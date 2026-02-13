/**
 * ===========================================
 * PROGRESS CONTROLLER
 * ===========================================
 *
 * Handles user progress tracking for problems.
 * Users can mark problems as completed or not started.
 *
 * PERMISSIONS:
 * - All endpoints: Authenticated users only
 * - Users can only see/modify their own progress
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import UserProgress from '../models/UserProgress.model';
import Problem from '../models/Problem.model';
import Topic from '../models/Topic.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import { ProgressStatus } from '../types/models.types';

/**
 * @desc    Get user's progress across all problems
 * @route   GET /api/progress
 * @access  Private
 *
 * @example
 * GET /api/progress?status=completed&topicId=xxx
 */
export const getUserProgress = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const { status, topicId, includeProblems = true } = req.query;

    // ===========================================
    // BUILD FILTER
    // ===========================================

    const filter: Record<string, unknown> = { userId };

    // Filter by status
    if (status && Object.values(ProgressStatus).includes(status as ProgressStatus)) {
      filter.status = status;
    }

    // ===========================================
    // BUILD AGGREGATION PIPELINE
    // ===========================================

    // If filtering by topic, we need to join with problems
    const pipeline: mongoose.PipelineStage[] = [
      { $match: filter },
    ];

    // Join with problems to get problem details
    if (includeProblems) {
      pipeline.push(
        {
          $lookup: {
            from: 'problems',
            localField: 'problemId',
            foreignField: '_id',
            as: 'problem',
          },
        },
        { $unwind: '$problem' },
        // Filter out inactive problems
        { $match: { 'problem.isActive': true } }
      );

      // Filter by topic if specified
      if (topicId) {
        pipeline.push({
          $match: {
            'problem.topicId': new mongoose.Types.ObjectId(topicId as string),
          },
        });
      }

      // Join with topics for topic info
      pipeline.push(
        {
          $lookup: {
            from: 'topics',
            localField: 'problem.topicId',
            foreignField: '_id',
            as: 'topic',
          },
        },
        { $unwind: '$topic' }
      );
    }

    // Sort by most recently updated
    pipeline.push({ $sort: { updatedAt: -1 } });

    // ===========================================
    // EXECUTE QUERY
    // ===========================================

    const progress = await UserProgress.aggregate(pipeline);

    // ===========================================
    // CALCULATE SUMMARY STATISTICS
    // ===========================================

    const summary = {
      total: progress.length,
      completed: progress.filter((p) => p.status === ProgressStatus.COMPLETED).length,
      notStarted: progress.filter((p) => p.status === ProgressStatus.NOT_STARTED).length,
      completionRate: 0,
    };

    summary.completionRate = summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

    ApiResponse.success(res, 200, 'Progress retrieved successfully', {
      progress,
      summary,
    });
  }
);

/**
 * @desc    Get progress summary by topic
 * @route   GET /api/progress/summary
 * @access  Private
 *
 * Returns completion stats for each topic
 */
export const getProgressSummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;

    // ===========================================
    // GET ALL TOPICS WITH PROBLEM COUNTS
    // ===========================================

    const topics = await Topic.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // ===========================================
    // GET USER'S COMPLETED PROBLEMS BY TOPIC
    // ===========================================

    const completedByTopic = await UserProgress.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId.toString()),
          status: ProgressStatus.COMPLETED,
        },
      },
      {
        $lookup: {
          from: 'problems',
          localField: 'problemId',
          foreignField: '_id',
          as: 'problem',
        },
      },
      { $unwind: '$problem' },
      { $match: { 'problem.isActive': true } },
      {
        $group: {
          _id: '$problem.topicId',
          completed: { $sum: 1 },
        },
      },
    ]);

    // Create a map for quick lookup
    const completedMap = new Map(
      completedByTopic.map((item) => [item._id.toString(), item.completed])
    );

    // ===========================================
    // GET TOTAL PROBLEMS BY TOPIC
    // ===========================================

    const totalByTopic = await Problem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$topicId',
          total: { $sum: 1 },
        },
      },
    ]);

    const totalMap = new Map(
      totalByTopic.map((item) => [item._id.toString(), item.total])
    );

    // ===========================================
    // BUILD SUMMARY RESPONSE
    // ===========================================

    const topicSummaries = topics.map((topic) => {
      const topicId = topic._id.toString();
      const total = totalMap.get(topicId) || 0;
      const completed = completedMap.get(topicId) || 0;

      return {
        topicId,
        title: topic.title,
        slug: topic.slug,
        total,
        completed,
        remaining: total - completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // Overall summary
    const overallSummary = {
      totalTopics: topics.length,
      totalProblems: topicSummaries.reduce((sum, t) => sum + t.total, 0),
      totalCompleted: topicSummaries.reduce((sum, t) => sum + t.completed, 0),
      overallCompletionRate: 0,
    };

    overallSummary.overallCompletionRate = overallSummary.totalProblems > 0
      ? Math.round((overallSummary.totalCompleted / overallSummary.totalProblems) * 100)
      : 0;

    ApiResponse.success(res, 200, 'Progress summary retrieved', {
      overall: overallSummary,
      byTopic: topicSummaries,
    });
  }
);

/**
 * @desc    Update progress for a problem
 * @route   PUT /api/progress/:problemId
 * @access  Private
 *
 * @example
 * PUT /api/progress/507f1f77bcf86cd799439011
 * Body: { "status": "completed" }
 */
export const updateProgress = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const { problemId } = req.params;
    const { status } = req.body;

    // ===========================================
    // VERIFY PROBLEM EXISTS
    // ===========================================

    const problem = await Problem.findById(problemId);

    if (!problem || !problem.isActive) {
      throw ApiError.notFound('Problem not found');
    }

    // ===========================================
    // UPDATE OR CREATE PROGRESS
    // ===========================================

    let progress;

    if (status === ProgressStatus.COMPLETED) {
      progress = await UserProgress.markCompleted(userId.toString(), problemId);
    } else {
      progress = await UserProgress.findOneAndUpdate(
        { userId, problemId },
        {
          status,
          completedAt: null,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );
    }

    // Populate problem details for response
    await progress.populate('problemId', 'title slug difficulty');

    logger.debug(`Progress updated: ${problem.title} -> ${status} for user ${req.user!.email}`);

    ApiResponse.success(res, 200, 'Progress updated successfully', progress);
  }
);

/**
 * @desc    Mark problem as completed
 * @route   POST /api/progress/:problemId/complete
 * @access  Private
 *
 * Shorthand endpoint for marking as completed
 */
export const markComplete = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const { problemId } = req.params;

    // Verify problem exists
    const problem = await Problem.findById(problemId);

    if (!problem || !problem.isActive) {
      throw ApiError.notFound('Problem not found');
    }

    // Mark as completed
    const progress = await UserProgress.markCompleted(userId.toString(), problemId);

    await progress.populate('problemId', 'title slug difficulty');

    logger.info(`Problem completed: ${problem.title} by user ${req.user!.email}`);

    ApiResponse.success(res, 200, 'Problem marked as completed', progress);
  }
);

/**
 * @desc    Reset progress for a problem
 * @route   DELETE /api/progress/:problemId
 * @access  Private
 */
export const resetProgress = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const { problemId } = req.params;

    // Reset progress
    const progress = await UserProgress.resetProgress(userId.toString(), problemId);

    if (!progress) {
      // No progress record exists - that's fine
      ApiResponse.success(res, 200, 'No progress to reset');
      return;
    }

    await progress.populate('problemId', 'title slug difficulty');

    logger.debug(`Progress reset: problem ${problemId} for user ${req.user!.email}`);

    ApiResponse.success(res, 200, 'Progress reset successfully', progress);
  }
);

/**
 * @desc    Batch update progress for multiple problems
 * @route   POST /api/progress/batch
 * @access  Private
 *
 * @example
 * POST /api/progress/batch
 * Body: {
 *   "updates": [
 *     { "problemId": "xxx", "status": "completed" },
 *     { "problemId": "yyy", "status": "not_started" }
 *   ]
 * }
 */
export const batchUpdateProgress = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const { updates } = req.body;

    // ===========================================
    // VERIFY ALL PROBLEMS EXIST
    // ===========================================

    const problemIds = updates.map((u: { problemId: string }) => u.problemId);
    const problems = await Problem.find({
      _id: { $in: problemIds },
      isActive: true,
    });

    if (problems.length !== problemIds.length) {
      throw ApiError.badRequest('One or more problems not found');
    }

    // ===========================================
    // PROCESS UPDATES
    // ===========================================

    const results = await Promise.all(
      updates.map(async (update: { problemId: string; status: ProgressStatus }) => {
        if (update.status === ProgressStatus.COMPLETED) {
          return UserProgress.markCompleted(userId.toString(), update.problemId);
        } else {
          return UserProgress.findOneAndUpdate(
            { userId, problemId: update.problemId },
            { status: update.status, completedAt: null },
            { new: true, upsert: true }
          );
        }
      })
    );

    logger.info(`Batch progress update: ${updates.length} problems for user ${req.user!.email}`);

    ApiResponse.success(res, 200, `Updated progress for ${results.length} problems`, {
      updated: results.length,
    });
  }
);
