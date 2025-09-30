import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../models/User';
import database from '../utils/database';
import { hashToken } from './security';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }

  try {
    // Check if token is blacklisted
    const tokenHash = hashToken(token);
    const blacklistedResult = await database.query(
      'SELECT id FROM blacklisted_tokens WHERE token_hash = $1',
      [tokenHash]
    );

    if (blacklistedResult.rows.length > 0) {
      res.status(401).json({
        success: false,
        message: 'Token has been invalidated'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret',
      {
        issuer: 'horti-iot',
        audience: 'horti-iot-api'
      }
    ) as JWTPayload;

    // Check if user is still active
    const userResult = await database.query(
      'SELECT is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      res.status(403).json({
        success: false,
        message: 'User account is not active'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    const error = err as any;
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    } else {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
    if (!err) {
      req.user = decoded as JWTPayload;
    }
    next();
  });
};