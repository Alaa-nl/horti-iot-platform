"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../utils/database"));
class AdminController {
    async createUser(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
                return;
            }
            const { email, password, name, role, phone_number, department, location } = req.body;
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
        INSERT INTO users (email, password_hash, name, role, phone_number, department, location, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, name, role, is_active, phone_number, department, location, created_at
      `;
            const newUserResult = await database_1.default.query(createUserQuery, [
                email,
                hashedPassword,
                name,
                role,
                phone_number || null,
                department || null,
                location || null,
                req.user.userId
            ]);
            const newUser = newUserResult.rows[0];
            await database_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`, [req.user.userId, 'create_user', 'user', newUser.id, { email, name, role }]);
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: { user: newUser }
            });
        }
        catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getUsers(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
                return;
            }
            const { role, is_active } = req.query;
            let query = `
        SELECT id, email, name, role, is_active, phone_number, department, location,
               created_at, last_login
        FROM users
        WHERE 1=1
      `;
            const params = [];
            let paramCount = 0;
            if (role) {
                paramCount++;
                query += ` AND role = $${paramCount}`;
                params.push(role);
            }
            if (is_active !== undefined) {
                paramCount++;
                query += ` AND is_active = $${paramCount}`;
                params.push(is_active === 'true');
            }
            query += ' ORDER BY created_at DESC';
            const result = await database_1.default.query(query, params);
            res.status(200).json({
                success: true,
                data: { users: result.rows }
            });
        }
        catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async resetPassword(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
                return;
            }
            const { user_id, new_password } = req.body;
            const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
            const userResult = await database_1.default.query(userQuery, [user_id]);
            if (userResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const user = userResult.rows[0];
            const saltRounds = 12;
            const hashedPassword = await bcrypt_1.default.hash(new_password, saltRounds);
            await database_1.default.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, user_id]);
            await database_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`, [req.user.userId, 'reset_password', 'user', user_id, { email: user.email, name: user.name }]);
            res.status(200).json({
                success: true,
                message: 'Password reset successfully'
            });
        }
        catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async toggleUserStatus(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
                return;
            }
            const { user_id } = req.params;
            const userQuery = 'SELECT id, email, name, is_active FROM users WHERE id = $1';
            const userResult = await database_1.default.query(userQuery, [user_id]);
            if (userResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const user = userResult.rows[0];
            const newStatus = !user.is_active;
            await database_1.default.query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, user_id]);
            await database_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`, [req.user.userId, newStatus ? 'activate_user' : 'deactivate_user', 'user', user_id,
                { email: user.email, name: user.name }]);
            res.status(200).json({
                success: true,
                message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
            });
        }
        catch (error) {
            console.error('Toggle user status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async deleteUser(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
                return;
            }
            const { user_id } = req.params;
            if (user_id === req.user.userId) {
                res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
                return;
            }
            const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
            const userResult = await database_1.default.query(userQuery, [user_id]);
            if (userResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const user = userResult.rows[0];
            await database_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`, [req.user.userId, 'delete_user', 'user', user_id, { email: user.email, name: user.name }]);
            await database_1.default.query('DELETE FROM users WHERE id = $1', [user_id]);
            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async manageGreenhouseAccess(req, res) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'researcher')) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin or researcher privileges required.'
                });
                return;
            }
            const { user_id, greenhouse_id, permission_type, action } = req.body;
            if (action === 'grant') {
                const existingPermission = await database_1.default.query('SELECT id FROM user_greenhouse_permissions WHERE user_id = $1 AND greenhouse_id = $2', [user_id, greenhouse_id]);
                if (existingPermission.rows.length > 0) {
                    await database_1.default.query('UPDATE user_greenhouse_permissions SET permission_type = $1 WHERE user_id = $2 AND greenhouse_id = $3', [permission_type, user_id, greenhouse_id]);
                }
                else {
                    await database_1.default.query(`INSERT INTO user_greenhouse_permissions (user_id, greenhouse_id, permission_type, granted_by)
             VALUES ($1, $2, $3, $4)`, [user_id, greenhouse_id, permission_type, req.user.userId]);
                }
                res.status(200).json({
                    success: true,
                    message: 'Greenhouse access granted successfully'
                });
            }
            else if (action === 'revoke') {
                await database_1.default.query('DELETE FROM user_greenhouse_permissions WHERE user_id = $1 AND greenhouse_id = $2', [user_id, greenhouse_id]);
                res.status(200).json({
                    success: true,
                    message: 'Greenhouse access revoked successfully'
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "grant" or "revoke"'
                });
            }
        }
        catch (error) {
            console.error('Manage greenhouse access error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map