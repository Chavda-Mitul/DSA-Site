/**
 * ===========================================
 * ADMIN INITIALIZATION UTILITY
 * ===========================================
 *
 * This module handles the creation of the initial admin user.
 * It runs on server startup and creates an admin account if:
 * - No admin users exist in the database
 * - ADMIN_EMAIL and ADMIN_PASSWORD environment variables are set
 *
 * WHY THIS IS IMPORTANT:
 * - Ensures there's always an admin account to access the system
 * - Automates initial setup without manual database manipulation
 * - Only runs once (when no admin exists)
 *
 * SECURITY CONSIDERATIONS:
 * - Admin credentials come from environment variables
 * - Password is hashed before storage
 * - Should use strong passwords in production
 */

import User from '../models/User.model';
import env from '../config/env';
import logger from './logger';
import { UserRole } from '../types/models.types';

/**
 * Initialize the admin user
 *
 * This function:
 * 1. Checks if any admin user exists
 * 2. If not, creates one using environment variables
 * 3. Logs the result
 *
 * @returns Promise that resolves when initialization is complete
 *
 * @example
 * ```typescript
 * // Called in server.ts after database connection
 * await connectDB();
 * await initializeAdmin();
 * ```
 */
const initializeAdmin = async (): Promise<void> => {
  try {
    // ===========================================
    // STEP 1: CHECK FOR EXISTING ADMIN
    // ===========================================

    /**
     * Count existing admin users
     * Using countDocuments is more efficient than find() when we just need a count
     */
    const adminCount = await User.countDocuments({ role: UserRole.ADMIN });

    // If admin exists, no need to create one
    if (adminCount > 0) {
      logger.debug(`Admin user(s) already exist (${adminCount} found). Skipping initialization.`);
      return;
    }

    // ===========================================
    // STEP 2: VALIDATE ENVIRONMENT VARIABLES
    // ===========================================

    /**
     * Check if admin credentials are provided in environment
     * Without these, we cannot create an admin user
     */
    if (!env.adminEmail || !env.adminPassword) {
      logger.warn(
        'No admin credentials provided in environment variables.\n' +
        '         Set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin user automatically.'
      );
      return;
    }

    // ===========================================
    // STEP 3: CHECK IF EMAIL IS ALREADY USED
    // ===========================================

    /**
     * Ensure the admin email isn't already registered as a regular user
     */
    const existingUser = await User.findOne({ email: env.adminEmail.toLowerCase() });

    if (existingUser) {
      // If user exists but isn't admin, we could promote them
      // For now, just log a warning
      logger.warn(
        `User with email ${env.adminEmail} already exists.\n` +
        '         To make them admin, update their role in the database.'
      );
      return;
    }

    // ===========================================
    // STEP 4: CREATE ADMIN USER
    // ===========================================

    /**
     * Create the admin user with credentials from environment
     *
     * Note: Password hashing happens automatically in the User model's
     * pre-save middleware. We pass the plain password, and the model
     * handles hashing.
     */
    const adminUser = new User({
      name: 'Admin',
      email: env.adminEmail.toLowerCase(),
      passwordHash: env.adminPassword, // Will be hashed by pre-save middleware
      role: UserRole.ADMIN,
      isActive: true,
    });

    // Save to database
    await adminUser.save();

    // ===========================================
    // STEP 5: LOG SUCCESS
    // ===========================================

    logger.success('Admin user created successfully');
    logger.info(`Admin email: ${env.adminEmail}`);

    // Security reminder in development
    if (env.isDevelopment) {
      logger.warn(
        'Remember to change the admin password in production!\n' +
        '         Never use default credentials in a live environment.'
      );
    }
  } catch (error) {
    // ===========================================
    // ERROR HANDLING
    // ===========================================

    /**
     * Log the error but don't crash the server
     * The application can still run without an admin user
     * (though admin functions won't be accessible)
     */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to initialize admin user: ${errorMessage}`);

    // In development, show the full error
    if (env.isDevelopment && error instanceof Error) {
      logger.debug('Admin initialization error stack:', error.stack);
    }
  }
};

export default initializeAdmin;
