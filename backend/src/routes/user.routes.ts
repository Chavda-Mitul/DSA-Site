/**
 * ===========================================
 * USER ROUTES
 * ===========================================
 *
 * Routes for user management (admin only):
 * - GET /users - List all users
 * - GET /users/stats - Get user statistics
 * - GET /users/:id - Get single user
 * - PUT /users/:id/promote - Promote to admin
 * - PUT /users/:id/demote - Demote to user
 * - PUT /users/:id/deactivate - Deactivate account
 * - PUT /users/:id/activate - Reactivate account
 */

import { Router } from 'express';
import {
  getUsers,
  getUser,
  promoteUser,
  demoteUser,
  deactivateUser,
  activateUser,
  getUserStats,
} from '../controllers/user.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateParams } from '../middleware/validate.middleware';
import { idParamSchema } from '../middleware/validate.middleware';

const router = Router();

// ===========================================
// ALL ROUTES REQUIRE ADMIN
// ===========================================

router.use(...requireAdmin);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 *
 * @query   page, limit, role, isActive, search, sortBy, sortOrder
 */
router.get('/', getUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin only)
 *
 * @param   id - User ID
 */
router.get(
  '/:id',
  validateParams(idParamSchema),
  getUser
);

/**
 * @route   PUT /api/users/:id/promote
 * @desc    Promote user to admin
 * @access  Private (Admin only)
 *
 * @param   id - User ID
 */
router.put(
  '/:id/promote',
  validateParams(idParamSchema),
  promoteUser
);

/**
 * @route   PUT /api/users/:id/demote
 * @desc    Demote admin to regular user
 * @access  Private (Admin only)
 *
 * @param   id - User ID
 */
router.put(
  '/:id/demote',
  validateParams(idParamSchema),
  demoteUser
);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (Admin only)
 *
 * @param   id - User ID
 */
router.put(
  '/:id/deactivate',
  validateParams(idParamSchema),
  deactivateUser
);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Reactivate user account
 * @access  Private (Admin only)
 *
 * @param   id - User ID
 */
router.put(
  '/:id/activate',
  validateParams(idParamSchema),
  activateUser
);

export default router;
