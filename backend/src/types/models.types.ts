/**
 * ===========================================
 * MODEL TYPE DEFINITIONS
 * ===========================================
 *
 * This file contains TypeScript interfaces for all MongoDB models.
 *
 * KEY TYPING PATTERNS:
 * 1. Base interface (IUser) - plain data shape
 * 2. Document interface (IUserDocument) - extends Document with methods
 * 3. Use Types.ObjectId for references, not string
 * 4. Mongoose Document already includes _id, so we don't redeclare it
 */

import { Document, Types } from 'mongoose';

// ===========================================
// ENUMS
// ===========================================

/**
 * User roles in the system
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * Problem difficulty levels
 */
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

/**
 * Progress status for a problem
 */
export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  COMPLETED = 'completed',
}

/**
 * Admin action types for logging
 */
export enum AdminActionType {
  CREATE_PROBLEM = 'create_problem',
  UPDATE_PROBLEM = 'update_problem',
  DELETE_PROBLEM = 'delete_problem',
  CREATE_TOPIC = 'create_topic',
  UPDATE_TOPIC = 'update_topic',
  DELETE_TOPIC = 'delete_topic',
  PROMOTE_USER = 'promote_user',
  DEMOTE_USER = 'demote_user',
  DEACTIVATE_USER = 'deactivate_user',
  ACTIVATE_USER = 'activate_user',
}

/**
 * Entity types for admin logs
 */
export enum EntityType {
  PROBLEM = 'problem',
  TOPIC = 'topic',
  USER = 'user',
}

// ===========================================
// USER TYPES
// ===========================================

/**
 * Base User interface - raw data shape without Mongoose specifics
 * Used for creating new users or typing plain objects
 */
export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Document interface - for Mongoose documents
 *
 * IMPORTANT: Document already includes:
 * - _id: Types.ObjectId
 * - __v: number
 * - save(), remove(), etc.
 *
 * We extend Document and add our fields + methods
 */
export interface IUserDocument extends Document {
  // Document fields (redefine for TypeScript autocomplete)
  _id: Types.ObjectId;

  // User fields
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAdmin(): boolean;
}

/**
 * User data safe to send to client (no password)
 */
export interface IUserPublic {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/**
 * Data required to create a new user
 */
export interface IUserCreate {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// ===========================================
// TOPIC TYPES
// ===========================================

/**
 * Topic Document interface
 */
export interface ITopicDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  order: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Virtual
  problems?: number;
}

/**
 * Data for creating a topic
 */
export interface ITopicCreate {
  title: string;
  description?: string;
  order?: number;
}

/**
 * Data for updating a topic
 */
export interface ITopicUpdate {
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

// ===========================================
// PROBLEM TYPES
// ===========================================

/**
 * Problem Document interface
 */
export interface IProblemDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  topicId: Types.ObjectId;
  difficulty: Difficulty;
  youtubeUrl?: string;
  leetcodeUrl?: string;
  articleUrl?: string;
  tags: string[];
  order: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data for creating a problem
 */
export interface IProblemCreate {
  title: string;
  topicId: string;
  difficulty: Difficulty;
  youtubeUrl?: string;
  leetcodeUrl?: string;
  articleUrl?: string;
  tags?: string[];
  order?: number;
}

/**
 * Data for updating a problem
 */
export interface IProblemUpdate {
  title?: string;
  topicId?: string;
  difficulty?: Difficulty;
  youtubeUrl?: string;
  leetcodeUrl?: string;
  articleUrl?: string;
  tags?: string[];
  order?: number;
  isActive?: boolean;
}

// ===========================================
// USER PROGRESS TYPES
// ===========================================

/**
 * UserProgress Document interface
 */
export interface IUserProgressDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  status: ProgressStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data for updating progress
 */
export interface IProgressUpdate {
  status: ProgressStatus;
}

// ===========================================
// ADMIN LOG TYPES
// ===========================================

/**
 * AdminLog Document interface
 */
export interface IAdminLogDocument extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  actionType: AdminActionType;
  entityId?: Types.ObjectId;
  entityType?: EntityType;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Data for creating an admin log
 */
export interface IAdminLogCreate {
  adminId: string | Types.ObjectId;
  actionType: AdminActionType;
  entityId?: string | Types.ObjectId;
  entityType?: EntityType;
  metadata?: Record<string, unknown>;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

/**
 * Standard API response structure
 */
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  stack?: string;
}

/**
 * Paginated response structure
 */
export interface IPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ===========================================
// AUTH TYPES
// ===========================================

/**
 * Login request data
 */
export interface ILoginRequest {
  email: string;
  password: string;
}

/**
 * Register request data
 */
export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * JWT payload structure
 * Used when signing and verifying tokens
 */
export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Auth response with token
 */
export interface IAuthResponse {
  user: IUserPublic;
  token: string;
}
