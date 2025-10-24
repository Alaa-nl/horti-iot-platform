"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../utils/database"));
const tokenService_1 = __importDefault(require("../services/tokenService"));
const security_1 = require("../middleware/security");
const joi_1 = __importDefault(require("joi"));
class AuthController {
    async refreshToken(req, res) {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
                return;
            }
            const decoded = tokenService_1.default.verifyRefreshToken(refresh_token);
            if (!decoded) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
                return;
            }
            const newTokens = await tokenService_1.default.rotateRefreshToken(refresh_token, decoded.userId, req);
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
                    token: newTokens.accessToken,
                    refresh_token: newTokens.refreshToken,
                    expires_in: newTokens.expiresIn
                }
            });
        }
        catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const userResult = await database_1.default.query('SELECT id, name FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true', [email]);
            if (userResult.rows.length === 0) {
                res.status(200).json({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent'
                });
                return;
            }
            const user = userResult.rows[0];
            const resetToken = (0, security_1.generateSecureToken)();
            const hashedToken = (0, security_1.hashToken)(resetToken);
            const expiresAt = new Date(Date.now() + 3600000);
            await database_1.default.query(`INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`, [user.id, hashedToken, expiresAt]);
            console.log(`Password reset token for ${email}: ${resetToken}`);
            await (0, security_1.logSecurityEvent)('password_reset_requested', user.id, { email }, req);
            res.status(200).json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
        }
        catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async resetPassword(req, res) {
        try {
            const { token, new_password } = req.body;
            const passwordSchema = joi_1.default.string()
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
            const hashedToken = (0, security_1.hashToken)(token);
            const tokenResult = await database_1.default.query(`SELECT user_id, expires_at, used
         FROM password_reset_tokens
         WHERE token = $1`, [hashedToken]);
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
            const saltRounds = 12;
            const hashedPassword = await bcrypt_1.default.hash(new_password, saltRounds);
            await database_1.default.query('BEGIN');
            await database_1.default.query(`UPDATE users
         SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL
         WHERE id = $2`, [hashedPassword, resetToken.user_id]);
            await database_1.default.query(`UPDATE password_reset_tokens
         SET used = true
         WHERE token = $1`, [hashedToken]);
            await tokenService_1.default.invalidateAllUserTokens(resetToken.user_id);
            await database_1.default.query('COMMIT');
            await (0, security_1.logSecurityEvent)('password_reset_completed', resetToken.user_id, {}, req);
            res.status(200).json({
                success: true,
                message: 'Password has been reset successfully. Please login with your new password.'
            });
        }
        catch (error) {
            await database_1.default.query('ROLLBACK');
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const schema = joi_1.default.object({
                email: joi_1.default.string().email().required().max(255),
                password: joi_1.default.string().required().min(6).max(100)
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
            const userQuery = `
        SELECT id, email, password_hash, name, role, is_active,
               failed_login_attempts, locked_until, created_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
      `;
            const userResult = await database_1.default.query(userQuery, [email]);
            if (userResult.rows.length === 0) {
                await (0, security_1.consumeLoginAttempt)(req, email, false);
                await (0, security_1.logSecurityEvent)('login_failed', null, { email, reason: 'user_not_found' }, req);
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }
            const user = userResult.rows[0];
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                await (0, security_1.logSecurityEvent)('login_attempt_locked', user.id, { email }, req);
                res.status(403).json({
                    success: false,
                    message: 'Account is temporarily locked due to multiple failed login attempts',
                    locked_until: user.locked_until
                });
                return;
            }
            if (!user.is_active) {
                await (0, security_1.logSecurityEvent)('login_attempt_inactive', user.id, { email }, req);
                res.status(403).json({
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
                });
                return;
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password_hash);
            if (!isPasswordValid) {
                const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
                let lockedUntil = null;
                if (newFailedAttempts >= 5) {
                    lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
                }
                await database_1.default.query(`UPDATE users
           SET failed_login_attempts = $1, locked_until = $2
           WHERE id = $3`, [newFailedAttempts, lockedUntil, user.id]);
                await (0, security_1.consumeLoginAttempt)(req, email, false);
                await (0, security_1.logSecurityEvent)('login_failed', user.id, { email, reason: 'invalid_password' }, req);
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }
            await database_1.default.query(`UPDATE users
         SET last_login = CURRENT_TIMESTAMP,
             failed_login_attempts = 0,
             locked_until = NULL
         WHERE id = $1`, [user.id]);
            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role
            };
            const tokens = tokenService_1.default.generateTokenPair(payload);
            await tokenService_1.default.saveRefreshToken(user.id, tokens.refreshToken, req);
            await (0, security_1.consumeLoginAttempt)(req, email, true);
            await (0, security_1.logSecurityEvent)('login_success', user.id, { email, role: user.role }, req);
            await database_1.default.query(`INSERT INTO login_attempts (email, ip_address, user_agent, success)
         VALUES ($1, $2, $3, $4)`, [email, req.ip || req.socket?.remoteAddress || 'unknown', req.get('user-agent') || 'unknown', true]);
            const userResponse = {
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
                    token: tokens.accessToken,
                    refresh_token: tokens.refreshToken,
                    expires_in: tokens.expiresIn
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            await (0, security_1.logSecurityEvent)('login_error', null, { error: error instanceof Error ? error.message : 'Unknown error' }, req);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async register(req, res) {
        try {
            const { email, password, name, role } = req.body;
            const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
            const existingUser = await database_1.default.query(existingUserQuery, [email]);
            if (existingUser.rows.length > 0) {
                res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
                return;
            }
            const saltRounds = 12;
            const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
            const createUserQuery = `
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role, is_active, created_at
      `;
            const newUserResult = await database_1.default.query(createUserQuery, [
                email,
                hashedPassword,
                name,
                role
            ]);
            const newUser = newUserResult.rows[0];
            const payload = {
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role
            };
            const tokens = tokenService_1.default.generateTokenPair(payload);
            await tokenService_1.default.saveRefreshToken(newUser.id, tokens.refreshToken, req);
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: {
                    user: newUser,
                    token: tokens.accessToken,
                    refresh_token: tokens.refreshToken,
                    expires_in: tokens.expiresIn
                }
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getMe(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const userQuery = `
        SELECT id, email, name, role, is_active, created_at, last_login
        FROM users
        WHERE id = $1 AND is_active = true
      `;
            const userResult = await database_1.default.query(userQuery, [req.user.userId]);
            if (userResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const user = userResult.rows[0];
            res.status(200).json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async logout(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            await tokenService_1.default.invalidateAllUserTokens(req.user.userId);
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (token) {
                const tokenHash = (0, security_1.hashToken)(token);
                const decoded = jsonwebtoken_1.default.decode(token);
                const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 3600000);
                await database_1.default.query(`INSERT INTO blacklisted_tokens (token_hash, user_id, expires_at, reason, token_jti)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (token_hash) DO NOTHING`, [tokenHash, req.user.userId, expiresAt, 'user_logout', decoded?.jti || null]);
            }
            await (0, security_1.logSecurityEvent)('logout', req.user.userId, { email: req.user.email }, req);
            res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async verifyToken(req, res) {
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
        }
        catch (error) {
            console.error('Token verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map