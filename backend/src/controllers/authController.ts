import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import database from '../utils/database';
import { User, UserResponse, LoginInput, CreateUserInput, JWTPayload } from '../models/User';

export class AuthController {

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginInput = req.body;

      // Find user by email
      const userQuery = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
      const userResult = await database.query(userQuery, [email]);

      if (userResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      const user: User = userResult.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Update last login
      await database.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      // Prepare user response (without password)
      const userResponse: UserResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
          expires_in: process.env.JWT_EXPIRE || '24h'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
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

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: newUser,
          token,
          expires_in: process.env.JWT_EXPIRE || '24h'
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
      // In a more sophisticated implementation, you would:
      // 1. Blacklist the JWT token
      // 2. Remove session from database
      // 3. Clear cookies

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