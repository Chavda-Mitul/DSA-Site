/**
 * ===========================================
 * PROBLEM CONTROLLER
 * ===========================================
 *
 * Handles CRUD operations for Problems (DSA questions).
 * Problems belong to Topics and have difficulty levels.
 *
 * PERMISSIONS:
 * - GET (list, single): Public
 * - POST, PUT, DELETE: Admin only
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Problem from '../models/Problem.model';
import Topic from '../models/Topic.model';
import AdminLog from '../models/AdminLog.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import { AdminActionType, EntityType, Difficulty } from '../types/models.types';

/**
 * @desc    Get all problems with filtering and pagination
 * @route   GET /api/problems
 * @access  Public
 *
 * @example
 * GET /api/problems?topicId=xxx&difficulty=Easy&tag=array&page=1&limit=20
 */
export const getProblems = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 20,
      topicId,
      difficulty,
      tag,
      search,
      includeInactive = false,
      sortBy = 'order',
      sortOrder = 'asc',
    } = req.query;

    // ===========================================
    // BUILD FILTER
    // ===========================================

    const filter: Record<string, unknown> = {};

    // Active status filter
    if (!includeInactive || !req.user?.isAdmin()) {
      filter.isActive = true;
    }

    // Filter by topic
    if (topicId) {
      filter.topicId = new mongoose.Types.ObjectId(topicId as string);
    }

    // Filter by difficulty
    if (difficulty && Object.values(Difficulty).includes(difficulty as Difficulty)) {
      filter.difficulty = difficulty;
    }

    // Filter by tag
    if (tag) {
      filter.tags = (tag as string).toLowerCase();
    }

    // Search in title (case-insensitive)
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // ===========================================
    // EXECUTE QUERY WITH PAGINATION
    // ===========================================

    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sort: Record<string, 1 | -1> = {
      [sortBy as string]: sortOrder === 'desc' ? -1 : 1,
    };

    const [problems, totalItems] = await Promise.all([
      Problem.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('topicId', 'title slug')
        .populate('createdBy', 'name email'),

      Problem.countDocuments(filter),
    ]);

    // ===========================================
    // SEND RESPONSE
    // ===========================================

    const pagination = ApiResponse.createPagination(
      Number(page),
      Number(limit),
      totalItems
    );

    ApiResponse.paginated(
      res,
      200,
      'Problems retrieved successfully',
      problems,
      pagination
    );
  }
);

/**
 * @desc    Get single problem by ID or slug
 * @route   GET /api/problems/:identifier
 * @access  Public
 *
 * @example
 * GET /api/problems/507f1f77bcf86cd799439011
 * GET /api/problems/two-sum
 */
export const getProblem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { identifier } = req.params;

    // ===========================================
    // FIND PROBLEM BY ID OR SLUG
    // ===========================================

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let problem;

    if (isObjectId) {
      problem = await Problem.findById(identifier)
        .populate('topicId', 'title slug description')
        .populate('createdBy', 'name email');
    } else {
      problem = await Problem.findOne({ slug: identifier })
        .populate('topicId', 'title slug description')
        .populate('createdBy', 'name email');
    }

    // ===========================================
    // CHECK IF FOUND AND ACTIVE
    // ===========================================

    if (!problem) {
      throw ApiError.notFound('Problem not found');
    }

    if (!problem.isActive && !req.user?.isAdmin()) {
      throw ApiError.notFound('Problem not found');
    }

    ApiResponse.success(res, 200, 'Problem retrieved successfully', problem);
  }
);

/**
 * @desc    Create a new problem
 * @route   POST /api/problems
 * @access  Private (Admin only)
 *
 * @example
 * POST /api/problems
 * Body: {
 *   "title": "Two Sum",
 *   "topicId": "507f1f77bcf86cd799439011",
 *   "difficulty": "Easy",
 *   "leetcodeUrl": "https://leetcode.com/problems/two-sum",
 *   "tags": ["array", "hash-table"]
 * }
 */
export const createProblem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      title,
      topicId,
      difficulty,
      youtubeUrl,
      leetcodeUrl,
      articleUrl,
      tags,
      order,
    } = req.body;
    const adminId = req.user!._id;

    // ===========================================
    // VERIFY TOPIC EXISTS
    // ===========================================

    const topic = await Topic.findById(topicId);

    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    if (!topic.isActive) {
      throw ApiError.badRequest('Cannot add problem to inactive topic');
    }

    // ===========================================
    // DETERMINE ORDER IF NOT PROVIDED
    // ===========================================

    let problemOrder = order;

    if (problemOrder === undefined) {
      problemOrder = await Problem.getNextOrder(topicId);
    }

    // ===========================================
    // CREATE PROBLEM
    // ===========================================

    const problem = await Problem.create({
      title,
      topicId,
      difficulty,
      youtubeUrl: youtubeUrl || '',
      leetcodeUrl: leetcodeUrl || '',
      articleUrl: articleUrl || '',
      tags: tags || [],
      order: problemOrder,
      createdBy: adminId,
      isActive: true,
    });

    // Populate references for response
    await problem.populate('topicId', 'title slug');

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.CREATE_PROBLEM,
      problem._id.toString(),
      EntityType.PROBLEM,
      {
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        topicTitle: topic.title,
      }
    );

    logger.info(`Problem created: ${problem.title} by admin ${req.user!.email}`);

    ApiResponse.created(res, 'Problem created successfully', problem);
  }
);

/**
 * @desc    Update a problem
 * @route   PUT /api/problems/:id
 * @access  Private (Admin only)
 *
 * @example
 * PUT /api/problems/507f1f77bcf86cd799439011
 * Body: { "title": "Updated Title", "difficulty": "Medium" }
 */
export const updateProblem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.user!._id;

    // ===========================================
    // FIND PROBLEM
    // ===========================================

    const problem = await Problem.findById(id);

    if (!problem) {
      throw ApiError.notFound('Problem not found');
    }

    // ===========================================
    // VERIFY NEW TOPIC IF CHANGING
    // ===========================================

    if (updateData.topicId && updateData.topicId !== problem.topicId.toString()) {
      const newTopic = await Topic.findById(updateData.topicId);

      if (!newTopic) {
        throw ApiError.notFound('Target topic not found');
      }

      if (!newTopic.isActive) {
        throw ApiError.badRequest('Cannot move problem to inactive topic');
      }
    }

    // Store old values for logging
    const oldValues = {
      title: problem.title,
      difficulty: problem.difficulty,
      topicId: problem.topicId.toString(),
    };

    // ===========================================
    // UPDATE PROBLEM
    // ===========================================

    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('topicId', 'title slug')
      .populate('createdBy', 'name email');

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.UPDATE_PROBLEM,
      id,
      EntityType.PROBLEM,
      { before: oldValues, after: updateData }
    );

    logger.info(`Problem updated: ${updatedProblem!.title} by admin ${req.user!.email}`);

    ApiResponse.success(res, 200, 'Problem updated successfully', updatedProblem);
  }
);

/**
 * @desc    Delete a problem (soft delete)
 * @route   DELETE /api/problems/:id
 * @access  Private (Admin only)
 */
export const deleteProblem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user!._id;

    // ===========================================
    // FIND PROBLEM
    // ===========================================

    const problem = await Problem.findById(id);

    if (!problem) {
      throw ApiError.notFound('Problem not found');
    }

    if (!problem.isActive) {
      throw ApiError.badRequest('Problem is already deleted');
    }

    // ===========================================
    // SOFT DELETE
    // ===========================================

    problem.isActive = false;
    await problem.save();

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.DELETE_PROBLEM,
      id,
      EntityType.PROBLEM,
      {
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
      }
    );

    logger.info(`Problem deleted: ${problem.title} by admin ${req.user!.email}`);

    ApiResponse.success(res, 200, 'Problem deleted successfully');
  }
);

/**
 * @desc    Get all unique tags
 * @route   GET /api/problems/tags
 * @access  Public
 *
 * Useful for tag-based filtering UI
 */
export const getTags = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    // Aggregate to get unique tags with counts
    const tags = await Problem.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      {
        $project: {
          tag: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    ApiResponse.success(res, 200, 'Tags retrieved successfully', tags);
  }
);

/**
 * @desc    Get problem statistics
 * @route   GET /api/problems/stats
 * @access  Public
 *
 * Returns counts by difficulty and total problems
 */
export const getStats = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const stats = await Problem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
        },
      },
    ]);

    // Format response
    const formattedStats = {
      total: 0,
      byDifficulty: {
        Easy: 0,
        Medium: 0,
        Hard: 0,
      },
    };

    stats.forEach((stat) => {
      formattedStats.byDifficulty[stat._id as keyof typeof formattedStats.byDifficulty] = stat.count;
      formattedStats.total += stat.count;
    });

    ApiResponse.success(res, 200, 'Problem statistics retrieved', formattedStats);
  }
);
