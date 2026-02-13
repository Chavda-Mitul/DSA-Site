/**
 * ===========================================
 * USER MODEL
 * ===========================================
 *
 * Mongoose model for User collection with TypeScript support.
 *
 * TYPE SAFETY APPROACH:
 * 1. IUserDocument - interface for document instances
 * 2. IUserModel - interface for model with static methods
 * 3. Schema generic types ensure type safety
 */

import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument, UserRole } from '../types/models.types';

// ===========================================
// MODEL INTERFACE (Static Methods)
// ===========================================

/**
 * Interface for User model with custom static methods
 * This extends Mongoose's Model type with our document interface
 */
interface IUserModel extends Model<IUserDocument> {
  /**
   * Find all active users
   */
  findActive(): Promise<IUserDocument[]>;

  /**
   * Find user by email including password hash
   * Used for authentication
   */
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;

  /**
   * Find all admin users
   */
  findAdmins(): Promise<IUserDocument[]>;
}

// ===========================================
// SCHEMA DEFINITION
// ===========================================

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: 'Role must be either user or admin',
      },
      default: UserRole.USER,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform: function (_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },

    toObject: {
      transform: function (_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ===========================================
// INDEXES
// ===========================================

userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * Pre-save: Hash password before saving
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ===========================================
// INSTANCE METHODS
// ===========================================

/**
 * Compare candidate password with stored hash
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Check if user has admin role
 */
userSchema.methods.isAdmin = function (): boolean {
  return this.role === UserRole.ADMIN;
};

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Find all active users
 */
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

/**
 * Find user by email with password included
 * Used for authentication
 */
userSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).select('+passwordHash');
};

/**
 * Find all admin users
 */
userSchema.statics.findAdmins = function () {
  return this.find({ role: UserRole.ADMIN, isActive: true });
};

// ===========================================
// MODEL EXPORT
// ===========================================

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
