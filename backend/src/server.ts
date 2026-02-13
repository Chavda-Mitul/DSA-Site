/**
 * ===========================================
 * SERVER ENTRY POINT
 * ===========================================
 *
 * This is the main entry point for the DSA Sheet API.
 * It sets up the Express application with:
 * - Security middleware (helmet, cors)
 * - Request parsing (json, urlencoded)
 * - Logging (morgan)
 * - API routes
 * - Error handling
 *
 * STARTUP SEQUENCE:
 * 1. Load environment variables
 * 2. Connect to MongoDB
 * 3. Initialize admin user (if needed)
 * 4. Set up Express middleware
 * 5. Mount routes
 * 6. Start HTTP server
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Configuration
import env from './config/env';
import connectDB from './config/db';

// Routes
import routes from './routes';

// Middleware
import errorMiddleware, { notFoundHandler } from './middleware/error.middleware';

// Utilities
import initializeAdmin from './utils/adminInit';
import logger from './utils/logger';

/**
 * Create Express application
 */
const app: Application = express();

/**
 * Bootstrap the application
 * This async function handles all startup tasks
 */
const bootstrap = async (): Promise<void> => {
  try {
    // ===========================================
    // STEP 1: CONNECT TO DATABASE
    // ===========================================

    logger.info('Connecting to MongoDB...');
    await connectDB();

    // ===========================================
    // STEP 2: INITIALIZE ADMIN USER
    // ===========================================

    logger.info('Checking admin initialization...');
    await initializeAdmin();

    // ===========================================
    // STEP 3: SET UP MIDDLEWARE
    // ===========================================

    /**
     * Security middleware: Helmet
     * Sets various HTTP headers for security
     * - Content-Security-Policy
     * - X-Content-Type-Options
     * - X-Frame-Options
     * - And more...
     */
    app.use(helmet());

    /**
     * CORS middleware
     * Configures Cross-Origin Resource Sharing
     * Allows frontend to communicate with API
     */
    // Support multiple origins for development
    const allowedOrigins = [
      env.corsOrigin,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ].filter(Boolean);
    
    logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
    
    app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, curl, etc.)
          if (!origin) return callback(null, true);
          
          if (allowedOrigins.includes(origin) || env.isDevelopment) {
            callback(null, true);
          } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,               // Allow cookies
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    /**
     * Request parsing middleware
     * Parses JSON and URL-encoded request bodies
     */
    app.use(express.json({ limit: '10kb' }));  // Limit body size for security
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    /**
     * Request logging middleware: Morgan
     * Logs HTTP requests to console
     * 'dev' format: :method :url :status :response-time ms
     */
    if (env.isDevelopment) {
      app.use(morgan('dev'));
    } else {
      // Production: minimal logging
      app.use(morgan('combined'));
    }

    // ===========================================
    // STEP 4: MOUNT ROUTES
    // ===========================================

    /**
     * Health check endpoint
     * Used to verify backend is running and accessible
     */
    app.get('/health', (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Backend is running',
        timestamp: new Date().toISOString(),
        corsOrigin: env.corsOrigin,
      });
    });

    /**
     * Root endpoint
     * Simple welcome message
     */
    app.get('/', (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Welcome to DSA Sheet API',
        version: '1.0.0',
        documentation: '/api',
      });
    });

    /**
     * API routes
     * All API endpoints are prefixed with /api
     */
    app.use('/api', routes);

    // ===========================================
    // STEP 5: ERROR HANDLING
    // ===========================================

    /**
     * 404 handler
     * Catches requests to undefined routes
     * Must come after all route definitions
     */
    app.use(notFoundHandler);

    /**
     * Global error handler
     * Catches all errors and sends appropriate response
     * Must be the LAST middleware
     */
    app.use(errorMiddleware);

    // ===========================================
    // STEP 6: START SERVER
    // ===========================================

    const PORT = env.port;

    app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
      logger.info(`Environment: ${env.nodeEnv}`);
      logger.info(`API URL: http://localhost:${PORT}/api`);

      if (env.isDevelopment) {
        logger.debug('Debug mode enabled');
        logger.info('\nAvailable endpoints:');
        logger.info('  POST   /api/auth/register');
        logger.info('  POST   /api/auth/login');
        logger.info('  GET    /api/auth/me');
        logger.info('  GET    /api/topics');
        logger.info('  GET    /api/problems');
        logger.info('  GET    /api/progress');
        logger.info('  GET    /api/health');
      }
    });
  } catch (error) {
    // ===========================================
    // STARTUP ERROR HANDLING
    // ===========================================

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to start server: ${errorMessage}`);

    if (error instanceof Error && error.stack) {
      logger.debug('Stack trace:', error.stack);
    }

    // Exit with error code
    process.exit(1);
  }
};

// ===========================================
// UNHANDLED ERROR HANDLERS
// ===========================================

/**
 * Handle unhandled promise rejections
 * These occur when a Promise rejects without a catch handler
 */
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason.message);
  logger.debug('Stack:', reason.stack);

  // In production, you might want to:
  // 1. Log to error tracking service (Sentry, etc.)
  // 2. Gracefully shut down
  // 3. Let process manager restart the app
});

/**
 * Handle uncaught exceptions
 * These are synchronous errors that weren't caught
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error.message);
  logger.debug('Stack:', error.stack);

  // Uncaught exceptions leave the app in undefined state
  // It's best to exit and let process manager restart
  process.exit(1);
});

// ===========================================
// START APPLICATION
// ===========================================

bootstrap();

// Export app for testing
export default app;
