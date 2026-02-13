/**
 * ===========================================
 * API RESPONSE UTILITY
 * ===========================================
 *
 * This class provides a standardized format for all API responses.
 * Using consistent response structures makes the API easier to use
 * and maintain.
 *
 * RESPONSE STRUCTURE:
 * {
 *   success: boolean,    // Whether the request succeeded
 *   message: string,     // Human-readable message
 *   data?: T,           // Optional payload (for successful responses)
 *   error?: string,     // Optional error details
 *   pagination?: {...}  // Optional pagination info
 * }
 *
 * WHY USE THIS:
 * - Consistent response format across all endpoints
 * - Type-safe response construction
 * - Easy to parse on the frontend
 * - Includes pagination support for list endpoints
 */

import { Response } from 'express';

/**
 * Pagination information for list responses
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Standard API response structure
 */
export interface ApiResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationInfo;
}

/**
 * API Response utility class
 * Provides static methods for creating consistent responses
 */
class ApiResponse {
  /**
   * Send a successful response
   *
   * @param res - Express response object
   * @param statusCode - HTTP status code (200, 201, etc.)
   * @param message - Success message
   * @param data - Optional data payload
   *
   * @example
   * ```typescript
   * // Simple success
   * ApiResponse.success(res, 200, 'User fetched successfully', user);
   *
   * // Created response
   * ApiResponse.success(res, 201, 'User created successfully', newUser);
   * ```
   */
  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T
  ): Response<ApiResponseBody<T>> {
    const response: ApiResponseBody<T> = {
      success: true,
      message,
    };

    // Only include data if it's provided
    if (data !== undefined) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a successful response with pagination
   *
   * @param res - Express response object
   * @param statusCode - HTTP status code
   * @param message - Success message
   * @param data - Array of items
   * @param pagination - Pagination information
   *
   * @example
   * ```typescript
   * const pagination = {
   *   currentPage: 1,
   *   totalPages: 5,
   *   totalItems: 50,
   *   itemsPerPage: 10,
   *   hasNextPage: true,
   *   hasPrevPage: false
   * };
   * ApiResponse.paginated(res, 200, 'Problems fetched', problems, pagination);
   * ```
   */
  static paginated<T>(
    res: Response,
    statusCode: number,
    message: string,
    data: T[],
    pagination: PaginationInfo
  ): Response<ApiResponseBody<T[]>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination,
    });
  }

  /**
   * Send an error response
   *
   * @param res - Express response object
   * @param statusCode - HTTP status code (400, 404, 500, etc.)
   * @param message - Error message
   * @param errors - Optional array of detailed errors
   *
   * @example
   * ```typescript
   * // Simple error
   * ApiResponse.error(res, 404, 'User not found');
   *
   * // Error with details
   * ApiResponse.error(res, 400, 'Validation failed', [
   *   'Email is required',
   *   'Password is too short'
   * ]);
   * ```
   */
  static error(
    res: Response,
    statusCode: number,
    message: string,
    errors?: string[]
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  /**
   * Send a 201 Created response
   * Shorthand for successful creation operations
   */
  static created<T>(res: Response, message: string, data?: T): Response {
    return ApiResponse.success(res, 201, message, data);
  }

  /**
   * Send a 204 No Content response
   * Used for successful delete operations
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Helper to create pagination info from query params
   *
   * @param page - Current page number
   * @param limit - Items per page
   * @param totalItems - Total number of items
   * @returns Pagination info object
   *
   * @example
   * ```typescript
   * const total = await Problem.countDocuments();
   * const pagination = ApiResponse.createPagination(1, 10, total);
   * ```
   */
  static createPagination(
    page: number,
    limit: number,
    totalItems: number
  ): PaginationInfo {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

export default ApiResponse;
