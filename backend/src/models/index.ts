/**
 * ===========================================
 * MODELS INDEX
 * ===========================================
 *
 * Central export for all Mongoose models.
 * Import from here for cleaner imports elsewhere.
 *
 * @example
 * ```typescript
 * import { User, Topic, Problem } from './models';
 * ```
 */

export { default as User } from './User.model';
export { default as Topic } from './Topic.model';
export { default as Problem } from './Problem.model';
export { default as UserProgress } from './UserProgress.model';
export { default as AdminLog } from './AdminLog.model';
