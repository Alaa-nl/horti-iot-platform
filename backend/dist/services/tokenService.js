"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../utils/database"));
class TokenService {
    constructor() {
        this.accessTokenSecret = process.env.JWT_SECRET || crypto_1.default.randomBytes(32).toString('hex');
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || crypto_1.default.randomBytes(32).toString('hex');
        this.accessTokenExpiry = process.env.JWT_EXPIRE || '15m';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '7d';
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            console.warn('WARNING: Using generated JWT secrets. Set JWT_SECRET and JWT_REFRESH_SECRET in production!');
        }
    }
    generateTokenPair(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
            expiresIn: this.accessTokenExpiry,
            issuer: 'horti-iot',
            audience: 'horti-iot-api'
        });
        const refreshTokenPayload = {
            userId: payload.userId,
            tokenId: crypto_1.default.randomUUID()
        };
        const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, this.refreshTokenSecret, {
            expiresIn: this.refreshTokenExpiry,
            issuer: 'horti-iot'
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: this.accessTokenExpiry
        };
    }
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret, {
                issuer: 'horti-iot',
                audience: 'horti-iot-api'
            });
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.refreshTokenSecret, {
                issuer: 'horti-iot'
            });
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
    async saveRefreshToken(userId, refreshToken, req) {
        const hashedToken = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await database_1.default.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`, [
            userId,
            hashedToken,
            expiresAt,
            req.ip || req.socket?.remoteAddress || 'unknown',
            req.get('user-agent') || 'unknown'
        ]);
        await database_1.default.query(`DELETE FROM refresh_tokens
       WHERE user_id = $1 AND expires_at < CURRENT_TIMESTAMP`, [userId]);
    }
    async validateRefreshToken(refreshToken) {
        const hashedToken = this.hashToken(refreshToken);
        const result = await database_1.default.query(`SELECT user_id, expires_at, is_valid
       FROM refresh_tokens
       WHERE token_hash = $1 AND is_valid = true`, [hashedToken]);
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
    async invalidateRefreshToken(tokenHash) {
        await database_1.default.query(`UPDATE refresh_tokens
       SET is_valid = false, invalidated_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1`, [tokenHash]);
    }
    async invalidateAllUserTokens(userId) {
        await database_1.default.query(`UPDATE refresh_tokens
       SET is_valid = false, invalidated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_valid = true`, [userId]);
    }
    async rotateRefreshToken(oldRefreshToken, userId, req) {
        const hashedOldToken = this.hashToken(oldRefreshToken);
        const result = await database_1.default.query(`SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND is_valid = true AND user_id = $2`, [hashedOldToken, userId]);
        if (result.rows.length === 0) {
            await this.invalidateAllUserTokens(userId);
            return null;
        }
        await this.invalidateRefreshToken(hashedOldToken);
        const userResult = await database_1.default.query(`SELECT id, email, role FROM users WHERE id = $1 AND is_active = true`, [userId]);
        if (userResult.rows.length === 0) {
            return null;
        }
        const user = userResult.rows[0];
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };
        const tokens = this.generateTokenPair(payload);
        await this.saveRefreshToken(userId, tokens.refreshToken, req);
        return tokens;
    }
    hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    async cleanupExpiredTokens() {
        await database_1.default.query(`DELETE FROM refresh_tokens
       WHERE expires_at < CURRENT_TIMESTAMP OR
       (is_valid = false AND invalidated_at < CURRENT_TIMESTAMP - INTERVAL '1 day')`);
    }
}
exports.TokenService = TokenService;
exports.default = new TokenService();
//# sourceMappingURL=tokenService.js.map