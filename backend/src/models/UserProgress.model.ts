/**
 * ===========================================
 * USER PROGRESS MODEL
 * ===========================================
 *
 * Tracks which problems each user has completed.
 * This is a junction/pivot table between Users and Problems.
 *
 * DESIGN DECISIONS:
 * - Separate collection (NOT embedded in User document)
 * - WHY: Avoids unbounded array growth in User documents
 *   - A user might complete 1000+ problems over time
 *   - Embedding would cause document size to grow indefinitely
 *   - MongoDB has 16MB document size limit
 * - Compound unique index on (userId, problemId) prevents duplicates
 *
 * SCALABILITY:
 * - Can efficiently query:
 *   - All problems completed by a user
 *   - All users who completed a problem
 *   - Completion stats for a problem
 * - Indexes optimized for these query patterns
 *
 * RELATIONSHIPS:
 * - Many-to-Many between Users and Problems
 * - Each document represents one user's status on one problem
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IUserProgressDocument, ProgressStatus } from '../types/models.types';

// ===========================================
// SCHEMA DEFINITION
// ===========================================

const userProgressSchema = new Schema<IUserProgressDocument>(
  {
    /**
     * Reference to the User
     * - Which user's progress this is
     * - Indexed for "get all progress for user X" queries
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    /**
     * Reference to the Problem
     * - Which problem this progress is for
     * - Indexed for "get all users who completed problem X" queries
     */
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
      index: true,
    },

    /**
     * Completion status
     * - not_started: User hasn't solved the problem yet
     * - completed: User has successfully solved the problem
     *
     * Note: We could add more statuses like 'in_progress', 'attempted'
     * for more granular tracking in the future
     */
    status: {
      type: String,
      enum: {
        values: Object.values(ProgressStatus),  // ['not_started', 'completed']
        message: 'Status must be not_started or completed',
      },
      default: ProgressStatus.NOT_STARTED,
    },

    /**
     * Timestamp when problem was completed
     * - null if not yet completed
     * - Set when status changes to 'completed'
     * - Useful for progress timeline and analytics
     */
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform: function (_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ===========================================
// INDEXES
// ===========================================

/**
 * Compound unique index on (userId, problemId)
 *
 * CRITICAL: This ensures a user can only have ONE progress record per problem.
 * Without this, you could accidentally create multiple progress records.
 *
 * This also makes lookups very fast when you know both user and problem.
 */
userProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });

/**
 * Index on userId (already created with index: true above)
 * Used for: "Get all progress records for user X"
 */

/**
 * Index on problemId (already created with index: true above)
 * Used for: "Get completion count for problem X"
 */

/**
 * Index on status
 * Used for: "Get all completed problems" or "Get problems in progress"
 */
userProgressSchema.index({ status: 1 });

/**
 * Compound index for user's completed problems
 * Optimizes: "Get all completed problems for user X"
 */
userProgressSchema.index({ userId: 1, status: 1 });

/**
 * Index on completedAt
 * Used for: Sorting by completion date, analytics
 */
userProgressSchema.index({ completedAt: -1 });

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * Pre-save: Set completedAt when status changes to completed
 */
userProgressSchema.pre('save', function (next) {
  // If status is being set to completed and completedAt is not set
  if (this.status === ProgressStatus.COMPLETED && !this.completedAt) {
    this.completedAt = new Date();
  }

  // If status is being changed back to not_started, clear completedAt
  if (this.status === ProgressStatus.NOT_STARTED) {
    this.completedAt = null;
  }

  next();
});

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Interface for UserProgress model with static methods
 */
interface IUserProgressModel extends Model<IUserProgressDocument> {
  findUserProgress(userId: string): Promise<IUserProgressDocument[]>;
  findCompletedByUser(userId: string): Promise<IUserProgressDocument[]>;
  getCompletionCount(problemId: string): Promise<number>;
  findOrCreate(userId: string, problemId: string): Promise<IUserProgressDocument>;
  markCompleted(userId: string, problemId: string): Promise<IUserProgressDocument>;
  resetProgress(userId: string, problemId: string): Promise<IUserProgressDocument | null>;
}

/**
 * Get all progress records for a user
 *
 * @param userId - User ObjectId
 * @returns Array of progress records with populated problem info
 */
userProgressSchema.statics.findUserProgress = function (
  userId: string
): Promise<IUserProgressDocument[]> {
  return this.find({ userId })
    .populate({
      path: 'problemId',
      select: 'title slug difficulty topicId',
      populate: {
        path: 'topicId',
        select: 'title slug',
      },
    })
    .sort({ updatedAt: -1 });
};

/**
 * Get only completed problems for a user
 *
 * @param userId - User ObjectId
 * @returns Array of completed progress records
 */
userProgressSchema.statics.findCompletedByUser = function (
  userId: string
): Promise<IUserProgressDocument[]> {
  return this.find({ userId, status: ProgressStatus.COMPLETED })
    .populate('problemId', 'title slug difficulty')
    .sort({ completedAt: -1 });
};

/**
 * Get count of users who completed a problem
 *
 * @param problemId - Problem ObjectId
 * @returns Number of completions
 */
userProgressSchema.statics.getCompletionCount = function (
  problemId: string
): Promise<number> {
  return this.countDocuments({ problemId, status: ProgressStatus.COMPLETED });
};

/**
 * Find or create a progress record
 * Uses MongoDB's upsert functionality
 *
 * @param userId - User ObjectId
 * @param problemId - Problem ObjectId
 * @returns Progress record (existing or newly created)
 */
userProgressSchema.statics.findOrCreate = async function (
  userId: string,
  problemId: string
): Promise<IUserProgressDocument> {
  // Try to find existing record
  let progress = await this.findOne({ userId, problemId });

  // If not found, create new one
  if (!progress) {
    progress = await this.create({
      userId,
      problemId,
      status: ProgressStatus.NOT_STARTED,
    });
  }

  return progress;
};

/**
 * Mark a problem as completed for a user
 *
 * @param userId - User ObjectId
 * @param problemId - Problem ObjectId
 * @returns Updated progress record
 */
userProgressSchema.statics.markCompleted = async function (
  userId: string,
  problemId: string
): Promise<IUserProgressDocument> {
  // Use findOneAndUpdate with upsert for atomic operation
  const progress = await this.findOneAndUpdate(
    { userId, problemId },
    {
      status: ProgressStatus.COMPLETED,
      completedAt: new Date(),
    },
    {
      new: true,           // Return updated document
      upsert: true,        // Create if doesn't exist
      runValidators: true, // Run schema validators
    }
  );

  return progress;
};

/**
 * Reset progress for a problem (mark as not started)
 *
 * @param userId - User ObjectId
 * @param problemId - Problem ObjectId
 * @returns Updated progress record or null if not found
 */
userProgressSchema.statics.resetProgress = async function (
  userId: string,
  problemId: string
): Promise<IUserProgressDocument | null> {
  return this.findOneAndUpdate(
    { userId, problemId },
    {
      status: ProgressStatus.NOT_STARTED,
      completedAt: null,
    },
    { new: true }
  );
};

// ===========================================
// MODEL EXPORT
// ===========================================

const UserProgress = mongoose.model<IUserProgressDocument, IUserProgressModel>(
  'UserProgress',
  userProgressSchema
);

export default UserProgress;
