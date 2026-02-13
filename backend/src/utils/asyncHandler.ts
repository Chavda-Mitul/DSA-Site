/**
 * ===========================================
 * ASYNC HANDLER UTILITY
 * ===========================================
 *
 * This utility wraps async route handlers to automatically catch errors
 * and pass them to Express error handling middleware.
 *
 * WITHOUT THIS WRAPPER:
 * ```typescript
 * // You'd need try/catch in every route handler
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json(users);
 *   } catch (error) {
 *     next(error); // Must manually call next(error)
 *   }
 * });
 * ```
 *
 * WITH THIS WRAPPER:
 * ```typescript
 * // Clean and simple - errors automatically forwarded
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 * ```
 *
 * HOW IT WORKS:
 * 1. Takes an async function as parameter
 * 2. Returns a new function that wraps the original
 * 3. The wrapper catches any errors from the async function
 * 4. Caught errors are passed to Express error middleware via next()
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Type definition for async route handlers
 * These are functions that take request, response, and optional next function
 * and return a Promise
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async function to handle errors automatically
 *
 * @param fn - Async function to wrap (route handler)
 * @returns Express RequestHandler that catches async errors
 *
 * @example
 * ```typescript
 * // Basic usage
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   ApiResponse.success(res, 200, 'Users fetched', users);
 * }));
 *
 * // Errors are automatically caught and forwarded
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) {
 *     throw new ApiError(404, 'User not found'); // Automatically caught!
 *   }
 *   ApiResponse.success(res, 200, 'User fetched', user);
 * }));
 * ```
 */
const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  // Return a new function that wraps the original
  return (req: Request, res: Response, next: NextFunction): void => {
    /**
     * Execute the async function and handle any errors
     *
     * Promise.resolve() ensures we always have a Promise to work with
     * even if fn() returns synchronously
     *
     * .catch(next) passes any error to Express error middleware
     */
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Alternative implementation using async/await syntax
 * Some developers find this more readable
 *
 * @example
 * ```typescript
 * const asyncHandlerAlt = (fn: AsyncRequestHandler): RequestHandler => {
 *   return async (req, res, next) => {
 *     try {
 *       await fn(req, res, next);
 *     } catch (error) {
 *       next(error);
 *     }
 *   };
 * };
 * ```
 */

export default asyncHandler;
