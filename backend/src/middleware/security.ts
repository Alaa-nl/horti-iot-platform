import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterPostgres } from 'rate-limiter-flexible';
import database from '../utils/database';
import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

const loginLimiter = new RateLimiterMemory({
  keyPrefix: 'login_fail_ip',
  points: 5,
  duration: 900,
  blockDuration: 900
});

const loginConsecutiveLimiter = new RateLimiterMemory({
  keyPrefix: 'login_fail_consecutive_email',
  points: 3,
  duration: 3600 * 2,
  blockDuration: 3600 * 2
});

const generalRateLimiter = new RateLimiterMemory({
  keyPrefix: 'general_api',
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000
});

export const loginRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ipAddr = req.ip || req.socket.remoteAddress || '';
    const emailKey = req.body.email ? req.body.email.toLowerCase() : '';

    const [resIP, resEmail] = await Promise.all([
      loginLimiter.get(ipAddr),
      emailKey ? loginConsecutiveLimiter.get(emailKey) : null
    ]);

    let retrySecs = 0;
    if (resIP !== null && resIP.consumedPoints > 4) {
      retrySecs = Math.round(resIP.msBeforeNext / 1000) || 1;
    } else if (resEmail !== null && resEmail.consumedPoints > 2) {
      retrySecs = Math.round(resEmail.msBeforeNext / 1000) || 1;
    }

    if (retrySecs > 0) {
      res.set('Retry-After', String(retrySecs));
      res.status(429).json({
        success: false,
        message: 'Too many failed login attempts. Please try again later.',
        retryAfter: retrySecs
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    next();
  }
};

export const consumeLoginAttempt = async (req: Request, email: string, success: boolean): Promise<void> => {
  try {
    const ipAddr = req.ip || req.socket.remoteAddress || '';

    if (!success) {
      await Promise.all([
        loginLimiter.consume(ipAddr),
        loginConsecutiveLimiter.consume(email.toLowerCase())
      ]);
    } else {
      await loginConsecutiveLimiter.delete(email.toLowerCase());
    }
  } catch (error) {
    console.error('Failed to consume login attempt:', error);
  }
};

export const generalApiRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = req.user?.userId || req.ip || req.socket.remoteAddress || 'unknown';

    await generalRateLimiter.consume(key);
    next();
  } catch (rateLimiterRes) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
      retryAfter: Math.round((rateLimiterRes as any).msBeforeNext / 1000) || 1
    });
  }
};

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 10000);
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }

  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }

  return input;
};

export const sanitizeRequestBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
};

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.removeHeader('X-Powered-By');
  next();
};

export const preventSQLInjection = (value: string): string => {
  if (typeof value !== 'string') return value;

  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
    'ALTER', 'EXEC', 'EXECUTE', 'UNION', '--', '/*', '*/',
    'xp_', 'sp_', '0x', '\\x', ';', 'OR', 'AND'
  ];

  let sanitized = value;
  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  return sanitized;
};

export const logSecurityEvent = async (
  eventType: string,
  userId: string | null,
  details: any,
  req: Request
): Promise<void> => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    await database.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        eventType,
        'security',
        null,
        JSON.stringify(details),
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};