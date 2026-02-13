/**
 * ===========================================
 * ERROR HANDLING MIDDLEWARE
 * ===========================================
 *
 * Central error handler for the entire application.
 * Catches all errors and sends appropriate responses.
 *
 * ERROR TYPES HANDLED:
 * - ApiError: Our custom errors with status codes
 * - Mongoose ValidationError: Schema validation failures
 * - Mongoose CastError: Invalid ObjectId format
 * - Mongoose Duplicate Key: Unique constraint violations
 * - JWT Errors: Token issues
 * - Generic Errors: Unexpected errors
 *
 * RESPONSE FORMAT:
 * {
 *   success: false,
 *   message: "Error message",
 *   errors?: ["Detailed error 1", "Detailed error 2"],
 *   stack?: "..." // Only in development
 * }
 *
 * USAGE:
 * This middleware should be registered LAST in the Express app.
 * ```typescript
 * app.use(routes);
 * app.use(errorMiddleware); // Must be last!
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError';
import env from '../config/env';
import logger from '../utils/logger';

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  stack?: string;
}

/**
 * Handle Mongoose Validation Errors
 *
 * Extracts validation messages from Mongoose ValidationError.
 * Example: Required fields, string length, enum values.
 *
 * @param err - Mongoose ValidationError
 * @returns ApiError with 400 status
 */
const handleValidationError = (err: mongoose.Error.ValidationError): ApiError => {
  // Extract all validation error messages
  const errors = Object.values(err.errors).map((error) => error.message);

  return new ApiError(400, 'Validation failed', errors);
};

/**
 * Handle Mongoose Cast Errors
 *
 * Occurs when an invalid ObjectId is provided.
 * Example: GET /users/invalid-id
 *
 * @param err - Mongoose CastError
 * @returns ApiError with 400 status
 */
const handleCastError = (err: mongoose.Error.CastError): ApiError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ApiError(400, message);
};

/**
 * Handle MongoDB Duplicate Key Errors
 *
 * Occurs when inserting a document that violates a unique constraint.
 * Example: Registering with an email that already exists.
 *
 * @param err - MongoDB error with code 11000
 * @returns ApiError with 409 (Conflict) status
 */
const handleDuplicateKeyError = (err: Error & { keyValue?: Record<string, unknown> }): ApiError => {
  // Extract the duplicate field name
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
  const value = err.keyValue ? err.keyValue[field] : 'value';

  const message = `${field} '${value}' already exists. Please use a different ${field}.`;
  return new ApiError(409, message);
};

/**
 * Handle JWT Errors
 *
 * Handles various JWT-related errors.
 *
 * @param err - JWT error
 * @returns ApiError with 401 status
 */
const handleJWTError = (err: Error): ApiError => {
  if (err.name === 'TokenExpiredError') {
    return new ApiError(401, 'Token has expired. Please login again.');
  }
  if (err.name === 'JsonWebTokenError') {
    return new ApiError(401, 'Invalid token. Please login again.');
  }
  return new ApiError(401, 'Authentication failed.');
};

/**
 * Central Error Handling Middleware
 *
 * This middleware catches all errors thrown in the application
 * and sends a standardized error response.
 *
 * Express recognizes this as error middleware because it has 4 parameters.
 *
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param _next - Express next function (unused but required for signature)
 */
const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction // Required for Express to recognize this as error middleware
): void => {
  // ===========================================
  // LOG THE ERROR
  // ===========================================

  /**
   * Log error details for debugging
   * In production, you might want to send to error tracking service
   */
  logger.error(`Error on ${req.method} ${req.path}:`, err.message);

  // Log stack trace in development
  if (env.isDevelopment && err.stack) {
    logger.debug('Stack trace:', err.stack);
  }

  // ===========================================
  // DETERMINE ERROR TYPE AND CONVERT
  // ===========================================

  let error: ApiError;

  /**
   * Convert various error types to ApiError
   * This ensures consistent error response format
   */

  // Already an ApiError - use as is
  if (err instanceof ApiError) {
    error = err;
  }
  // Mongoose Validation Error
  else if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationError(err);
  }
  // Mongoose Cast Error (invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    error = handleCastError(err);
  }
  // MongoDB Duplicate Key Error
  else if ((err as Error & { code?: number }).code === 11000) {
    error = handleDuplicateKeyError(err as Error & { keyValue?: Record<string, unknown> });
  }
  // JWT Errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }
  // Unknown Error - convert to 500
  else {
    error = new ApiError(
      500,
      env.isProduction ? 'Internal server error' : err.message,
      undefined,
      false // Not operational (programming error)
    );
  }

  // ===========================================
  // BUILD ERROR RESPONSE
  // ===========================================

  const response: ErrorResponse = {
    success: false,
    message: error.message,
  };

  // Include detailed errors if available
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  // Include stack trace in development (for debugging)
  if (env.isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  // ===========================================
  // SEND RESPONSE
  // ===========================================

  res.status(error.statusCode).json(response);
};

/**
 * 404 Not Found Handler
 *
 * Catches requests to undefined routes.
 * Should be registered after all route definitions.
 *
 * @example
 * ```typescript
 * app.use(routes);
 * app.use(notFoundHandler);
 * app.use(errorMiddleware);
 * ```
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new ApiError(
    404,
    `Route not found: ${req.method} ${req.originalUrl}`
  );
  next(error);
};

export default errorMiddleware;
