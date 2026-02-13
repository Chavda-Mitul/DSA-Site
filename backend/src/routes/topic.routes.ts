/**
 * ===========================================
 * TOPIC ROUTES
 * ===========================================
 *
 * Routes for Topic CRUD operations:
 * - GET /topics - List all topics (public)
 * - GET /topics/:identifier - Get single topic (public)
 * - GET /topics/:id/problems - Get problems for topic (public)
 * - POST /topics - Create topic (admin)
 * - PUT /topics/:id - Update topic (admin)
 * - DELETE /topics/:id - Delete topic (admin)
 */

import { Router } from 'express';
import {
  getTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  getTopicProblems,
} from '../controllers/topic.controller';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../middleware/validate.middleware';
import {
  createTopicSchema,
  updateTopicSchema,
  topicQuerySchema,
} from '../validators/topic.validator';

const router = Router();

// ===========================================
// PUBLIC ROUTES
// ===========================================

/**
 * @route   GET /api/topics
 * @desc    Get all topics
 * @access  Public
 *
 * @query   page, limit, includeInactive, sortBy, sortOrder
 */
router.get(
  '/',
  optionalAuthMiddleware, // Attach user if logged in (for admin checks)
  validateQuery(topicQuerySchema),
  getTopics
);

/**
 * @route   GET /api/topics/:identifier
 * @desc    Get single topic by ID or slug
 * @access  Public
 *
 * @param   identifier - Topic ID or slug
 */
router.get(
  '/:identifier',
  optionalAuthMiddleware,
  getTopic
);

/**
 * @route   GET /api/topics/:id/problems
 * @desc    Get all problems for a topic
 * @access  Public
 *
 * @param   id - Topic ID
 * @query   page, limit
 */
router.get(
  '/:id/problems',
  validateParams(idParamSchema),
  getTopicProblems
);

// ===========================================
// ADMIN ROUTES
// ===========================================

/**
 * @route   POST /api/topics
 * @desc    Create a new topic
 * @access  Private (Admin only)
 *
 * @body    { title, description?, order? }
 */
router.post(
  '/',
  ...requireAdmin, // Auth + Admin middleware
  validateBody(createTopicSchema),
  createTopic
);

/**
 * @route   PUT /api/topics/:id
 * @desc    Update a topic
 * @access  Private (Admin only)
 *
 * @param   id - Topic ID
 * @body    { title?, description?, order?, isActive? }
 */
router.put(
  '/:id',
  ...requireAdmin,
  validateParams(idParamSchema),
  validateBody(updateTopicSchema),
  updateTopic
);

/**
 * @route   DELETE /api/topics/:id
 * @desc    Delete a topic (soft delete)
 * @access  Private (Admin only)
 *
 * @param   id - Topic ID
 */
router.delete(
  '/:id',
  ...requireAdmin,
  validateParams(idParamSchema),
  deleteTopic
);

export default router;
