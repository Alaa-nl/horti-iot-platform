import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import database from '../utils/database';
import { User, UserResponse, LoginInput, CreateUserInput, JWTPayload } from '../models/User';
import tokenService from '../services/tokenService';
import { consumeLoginAttempt, logSecurityEvent, generateSecureToken, hashToken } from '../middleware/security';
import Joi from 'joi';

export class AuthController {

  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      // Verify the refresh token
      const decoded = tokenService.verifyRefreshToken(refresh_token);
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      // Rotate the refresh token
      const newTokens = await tokenService.rotateRefreshToken(refresh_token, decoded.userId, req);
      if (!newTokens) {
        res.status(401).json({
          success: false,
          message: 'Failed to refresh token. Please login again.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          expires_in: newTokens.expiresIn
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const userResult = await database.query(
        'SELECT id, name FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true',
        [email]
      );

      // Always return success to prevent email enumeration
      if (userResult.rows.length === 0) {
        res.status(200).json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
        return;
      }

      const user = userResult.rows[0];
      const resetToken = generateSecureToken();
      const hashedToken = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await database.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, hashedToken, expiresAt]
      );

      // In production, send email with reset link
      // For now, log the token (remove in production)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      await logSecurityEvent('password_reset_requested', user.id, { email }, req);

      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, new_password } = req.body;

      // Validate password strength
      const passwordSchema = Joi.string()
        .min(8)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });

      const { error } = passwordSchema.validate(new_password);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message
        });
        return;
      }

      const hashedToken = hashToken(token);

      const tokenResult = await database.query(
        `SELECT user_id, expires_at, used
         FROM password_reset_tokens
         WHERE token = $1`,
        [hashedToken]
      );

      if (tokenResult.rows.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
        return;
      }

      const resetToken = tokenResult.rows[0];

      if (resetToken.used || new Date(resetToken.expires_at) < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);

      // Update password and mark token as used
      await database.query('BEGIN');

      await database.query(
        `UPDATE users
         SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL
         WHERE id = $2`,
        [hashedPassword, resetToken.user_id]
      );

      await database.query(
        `UPDATE password_reset_tokens
         SET used = true
         WHERE token = $1`,
        [hashedToken]
      );

      // Invalidate all refresh tokens for security
      await tokenService.invalidateAllUserTokens(resetToken.user_id);

      await database.query('COMMIT');

      await logSecurityEvent('password_reset_completed', resetToken.user_id, {}, req);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. Please login with your new password.'
      });

    } catch (error) {
      await database.query('ROLLBACK');
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginInput = req.body;

      // Input validation
      const schema = Joi.object({
        email: Joi.string().email().required().max(255),
        password: Joi.string().required().min(6).max(100)
      });

      const { error } = schema.validate({ email, password });
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: error.details
        });
        return;
      }

      // Find user by email
      const userQuery = `
        SELECT id, email, password_hash, name, role, is_active,
               failed_login_attempts, locked_until, created_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
      `;
      const userResult = await database.query(userQuery, [email]);

      if (userResult.rows.length === 0) {
        await consumeLoginAttempt(req, email, false);
        await logSecurityEvent('login_failed', null, { email, reason: 'user_not_found' }, req);
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      const user: User = userResult.rows[0];

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        await logSecurityEvent('login_attempt_locked', user.id, { email }, req);
        res.status(403).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts',
          locked_until: user.locked_until
        });
        return;
      }

      // Check if account is active
      if (!user.is_active) {
        await logSecurityEvent('login_attempt_inactive', user.id, { email }, req);
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        // Increment failed attempts
        const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
        let lockedUntil = null;

        if (newFailedAttempts >= 5) {
          lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        }

        await database.query(
          `UPDATE users
           SET failed_login_attempts = $1, locked_until = $2
           WHERE id = $3`,
          [newFailedAttempts, lockedUntil, user.id]
        );

        await consumeLoginAttempt(req, email, false);
        await logSecurityEvent('login_failed', user.id, { email, reason: 'invalid_password' }, req);

        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Reset failed login attempts and update last login
      await database.query(
        `UPDATE users
         SET last_login = CURRENT_TIMESTAMP,
             failed_login_attempts = 0,
             locked_until = NULL
         WHERE id = $1`,
        [user.id]
      );

      // Generate token pair
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const tokens = tokenService.generateTokenPair(payload);
      await tokenService.saveRefreshToken(user.id, tokens.refreshToken, req);

      // Record successful login
      await consumeLoginAttempt(req, email, true);
      await logSecurityEvent('login_success', user.id, { email, role: user.role }, req);

      // Store login attempt
      await database.query(
        `INSERT INTO login_attempts (email, ip_address, user_agent, success)
         VALUES ($1, $2, $3, $4)`,
        [email, req.ip || req.socket?.remoteAddress || 'unknown', req.get('user-agent') || 'unknown', true]
      );

      // Prepare user response (without sensitive data)
      const userResponse: UserResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        profile_photo: user.profile_photo,
        bio: user.bio,
        phone_number: user.phone_number,
        department: user.department,
        location: user.location,
        created_at: user.created_at,
        last_login: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: tokens.expiresIn
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      await logSecurityEvent('login_error', null, { error: error instanceof Error ? error.message : 'Unknown error' }, req);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role }: CreateUserInput = req.body;

      // Check if user already exists
      const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
      const existingUser = await database.query(existingUserQuery, [email]);

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const createUserQuery = `
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role, is_active, created_at
      `;

      const newUserResult = await database.query(createUserQuery, [
        email,
        hashedPassword,
        name,
        role
      ]);

      const newUser = newUserResult.rows[0];

      // Generate JWT token
      const payload: JWTPayload = {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      };

      const tokens = tokenService.generateTokenPair(payload);
      await tokenService.saveRefreshToken(newUser.id, tokens.refreshToken, req);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: newUser,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: tokens.expiresIn
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Get current user data
      const userQuery = `
        SELECT id, email, name, role, is_active, created_at, last_login
        FROM users
        WHERE id = $1 AND is_active = true
      `;

      const userResult = await database.query(userQuery, [req.user.userId]);

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user: UserResponse = userResult.rows[0];

      res.status(200).json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Invalidate all refresh tokens for this user
      await tokenService.invalidateAllUserTokens(req.user.userId);

      // Blacklist the current access token if it has a JTI
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        const tokenHash = hashToken(token);
        const decoded = jwt.decode(token) as any;
        const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 3600000);

        await database.query(
          `INSERT INTO blacklisted_tokens (token_hash, user_id, expires_at, reason, token_jti)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (token_hash) DO NOTHING`,
          [tokenHash, req.user.userId, expiresAt, 'user_logout', decoded?.jti || null]
        );
      }

      // Log the logout event
      await logSecurityEvent('logout', req.user.userId, { email: req.user.email }, req);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: req.user.userId,
            email: req.user.email,
            role: req.user.role
          }
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}