/**
 * ===========================================
 * EXPRESS TYPE EXTENSIONS
 * ===========================================
 *
 * This file extends Express's Request interface to include custom properties.
 *
 * WHY THIS STRUCTURE:
 * 1. Must be a module (have export/import) for declaration merging to work
 * 2. Must use 'declare global' to extend global Express namespace
 * 3. Must be included in tsconfig.json typeRoots
 *
 * COMMON MISTAKES:
 * - Not exporting anything (file not treated as module)
 * - Using 'declare namespace' without 'declare global'
 * - Not referencing the file in tsconfig
 */

import { IUserDocument } from './models.types';

/**
 * Extend Express namespace globally
 * This adds our custom properties to Express.Request
 */
declare global {
  namespace Express {
    /**
     * Extended Request interface
     * Adds user property set by auth middleware
     */
    interface Request {
      /**
       * Authenticated user document
       * Set by authMiddleware after JWT verification
       * Optional because not all routes require auth
       */
      user?: IUserDocument;
    }
  }
}

// This export makes this file a module (required for declaration merging)
export {};
