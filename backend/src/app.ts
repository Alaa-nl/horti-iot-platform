import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import greenhouseRoutes from './routes/greenhouse';
import adminRoutes from './routes/admin.routes';
import profileRoutes from './routes/profile.routes';
import phytosenseRoutes from './routes/phytosense.routes';
import sensorDataRoutes from './routes/sensorData.routes';
import phytosenseProxyRoutes from './routes/phytosenseProxy.routes';
import aiRoutes from './routes/ai.routes';

// Import database
import database from './utils/database';

// Import security middleware
import { securityHeaders } from './middleware/security';
import tokenService from './services/tokenService';

// Import data sync service
import { dataSyncService } from './services/dataSync.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDatabase();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
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

    // Additional security headers
    this.app.use(securityHeaders);

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400 // 24 hours
    }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware with custom format
    if (process.env.NODE_ENV !== 'test') {
      const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
      this.app.use(morgan(logFormat, {
        skip: (req, res) => res.statusCode < 400 && process.env.NODE_ENV === 'production'
      }));
    }

    // Body parsing middleware with size limits
    this.app.use(express.json({
      limit: '1mb',
      verify: (req: any, res, buf, encoding) => {
        req.rawBody = buf.toString((encoding || 'utf8') as BufferEncoding);
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Static file serving for uploads with security
    this.app.use('/uploads', express.static('uploads', {
      dotfiles: 'deny',
      setHeaders: (res) => {
        res.set('X-Content-Type-Options', 'nosniff');
      }
    }));

    // Trust proxy for rate limiting and security
    this.app.set('trust proxy', 1);

    // Disable X-Powered-By header
    this.app.disable('x-powered-by');
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'HORTI-IOT API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/greenhouses', greenhouseRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/profile', profileRoutes);
    this.app.use('/api/phytosense', phytosenseRoutes);
    this.app.use('/api/sensors', sensorDataRoutes);
    this.app.use('/api/phytosense-proxy', phytosenseProxyRoutes);
    this.app.use('/api/ai', aiRoutes);

    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
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

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Global error handler:', error);

      // Handle specific error types
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

      // Default error response
      const statusCode = (error as any).status || (error as any).statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      });
    });

    // Handle 404 for non-API routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const isConnected = await database.testConnection();
      if (isConnected) {
        console.log('✅ Database connection established successfully');

        // Schedule cleanup of expired tokens
        setInterval(async () => {
          try {
            await tokenService.cleanupExpiredTokens();
            console.log('🧹 Cleaned up expired tokens');
          } catch (error) {
            console.error('Failed to cleanup expired tokens:', error);
          }
        }, 3600000); // Run every hour

        // Start the data sync service
        this.initializeDataSync();
      } else {
        console.error('❌ Failed to establish database connection');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      process.exit(1);
    }
  }

  private initializeDataSync(): void {
    try {
      // Start the data synchronization service
      dataSyncService.start();
      console.log('🔄 Data sync service started - syncing sensor data every 5 minutes');
      logger.info('Data sync service initialized successfully');
    } catch (error) {
      console.error('⚠️  Failed to start data sync service:', error);
      logger.error('Data sync service initialization failed:', error);
      // Don't exit the process, as the app can still function without auto-sync
      // Users can still trigger manual sync via the API
    }
  }

  public listen(): void {
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

export default App;