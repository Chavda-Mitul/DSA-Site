/**
 * ===========================================
 * AUTHENTICATION ROUTES
 * ===========================================
 *
 * Routes for user authentication:
 * - POST /register - Create new account
 * - POST /login - Login to account (includes completedProblemIds)
 * - GET /me - Get current user profile
 * - GET /progress - Get completed problem IDs (optimized)
 * - POST /logout - Logout (client-side)
 * - PUT /change-password - Change password
 */

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  changePassword,
  getCompletedProblemIds,
} from '../controllers/auth.controller';
import authMiddleware from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 *
 * @body    { name, email, password }
 * @returns { user, token }
 */

router.post('/register', validateBody(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 *
 * @body    { email, password }
 * @returns { user, token }
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 *
 * @headers Authorization: Bearer <token>
 * @returns { user }
 */
router.get('/me', authMiddleware, getMe);

/**
 * @route   GET /api/auth/progress
 * @desc    Get completed problem IDs for current user
 * @access  Private
 *
 * OPTIMIZED ENDPOINT:
 * - Returns only problem IDs (minimal payload)
 * - Perfect for progress restoration after page refresh
 * - Scales well with large number of completed problems
 *
 * @returns { completedProblemIds: string[], count: number }
 */
router.get('/progress', authMiddleware, getCompletedProblemIds);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 *
 * @note    JWT is stateless - client must remove token
 */
router.post('/logout', authMiddleware, logout);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 *
 * @body    { currentPassword, newPassword }
 */
router.put(
  '/change-password',
  authMiddleware,
  validateBody(changePasswordSchema),
  changePassword
);

export default router;
