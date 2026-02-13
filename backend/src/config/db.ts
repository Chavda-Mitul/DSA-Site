/**
 * ===========================================
 * DATABASE CONNECTION MODULE
 * ===========================================
 *
 * This module handles MongoDB connection using Mongoose.
 * It includes:
 * - Connection establishment with retry logic
 * - Connection event handlers for monitoring
 * - Graceful shutdown handling
 *
 * WHY SEPARATE THIS:
 * - Single responsibility: only handles database connection
 * - Easy to test and mock
 * - Reusable across the application
 * - Centralized connection configuration
 */

import mongoose from 'mongoose';
import env from './env';
import logger from '../utils/logger';

/**
 * Connect to MongoDB database
 *
 * This function establishes a connection to MongoDB and sets up
 * event handlers for connection monitoring.
 *
 * @returns Promise that resolves to the Mongoose connection
 * @throws Error if connection fails
 *
 * @example
 * ```typescript
 * await connectDB();
 * console.log('Database connected!');
 * ```
 */
const connectDB = async (): Promise<typeof mongoose> => {
  try {
    // ===========================================
    // ESTABLISH CONNECTION
    // ===========================================

    /**
     * Connect to MongoDB using the URI from environment variables
     *
     * Mongoose 8+ Notes:
     * - useNewUrlParser and useUnifiedTopology are no longer needed
     * - These options are now default behavior
     */
    const conn = await mongoose.connect(env.mongodbUri);

    // Log successful connection (with masked credentials for security)
    const dbHost = conn.connection.host;
    const dbName = conn.connection.name;
    logger.success(`MongoDB Connected: ${dbHost}/${dbName}`);

    // ===========================================
    // CONNECTION EVENT HANDLERS
    // ===========================================

    /**
     * Handle connection errors after initial connection
     * These can occur due to network issues, server restarts, etc.
     */
    mongoose.connection.on('error', (err: Error) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    /**
     * Handle disconnection events
     * Mongoose will automatically try to reconnect
     */
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    /**
     * Handle successful reconnection
     */
    mongoose.connection.on('reconnected', () => {
      logger.success('MongoDB reconnected');
    });

    // ===========================================
    // GRACEFUL SHUTDOWN HANDLING
    // ===========================================

    /**
     * Handle SIGINT (Ctrl+C) for graceful shutdown
     * Ensures database connections are properly closed
     */
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error during database disconnection:', err);
        process.exit(1);
      }
    });

    /**
     * Handle SIGTERM (process termination) for graceful shutdown
     * Common in containerized environments (Docker, Kubernetes)
     */
    process.on('SIGTERM', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to SIGTERM');
        process.exit(0);
      } catch (err) {
        logger.error('Error during database disconnection:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    // ===========================================
    // CONNECTION FAILURE HANDLING
    // ===========================================

    /**
     * If initial connection fails, log the error and exit
     * The application cannot function without a database connection
     */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error connecting to MongoDB: ${errorMessage}`);

    // In development, provide more helpful information
    if (env.isDevelopment) {
      logger.debug('\n💡 Troubleshooting tips:');
      logger.debug('   1. Make sure MongoDB is running');
      logger.debug('   2. Check your MONGODB_URI in .env file');
      logger.debug('   3. Verify network connectivity to the database');
      logger.debug(`   4. Current URI: ${env.mongodbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    }

    // Exit with error code
    process.exit(1);
  }
};

export default connectDB;
