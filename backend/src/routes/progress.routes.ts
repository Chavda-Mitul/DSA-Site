/**
 * ===========================================
 * PROGRESS ROUTES
 * ===========================================
 *
 * Routes for user progress tracking:
 * - GET /progress - Get user's progress (private)
 * - GET /progress/summary - Get progress summary by topic (private)
 * - PUT /progress/:problemId - Update progress for a problem (private)
 * - POST /progress/:problemId/complete - Mark problem as completed (private)
 * - DELETE /progress/:problemId - Reset progress (private)
 * - POST /progress/batch - Batch update progress (private)
 */

import { Router } from 'express';
import {
  getUserProgress,
  getProgressSummary,
  updateProgress,
  markComplete,
  resetProgress,
  batchUpdateProgress,
} from '../controllers/progress.controller';
import authMiddleware from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
  updateProgressSchema,
  problemIdParamSchema,
  progressQuerySchema,
  batchUpdateProgressSchema,
} from '../validators/progress.validator';

const router = Router();

// ===========================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ===========================================

router.use(authMiddleware);

/**
 * @route   GET /api/progress
 * @desc    Get user's progress across all problems
 * @access  Private
 *
 * @query   status, topicId, includeProblems
 */
router.get(
  '/',
  validateQuery(progressQuerySchema),
  getUserProgress
);

/**
 * @route   GET /api/progress/summary
 * @desc    Get progress summary by topic
 * @access  Private
 *
 * Returns completion stats for each topic
 */
router.get('/summary', getProgressSummary);

/**
 * @route   POST /api/progress/batch
 * @desc    Batch update progress for multiple problems
 * @access  Private
 *
 * @body    { updates: [{ problemId, status }] }
 */
router.post(
  '/batch',
  validateBody(batchUpdateProgressSchema),
  batchUpdateProgress
);

/**
 * @route   PUT /api/progress/:problemId
 * @desc    Update progress for a specific problem
 * @access  Private
 *
 * @param   problemId - Problem ID
 * @body    { status: 'not_started' | 'completed' }
 */
router.put(
  '/:problemId',
  validateParams(problemIdParamSchema),
  validateBody(updateProgressSchema),
  updateProgress
);

/**
 * @route   POST /api/progress/:problemId/complete
 * @desc    Mark a problem as completed
 * @access  Private
 *
 * @param   problemId - Problem ID
 */
router.post(
  '/:problemId/complete',
  validateParams(problemIdParamSchema),
  markComplete
);

/**
 * @route   DELETE /api/progress/:problemId
 * @desc    Reset progress for a problem
 * @access  Private
 *
 * @param   problemId - Problem ID
 */
router.delete(
  '/:problemId',
  validateParams(problemIdParamSchema),
  resetProgress
);

export default router;
