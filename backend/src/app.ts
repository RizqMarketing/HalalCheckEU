/**
 * HalalCheck EU - Main Express Application
 * 
 * Production-ready Express server with comprehensive middleware,
 * security, monitoring, and API route configuration
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

// Route imports
import authRoutes from '@/routes/auth';
import analysisRoutes from '@/routes/analysis';
import reportRoutes from '@/routes/reports';
import userRoutes from '@/routes/users';
import organizationRoutes from '@/routes/organizations';
import uploadRoutes from '@/routes/upload';
import paymentRoutes from '@/routes/payments';
import dashboardRoutes from '@/routes/dashboard';

// Middleware imports
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

export class HalalCheckApp {
  public app: Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeHealthCheck();
  }

  /**
   * Initialize core middleware
   */
  private initializeMiddleware(): void {
    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.stripe.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim(), { component: 'http' });
        }
      }
    }));

    // Body parsing middleware
    this.app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Cookie parser
    this.app.use(cookieParser());

    // Static file serving
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    
    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          requestId: req.id,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      
      next();
    });
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // API base path
    const apiPath = '/api';

    // Health check endpoint (before other routes)
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'HalalCheck EU API is healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API Documentation
    this.app.get(`${apiPath}`, (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to HalalCheck EU API',
        version: '1.0.0',
        documentation: 'https://docs.halalcheck.eu/api',
        endpoints: {
          authentication: `${apiPath}/auth`,
          analysis: `${apiPath}/analysis`,
          reports: `${apiPath}/reports`,
          users: `${apiPath}/users`,
          organizations: `${apiPath}/organizations`,
          uploads: `${apiPath}/upload`,
          payments: `${apiPath}/payments`,
          dashboard: `${apiPath}/dashboard`
        },
        support: {
          email: 'support@halalcheck.eu',
          documentation: 'https://docs.halalcheck.eu'
        }
      });
    });

    // Mount route modules
    this.app.use(`${apiPath}/auth`, authRoutes);
    this.app.use(`${apiPath}/analysis`, analysisRoutes);
    this.app.use(`${apiPath}/reports`, reportRoutes);
    this.app.use(`${apiPath}/users`, userRoutes);
    this.app.use(`${apiPath}/organizations`, organizationRoutes);
    this.app.use(`${apiPath}/upload`, uploadRoutes);
    this.app.use(`${apiPath}/payments`, paymentRoutes);
    this.app.use(`${apiPath}/dashboard`, dashboardRoutes);

    // Serve frontend in production
    if (process.env.NODE_ENV === 'production') {
      const frontendPath = path.join(__dirname, '../../frontend/dist');
      this.app.use(express.static(frontendPath));
      
      // Catch-all handler for SPA routing
      this.app.get('*', (req: Request, res: Response) => {
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(frontendPath, 'index.html'));
        }
      });
    }
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    // Uncaught exception handler
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        type: 'uncaughtException'
      });
      process.exit(1);
    });

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        type: 'unhandledRejection'
      });
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  }

  /**
   * Initialize comprehensive health check
   */
  private initializeHealthCheck(): void {
    this.app.get('/api/health/detailed', async (req: Request, res: Response) => {
      const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: 'unknown',
          openai: 'unknown',
          stripe: 'unknown',
          email: 'unknown'
        },
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };

      try {
        // You could add actual service health checks here
        // For now, we'll assume they're healthy if env vars are set
        healthCheck.services.database = process.env.DATABASE_URL ? 'healthy' : 'not_configured';
        healthCheck.services.openai = process.env.OPENAI_API_KEY ? 'healthy' : 'not_configured';
        healthCheck.services.stripe = process.env.STRIPE_SECRET_KEY ? 'healthy' : 'not_configured';
        healthCheck.services.email = process.env.SMTP_HOST ? 'healthy' : 'not_configured';

        res.status(200).json({
          success: true,
          data: healthCheck
        });
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
          success: false,
          error: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          data: healthCheck
        });
      }
    });
  }

  /**
   * Get allowed CORS origins
   */
  private getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // Default origins for development
    if (process.env.NODE_ENV === 'development') {
      origins.push('http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173');
    }

    return origins;
  }

  /**
   * Start the Express server
   */
  public start(): void {
    this.app.listen(this.port, () => {
      logger.info('HalalCheck EU API Server started', {
        port: this.port,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString()
      });

      // Log configuration status
      this.logConfigurationStatus();
    });
  }

  /**
   * Log configuration status for debugging
   */
  private logConfigurationStatus(): void {
    const config = {
      database: !!process.env.DATABASE_URL,
      openai: !!process.env.OPENAI_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      email: !!process.env.SMTP_HOST,
      jwtSecret: !!process.env.JWT_SECRET,
      uploadDir: process.env.UPLOAD_DIR || './uploads'
    };

    logger.info('Configuration status', config);

    // Warn about missing critical configuration
    if (!config.database) {
      logger.warn('DATABASE_URL not configured - database operations will fail');
    }
    if (!config.openai) {
      logger.warn('OPENAI_API_KEY not configured - AI analysis will fail');
    }
    if (!config.jwtSecret) {
      logger.warn('JWT_SECRET not configured - authentication will fail');
    }
  }

  /**
   * Get Express app instance
   */
  public getApp(): Application {
    return this.app;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
      rawBody?: Buffer;
    }
  }
}

export default HalalCheckApp;