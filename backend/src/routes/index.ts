/**
 * ===========================================
 * ROUTE AGGREGATOR
 * ===========================================
 *
 * This file aggregates all route modules and exports a single router.
 * It also includes health check and API info endpoints.
 *
 * ROUTE STRUCTURE:
 * - /api/health - Health check
 * - /api/auth/* - Authentication routes
 * - /api/users/* - User management (admin)
 * - /api/topics/* - Topic CRUD
 * - /api/problems/* - Problem CRUD
 * - /api/progress/* - Progress tracking
 */

import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import topicRoutes from './topic.routes';
import problemRoutes from './problem.routes';
import progressRoutes from './progress.routes';

const router = Router();

// ===========================================
// API INFO & HEALTH CHECK
// ===========================================

/**
 * @route   GET /api
 * @desc    API information
 * @access  Public
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'DSA Sheet API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      topics: '/api/topics',
      problems: '/api/problems',
      progress: '/api/progress',
      health: '/api/health',
    },
    documentation: 'See /api/health for server status',
  });
});

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 *
 * Used by load balancers and monitoring tools
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ===========================================
// MOUNT ROUTE MODULES
// ===========================================

/**
 * Authentication routes
 * /api/auth/*
 */
router.use('/auth', authRoutes);

/**
 * User management routes (admin only)
 * /api/users/*
 */
router.use('/users', userRoutes);

/**
 * Topic routes
 * /api/topics/*
 */
router.use('/topics', topicRoutes);

/**
 * Problem routes
 * /api/problems/*
 */
router.use('/problems', problemRoutes);

/**
 * Progress tracking routes
 * /api/progress/*
 */
router.use('/progress', progressRoutes);

export default router;
