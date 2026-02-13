/**
 * ===========================================
 * AUTH VALIDATION SCHEMAS
 * ===========================================
 *
 * Joi validation schemas for authentication endpoints.
 * These schemas define the expected structure and constraints
 * for registration and login requests.
 *
 * VALIDATION RULES:
 * - Name: 2-100 characters, required
 * - Email: Valid email format, required
 * - Password: 8+ chars, must include uppercase, lowercase, number
 */

import Joi from 'joi';

/**
 * Password validation regex
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * Password validation error message
 */
const passwordMessage =
  'Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number';

/**
 * Registration request validation schema
 *
 * @example
 * Valid request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "Password123"
 * }
 */
export const registerSchema = Joi.object({
  /**
   * User's display name
   * - Required
   * - Trimmed (whitespace removed)
   * - 2-100 characters
   */
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),

  /**
   * User's email address
   * - Required
   * - Must be valid email format
   * - Converted to lowercase
   */
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

  /**
   * User's password
   * - Required
   * - Must match password requirements (regex)
   */
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(passwordRegex)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': passwordMessage,
      'any.required': 'Password is required',
    }),
});

/**
 * Login request validation schema
 *
 * @example
 * Valid request body:
 * {
 *   "email": "john@example.com",
 *   "password": "Password123"
 * }
 */
export const loginSchema = Joi.object({
  /**
   * User's email address
   * - Required
   * - Must be valid email format
   */
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

  /**
   * User's password
   * - Required
   * - No pattern validation (user might have old password format)
   */
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
});

/**
 * Change password validation schema
 *
 * @example
 * Valid request body:
 * {
 *   "currentPassword": "OldPassword123",
 *   "newPassword": "NewPassword456"
 * }
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required',
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(passwordRegex)
    .required()
    .invalid(Joi.ref('currentPassword')) // Must be different from current
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': passwordMessage,
      'any.required': 'New password is required',
      'any.invalid': 'New password must be different from current password',
    }),
});
