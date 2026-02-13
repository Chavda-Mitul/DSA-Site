/**
 * ===========================================
 * TOPIC VALIDATION SCHEMAS
 * ===========================================
 *
 * Joi validation schemas for Topic CRUD operations.
 * Topics are DSA chapters like "Arrays", "Trees", etc.
 */

import Joi from 'joi';

/**
 * Create topic validation schema
 *
 * @example
 * Valid request body:
 * {
 *   "title": "Binary Search",
 *   "description": "Problems related to binary search algorithm",
 *   "order": 5
 * }
 */
export const createTopicSchema = Joi.object({
  /**
   * Topic title
   * - Required
   * - 3-200 characters
   * - Used to generate slug
   */
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Topic title is required',
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Topic title is required',
    }),

  /**
   * Topic description
   * - Optional
   * - Max 1000 characters
   */
  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .default('')
    .messages({
      'string.max': 'Description cannot exceed 1000 characters',
    }),

  /**
   * Display order
   * - Optional (auto-generated if not provided)
   * - Must be positive number
   */
  order: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Order must be a number',
      'number.integer': 'Order must be a whole number',
      'number.min': 'Order must be a positive number',
    }),
});

/**
 * Update topic validation schema
 *
 * All fields are optional since it's a partial update.
 *
 * @example
 * Valid request body:
 * {
 *   "title": "Updated Title",
 *   "description": "New description"
 * }
 */
export const updateTopicSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 200 characters',
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 1000 characters',
    }),

  order: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Order must be a number',
      'number.integer': 'Order must be a whole number',
      'number.min': 'Order must be a positive number',
    }),

  /**
   * Active status
   * - Used for soft delete/restore
   */
  isActive: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});

/**
 * Topic query parameters schema
 *
 * @example
 * GET /api/topics?page=1&limit=10&includeInactive=true
 */
export const topicQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),

  /**
   * Include inactive topics (admin only)
   */
  includeInactive: Joi.boolean()
    .default(false),

  /**
   * Sort field
   */
  sortBy: Joi.string()
    .valid('order', 'title', 'createdAt')
    .default('order'),

  /**
   * Sort order
   */
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc'),
});
