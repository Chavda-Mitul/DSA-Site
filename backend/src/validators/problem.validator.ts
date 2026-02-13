/**
 * ===========================================
 * PROBLEM VALIDATION SCHEMAS
 * ===========================================
 *
 * Joi validation schemas for Problem CRUD operations.
 * Problems are individual DSA questions like "Two Sum", "Valid Parentheses".
 */

import Joi from 'joi';
import { Difficulty } from '../types/models.types';

/**
 * URL validation pattern
 * Allows http and https URLs
 */
const urlPattern = /^https?:\/\/.+/;

/**
 * MongoDB ObjectId pattern
 */
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Create problem validation schema
 *
 * @example
 * Valid request body:
 * {
 *   "title": "Two Sum",
 *   "topicId": "507f1f77bcf86cd799439011",
 *   "difficulty": "Easy",
 *   "leetcodeUrl": "https://leetcode.com/problems/two-sum",
 *   "youtubeUrl": "https://youtube.com/watch?v=xxx",
 *   "tags": ["array", "hash-table"]
 * }
 */
export const createProblemSchema = Joi.object({
  /**
   * Problem title
   * - Required
   * - 3-300 characters
   */
  title: Joi.string()
    .trim()
    .min(3)
    .max(300)
    .required()
    .messages({
      'string.empty': 'Problem title is required',
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 300 characters',
      'any.required': 'Problem title is required',
    }),

  /**
   * Topic reference (ObjectId)
   * - Required
   * - Must be valid MongoDB ObjectId
   */
  topicId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.empty': 'Topic ID is required',
      'string.pattern.base': 'Invalid Topic ID format',
      'any.required': 'Topic ID is required',
    }),

  /**
   * Problem difficulty
   * - Required
   * - Must be Easy, Medium, or Hard
   */
  difficulty: Joi.string()
    .valid(...Object.values(Difficulty))
    .required()
    .messages({
      'string.empty': 'Difficulty is required',
      'any.only': 'Difficulty must be Easy, Medium, or Hard',
      'any.required': 'Difficulty is required',
    }),

  /**
   * YouTube video URL
   * - Optional
   * - Must be valid URL if provided
   */
  youtubeUrl: Joi.string()
    .trim()
    .pattern(urlPattern)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid YouTube URL',
    }),

  /**
   * LeetCode problem URL
   * - Optional
   * - Must be valid URL if provided
   */
  leetcodeUrl: Joi.string()
    .trim()
    .pattern(urlPattern)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid LeetCode URL',
    }),

  /**
   * Article/solution URL
   * - Optional
   * - Must be valid URL if provided
   */
  articleUrl: Joi.string()
    .trim()
    .pattern(urlPattern)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid article URL',
    }),

  /**
   * Problem tags
   * - Optional
   * - Array of strings
   * - Each tag: 1-50 characters
   * - Max 10 tags
   */
  tags: Joi.array()
    .items(
      Joi.string()
        .trim()
        .min(1)
        .max(50)
    )
    .max(10)
    .default([])
    .messages({
      'array.max': 'Maximum 10 tags allowed',
    }),

  /**
   * Display order within topic
   * - Optional (auto-generated if not provided)
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
 * Update problem validation schema
 *
 * All fields are optional for partial updates.
 */
export const updateProblemSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(300)
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 300 characters',
    }),

  topicId: Joi.string()
    .pattern(objectIdPattern)
    .messages({
      'string.pattern.base': 'Invalid Topic ID format',
    }),

  difficulty: Joi.string()
    .valid(...Object.values(Difficulty))
    .messages({
      'any.only': 'Difficulty must be Easy, Medium, or Hard',
    }),

  youtubeUrl: Joi.string()
    .trim()
    .pattern(urlPattern)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid YouTube URL',
    }),

  leetcodeUrl: Joi.string()
    .trim()
    .pattern(urlPattern)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid LeetCode URL',
    }),

  articleUrl: Joi.string()
    .trim()
    .pattern(urlPattern)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid article URL',
    }),

  tags: Joi.array()
    .items(
      Joi.string()
        .trim()
        .min(1)
        .max(50)
    )
    .max(10)
    .messages({
      'array.max': 'Maximum 10 tags allowed',
    }),

  order: Joi.number()
    .integer()
    .min(0),

  isActive: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});

/**
 * Problem query parameters schema
 *
 * @example
 * GET /api/problems?topicId=xxx&difficulty=Easy&tags=array&page=1&limit=20
 */
export const problemQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  /**
   * Filter by topic
   */
  topicId: Joi.string()
    .pattern(objectIdPattern)
    .messages({
      'string.pattern.base': 'Invalid Topic ID format',
    }),

  /**
   * Filter by difficulty
   */
  difficulty: Joi.string()
    .valid(...Object.values(Difficulty)),

  /**
   * Filter by tag (single tag)
   */
  tag: Joi.string()
    .trim()
    .max(50),

  /**
   * Search in title
   */
  search: Joi.string()
    .trim()
    .max(100),

  /**
   * Include inactive problems (admin only)
   */
  includeInactive: Joi.boolean()
    .default(false),

  sortBy: Joi.string()
    .valid('order', 'title', 'difficulty', 'createdAt')
    .default('order'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc'),
});
