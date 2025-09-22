import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import greenhouseRoutes from './routes/greenhouse';

// Import database
import database from './utils/database';

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
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for rate limiting and security
    this.app.set('trust proxy', 1);
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
          greenhouses: '/api/greenhouses'
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
      } else {
        console.error('❌ Failed to establish database connection');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      process.exit(1);
    }
  }

  public listen(): void {
    const port = process.env.PORT || 3001;
    this.app.listen(port, () => {
      console.log(`🚀 HORTI-IOT API Server running on port ${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    });
  }
}

export default App;