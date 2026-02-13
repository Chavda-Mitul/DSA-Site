/**
 * ===========================================
 * PROGRESS VALIDATION SCHEMAS
 * ===========================================
 *
 * Joi validation schemas for user progress tracking.
 * Handles marking problems as completed/not started.
 */

import Joi from 'joi';
import { ProgressStatus } from '../types/models.types';

/**
 * MongoDB ObjectId pattern
 */
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Update progress validation schema
 *
 * @example
 * Valid request body:
 * {
 *   "status": "completed"
 * }
 */
export const updateProgressSchema = Joi.object({
  /**
   * Progress status
   * - Required
   * - Must be 'not_started' or 'completed'
   */
  status: Joi.string()
    .valid(...Object.values(ProgressStatus))
    .required()
    .messages({
      'string.empty': 'Status is required',
      'any.only': 'Status must be not_started or completed',
      'any.required': 'Status is required',
    }),
});

/**
 * Problem ID parameter schema
 */
export const problemIdParamSchema = Joi.object({
  problemId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.empty': 'Problem ID is required',
      'string.pattern.base': 'Invalid Problem ID format',
      'any.required': 'Problem ID is required',
    }),
});

/**
 * Progress query parameters schema
 *
 * @example
 * GET /api/progress?status=completed&topicId=xxx
 */
export const progressQuerySchema = Joi.object({
  /**
   * Filter by status
   */
  status: Joi.string()
    .valid(...Object.values(ProgressStatus)),

  /**
   * Filter by topic
   */
  topicId: Joi.string()
    .pattern(objectIdPattern)
    .messages({
      'string.pattern.base': 'Invalid Topic ID format',
    }),

  /**
   * Include problem details
   */
  includeProblems: Joi.boolean()
    .default(true),
});

/**
 * Batch update progress schema
 *
 * Allows updating multiple problems at once.
 *
 * @example
 * {
 *   "updates": [
 *     { "problemId": "xxx", "status": "completed" },
 *     { "problemId": "yyy", "status": "not_started" }
 *   ]
 * }
 */
export const batchUpdateProgressSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        problemId: Joi.string()
          .pattern(objectIdPattern)
          .required()
          .messages({
            'string.pattern.base': 'Invalid Problem ID format',
            'any.required': 'Problem ID is required',
          }),
        status: Joi.string()
          .valid(...Object.values(ProgressStatus))
          .required()
          .messages({
            'any.only': 'Status must be not_started or completed',
            'any.required': 'Status is required',
          }),
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one update is required',
      'array.max': 'Maximum 50 updates allowed at once',
      'any.required': 'Updates array is required',
    }),
});
