"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const greenhouse_1 = __importDefault(require("./routes/greenhouse"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const database_1 = __importDefault(require("./utils/database"));
const security_1 = require("./middleware/security");
const tokenService_1 = __importDefault(require("./services/tokenService"));
dotenv_1.default.config();
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeDatabase();
    }
    initializeMiddleware() {
        this.app.use((0, helmet_1.default)({
            crossOriginResourcePolicy: { policy: "cross-origin" },
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));
        this.app.use(security_1.securityHeaders);
        this.app.use((0, cors_1.default)({
            origin: (origin, callback) => {
                const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            maxAge: 86400
        }));
        this.app.use((0, compression_1.default)());
        if (process.env.NODE_ENV !== 'test') {
            const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
            this.app.use((0, morgan_1.default)(logFormat, {
                skip: (req, res) => res.statusCode < 400 && process.env.NODE_ENV === 'production'
            }));
        }
        this.app.use(express_1.default.json({
            limit: '1mb',
            verify: (req, res, buf, encoding) => {
                req.rawBody = buf.toString((encoding || 'utf8'));
            }
        }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
        this.app.use('/uploads', express_1.default.static('uploads', {
            dotfiles: 'deny',
            setHeaders: (res) => {
                res.set('X-Content-Type-Options', 'nosniff');
            }
        }));
        this.app.set('trust proxy', 1);
        this.app.disable('x-powered-by');
    }
    initializeRoutes() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'HORTI-IOT API is running',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/greenhouses', greenhouse_1.default);
        this.app.use('/api/admin', admin_routes_1.default);
        this.app.use('/api/profile', profile_routes_1.default);
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint not found',
                path: req.originalUrl,
                method: req.method
            });
        });
        this.app.get('/', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Welcome to HORTI-IOT Platform API',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    auth: '/api/auth',
                    greenhouses: '/api/greenhouses',
                    admin: '/api/admin',
                    profile: '/api/profile'
                }
            });
        });
    }
    initializeErrorHandling() {
        this.app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            if (error.name === 'ValidationError') {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    error: error.message
                });
                return;
            }
            if (error.name === 'UnauthorizedError') {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized access',
                    error: error.message
                });
                return;
            }
            const statusCode = error.status || error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: process.env.NODE_ENV === 'production'
                    ? 'Internal server error'
                    : error.message,
                ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
            });
        });
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found',
                path: req.originalUrl,
                method: req.method
            });
        });
    }
    async initializeDatabase() {
        try {
            const isConnected = await database_1.default.testConnection();
            if (isConnected) {
                console.log('✅ Database connection established successfully');
                setInterval(async () => {
                    try {
                        await tokenService_1.default.cleanupExpiredTokens();
                        console.log('🧹 Cleaned up expired tokens');
                    }
                    catch (error) {
                        console.error('Failed to cleanup expired tokens:', error);
                    }
                }, 3600000);
            }
            else {
                console.error('❌ Failed to establish database connection');
                process.exit(1);
            }
        }
        catch (error) {
            console.error('❌ Database initialization error:', error);
            process.exit(1);
        }
    }
    listen() {
        const port = process.env.PORT || 3001;
        this.app.listen(port, () => {
            console.log(`🚀 HORTI-IOT API Server running on port ${port}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
            console.log(`🔒 Security: Enhanced RBAC with JWT + Refresh Tokens`);
            console.log(`🛡️  Rate Limiting: Enabled`);
            console.log(`📝 Audit Logging: Enabled`);
            if (process.env.NODE_ENV !== 'production' && !process.env.JWT_SECRET) {
                console.warn('⚠️  WARNING: Using auto-generated JWT secret. Set JWT_SECRET in production!');
            }
        });
    }
}
exports.default = App;
//# sourceMappingURL=app%202.js.map