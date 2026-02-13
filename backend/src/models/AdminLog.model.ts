/**
 * ===========================================
 * ADMIN LOG MODEL
 * ===========================================
 *
 * Tracks administrative actions for audit trail and accountability.
 * Every significant action by an admin is logged here.
 *
 * PURPOSE:
 * - Security: Track who did what and when
 * - Debugging: Understand sequence of changes
 * - Compliance: Audit trail for sensitive operations
 * - Analytics: Admin activity patterns
 *
 * LOGGED ACTIONS:
 * - Problem CRUD (create, update, delete)
 * - Topic CRUD (create, update, delete)
 * - User management (promote, demote, deactivate)
 *
 * NOTE: This is a write-heavy collection. Consider:
 * - TTL index to auto-delete old logs (e.g., after 90 days)
 * - Separate database for high-volume logging
 * - Async logging to avoid blocking requests
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IAdminLogDocument, AdminActionType, EntityType } from '../types/models.types';

// ===========================================
// SCHEMA DEFINITION
// ===========================================

const adminLogSchema = new Schema<IAdminLogDocument>(
  {
    /**
     * Reference to the admin who performed the action
     * - Links to User collection
     * - Required for accountability
     */
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin reference is required'],
      index: true,
    },

    /**
     * Type of action performed
     * - Predefined enum values for consistency
     * - Examples: 'create_problem', 'delete_topic', 'promote_user'
     */
    actionType: {
      type: String,
      enum: {
        values: Object.values(AdminActionType),
        message: 'Invalid action type',
      },
      required: [true, 'Action type is required'],
    },

    /**
     * ID of the entity that was affected
     * - Could be a Problem, Topic, or User ID
     * - Optional because some actions might not have a target
     */
    entityId: {
      type: Schema.Types.ObjectId,
      required: false,
    },

    /**
     * Type of entity that was affected
     * - Helps interpret the entityId
     * - 'problem', 'topic', or 'user'
     */
    entityType: {
      type: String,
      enum: {
        values: Object.values(EntityType),
        message: 'Invalid entity type',
      },
      required: false,
    },

    /**
     * Additional metadata about the action
     * - Flexible object for extra information
     * - Examples:
     *   - For updates: { before: {...}, after: {...} }
     *   - For deletes: { deletedEntity: {...} }
     *   - For promotions: { previousRole: 'user', newRole: 'admin' }
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    /**
     * When the action occurred
     * - Defaults to current time
     * - Immutable (cannot be changed after creation)
     */
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,  // Cannot be modified after creation
    },
  },
  {
    // Don't use timestamps here since we have our own timestamp field
    // timestamps: false would work but we want createdAt for consistency

    /**
     * We use a custom timestamp field instead of Mongoose's timestamps
     * because we want it to be immutable and named 'timestamp'
     */

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
 * Index on adminId
 * Used for: "Get all actions by admin X"
 */
// Already created with index: true above

/**
 * Index on timestamp (descending)
 * Used for: Recent activity, pagination
 */
adminLogSchema.index({ timestamp: -1 });

/**
 * Index on actionType
 * Used for: "Get all delete actions" or filter by action type
 */
adminLogSchema.index({ actionType: 1 });

/**
 * Index on entityType
 * Used for: "Get all actions on problems"
 */
adminLogSchema.index({ entityType: 1 });

/**
 * Compound index for common query pattern
 * Used for: "Get recent actions by admin X"
 */
adminLogSchema.index({ adminId: 1, timestamp: -1 });

/**
 * Compound index for entity history
 * Used for: "Get all actions on entity X"
 */
adminLogSchema.index({ entityId: 1, timestamp: -1 });

/**
 * TTL Index (Time To Live) - Optional
 *
 * Automatically delete logs older than 90 days.
 * Uncomment if you want automatic cleanup.
 *
 * Note: This will permanently delete old logs!
 * Consider archiving before deletion in production.
 */
// adminLogSchema.index(
//   { timestamp: 1 },
//   { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 days
// );

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Interface for AdminLog model with static methods
 */
interface IAdminLogModel extends Model<IAdminLogDocument> {
  logAction(
    adminId: string,
    actionType: AdminActionType,
    entityId?: string,
    entityType?: EntityType,
    metadata?: Record<string, unknown>
  ): Promise<IAdminLogDocument>;
  getAdminActivity(adminId: string, limit?: number): Promise<IAdminLogDocument[]>;
  getEntityHistory(entityId: string): Promise<IAdminLogDocument[]>;
  getRecentActivity(limit?: number): Promise<IAdminLogDocument[]>;
}

/**
 * Log an admin action
 * Convenience method for creating log entries
 *
 * @param adminId - ID of the admin performing the action
 * @param actionType - Type of action being performed
 * @param entityId - Optional ID of affected entity
 * @param entityType - Optional type of affected entity
 * @param metadata - Optional additional information
 * @returns Created log document
 *
 * @example
 * ```typescript
 * await AdminLog.logAction(
 *   admin._id,
 *   AdminActionType.CREATE_PROBLEM,
 *   problem._id,
 *   EntityType.PROBLEM,
 *   { problemTitle: problem.title }
 * );
 * ```
 */
adminLogSchema.statics.logAction = async function (
  adminId: string,
  actionType: AdminActionType,
  entityId?: string,
  entityType?: EntityType,
  metadata?: Record<string, unknown>
): Promise<IAdminLogDocument> {
  return this.create({
    adminId,
    actionType,
    entityId,
    entityType,
    metadata,
    timestamp: new Date(),
  });
};

/**
 * Get activity history for a specific admin
 *
 * @param adminId - Admin user ID
 * @param limit - Maximum number of records (default: 50)
 * @returns Array of log entries, newest first
 */
adminLogSchema.statics.getAdminActivity = function (
  adminId: string,
  limit: number = 50
): Promise<IAdminLogDocument[]> {
  return this.find({ adminId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('adminId', 'name email');
};

/**
 * Get action history for a specific entity
 *
 * @param entityId - Entity ID (Problem, Topic, or User)
 * @returns Array of log entries related to this entity
 */
adminLogSchema.statics.getEntityHistory = function (
  entityId: string
): Promise<IAdminLogDocument[]> {
  return this.find({ entityId })
    .sort({ timestamp: -1 })
    .populate('adminId', 'name email');
};

/**
 * Get recent admin activity across all admins
 *
 * @param limit - Maximum number of records (default: 100)
 * @returns Array of recent log entries
 */
adminLogSchema.statics.getRecentActivity = function (
  limit: number = 100
): Promise<IAdminLogDocument[]> {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('adminId', 'name email');
};

// ===========================================
// MODEL EXPORT
// ===========================================

const AdminLog = mongoose.model<IAdminLogDocument, IAdminLogModel>('AdminLog', adminLogSchema);

export default AdminLog;
