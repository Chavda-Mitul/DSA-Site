/**
 * ===========================================
 * TOPIC CONTROLLER
 * ===========================================
 *
 * Handles CRUD operations for Topics (DSA chapters).
 * Topics are categories like "Arrays", "Linked Lists", "Trees", etc.
 *
 * PERMISSIONS:
 * - GET (list, single): Public
 * - POST, PUT, DELETE: Admin only
 */

import { Request, Response } from 'express';
import Topic from '../models/Topic.model';
import Problem from '../models/Problem.model';
import AdminLog from '../models/AdminLog.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import { AdminActionType, EntityType } from '../types/models.types';

/**
 * @desc    Get all topics
 * @route   GET /api/topics
 * @access  Public
 *
 * @example
 * GET /api/topics?page=1&limit=10&includeInactive=false
 */
export const getTopics = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      includeInactive = false,
      sortBy = 'order',
      sortOrder = 'asc',
    } = req.query;

    // ===========================================
    // BUILD QUERY
    // ===========================================

    // Base filter
    const filter: Record<string, unknown> = {};

    // Only admins can see inactive topics
    if (!includeInactive || !req.user?.isAdmin()) {
      filter.isActive = true;
    }

    // ===========================================
    // EXECUTE QUERY WITH PAGINATION
    // ===========================================

    // Calculate skip for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sort: Record<string, 1 | -1> = {
      [sortBy as string]: sortOrder === 'desc' ? -1 : 1,
    };

    // Execute queries in parallel for efficiency
    const [topics, totalItems] = await Promise.all([
      Topic.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('problems') // Virtual field - gets problem count
        .populate('createdBy', 'name email'),

      Topic.countDocuments(filter),
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
      'Topics retrieved successfully',
      topics,
      pagination
    );
  }
);

/**
 * @desc    Get single topic by ID or slug
 * @route   GET /api/topics/:identifier
 * @access  Public
 *
 * @example
 * GET /api/topics/507f1f77bcf86cd799439011
 * GET /api/topics/binary-search
 */
export const getTopic = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { identifier } = req.params;

    // ===========================================
    // FIND TOPIC BY ID OR SLUG
    // ===========================================

    // Check if identifier is a valid ObjectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let topic;

    if (isObjectId) {
      topic = await Topic.findById(identifier)
        .populate('problems')
        .populate('createdBy', 'name email');
    } else {
      // Search by slug
      topic = await Topic.findOne({ slug: identifier })
        .populate('problems')
        .populate('createdBy', 'name email');
    }

    // ===========================================
    // CHECK IF FOUND AND ACTIVE
    // ===========================================

    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    // Only admins can view inactive topics
    if (!topic.isActive && !req.user?.isAdmin()) {
      throw ApiError.notFound('Topic not found');
    }

    ApiResponse.success(res, 200, 'Topic retrieved successfully', topic);
  }
);

/**
 * @desc    Create a new topic
 * @route   POST /api/topics
 * @access  Private (Admin only)
 *
 * @example
 * POST /api/topics
 * Body: { "title": "Binary Search", "description": "...", "order": 5 }
 */
export const createTopic = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { title, description, order } = req.body;
    const adminId = req.user!._id;

    // ===========================================
    // DETERMINE ORDER IF NOT PROVIDED
    // ===========================================

    let topicOrder = order;

    if (topicOrder === undefined) {
      // Get next available order number
      topicOrder = await Topic.getNextOrder();
    }

    // ===========================================
    // CREATE TOPIC
    // ===========================================

    const topic = await Topic.create({
      title,
      description: description || '',
      order: topicOrder,
      createdBy: adminId,
      isActive: true,
    });

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.CREATE_TOPIC,
      topic._id.toString(),
      EntityType.TOPIC,
      { title: topic.title, slug: topic.slug }
    );

    logger.info(`Topic created: ${topic.title} by admin ${req.user!.email}`);

    ApiResponse.created(res, 'Topic created successfully', topic);
  }
);

/**
 * @desc    Update a topic
 * @route   PUT /api/topics/:id
 * @access  Private (Admin only)
 *
 * @example
 * PUT /api/topics/507f1f77bcf86cd799439011
 * Body: { "title": "Updated Title", "description": "New description" }
 */
export const updateTopic = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.user!._id;

    // ===========================================
    // FIND AND UPDATE TOPIC
    // ===========================================

    const topic = await Topic.findById(id);

    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    // Store old values for logging
    const oldValues = {
      title: topic.title,
      description: topic.description,
      order: topic.order,
    };

    // Update topic
    const updatedTopic = await Topic.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    ).populate('createdBy', 'name email');

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.UPDATE_TOPIC,
      id,
      EntityType.TOPIC,
      { before: oldValues, after: updateData }
    );

    logger.info(`Topic updated: ${updatedTopic!.title} by admin ${req.user!.email}`);

    ApiResponse.success(res, 200, 'Topic updated successfully', updatedTopic);
  }
);

/**
 * @desc    Delete a topic (soft delete)
 * @route   DELETE /api/topics/:id
 * @access  Private (Admin only)
 *
 * Soft delete sets isActive to false instead of removing the document.
 * This preserves data integrity and allows recovery.
 */
export const deleteTopic = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user!._id;

    // ===========================================
    // FIND TOPIC
    // ===========================================

    const topic = await Topic.findById(id);

    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    if (!topic.isActive) {
      throw ApiError.badRequest('Topic is already deleted');
    }

    // ===========================================
    // CHECK FOR ASSOCIATED PROBLEMS
    // ===========================================

    const problemCount = await Problem.countDocuments({
      topicId: id,
      isActive: true,
    });

    if (problemCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete topic with ${problemCount} active problem(s). ` +
        'Delete or move the problems first.'
      );
    }

    // ===========================================
    // SOFT DELETE
    // ===========================================

    topic.isActive = false;
    await topic.save();

    // ===========================================
    // LOG ADMIN ACTION
    // ===========================================

    await AdminLog.logAction(
      adminId.toString(),
      AdminActionType.DELETE_TOPIC,
      id,
      EntityType.TOPIC,
      { title: topic.title, slug: topic.slug }
    );

    logger.info(`Topic deleted: ${topic.title} by admin ${req.user!.email}`);

    ApiResponse.success(res, 200, 'Topic deleted successfully');
  }
);

/**
 * @desc    Get problems for a specific topic
 * @route   GET /api/topics/:id/problems
 * @access  Public
 */
export const getTopicProblems = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { page = 1, limit = 20, difficulty } = req.query;

    // ===========================================
    // VERIFY TOPIC EXISTS
    // ===========================================

    const topic = await Topic.findById(id);

    if (!topic || !topic.isActive) {
      throw ApiError.notFound('Topic not found');
    }

    // ===========================================
    // BUILD FILTER
    // ===========================================

    const filter: Record<string, unknown> = { topicId: id, isActive: true };

    // Add difficulty filter if provided
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty as string)) {
      filter.difficulty = difficulty;
    }

    // ===========================================
    // GET PROBLEMS WITH PAGINATION
    // ===========================================

    const skip = (Number(page) - 1) * Number(limit);

    const [problems, totalItems] = await Promise.all([
      Problem.find(filter)
        .sort({ order: 1 })
        .skip(skip)
        .limit(Number(limit)),

      Problem.countDocuments(filter),
    ]);

    const pagination = ApiResponse.createPagination(
      Number(page),
      Number(limit),
      totalItems
    );

    ApiResponse.paginated(
      res,
      200,
      `Problems for topic "${topic.title}" retrieved`,
      problems,
      pagination
    );
  }
);
