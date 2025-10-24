"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSecurityEvent = exports.preventSQLInjection = exports.securityHeaders = exports.hashToken = exports.generateSecureToken = exports.sanitizeRequestBody = exports.sanitizeInput = exports.phytoSenseRateLimit = exports.generalApiRateLimit = exports.consumeLoginAttempt = exports.loginRateLimit = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const database_1 = __importDefault(require("../utils/database"));
const crypto_1 = __importDefault(require("crypto"));
const isProduction = process.env.NODE_ENV === 'production';
const loginLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    keyPrefix: 'login_fail_ip',
    points: 5,
    duration: 900,
    blockDuration: 900
});
const loginConsecutiveLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    keyPrefix: 'login_fail_consecutive_email',
    points: 3,
    duration: 3600 * 2,
    blockDuration: 3600 * 2
});
const generalRateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    keyPrefix: 'general_api',
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000
});
const phytoSenseRateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    keyPrefix: 'phytosense_api',
    points: parseInt(process.env.PHYTOSENSE_RATE_LIMIT_MAX_REQUESTS || '20'),
    duration: parseInt(process.env.PHYTOSENSE_RATE_LIMIT_WINDOW_MS || '60000') / 1000,
    blockDuration: 60
});
const loginRateLimit = async (req, res, next) => {
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
        }
        else if (resEmail !== null && resEmail.consumedPoints > 2) {
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
    }
    catch (error) {
        console.error('Rate limit error:', error);
        next();
    }
};
exports.loginRateLimit = loginRateLimit;
const consumeLoginAttempt = async (req, email, success) => {
    try {
        const ipAddr = req.ip || req.socket.remoteAddress || '';
        if (!success) {
            await Promise.all([
                loginLimiter.consume(ipAddr),
                loginConsecutiveLimiter.consume(email.toLowerCase())
            ]);
        }
        else {
            await loginConsecutiveLimiter.delete(email.toLowerCase());
        }
    }
    catch (error) {
        console.error('Failed to consume login attempt:', error);
    }
};
exports.consumeLoginAttempt = consumeLoginAttempt;
const generalApiRateLimit = async (req, res, next) => {
    try {
        const key = req.user?.userId || req.ip || req.socket.remoteAddress || 'unknown';
        await generalRateLimiter.consume(key);
        next();
    }
    catch (rateLimiterRes) {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please slow down.',
            retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000) || 1
        });
    }
};
exports.generalApiRateLimit = generalApiRateLimit;
const phytoSenseRateLimit = async (req, res, next) => {
    try {
        const key = req.user?.userId || req.ip || req.socket.remoteAddress || 'unknown';
        await phytoSenseRateLimiter.consume(key);
        const rateLimiterState = await phytoSenseRateLimiter.get(key);
        if (rateLimiterState) {
            res.setHeader('X-RateLimit-Limit', '20');
            res.setHeader('X-RateLimit-Remaining', String(Math.max(0, 20 - rateLimiterState.consumedPoints)));
            res.setHeader('X-RateLimit-Reset', String(new Date(Date.now() + rateLimiterState.msBeforeNext).getTime()));
        }
        next();
    }
    catch (rateLimiterRes) {
        const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
        res.setHeader('Retry-After', String(retryAfter));
        res.setHeader('X-RateLimit-Limit', '20');
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', String(new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime()));
        res.status(429).json({
            success: false,
            message: 'PhytoSense API rate limit exceeded. Please try again later.',
            retryAfter,
            limit: 20,
            window: '1 minute'
        });
    }
};
exports.phytoSenseRateLimit = phytoSenseRateLimit;
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input
            .replace(/[<>]/g, '')
            .trim()
            .substring(0, 10000);
    }
    if (Array.isArray(input)) {
        return input.map(item => (0, exports.sanitizeInput)(item));
    }
    if (input && typeof input === 'object') {
        const sanitized = {};
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                sanitized[key] = (0, exports.sanitizeInput)(input[key]);
            }
        }
        return sanitized;
    }
    return input;
};
exports.sanitizeInput = sanitizeInput;
const sanitizeRequestBody = (req, res, next) => {
    if (req.body) {
        req.body = (0, exports.sanitizeInput)(req.body);
    }
    next();
};
exports.sanitizeRequestBody = sanitizeRequestBody;
const generateSecureToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashToken = hashToken;
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.removeHeader('X-Powered-By');
    next();
};
exports.securityHeaders = securityHeaders;
const preventSQLInjection = (value) => {
    if (typeof value !== 'string')
        return value;
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
exports.preventSQLInjection = preventSQLInjection;
const logSecurityEvent = async (eventType, userId, details, req) => {
    try {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';
        await database_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            userId,
            eventType,
            'security',
            null,
            JSON.stringify(details),
            ipAddress,
            userAgent
        ]);
    }
    catch (error) {
        console.error('Failed to log security event:', error);
    }
};
exports.logSecurityEvent = logSecurityEvent;
//# sourceMappingURL=security.js.map