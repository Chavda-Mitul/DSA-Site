/**
 * ===========================================
 * AUTHENTICATION CONTROLLER
 * ===========================================
 *
 * Handles user authentication operations:
 * - User registration
 * - User login
 * - Get current user profile
 * - Logout
 * - Change password
 *
 * TYPE SAFETY NOTES:
 * - jwt.sign requires Secret type, not just string
 * - IUserDocument includes _id as Types.ObjectId
 * - req.user is typed via express.d.ts declaration merging
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import UserProgress from '../models/UserProgress.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import env from '../config/env';
import logger from '../utils/logger';
import { IUserDocument, IUserPublic, IJwtPayload, UserRole, ProgressStatus } from '../types/models.types';

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Convert time string (like '7d', '1h', '30m') to seconds
 * Used for JWT expiresIn which expects a number in newer versions
 *
 * @param timeStr - Time string (e.g., '7d', '24h', '30m', '60s')
 * @returns Number of seconds
 */
const parseTimeToSeconds = (timeStr: string): number => {
  const match = timeStr.match(/^(\d+)([dhms])$/);
  if (!match) {
    // Default to 7 days if invalid format
    return 7 * 24 * 60 * 60;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60; // days to seconds
    case 'h': return value * 60 * 60;       // hours to seconds
    case 'm': return value * 60;             // minutes to seconds
    case 's': return value;                  // already seconds
    default: return 7 * 24 * 60 * 60;        // default 7 days
  }
};

/**
 * Generate JWT token for a user
 *
 * TYPE SAFETY:
 * - jwt.sign expects secret as string and expiresIn as number (seconds)
 * - We convert the time string from env to seconds for compatibility
 *
 * @param userId - User's MongoDB _id as string
 * @param email - User's email
 * @param role - User's role
 * @returns Signed JWT token string
 */
const generateToken = (userId: string, email: string, role: UserRole): string => {
  // Create payload - must match IJwtPayload structure
  const payload: IJwtPayload = {
    userId,
    email,
    role,
  };

  // Convert expiry time string to seconds (e.g., '7d' -> 604800)
  const expiresInSeconds = parseTimeToSeconds(env.jwtExpiresIn);

  // Sign and return token
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: expiresInSeconds,
  });
};

/**
 * Format user document for public response
 *
 * TYPE SAFETY:
 * - Input is IUserDocument (Mongoose document)
 * - Output is IUserPublic (plain object safe for client)
 * - _id is converted from ObjectId to string
 *
 * @param user - Mongoose user document
 * @returns Safe user object for API response
 */
const formatUserResponse = (user: IUserDocument): IUserPublic => {
  return {
    _id: user._id.toString(), // ObjectId -> string
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
};

// ===========================================
// CONTROLLER FUNCTIONS
// ===========================================

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */

export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: UserRole.USER,
      isActive: true,
    });

    // Generate token
    const token = generateToken(
      user._id.toString(),
      user.email,
      user.role
    );

    logger.info(`New user registered: ${email}`);

    ApiResponse.created(res, 'User registered successfully', {
      user: formatUserResponse(user),
      token,
    });
  }
);

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Find user with password (normally excluded)
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw ApiError.forbidden(
        'Your account has been deactivated. Please contact support.'
      );
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken(
      user._id.toString(),
      user.email,
      user.role
    );

    // ===========================================
    // FETCH COMPLETED PROBLEM IDS FOR RESTORATION
    // ===========================================

    /**
     * Optimized query using aggregation for better performance
     * - Uses distinct() for efficient unique value retrieval
     * - Uses lean() for performance (returns plain objects)
     * - Scales well even with 1000+ completed problems
     */
    const completedProblemIds = await UserProgress.distinct(
      'problemId',
      { userId: user._id, status: ProgressStatus.COMPLETED }
    ).then((ids) => ids.map((id) => id.toString()));

    logger.info(`User logged in: ${email}`);

    ApiResponse.success(res, 200, 'Login successful', {
      user: formatUserResponse(user),
      token,
      completedProblemIds,
    });
  }
);

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 *
 * TYPE SAFETY:
 * - req.user is typed via express.d.ts
 * - We use non-null assertion (!) because auth middleware guarantees user exists
 * - Alternatively, we could check: if (!req.user) throw error
 */
export const getMe = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // req.user is set by auth middleware
    // Using non-null assertion since auth middleware guarantees it exists
    const user = req.user!;

    ApiResponse.success(res, 200, 'User profile retrieved', {
      user: formatUserResponse(user),
    });
  }
);

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 *
 * NOTE: JWT is stateless - we can't invalidate tokens server-side
 * without additional infrastructure. Client must remove token.
 */
export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;

    logger.info(`User logged out: ${user.email}`);

    ApiResponse.success(
      res,
      200,
      'Logged out successfully. Please remove the token from client storage.'
    );
  }
);

/**
 * @desc    Get completed problem IDs for current user
 * @route   GET /api/auth/progress
 * @access  Private
 *
 * OPTIMIZED ENDPOINT FOR PROGRESS RESTORATION:
 * - Returns only problem IDs (not full progress records)
 * - Uses lean queries for performance
 * - Scales to 1000+ completed problems efficiently
 * - Perfect for frontend checkbox state restoration
 */
export const getCompletedProblemIds = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;

    // Optimized query: only fetch problemId field
    const completedProgress = await UserProgress.find(
      {
        userId,
        status: ProgressStatus.COMPLETED,
      },
      { problemId: 1, _id: 0 }
    ).lean();

    const completedProblemIds = completedProgress.map(
      (p) => p.problemId.toString()
    );

    ApiResponse.success(res, 200, 'Completed problems retrieved', {
      completedProblemIds,
      count: completedProblemIds.length,
    });
  }
);

/**
 * @desc    Change user password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!._id;

    // Get user with password field
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Update password (will be hashed by pre-save hook)
    user.passwordHash = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    ApiResponse.success(res, 200, 'Password changed successfully');
  }
);
