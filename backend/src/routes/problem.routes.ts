/**
 * ===========================================
 * PROBLEM ROUTES
 * ===========================================
 *
 * Routes for Problem CRUD operations:
 * - GET /problems - List all problems (public)
 * - GET /problems/tags - Get all tags (public)
 * - GET /problems/stats - Get statistics (public)
 * - GET /problems/:identifier - Get single problem (public)
 * - POST /problems - Create problem (admin)
 * - PUT /problems/:id - Update problem (admin)
 * - DELETE /problems/:id - Delete problem (admin)
 */

import { Router } from 'express';
import {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  getTags,
  getStats,
} from '../controllers/problem.controller';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../middleware/validate.middleware';
import {
  createProblemSchema,
  updateProblemSchema,
  problemQuerySchema,
} from '../validators/problem.validator';

const router = Router();

// ===========================================
// PUBLIC ROUTES
// ===========================================

/**
 * @route   GET /api/problems
 * @desc    Get all problems with filtering
 * @access  Public
 *
 * @query   page, limit, topicId, difficulty, tag, search, sortBy, sortOrder
 */
router.get(
  '/',
  optionalAuthMiddleware,
  validateQuery(problemQuerySchema),
  getProblems
);

/**
 * @route   GET /api/problems/tags
 * @desc    Get all unique tags with counts
 * @access  Public
 */
router.get('/tags', getTags);

/**
 * @route   GET /api/problems/stats
 * @desc    Get problem statistics (count by difficulty)
 * @access  Public
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/problems/:identifier
 * @desc    Get single problem by ID or slug
 * @access  Public
 *
 * @param   identifier - Problem ID or slug
 */
router.get(
  '/:identifier',
  optionalAuthMiddleware,
  getProblem
);

// ===========================================
// ADMIN ROUTES
// ===========================================

/**
 * @route   POST /api/problems
 * @desc    Create a new problem
 * @access  Private (Admin only)
 *
 * @body    { title, topicId, difficulty, youtubeUrl?, leetcodeUrl?, articleUrl?, tags?, order? }
 */
router.post(
  '/',
  ...requireAdmin,
  validateBody(createProblemSchema),
  createProblem
);

/**
 * @route   PUT /api/problems/:id
 * @desc    Update a problem
 * @access  Private (Admin only)
 *
 * @param   id - Problem ID
 * @body    { title?, topicId?, difficulty?, youtubeUrl?, leetcodeUrl?, articleUrl?, tags?, order?, isActive? }
 */
router.put(
  '/:id',
  ...requireAdmin,
  validateParams(idParamSchema),
  validateBody(updateProblemSchema),
  updateProblem
);

/**
 * @route   DELETE /api/problems/:id
 * @desc    Delete a problem (soft delete)
 * @access  Private (Admin only)
 *
 * @param   id - Problem ID
 */
router.delete(
  '/:id',
  ...requireAdmin,
  validateParams(idParamSchema),
  deleteProblem
);

export default router;
