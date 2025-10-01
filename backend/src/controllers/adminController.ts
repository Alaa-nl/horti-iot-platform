import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import database from '../utils/database';
import { CreateUserInput, ResetPasswordInput, UserResponse } from '../models/User';

export class AdminController {

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
        return;
      }

      const { email, password, name, role, phone_number, department, location }: CreateUserInput = req.body;

      const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
      const existingUser = await database.query(existingUserQuery, [email]);

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const createUserQuery = `
        INSERT INTO users (email, password_hash, name, role, phone_number, department, location, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, name, role, is_active, phone_number, department, location, created_at
      `;

      const newUserResult = await database.query(createUserQuery, [
        email,
        hashedPassword,
        name,
        role,
        phone_number || null,
        department || null,
        location || null,
        req.user.userId
      ]);

      const newUser: UserResponse = newUserResult.rows[0];

      // Log the creation (if audit_logs table exists)
      try {
        await database.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.user.userId, 'create_user', 'user', newUser.id, JSON.stringify({ email, name, role })]
        );
      } catch (auditError) {
        // Silently fail if audit_logs doesn't exist
        console.warn('Audit log failed:', auditError);
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: newUser }
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async getUsers(req: Request, res: Response): Promise<void> {
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
      const params: any[] = [];
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

      const result = await database.query(query, params);

      res.status(200).json({
        success: true,
        data: { users: result.rows }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
        return;
      }

      const { user_id, new_password }: ResetPasswordInput = req.body;

      const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
      const userResult = await database.query(userQuery, [user_id]);

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user = userResult.rows[0];

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);

      await database.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, user_id]
      );

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async toggleUserStatus(req: Request, res: Response): Promise<void> {
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
      const userResult = await database.query(userQuery, [user_id]);

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user = userResult.rows[0];
      const newStatus = !user.is_active;

      await database.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStatus, user_id]
      );

      res.status(200).json({
        success: true,
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
      });

    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
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
      const userResult = await database.query(userQuery, [user_id]);

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user = userResult.rows[0];

      // Use transaction to ensure all deletes succeed or none do
      await database.query('BEGIN');

      try {
        // Delete related records first (to handle foreign key constraints)
        await database.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user_id]);
        await database.query('DELETE FROM blacklisted_tokens WHERE user_id = $1', [user_id]);
        await database.query('DELETE FROM user_sessions WHERE user_id = $1', [user_id]);
        await database.query('DELETE FROM login_attempts WHERE email = $1', [user.email]);

        // Delete audit logs for this user
        await database.query('DELETE FROM audit_logs WHERE user_id = $1', [user_id]);

        // Also delete audit logs where this user is mentioned in entity_id
        await database.query('DELETE FROM audit_logs WHERE entity_id = $1 AND entity_type = $2', [user_id, 'user']);

        // Finally delete the user (CASCADE will handle remaining foreign keys)
        await database.query('DELETE FROM users WHERE id = $1', [user_id]);

        await database.query('COMMIT');

        res.status(200).json({
          success: true,
          message: 'User deleted successfully'
        });
      } catch (deleteError) {
        await database.query('ROLLBACK');
        throw deleteError;
      }

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async manageGreenhouseAccess(req: Request, res: Response): Promise<void> {
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
        const existingPermission = await database.query(
          'SELECT id FROM user_greenhouse_permissions WHERE user_id = $1 AND greenhouse_id = $2',
          [user_id, greenhouse_id]
        );

        if (existingPermission.rows.length > 0) {
          await database.query(
            'UPDATE user_greenhouse_permissions SET permission_type = $1 WHERE user_id = $2 AND greenhouse_id = $3',
            [permission_type, user_id, greenhouse_id]
          );
        } else {
          await database.query(
            `INSERT INTO user_greenhouse_permissions (user_id, greenhouse_id, permission_type, granted_by)
             VALUES ($1, $2, $3, $4)`,
            [user_id, greenhouse_id, permission_type, req.user.userId]
          );
        }

        res.status(200).json({
          success: true,
          message: 'Greenhouse access granted successfully'
        });
      } else if (action === 'revoke') {
        await database.query(
          'DELETE FROM user_greenhouse_permissions WHERE user_id = $1 AND greenhouse_id = $2',
          [user_id, greenhouse_id]
        );

        res.status(200).json({
          success: true,
          message: 'Greenhouse access revoked successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid action. Use "grant" or "revoke"'
        });
      }

    } catch (error) {
      console.error('Manage greenhouse access error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}