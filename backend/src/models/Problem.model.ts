/**
 * ===========================================
 * PROBLEM MODEL
 * ===========================================
 *
 * Problems are individual DSA questions/challenges.
 * Each problem belongs to a Topic and has associated resources.
 *
 * DESIGN DECISIONS:
 * - Problems are NOT embedded in Topics (separate collection)
 * - This allows:
 *   - Independent scaling (can have thousands of problems)
 *   - Efficient pagination and filtering
 *   - Flexible querying across all problems
 * - Compound indexes optimize common query patterns
 *
 * RELATIONSHIPS:
 * - Many Problems belong to one Topic (via topicId)
 * - Problem is created by a User (admin)
 * - UserProgress tracks completion of Problems
 */

import mongoose, { Schema, Model } from 'mongoose';
import slugify from 'slugify';
import { IProblemDocument, Difficulty } from '../types/models.types';

// ===========================================
// SCHEMA DEFINITION
// ===========================================

const problemSchema = new Schema<IProblemDocument>(
  {
    /**
     * Problem title
     * - Clear, descriptive name of the problem
     * - Example: "Two Sum", "Valid Parentheses"
     */
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },

    /**
     * URL-friendly identifier
     * - Auto-generated from title
     * - Used in URLs: /problems/two-sum
     */
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    /**
     * Reference to parent Topic
     * - Links problem to its category
     * - Indexed for efficient topic-based queries
     */
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic reference is required'],
      index: true,
    },

    /**
     * Problem difficulty level
     * - Easy: Basic concepts, straightforward solution
     * - Medium: Requires good understanding, multiple concepts
     * - Hard: Complex, optimization required, multiple approaches
     */
    difficulty: {
      type: String,
      enum: {
        values: Object.values(Difficulty),  // ['Easy', 'Medium', 'Hard']
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
      required: [true, 'Difficulty is required'],
    },

    /**
     * External resource URLs
     * - youtubeUrl: Video explanation
     * - leetcodeUrl: Problem on LeetCode
     * - articleUrl: Written explanation/solution
     * All optional to allow flexibility
     */
    youtubeUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          // Allow empty strings or valid URLs
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL',
      },
    },

    leetcodeUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL',
      },
    },

    articleUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL',
      },
    },

    /**
     * Problem tags for categorization
     * - Examples: ['array', 'hash-table', 'two-pointers']
     * - Used for filtering and search
     * - Indexed as multikey index for efficient queries
     */
    tags: {
      type: [String],
      default: [],
      // Transform tags to lowercase for consistency
      set: (tags: string[]) => tags.map((tag) => tag.toLowerCase().trim()),
    },

    /**
     * Display order within the topic
     * - Lower numbers appear first
     * - Used with topicId for sorting problems in a topic
     */
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [0, 'Order must be a positive number'],
    },

    /**
     * Active status for soft delete
     * - true: Problem is visible and usable
     * - false: Problem is "deleted" but data preserved
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * Reference to admin who created this problem
     * - Used for audit trail and accountability
     */
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

// ===========================================
// INDEXES
// ===========================================

/**
 * Unique index on slug
 * - Fast problem lookup by slug
 */
problemSchema.index({ slug: 1 }, { unique: true });

/**
 * Index on topicId
 * - Already created above with `index: true`
 * - Fast lookup of problems by topic
 */

/**
 * Compound index on (topicId, order)
 * - Optimizes the common query: "Get all problems in topic X, sorted by order"
 * - This is the most frequent query pattern
 */
problemSchema.index({ topicId: 1, order: 1 });

/**
 * Index on difficulty
 * - Fast filtering by difficulty level
 */
problemSchema.index({ difficulty: 1 });

/**
 * Multikey index on tags
 * - Efficient queries like: "Find all problems with tag 'array'"
 * - MongoDB creates index entry for each array element
 */
problemSchema.index({ tags: 1 });

/**
 * Index on isActive
 * - Quick filtering of active/deleted problems
 */
problemSchema.index({ isActive: 1 });

/**
 * Compound index for active problems in a topic
 * - Common query: "Get active problems in topic X"
 */
problemSchema.index({ topicId: 1, isActive: 1, order: 1 });

/**
 * Compound index for filtering by difficulty and topic
 * - Query: "Get Medium problems in Arrays topic"
 */
problemSchema.index({ topicId: 1, difficulty: 1 });

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * Pre-save: Generate slug from title
 */
problemSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    // Add timestamp to ensure uniqueness if needed
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

/**
 * Pre-update: Update slug if title changes
 */
problemSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as { title?: string; slug?: string };

  if (update && update.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Interface for Problem model with static methods
 */
interface IProblemModel extends Model<IProblemDocument> {
  findByTopicOrdered(topicId: string): Promise<IProblemDocument[]>;
  findBySlug(slug: string): Promise<IProblemDocument | null>;
  findByDifficulty(difficulty: Difficulty): Promise<IProblemDocument[]>;
  findByTag(tag: string): Promise<IProblemDocument[]>;
  getNextOrder(topicId: string): Promise<number>;
}

/**
 * Find all active problems in a topic, sorted by order
 *
 * @param topicId - Topic ObjectId
 * @returns Array of problems sorted by order
 */
problemSchema.statics.findByTopicOrdered = function (
  topicId: string
): Promise<IProblemDocument[]> {
  return this.find({ topicId, isActive: true })
    .sort({ order: 1 })
    .populate('topicId', 'title slug'); // Include topic info
};

/**
 * Find a problem by its slug
 *
 * @param slug - URL-friendly identifier
 * @returns Problem document or null
 */
problemSchema.statics.findBySlug = function (
  slug: string
): Promise<IProblemDocument | null> {
  return this.findOne({ slug, isActive: true })
    .populate('topicId', 'title slug');
};

/**
 * Find all problems with a specific difficulty
 *
 * @param difficulty - Easy, Medium, or Hard
 * @returns Array of problems
 */
problemSchema.statics.findByDifficulty = function (
  difficulty: Difficulty
): Promise<IProblemDocument[]> {
  return this.find({ difficulty, isActive: true })
    .sort({ order: 1 })
    .populate('topicId', 'title slug');
};

/**
 * Find all problems with a specific tag
 *
 * @param tag - Tag to search for
 * @returns Array of problems with that tag
 */
problemSchema.statics.findByTag = function (
  tag: string
): Promise<IProblemDocument[]> {
  return this.find({ tags: tag.toLowerCase(), isActive: true })
    .sort({ order: 1 })
    .populate('topicId', 'title slug');
};

/**
 * Get the next available order number for a topic
 *
 * @param topicId - Topic to get order for
 * @returns Next order number
 */
problemSchema.statics.getNextOrder = async function (
  topicId: string
): Promise<number> {
  const lastProblem = await this.findOne({ topicId }).sort({ order: -1 });
  return lastProblem ? lastProblem.order + 1 : 1;
};

// ===========================================
// MODEL EXPORT
// ===========================================

const Problem = mongoose.model<IProblemDocument, IProblemModel>('Problem', problemSchema);

export default Problem;
