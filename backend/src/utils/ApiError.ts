/**
 * ===========================================
 * CUSTOM API ERROR CLASS
 * ===========================================
 *
 * This class extends the built-in Error class to add HTTP status codes
 * and other properties useful for API error handling.
 *
 * WHY USE A CUSTOM ERROR CLASS:
 * - Consistent error structure across the application
 * - Easy to determine HTTP status code from error
 * - Supports operational vs programming errors distinction
 * - Works seamlessly with the error handling middleware
 *
 * USAGE:
 * ```typescript
 * // Throw a 404 error
 * throw new ApiError(404, 'User not found');
 *
 * // Throw a 400 error with additional details
 * throw new ApiError(400, 'Validation failed', ['email is required']);
 * ```
 */

/**
 * Custom error class for API errors
 * Extends Error to include HTTP status code and additional properties
 */
class ApiError extends Error {
  /**
   * HTTP status code for this error
   * Examples: 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)
   */
  public statusCode: number;

  /**
   * Whether this is an operational error (expected) or programming error (bug)
   * Operational errors: Invalid input, resource not found, etc.
   * Programming errors: Type errors, null reference, etc.
   */
  public isOperational: boolean;

  /**
   * Additional error details (e.g., validation errors)
   */
  public errors?: string[];

  /**
   * Create a new API error
   *
   * @param statusCode - HTTP status code (default: 500)
   * @param message - Error message
   * @param errors - Optional array of detailed error messages
   * @param isOperational - Whether this is an operational error (default: true)
   *
   * @example
   * ```typescript
   * // Simple error
   * throw new ApiError(404, 'User not found');
   *
   * // Error with validation details
   * throw new ApiError(400, 'Validation failed', [
   *   'Email is required',
   *   'Password must be at least 8 characters'
   * ]);
   * ```
   */
  constructor(
    statusCode: number = 500,
    message: string = 'Something went wrong',
    errors?: string[],
    isOperational: boolean = true
  ) {
    // Call parent constructor with message
    super(message);

    // Set custom properties
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    // Set the prototype explicitly (needed for extending built-in classes)
    Object.setPrototypeOf(this, ApiError.prototype);

    // Capture stack trace (excludes constructor call from stack)
    Error.captureStackTrace(this, this.constructor);

    // Set error name to class name
    this.name = this.constructor.name;
  }

  // ===========================================
  // STATIC FACTORY METHODS
  // ===========================================
  // These provide convenient ways to create common error types

  /**
   * Create a 400 Bad Request error
   * Use for invalid client input
   */
  static badRequest(message: string = 'Bad request', errors?: string[]): ApiError {
    return new ApiError(400, message, errors);
  }

  /**
   * Create a 401 Unauthorized error
   * Use when authentication is required but not provided
   */
  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Create a 403 Forbidden error
   * Use when user is authenticated but lacks permission
   */
  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Create a 404 Not Found error
   * Use when requested resource doesn't exist
   */
  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Create a 409 Conflict error
   * Use for duplicate entries or conflicting operations
   */
  static conflict(message: string = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * Use when request is syntactically correct but semantically wrong
   */
  static unprocessable(message: string = 'Unprocessable entity', errors?: string[]): ApiError {
    return new ApiError(422, message, errors);
  }

  /**
   * Create a 429 Too Many Requests error
   * Use for rate limiting
   */
  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  /**
   * Create a 500 Internal Server Error
   * Use for unexpected server errors
   */
  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }
}

export default ApiError;
