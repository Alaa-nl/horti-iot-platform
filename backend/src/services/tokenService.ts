import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import database from '../utils/database';
import { JWTPayload } from '../models/User';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface RefreshTokenData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isValid: boolean;
}

export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex');
    this.accessTokenExpiry = process.env.JWT_EXPIRE || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '7d';

    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn('WARNING: Using generated JWT secrets. Set JWT_SECRET and JWT_REFRESH_SECRET in production!');
    }
  }

  public generateTokenPair(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(
      payload,
      this.accessTokenSecret,
      {
        expiresIn: this.accessTokenExpiry,
        issuer: 'horti-iot',
        audience: 'horti-iot-api'
      } as jwt.SignOptions
    );

    const refreshTokenPayload = {
      userId: payload.userId,
      tokenId: crypto.randomUUID()
    };

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'horti-iot'
      } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry
    };
  }

  public verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'horti-iot',
        audience: 'horti-iot-api'
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  public verifyRefreshToken(token: string): { userId: string; tokenId: string } | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'horti-iot'
      }) as { userId: string; tokenId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  public async saveRefreshToken(userId: string, refreshToken: string, req: any): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await database.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        hashedToken,
        expiresAt,
        req.ip || req.socket?.remoteAddress || 'unknown',
        req.get('user-agent') || 'unknown'
      ]
    );

    await database.query(
      `DELETE FROM refresh_tokens
       WHERE user_id = $1 AND expires_at < CURRENT_TIMESTAMP`,
      [userId]
    );
  }

  public async validateRefreshToken(refreshToken: string): Promise<string | null> {
    const hashedToken = this.hashToken(refreshToken);

    const result = await database.query(
      `SELECT user_id, expires_at, is_valid
       FROM refresh_tokens
       WHERE token_hash = $1 AND is_valid = true`,
      [hashedToken]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const tokenData = result.rows[0];

    if (new Date(tokenData.expires_at) < new Date()) {
      await this.invalidateRefreshToken(hashedToken);
      return null;
    }

    return tokenData.user_id;
  }

  public async invalidateRefreshToken(tokenHash: string): Promise<void> {
    await database.query(
      `UPDATE refresh_tokens
       SET is_valid = false, invalidated_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  public async invalidateAllUserTokens(userId: string): Promise<void> {
    await database.query(
      `UPDATE refresh_tokens
       SET is_valid = false, invalidated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_valid = true`,
      [userId]
    );
  }

  public async rotateRefreshToken(oldRefreshToken: string, userId: string, req: any): Promise<TokenPair | null> {
    const hashedOldToken = this.hashToken(oldRefreshToken);

    const result = await database.query(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND is_valid = true AND user_id = $2`,
      [hashedOldToken, userId]
    );

    if (result.rows.length === 0) {
      await this.invalidateAllUserTokens(userId);
      return null;
    }

    await this.invalidateRefreshToken(hashedOldToken);

    const userResult = await database.query(
      `SELECT id, email, role FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const tokens = this.generateTokenPair(payload);
    await this.saveRefreshToken(userId, tokens.refreshToken, req);

    return tokens;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async cleanupExpiredTokens(): Promise<void> {
    await database.query(
      `DELETE FROM refresh_tokens
       WHERE expires_at < CURRENT_TIMESTAMP OR
       (is_valid = false AND invalidated_at < CURRENT_TIMESTAMP - INTERVAL '1 day')`
    );
  }
}

export default new TokenService();