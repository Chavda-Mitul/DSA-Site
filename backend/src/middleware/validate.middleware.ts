/**
 * ===========================================
 * VALIDATION MIDDLEWARE
 * ===========================================
 *
 * This middleware validates request data using Joi schemas.
 * It ensures data integrity before reaching route handlers.
 *
 * WHAT IT VALIDATES:
 * - req.body: Request payload (POST, PUT, PATCH)
 * - req.params: URL parameters (/users/:id)
 * - req.query: Query string (?page=1&limit=10)
 *
 * WHY USE VALIDATION MIDDLEWARE:
 * - Centralized validation logic
 * - Consistent error responses
 * - Type-safe request data
 * - Clear API contracts
 * - Prevents invalid data from reaching database
 *
 * USAGE:
 * ```typescript
 * import { validateBody, validateParams } from './middleware/validate.middleware';
 * import { createUserSchema, idParamSchema } from './validators/user.validator';
 *
 * router.post('/users', validateBody(createUserSchema), createUser);
 * router.get('/users/:id', validateParams(idParamSchema), getUser);
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import ApiError from '../utils/ApiError';

/**
 * Validation options for Joi
 */
const validationOptions: Joi.ValidationOptions = {
  abortEarly: false,    // Return all errors, not just the first
  allowUnknown: false,  // Reject unknown fields
  stripUnknown: true,   // Remove unknown fields from validated data
};

/**
 * Extract error messages from Joi validation result
 *
 * @param error - Joi validation error
 * @returns Array of error messages
 */
const extractErrorMessages = (error: Joi.ValidationError): string[] => {
  return error.details.map((detail) => {
    // Make error messages more user-friendly
    return detail.message.replace(/"/g, "'");
  });
};

/**
 * Create validation middleware for request body
 *
 * Validates req.body against provided Joi schema.
 * Replaces req.body with validated (and sanitized) data.
 *
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const createUserSchema = Joi.object({
 *   name: Joi.string().required().min(2).max(100),
 *   email: Joi.string().required().email(),
 *   password: Joi.string().required().min(8)
 * });
 *
 * router.post('/users', validateBody(createUserSchema), createUser);
 * ```
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, validationOptions);

    if (error) {
      const messages = extractErrorMessages(error);
      throw new ApiError(400, 'Validation failed', messages);
    }

    // Replace body with validated/sanitized data
    req.body = value;
    next();
  };
};

/**
 * Create validation middleware for URL parameters
 *
 * Validates req.params against provided Joi schema.
 * Useful for validating IDs and other URL parameters.
 *
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const idParamSchema = Joi.object({
 *   id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
 * });
 *
 * router.get('/users/:id', validateParams(idParamSchema), getUser);
 * ```
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, validationOptions);

    if (error) {
      const messages = extractErrorMessages(error);
      throw new ApiError(400, 'Invalid URL parameters', messages);
    }

    req.params = value;
    next();
  };
};

/**
 * Create validation middleware for query string
 *
 * Validates req.query against provided Joi schema.
 * Useful for pagination, filtering, and search parameters.
 *
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const listQuerySchema = Joi.object({
 *   page: Joi.number().integer().min(1).default(1),
 *   limit: Joi.number().integer().min(1).max(100).default(10),
 *   difficulty: Joi.string().valid('Easy', 'Medium', 'Hard')
 * });
 *
 * router.get('/problems', validateQuery(listQuerySchema), listProblems);
 * ```
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Query params are always strings, so we need to convert types
    const queryOptions: Joi.ValidationOptions = {
      ...validationOptions,
      convert: true, // Convert strings to appropriate types
    };

    const { error, value } = schema.validate(req.query, queryOptions);

    if (error) {
      const messages = extractErrorMessages(error);
      throw new ApiError(400, 'Invalid query parameters', messages);
    }

    req.query = value;
    next();
  };
};

/**
 * Combined validation middleware
 *
 * Validates body, params, and query in one call.
 * Useful when you need to validate multiple parts of the request.
 *
 * @param schemas - Object containing Joi schemas for body, params, and/or query
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const updateProblemSchemas = {
 *   body: Joi.object({ title: Joi.string(), difficulty: Joi.string() }),
 *   params: Joi.object({ id: Joi.string().required() })
 * };
 *
 * router.put('/problems/:id', validate(updateProblemSchemas), updateProblem);
 * ```
 */
export const validate = (schemas: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, validationOptions);
      if (error) {
        errors.push(...extractErrorMessages(error));
      } else {
        req.body = value;
      }
    }

    // Validate params
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, validationOptions);
      if (error) {
        errors.push(...extractErrorMessages(error));
      } else {
        req.params = value;
      }
    }

    // Validate query
    if (schemas.query) {
      const queryOptions = { ...validationOptions, convert: true };
      const { error, value } = schemas.query.validate(req.query, queryOptions);
      if (error) {
        errors.push(...extractErrorMessages(error));
      } else {
        req.query = value;
      }
    }

    // If any validation errors, throw ApiError
    if (errors.length > 0) {
      throw new ApiError(400, 'Validation failed', errors);
    }

    next();
  };
};

// ===========================================
// COMMON VALIDATION SCHEMAS
// ===========================================

/**
 * MongoDB ObjectId validation schema
 * Use for validating :id parameters
 */
export const objectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ID format');

/**
 * Pagination query schema
 * Common schema for list endpoints
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

/**
 * ID parameter schema
 * Use for routes with :id parameter
 */
export const idParamSchema = Joi.object({
  id: objectIdSchema.required(),
});

export default validate;
