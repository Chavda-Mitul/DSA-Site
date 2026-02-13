/**
 * ===========================================
 * TOPIC MODEL
 * ===========================================
 *
 * Topics represent DSA chapters or categories (e.g., Arrays, Strings, Trees).
 * Each topic contains multiple problems.
 *
 * DESIGN DECISIONS:
 * - Topics and Problems are in separate collections (not embedded)
 * - This allows independent scaling and easier querying
 * - Soft delete via isActive flag preserves data integrity
 * - Slugs provide URL-friendly identifiers
 *
 * RELATIONSHIPS:
 * - One Topic has many Problems (via Problem.topicId)
 * - Topic is created by a User (admin)
 */

import mongoose, { Schema, Model } from 'mongoose';
import slugify from 'slugify';
import { ITopicDocument } from '../types/models.types';

// ===========================================
// SCHEMA DEFINITION
// ===========================================

const topicSchema = new Schema<ITopicDocument>(
  {
    /**
     * Topic title
     * - Human-readable name (e.g., "Binary Search", "Dynamic Programming")
     * - Used to generate the slug
     */
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    /**
     * URL-friendly identifier
     * - Auto-generated from title
     * - Used in URLs (e.g., /topics/binary-search)
     * - Must be unique
     */
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    /**
     * Topic description
     * - Optional detailed explanation
     * - Can include what topics are covered
     */
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },

    /**
     * Display order
     * - Used to sort topics in the UI
     * - Lower numbers appear first
     * - Should be unique but not enforced (allows reordering)
     */
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [0, 'Order must be a positive number'],
    },

    /**
     * Active status for soft delete
     * - true: Topic is visible and usable
     * - false: Topic is "deleted" but data preserved
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * Reference to the admin who created this topic
     * - Used for audit trail
     * - Links to User collection
     */
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
    },
  },
  {
    /**
     * Schema options
     */
    timestamps: true,  // Adds createdAt and updatedAt

    /**
     * Enable virtuals in JSON output
     * Allows problem count to be included
     */
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
 * - Ensures no duplicate slugs
 * - Fast lookup by slug (for URL routing)
 */
topicSchema.index({ slug: 1 }, { unique: true });

/**
 * Index on order (ascending)
 * - Efficient sorting by display order
 */
topicSchema.index({ order: 1 });

/**
 * Index on isActive
 * - Quick filtering of active/inactive topics
 */
topicSchema.index({ isActive: 1 });

/**
 * Index on createdAt (descending)
 * - Efficient sorting by creation date
 */
topicSchema.index({ createdAt: -1 });

/**
 * Compound index for common query pattern
 * - Finding active topics sorted by order
 */
topicSchema.index({ isActive: 1, order: 1 });

// ===========================================
// VIRTUALS
// ===========================================

/**
 * Virtual field for problem count
 *
 * This creates a virtual relationship with the Problem collection.
 * When you call .populate('problems'), it will include the count
 * of problems associated with this topic.
 *
 * @example
 * ```typescript
 * const topics = await Topic.find().populate('problems');
 * // topics[0].problems will be the count of problems
 * ```
 */
topicSchema.virtual('problems', {
  ref: 'Problem',           // Reference the Problem model
  localField: '_id',        // Field in Topic
  foreignField: 'topicId',  // Field in Problem
  count: true,              // Return count instead of documents
});

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * Pre-save middleware: Generate slug from title
 *
 * Automatically creates a URL-friendly slug when:
 * - Creating a new topic
 * - Updating the title
 */
topicSchema.pre('save', function (next) {
  // Generate slug if title is modified or slug doesn't exist
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, {
      lower: true,      // Convert to lowercase
      strict: true,     // Remove special characters
      trim: true,       // Trim whitespace
    });
  }
  next();
});

/**
 * Pre-update middleware: Update slug if title changes
 *
 * When using findOneAndUpdate, this ensures the slug
 * is updated if the title changes.
 */
topicSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as { title?: string; slug?: string };

  // If title is being updated, regenerate slug
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
 * Interface for Topic model with static methods
 */
interface ITopicModel extends Model<ITopicDocument> {
  findActiveOrdered(): Promise<ITopicDocument[]>;
  findBySlug(slug: string): Promise<ITopicDocument | null>;
  getNextOrder(): Promise<number>;
}

/**
 * Find all active topics, sorted by order
 *
 * @returns Promise<ITopicDocument[]> - Array of active topics
 *
 * @example
 * ```typescript
 * const topics = await Topic.findActiveOrdered();
 * ```
 */
topicSchema.statics.findActiveOrdered = function (): Promise<ITopicDocument[]> {
  return this.find({ isActive: true })
    .sort({ order: 1 })    // Sort by order ascending
    .populate('problems'); // Include problem count
};

/**
 * Find a topic by its slug
 *
 * @param slug - URL-friendly identifier
 * @returns Promise<ITopicDocument | null>
 *
 * @example
 * ```typescript
 * const topic = await Topic.findBySlug('binary-search');
 * ```
 */
topicSchema.statics.findBySlug = function (
  slug: string
): Promise<ITopicDocument | null> {
  return this.findOne({ slug, isActive: true });
};

/**
 * Get the next available order number
 * Used when creating a new topic without specifying order
 *
 * @returns Promise<number> - Next order number
 *
 * @example
 * ```typescript
 * const order = await Topic.getNextOrder();
 * // If highest order is 5, returns 6
 * ```
 */
topicSchema.statics.getNextOrder = async function (): Promise<number> {
  const lastTopic = await this.findOne().sort({ order: -1 });
  return lastTopic ? lastTopic.order + 1 : 1;
};

// ===========================================
// MODEL EXPORT
// ===========================================

const Topic = mongoose.model<ITopicDocument, ITopicModel>('Topic', topicSchema);

export default Topic;
