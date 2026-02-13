/**
 * ===========================================
 * ENVIRONMENT CONFIGURATION
 * ===========================================
 *
 * This module loads and validates environment variables.
 * It provides a type-safe way to access configuration values.
 *
 * WHY USE THIS:
 * - Centralized configuration management
 * - Type safety for environment variables
 * - Validation of required variables at startup
 * - Default values for optional variables
 * - Easy access throughout the application
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
// The path.join ensures we find the .env file relative to this file's location
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

/**
 * Interface defining the shape of our environment configuration
 * This ensures type safety when accessing config values
 */
export interface EnvConfig {
  // Server settings
  nodeEnv: string;
  port: number;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;

  // Database
  mongodbUri: string;

  // Authentication
  jwtSecret: string;
  jwtExpiresIn: string;

  // Admin initialization
  adminEmail: string;
  adminPassword: string;

  // CORS
  corsOrigin: string;
}

/**
 * Parse and validate environment variables
 * Creates a strongly-typed configuration object
 */
const env: EnvConfig = {
  // ===========================================
  // SERVER CONFIGURATION
  // ===========================================

  /**
   * Current environment (development, production, test)
   * Used to adjust behavior based on environment
   */
  nodeEnv: process.env.NODE_ENV || 'development',

  /**
   * Port number for the Express server
   * Defaults to 5000 if not specified
   */
  port: parseInt(process.env.PORT || '5000', 10),

  /**
   * Helper boolean flags for environment checks
   * Use these instead of comparing strings directly
   */
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // ===========================================
  // DATABASE CONFIGURATION
  // ===========================================

  /**
   * MongoDB connection string
   * Can be a local MongoDB instance or MongoDB Atlas cluster
   */
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-sheet',

  // ===========================================
  // AUTHENTICATION CONFIGURATION
  // ===========================================

  /**
   * Secret key for signing JWT tokens
   * IMPORTANT: Must be a strong, random string in production
   */
  jwtSecret: process.env.JWT_SECRET || '',

  /**
   * JWT token expiration time
   * Examples: '1h' (1 hour), '7d' (7 days), '30d' (30 days)
   */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // ===========================================
  // ADMIN INITIALIZATION
  // ===========================================

  /**
   * Email for the initial admin user
   * Created on first server startup if no admin exists
   */
  adminEmail: process.env.ADMIN_EMAIL || '',

  /**
   * Password for the initial admin user
   * IMPORTANT: Change this in production
   */
  adminPassword: process.env.ADMIN_PASSWORD || '',

  // ===========================================
  // CORS CONFIGURATION
  // ===========================================

  /**
   * Allowed origin(s) for CORS
   * Typically your frontend application URL
   */
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// ===========================================
// VALIDATION
// ===========================================

/**
 * List of required environment variables
 * Server will fail to start if these are missing
 */
const requiredEnvVars: (keyof EnvConfig)[] = ['jwtSecret'];

/**
 * Validate that all required environment variables are set
 * Throws an error if any are missing (except in test environment)
 */
const validateEnv = (): void => {
  const missing: string[] = [];

  for (const varName of requiredEnvVars) {
    if (!env[varName]) {
      missing.push(varName);
    }
  }

  // Don't fail in test environment
  if (missing.length > 0 && !env.isTest) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please check your .env file or environment configuration.`
    );
  }

  // Additional validation: warn if JWT secret is weak in production
  if (env.jwtSecret && env.jwtSecret.length < 32 && env.isProduction) {
    throw new Error(
      `JWT_SECRET is too short. It must be at least 32 characters for production security.`
    );
  }
};

// Run validation
validateEnv();

// Export the configuration object
export default env;
