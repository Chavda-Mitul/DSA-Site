/**
 * ===========================================
 * AUTHENTICATION MIDDLEWARE
 * ===========================================
 *
 * This middleware verifies JWT tokens and attaches user info to requests.
 * It protects routes that require authentication.
 *
 * HOW IT WORKS:
 * 1. Extract token from Authorization header (Bearer token)
 * 2. Verify token signature and expiration
 * 3. Find user in database
 * 4. Attach user to request object
 * 5. Call next() to continue to route handler
 *
 * USAGE:
 * ```typescript
 * // Protect a single route
 * router.get('/profile', authMiddleware, getProfile);
 *
 * // Protect all routes in a router
 * router.use(authMiddleware);
 * ```
 *
 * AUTHORIZATION HEADER FORMAT:
 * Authorization: Bearer <token>
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import env from '../config/env';
import { IJwtPayload } from '../types/models.types';

/**
 * Authentication middleware
 *
 * Verifies the JWT token and attaches the user to the request.
 * If authentication fails, throws an appropriate error.
 *
 * @throws ApiError 401 - If no token provided
 * @throws ApiError 401 - If token is invalid or expired
 * @throws ApiError 401 - If user not found or deactivated
 */
const authMiddleware = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // ===========================================
    // STEP 1: EXTRACT TOKEN FROM HEADER
    // ===========================================

    /**
     * Get Authorization header
     * Expected format: "Bearer <token>"
     */
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(
        'Authentication required. Please provide a valid token.'
      );
    }

    // Extract the token (everything after 'Bearer ')
    const token = authHeader.split(' ')[1];

    // Verify token exists
    if (!token) {
      throw ApiError.unauthorized('Authentication token is missing.');
    }

    // ===========================================
    // STEP 2: VERIFY TOKEN
    // ===========================================

    /**
     * Verify JWT token
     * - Checks signature using JWT_SECRET
     * - Checks expiration (exp claim)
     * - Returns decoded payload if valid
     */
    let decoded: IJwtPayload;

    try {
      decoded = jwt.verify(token, env.jwtSecret) as IJwtPayload;
    } catch (error) {
      // Handle specific JWT errors
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Token has expired. Please login again.');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid token. Please login again.');
      }
      throw ApiError.unauthorized('Token verification failed.');
    }

    // ===========================================
    // STEP 3: FIND USER IN DATABASE
    // ===========================================

    /**
     * Fetch user from database
     * We need to verify:
     * - User still exists (might have been deleted)
     * - User is still active (might have been deactivated)
     */
    const user = await User.findById(decoded.userId);

    // Check if user exists
    if (!user) {
      throw ApiError.unauthorized(
        'User no longer exists. Please register again.'
      );
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.unauthorized(
        'Your account has been deactivated. Please contact support.'
      );
    }

    // ===========================================
    // STEP 4: ATTACH USER TO REQUEST
    // ===========================================

    /**
     * Attach user document to request
     * This makes user info available in route handlers
     *
     * @example
     * // In a route handler:
     * const userId = req.user._id;
     * const isAdmin = req.user.isAdmin();
     */
    req.user = user;

    // ===========================================
    // STEP 5: CONTINUE TO ROUTE HANDLER
    // ===========================================

    next();
  }
);

/**
 * Optional authentication middleware
 *
 * Similar to authMiddleware but doesn't throw error if no token.
 * Useful for routes that work for both authenticated and anonymous users.
 *
 * @example
 * // Route shows extra info for logged-in users
 * router.get('/problems', optionalAuth, listProblems);
 */
export const optionalAuthMiddleware = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    // If no token, just continue (user will be undefined)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret) as IJwtPayload;
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    } catch {
      // Silently ignore token errors for optional auth
    }

    next();
  }
);

export default authMiddleware;
