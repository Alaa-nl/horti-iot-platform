"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorizeRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../utils/database"));
const security_1 = require("./security");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Access token required'
        });
        return;
    }
    try {
        const tokenHash = (0, security_1.hashToken)(token);
        const blacklistedResult = await database_1.default.query('SELECT id FROM blacklisted_tokens WHERE token_hash = $1', [tokenHash]);
        if (blacklistedResult.rows.length > 0) {
            res.status(401).json({
                success: false,
                message: 'Token has been invalidated'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret', {
            issuer: 'horti-iot',
            audience: 'horti-iot-api'
        });
        const userResult = await database_1.default.query('SELECT is_active FROM users WHERE id = $1', [decoded.userId]);
        if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
            res.status(403).json({
                success: false,
                message: 'User account is not active'
            });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        const error = err;
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        else if (error.name === 'JsonWebTokenError') {
            res.status(403).json({
                success: false,
                message: 'Invalid token'
            });
        }
        else {
            console.error('Token verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Token verification failed'
            });
        }
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRole = (roles) => {
    return (req, res, next) => {
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
exports.authorizeRole = authorizeRole;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        next();
        return;
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
        if (!err) {
            req.user = decoded;
        }
        next();
    });
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map