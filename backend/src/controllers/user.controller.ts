/**
 * ===========================================
 * USER CONTROLLER
 * ===========================================
 *
 * Handles user management operations.
 * Most endpoints are admin-only.
 *
 * PERMISSIONS:
 * - GET users: Admin only
 * - Promote/demote: Admin only
 * - Deactivate: Admin only
 */

import { Request, Response } from 'express';
import User from '../models/User.model';
import AdminLog from '../models/AdminLog.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import { AdminActionType, EntityType, UserRole } from '../types/models.types';

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private (Admin only)
 *
 * @example
 * GET /api/users?page=1&limit=10&role=user&isActive=true
 */
export const getUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // ===========================================
    // BUILD FILTER
    // ===========================================

    const filter: Record<string, unknown> = {};

    // Filter by role
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filter.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search in name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // ===========================================
    // EXECUTE QUERY WITH PAGINATION
    // ===========================================

    const skip = (Number(page) - 1) * Number(limit);

    const sort: Record<string, 1 | -1> = {
      [sortBy as string]: sortOrder === 'desc' ? -1 : 1,
    };

    const [users, totalItems] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),

      User.countDocuments(filter),
    ]);

    const pagination = ApiResponse.createPagination(
      Number(page),
      Number(limit),
      totalItems
    );

    ApiResponse.paginated(
      res,
      200,
      'Users retrieved successfully',
      users,
      pagination
    );
  }
);

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin only)
 */
export const getUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    ApiResponse.success(res, 200, 'User retrieved successfully', user);
  }
);

/**
 * @desc    Promote user to admin
 * @route   PUT /api/users/:id/promote
 * @access  Private (Admin only)
 */
export const promoteUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user!._id;

    // ===========================================
    // FIND USER
    // ===========================================

    const user = await User.findById(id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if already admin
    if (user.role === UserRole.ADMIN) {
      throw ApiError.badRequest('User is already an admin');
    }

    // ===========================================
    // PROMOTE TO ADMIN
    // ===========================================

    const previousRole = user.role;
    user.role = UserRole.ADMIN;
    await user.save();

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.PROMOTE_USER,
      id,
      EntityType.USER,
      {
        userName: user.name,
        userEmail: user.email,
        previousRole,
        newRole: UserRole.ADMIN,
      }
    );

    logger.info(`User promoted to admin: ${user.email} by ${req.user!.email}`);

    ApiResponse.success(res, 200, 'User promoted to admin successfully', user);
  }
);

/**
 * @desc    Demote admin to regular user
 * @route   PUT /api/users/:id/demote
 * @access  Private (Admin only)
 */
export const demoteUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user!._id;

    // ===========================================
    // FIND USER
    // ===========================================

    const user = await User.findById(id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if already a regular user
    if (user.role === UserRole.USER) {
      throw ApiError.badRequest('User is already a regular user');
    }

    // Prevent self-demotion
    if (user._id.toString() === adminId.toString()) {
      throw ApiError.badRequest('You cannot demote yourself');
    }

    // ===========================================
    // DEMOTE TO USER
    // ===========================================

    const previousRole = user.role;
    user.role = UserRole.USER;
    await user.save();

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.DEMOTE_USER,
      id,
      EntityType.USER,
      {
        userName: user.name,
        userEmail: user.email,
        previousRole,
        newRole: UserRole.USER,
      }
    );

    logger.info(`User demoted: ${user.email} by ${req.user!.email}`);

    ApiResponse.success(res, 200, 'User demoted to regular user successfully', user);
  }
);

/**
 * @desc    Deactivate user account
 * @route   PUT /api/users/:id/deactivate
 * @access  Private (Admin only)
 */
export const deactivateUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user!._id;

    // ===========================================
    // FIND USER
    // ===========================================

    const user = await User.findById(id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent self-deactivation
    if (user._id.toString() === adminId.toString()) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }

    // Check if already deactivated
    if (!user.isActive) {
      throw ApiError.badRequest('User is already deactivated');
    }

    // ===========================================
    // DEACTIVATE
    // ===========================================

    user.isActive = false;
    await user.save();

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.DEACTIVATE_USER,
      id,
      EntityType.USER,
      {
        userName: user.name,
        userEmail: user.email,
      }
    );

    logger.info(`User deactivated: ${user.email} by ${req.user!.email}`);

    ApiResponse.success(res, 200, 'User deactivated successfully', user);
  }
);

/**
 * @desc    Reactivate user account
 * @route   PUT /api/users/:id/activate
 * @access  Private (Admin only)
 */
export const activateUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user!._id;

    const user = await User.findById(id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.isActive) {
      throw ApiError.badRequest('User is already active');
    }

    user.isActive = true;
    await user.save();

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.ACTIVATE_USER,
      id,
      EntityType.USER,
      {
        userName: user.name,
        userEmail: user.email,
      }
    );

    logger.info(`User activated: ${user.email} by ${req.user!.email}`);

    ApiResponse.success(res, 200, 'User activated successfully', user);
  }
);

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (Admin only)
 */
export const getUserStats = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const stats = await User.aggregate([
      {
        $facet: {
          byRole: [
            {
              $group: {
                _id: '$role',
                count: { $sum: 1 },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: '$isActive',
                count: { $sum: 1 },
              },
            },
          ],
          total: [
            { $count: 'count' },
          ],
          recentUsers: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                name: 1,
                email: 1,
                role: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    const result = stats[0];

    const formattedStats = {
      total: result.total[0]?.count || 0,
      byRole: {
        users: result.byRole.find((r: { _id: string }) => r._id === 'user')?.count || 0,
        admins: result.byRole.find((r: { _id: string }) => r._id === 'admin')?.count || 0,
      },
      byStatus: {
        active: result.byStatus.find((s: { _id: boolean }) => s._id === true)?.count || 0,
        inactive: result.byStatus.find((s: { _id: boolean }) => s._id === false)?.count || 0,
      },
      recentUsers: result.recentUsers,
    };

    ApiResponse.success(res, 200, 'User statistics retrieved', formattedStats);
  }
);
