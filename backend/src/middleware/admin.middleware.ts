/**
 * ===========================================
 * ADMIN AUTHORIZATION MIDDLEWARE
 * ===========================================
 *
 * This middleware checks if the authenticated user has admin role.
 * It MUST be used AFTER the auth middleware.
 *
 * PURPOSE:
 * - Protect admin-only routes (create/update/delete operations)
 * - Prevent regular users from accessing admin functionality
 * - Enforce role-based access control (RBAC)
 *
 * USAGE:
 * ```typescript
 * // Apply both auth and admin middleware
 * router.post('/topics', authMiddleware, adminMiddleware, createTopic);
 *
 * // Or use the combined middleware
 * router.delete('/problems/:id', requireAdmin, deleteProblem);
 * ```
 *
 * IMPORTANT:
 * - Always use authMiddleware before adminMiddleware
 * - adminMiddleware assumes req.user is already set
 */

import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import { UserRole } from '../types/models.types';
import authMiddleware from './auth.middleware';

/**
 * Admin authorization middleware
 *
 * Checks if the authenticated user has admin role.
 * Must be used after authMiddleware.
 *
 * @throws ApiError 401 - If user is not authenticated (no req.user)
 * @throws ApiError 403 - If user is not an admin
 */
const adminMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // ===========================================
  // STEP 1: VERIFY USER IS AUTHENTICATED
  // ===========================================

  /**
   * Check if user is attached to request
   * This should be set by authMiddleware
   */
  if (!req.user) {
    /**
     * This means adminMiddleware was used without authMiddleware
     * This is a programming error, not a user error
     */
    throw ApiError.unauthorized(
      'Authentication required. Please login to access this resource.'
    );
  }

  // ===========================================
  // STEP 2: CHECK ADMIN ROLE
  // ===========================================

  /**
   * Verify user has admin role
   * Using the isAdmin() method from User model
   */
  if (req.user.role !== UserRole.ADMIN) {
    /**
     * User is authenticated but not authorized
     * 403 Forbidden is appropriate here (not 401)
     *
     * 401: "Who are you?" (authentication)
     * 403: "I know who you are, but you can't do this" (authorization)
     */
    throw ApiError.forbidden(
      'Access denied. Administrator privileges required.'
    );
  }

  // ===========================================
  // STEP 3: USER IS ADMIN - CONTINUE
  // ===========================================

  next();
};

/**
 * Combined authentication + admin authorization middleware
 *
 * Convenience function that applies both middlewares.
 * Use this for routes that require admin access.
 *
 * @example
 * ```typescript
 * // Instead of:
 * router.post('/topics', authMiddleware, adminMiddleware, createTopic);
 *
 * // You can use:
 * router.post('/topics', requireAdmin, createTopic);
 * ```
 */
export const requireAdmin = [authMiddleware, adminMiddleware];

/**
 * Role-based middleware factory
 *
 * Creates middleware that checks for specific roles.
 * Useful if you add more roles in the future.
 *
 * @param allowedRoles - Array of roles that are allowed
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * // Allow only admins
 * router.use(requireRoles([UserRole.ADMIN]));
 *
 * // Allow both users and admins (all authenticated users)
 * router.use(requireRoles([UserRole.USER, UserRole.ADMIN]));
 * ```
 */
export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.');
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw ApiError.forbidden(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

export default adminMiddleware;
