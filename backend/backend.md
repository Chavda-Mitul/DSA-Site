# DSA Sheet Backend Architecture Documentation

---

## 1. Project Overview

The DSA Sheet backend is a production-ready RESTful API built with Node.js and Express.js, designed to power a Data Structures and Algorithms learning platform. The system provides a robust foundation for managing DSA topics, problems, and user progress tracking.

### Core Responsibilities

- **User Authentication**: Secure JWT-based authentication with session-less architecture
- **Authorization**: Role-Based Access Control distinguishing between regular users and administrators
- **Content Management**: CRUD operations for topics (chapters) and problems (questions)
- **Progress Tracking**: Persistent user progress with automatic restoration on login
- **Audit Trail**: Administrative action logging for accountability

### Major Features

| Feature | Description |
|---------|-------------|
| JWT Authentication | Stateless authentication with configurable token expiration |
| Role-Based Access Control | Two-tier system (User/Admin) with middleware enforcement |
| Topics Management | Hierarchical content organization with ordering support |
| Problems Management | Questions with difficulty levels, external resources, and tagging |
| Progress Tracking | Per-user problem completion tracking with analytics |
| Admin Promotion | Secure role elevation with audit logging |
| Soft Delete Strategy | Data preservation through active status flags |
| Auto-Admin Initialization | Environment-based initial admin creation on startup |

### Design Principles

- **Separation of Concerns**: Clear boundaries between routes, controllers, and models
- **Backend-Only Security**: All authorization enforced server-side, never relying on frontend
- **Scalable Data Design**: Separate collections with proper indexing for performance
- **Clean Error Handling**: Centralized error processing with consistent response formats
- **Type Safety**: Full TypeScript implementation for compile-time error detection

---

## 2. Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── topic.controller.ts
│   │   ├── problem.controller.ts
│   │   └── progress.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── admin.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Topic.model.ts
│   │   ├── Problem.model.ts
│   │   ├── UserProgress.model.ts
│   │   └── AdminLog.model.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── topic.routes.ts
│   │   ├── problem.routes.ts
│   │   └── progress.routes.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── topic.validator.ts
│   │   ├── problem.validator.ts
│   │   └── progress.validator.ts
│   ├── types/
│   │   ├── models.types.ts
│   │   └── express.d.ts
│   ├── utils/
│   │   ├── ApiError.ts
│   │   ├── ApiResponse.ts
│   │   ├── asyncHandler.ts
│   │   ├── logger.ts
│   │   └── adminInit.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

### Folder Responsibilities

| Folder | Responsibility |
|--------|----------------|
| **config/** | Environment configuration and database connection setup. Centralizes all external configuration. |
| **controllers/** | Business logic layer. Handles request processing, interacts with models, and formulates responses. |
| **middleware/** | Request interceptors for authentication, authorization, validation, and error handling. |
| **models/** | Mongoose schemas defining data structure, indexes, virtuals, and static methods. |
| **routes/** | API endpoint definitions. Maps HTTP methods and paths to controller functions. |
| **validators/** | Joi validation schemas for request body, query parameters, and URL parameters. |
| **types/** | TypeScript interfaces and type definitions for type safety across the application. |
| **utils/** | Reusable utilities including error classes, response formatters, and helper functions. |
| **server.ts** | Application entry point. Initializes middleware, routes, and starts the HTTP server. |

### Architectural Separation

The codebase follows a layered architecture pattern:

1. **Routes Layer**: Receives HTTP requests, applies middleware, delegates to controllers
2. **Middleware Layer**: Cross-cutting concerns (auth, validation, error handling)
3. **Controller Layer**: Business logic orchestration, no direct database operations
4. **Model Layer**: Data access, schema definition, database operations
5. **Utils Layer**: Shared functionality across all layers

This separation ensures maintainability, testability, and clear responsibility boundaries.

---

## 3. System Architecture Diagram

### High-Level Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│                    Stores JWT in localStorage                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   MIDDLEWARE LAYER                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐   │   │
│  │  │ Helmet  │→│  CORS   │→│ Morgan  │→│ JSON Parse│   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └───────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ROUTE HANDLERS                        │   │
│  │  /api/auth  │  /api/users  │  /api/topics  │  /api/...  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              AUTH & ADMIN MIDDLEWARE                     │   │
│  │         (JWT Verification / Role Checking)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              VALIDATION MIDDLEWARE                       │   │
│  │                 (Joi Schema Check)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CONTROLLERS                           │   │
│  │  AuthCtrl  │  UserCtrl  │  TopicCtrl  │  ProblemCtrl    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 MONGOOSE MODELS                          │   │
│  │   User  │  Topic  │  Problem  │  UserProgress  │ Admin  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MONGODB                                  │
│    Collections: users, topics, problems, userprogresses, etc.  │
└─────────────────────────────────────────────────────────────────┘
```

### JWT Authentication Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    CLIENT    │         │    SERVER    │         │   DATABASE   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  POST /auth/login      │                        │
       │  {email, password}     │                        │
       │───────────────────────>│                        │
       │                        │  Find user by email    │
       │                        │───────────────────────>│
       │                        │<───────────────────────│
       │                        │                        │
       │                        │  Compare password hash │
       │                        │  (bcrypt)              │
       │                        │                        │
       │                        │  Generate JWT          │
       │                        │  {userId, role, email} │
       │                        │                        │
       │                        │  Fetch completed IDs   │
       │                        │───────────────────────>│
       │                        │<───────────────────────│
       │                        │                        │
       │  {user, token,         │                        │
       │   completedProblemIds} │                        │
       │<───────────────────────│                        │
       │                        │                        │
       │  GET /api/topics       │                        │
       │  Authorization: Bearer │                        │
       │───────────────────────>│                        │
       │                        │                        │
       │                        │  Verify JWT signature  │
       │                        │  Check expiration      │
       │                        │  Attach user to req    │
       │                        │                        │
       │                        │  Process request       │
       │                        │───────────────────────>│
       │                        │<───────────────────────│
       │                        │                        │
       │  {topics: [...]}       │                        │
       │<───────────────────────│                        │
       │                        │                        │
```

### Admin Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      INCOMING REQUEST                        │
│              POST /api/topics (Create Topic)                 │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AUTH MIDDLEWARE                            │
│  1. Extract Bearer token from Authorization header          │
│  2. Verify JWT signature using JWT_SECRET                   │
│  3. Check token expiration                                  │
│  4. Fetch user from database                                │
│  5. Verify user is active                                   │
│  6. Attach user to request object                           │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────┐           ┌─────────────────────┐
│   TOKEN VALID       │           │   TOKEN INVALID     │
│   User attached     │           │   401 Unauthorized  │
└──────────┬──────────┘           └─────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                   ADMIN MIDDLEWARE                           │
│  1. Check if req.user exists                                │
│  2. Verify user.role === 'admin'                            │
│  3. Allow or reject                                         │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────┐           ┌─────────────────────┐
│   ROLE = ADMIN      │           │   ROLE = USER       │
│   Continue to       │           │   403 Forbidden     │
│   Controller        │           │                     │
└─────────────────────┘           └─────────────────────┘
```

---

## 4. API Endpoints

### Authentication Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Creates a new user account with default role of "user". Validates email uniqueness and password requirements. Returns user info and JWT token. |
| POST | `/api/auth/login` | Public | Authenticates user credentials. Updates last login timestamp. Returns user info, JWT token, and array of completed problem IDs for progress restoration. |
| GET | `/api/auth/me` | Authenticated | Returns the current authenticated user's profile information. |
| GET | `/api/auth/progress` | Authenticated | Optimized endpoint returning only completed problem IDs. Designed for fast progress restoration without full progress records. |
| POST | `/api/auth/logout` | Authenticated | Client-side logout notification. JWT is stateless, so actual invalidation happens client-side. |
| PUT | `/api/auth/change-password` | Authenticated | Updates user password after verifying current password. |

### User Management Module

All endpoints in this module require admin privileges.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | Admin | Lists all users with pagination, filtering by role and status, and search capability. |
| GET | `/api/users/stats` | Admin | Returns user statistics including counts by role and status. |
| GET | `/api/users/:id` | Admin | Retrieves a single user by ID. |
| PUT | `/api/users/:id/promote` | Admin | Elevates a user's role to admin. Prevents duplicate promotion. Logs action. |
| PUT | `/api/users/:id/demote` | Admin | Demotes an admin to regular user. Prevents self-demotion. |
| PUT | `/api/users/:id/deactivate` | Admin | Soft-deactivates a user account. Prevents self-deactivation. |
| PUT | `/api/users/:id/activate` | Admin | Reactivates a deactivated user account. |

### Topics Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/topics` | Public | Lists all active topics sorted by order. Admins can include inactive topics. Supports pagination. |
| GET | `/api/topics/:identifier` | Public | Retrieves a single topic by ID or slug. Includes problem count via virtual field. |
| GET | `/api/topics/:id/problems` | Public | Lists all problems within a specific topic with pagination. |
| POST | `/api/topics` | Admin | Creates a new topic. Auto-generates slug from title. Auto-assigns order if not provided. |
| PUT | `/api/topics/:id` | Admin | Updates topic properties. Regenerates slug if title changes. |
| DELETE | `/api/topics/:id` | Admin | Soft-deletes a topic by setting isActive to false. Prevents deletion if topic contains active problems. |

### Problems Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/problems` | Public | Lists problems with comprehensive filtering: by topic, difficulty, tag, and search term. Supports pagination and sorting. |
| GET | `/api/problems/tags` | Public | Returns all unique tags with their usage counts. Useful for tag cloud UI. |
| GET | `/api/problems/stats` | Public | Returns problem counts grouped by difficulty level. |
| GET | `/api/problems/:identifier` | Public | Retrieves a single problem by ID or slug with topic information. |
| POST | `/api/problems` | Admin | Creates a new problem. Validates topic exists and is active. Auto-assigns order within topic. |
| PUT | `/api/problems/:id` | Admin | Updates problem properties. Validates new topic if changing topic assignment. |
| DELETE | `/api/problems/:id` | Admin | Soft-deletes a problem by setting isActive to false. |

**Filtering Options for GET /api/problems:**

- `topicId`: Filter by parent topic
- `difficulty`: Filter by Easy, Medium, or Hard
- `tag`: Filter by tag (single tag matching)
- `search`: Text search in problem title
- `sortBy`: order, title, difficulty, createdAt
- `sortOrder`: asc or desc
- `page` and `limit`: Pagination controls

### Progress Module

All endpoints require authentication. Users can only access their own progress.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/progress` | Authenticated | Returns user's progress records with optional filtering by status and topic. Includes summary statistics. |
| GET | `/api/progress/summary` | Authenticated | Returns completion statistics per topic and overall. Includes completion percentages. |
| POST | `/api/progress/:problemId/complete` | Authenticated | Marks a problem as completed. Creates record if not exists, updates if exists. Idempotent operation. |
| PUT | `/api/progress/:problemId` | Authenticated | Updates progress status to any valid value. |
| DELETE | `/api/progress/:problemId` | Authenticated | Resets progress to not_started status. |
| POST | `/api/progress/batch` | Authenticated | Batch updates progress for multiple problems (up to 50). Validates all problems exist before processing. |

**Progress Restoration Flow:**

1. User logs in via POST `/api/auth/login`
2. Server fetches all completed problem IDs for the user
3. Response includes `completedProblemIds` array
4. Frontend uses this array to restore checkbox states immediately
5. For subsequent refreshes, use GET `/api/auth/progress` for optimized ID-only response

---

## 5. Database Schema Overview

### Users Collection

**Purpose**: Stores user accounts with authentication credentials and role information.

**Key Fields**:
- Identity: name, email (unique), passwordHash
- Authorization: role (user/admin)
- Status: isActive, lastLoginAt
- Timestamps: createdAt, updatedAt

**Indexing Strategy**:
- Unique index on email for fast login lookups
- Index on role for admin queries
- Index on isActive for filtering active users
- Compound index on (isActive, role) for common queries

**Design Decision**: Password hash stored with `select: false` to exclude from default queries, preventing accidental exposure.

### Topics Collection

**Purpose**: Represents DSA chapters or categories that organize problems hierarchically.

**Key Fields**:
- Content: title, slug (unique, auto-generated), description
- Ordering: order (for display sequence)
- Status: isActive (soft delete flag)
- Audit: createdBy (reference to User)

**Indexing Strategy**:
- Unique index on slug for URL-based lookups
- Index on order for sorted retrieval
- Compound index on (isActive, order) for active topic listing

**Virtual Field**: `problems` - dynamically computes problem count without storing it.

**Design Decision**: Slug auto-generated from title using slugify library. Updates when title changes.

### Problems Collection

**Purpose**: Individual DSA questions/challenges belonging to topics.

**Key Fields**:
- Content: title, slug (unique, auto-generated)
- Classification: difficulty (Easy/Medium/Hard), tags array
- Resources: youtubeUrl, leetcodeUrl, articleUrl
- Organization: topicId (reference to Topic), order
- Status: isActive, createdBy

**Indexing Strategy**:
- Unique index on slug
- Index on topicId for topic-based queries
- Compound index on (topicId, order) for sorted problems within topic
- Index on difficulty for filtering
- Multikey index on tags for tag-based filtering
- Compound index on (topicId, isActive, order) for common active problem queries

**Design Decision**: Problems stored in separate collection (not embedded in Topic) because:
- Topics could have hundreds of problems
- Enables independent pagination and filtering
- Avoids document size growth
- Allows cross-topic problem queries

### UserProgress Collection

**Purpose**: Tracks which problems each user has completed. Junction table between Users and Problems.

**Key Fields**:
- References: userId, problemId
- Status: status (not_started/completed)
- Timestamps: completedAt, createdAt, updatedAt

**Indexing Strategy**:
- Compound unique index on (userId, problemId) - prevents duplicates
- Index on userId for user's progress queries
- Index on problemId for problem completion statistics
- Compound index on (userId, status) for completed problems query
- Index on completedAt for timeline queries

**Design Decision**: Separate collection instead of embedding in User because:
- User might complete 1000+ problems over time
- MongoDB 16MB document limit protection
- Enables efficient aggregation across users
- Allows independent scaling

### AdminLogs Collection

**Purpose**: Audit trail for administrative actions. Provides accountability and debugging capability.

**Key Fields**:
- Actor: adminId (reference to User)
- Action: actionType (enum of action types)
- Target: entityId, entityType
- Details: metadata (flexible object for action-specific data)
- Timestamp: timestamp

**Indexing Strategy**:
- Index on adminId for admin activity history
- Index on actionType for filtering by action
- Index on timestamp for chronological queries
- Compound index for filtering by entity

**Action Types Logged**:
- User management: promote, demote, activate, deactivate
- Content management: create/update/delete topics and problems

### Soft Delete Pattern

All content collections (Topics, Problems) implement soft delete:

- `isActive: true` means record is active and visible
- `isActive: false` means record is "deleted" but preserved
- All queries filter by `isActive: true` by default
- Only admins can view inactive records

**Benefits**:
- Data preservation for compliance
- Recovery capability
- Referential integrity maintained
- Historical accuracy for progress records

---

## 6. Security Design

### Password Security

- Passwords hashed using bcrypt with 12 salt rounds
- Plain passwords never stored or logged
- Password hash excluded from default queries via `select: false`
- Minimum password requirements enforced: 8 characters, uppercase, lowercase, number

### JWT Authentication

- Tokens signed with secret from environment variable
- Configurable expiration (default: 7 days)
- Payload contains only: userId, email, role
- No sensitive data in token
- Token verification on every protected request

### Role-Based Access Control

- Two roles: user and admin
- Role stored in database, not derived from token alone
- Fresh user lookup on each request verifies current role
- Admin middleware enforces role check server-side

### Middleware Security Stack

1. **Helmet**: Sets security headers (XSS protection, content type sniffing prevention)
2. **CORS**: Configured origin restrictions
3. **Auth Middleware**: Token verification, user attachment
4. **Admin Middleware**: Role verification
5. **Validation Middleware**: Input sanitization via Joi

### Input Validation

- All endpoints validate input using Joi schemas
- ObjectId format validation prevents injection
- URL format validation for resource links
- Enum validation for status fields
- Maximum length restrictions prevent DoS

### Protected Admin Routes

- Admin routes require both authentication AND admin role
- Middleware chain: `authMiddleware` → `adminMiddleware` → `controller`
- 401 returned for missing/invalid token
- 403 returned for non-admin users

### Why Frontend Hiding Is Not Security

The backend enforces all security rules because:
- Frontend code is visible and modifiable by users
- API calls can be made directly, bypassing frontend
- Role checks in frontend are UX conveniences, not security measures
- All authorization logic must exist server-side

---

## 7. Scalability Considerations

### Indexing Strategy

Every collection has indexes optimized for common query patterns:

- Single-field indexes for filtering operations
- Compound indexes for multi-field queries
- Unique indexes for constraint enforcement
- Multikey indexes for array fields (tags)

Indexes are designed based on actual query patterns, not theoretical needs.

### Collection Separation

Data is distributed across collections to prevent document bloat:

| Instead Of | We Use |
|------------|--------|
| Embedding problems in topics | Separate Problems collection with topicId reference |
| Embedding progress in users | Separate UserProgress collection |
| Storing computed counts | Virtual fields and aggregation |

### Document Size Management

- No unbounded arrays in documents
- Progress stored as individual records, not user arrays
- Tags limited to 10 per problem
- Descriptions have maximum length constraints

### Pagination Support

All list endpoints support pagination:

- `page`: Current page number (1-indexed)
- `limit`: Items per page (with maximum caps)
- Response includes pagination metadata: totalItems, totalPages, currentPage, hasNext, hasPrev

### Lean Queries

Read-heavy operations use `.lean()` where appropriate:

- Returns plain JavaScript objects instead of Mongoose documents
- Reduces memory usage and improves performance
- Used when document methods are not needed

### Query Optimization

- `Promise.all()` for parallel independent queries
- Projection to select only needed fields
- Aggregation pipelines for complex joins
- Avoiding N+1 query patterns

### Future-Ready Design

The schema supports future features without restructuring:

- **Streaks**: Can be computed from UserProgress.completedAt dates
- **Analytics**: AdminLog provides action history
- **Bookmarks**: New collection with userId/problemId pattern
- **Notes**: New collection following same patterns
- **Difficulty Ratings**: Can add user ratings collection

### Horizontal Scaling Potential

- Stateless JWT authentication enables multiple server instances
- MongoDB supports replica sets and sharding
- No server-side session storage required
- Environment-based configuration for different environments

---

## 8. Frontend Integration Guidelines

### Recommended Frontend Structure

```
src/
├── pages/
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Topics.tsx
│   ├── Problems.tsx
│   └── Admin/
│       ├── Dashboard.tsx
│       ├── ManageTopics.tsx
│       ├── ManageProblems.tsx
│       └── ManageUsers.tsx
├── components/
│   ├── common/
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── AdminRoute.tsx
│   ├── topics/
│   │   └── TopicCard.tsx
│   └── problems/
│       └── ProblemRow.tsx
├── context/
│   ├── AuthContext.tsx
│   └── ProgressContext.tsx
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── topicService.ts
│   ├── problemService.ts
│   └── progressService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProgress.ts
│   └── useAdmin.ts
├── routes/
│   └── AppRoutes.tsx
└── types/
    └── index.ts
```

### Authentication Context Handling

The AuthContext should manage:

- Current user state (null when logged out)
- Authentication status (loading, authenticated, unauthenticated)
- Login function that stores token and user
- Logout function that clears stored data
- Token refresh logic if implementing refresh tokens

### Storing JWT

**Recommended Approach**: localStorage with considerations

- Store token in localStorage for persistence across tabs
- Include token in Authorization header for all API requests
- Clear token on logout and on 401 responses
- Consider httpOnly cookies for enhanced security in production

### Protected Routes

Implement route protection at two levels:

1. **ProtectedRoute**: Requires authentication
   - Redirects to login if not authenticated
   - Shows loading state while checking auth

2. **AdminRoute**: Requires admin role
   - Extends ProtectedRoute logic
   - Checks user.role === 'admin'
   - Redirects non-admins to home or shows forbidden message

### Admin-Only Rendering

For UI elements (not routes):

- Check user role from context
- Conditionally render admin buttons/links
- Remember: this is UX convenience, not security
- Backend enforces actual permissions

### Optimistic Progress Updates

For responsive checkbox interactions:

1. User clicks checkbox
2. Immediately update local state (optimistic)
3. Send API request in background
4. If request fails, revert local state
5. Show error notification

This provides instant feedback while ensuring data consistency.

### Avoiding Tight Coupling

Best practices for frontend-backend separation:

- Use TypeScript interfaces matching API responses
- Create service layer abstracting API calls
- Handle errors consistently in service layer
- Don't spread backend response objects directly into components
- Map API responses to frontend-specific formats when needed

### Progress Restoration Flow

On application load:

1. Check for stored token
2. If token exists, validate by calling GET `/api/auth/me`
3. On successful login or token validation, store `completedProblemIds`
4. Initialize progress context with completed IDs as Set for O(1) lookup
5. Problem checkboxes check against this Set

For page refresh without re-login:

1. Call GET `/api/auth/progress` (lightweight endpoint)
2. Update progress context with response

---

## 9. Conclusion

This backend represents a production-ready foundation for a DSA learning platform, built with scalability, security, and maintainability as core principles.

### Architecture Highlights

- **Clean Layered Architecture**: Clear separation between routes, middleware, controllers, and models enables independent testing and modification of each layer.

- **Type-Safe Implementation**: Full TypeScript coverage catches errors at compile time and provides excellent developer experience with IDE support.

- **Scalable Data Design**: Separate collections with proper indexing handle growth from tens to tens of thousands of users and problems without restructuring.

- **Security-First Approach**: All authorization enforced server-side with JWT authentication, role-based access control, and comprehensive input validation.

- **Soft Delete Strategy**: Data preservation through active status flags maintains referential integrity and enables recovery.

- **Audit Trail**: Administrative action logging provides accountability and debugging capability.

### Production Readiness

The codebase is prepared for production deployment:

- Environment-based configuration
- Graceful error handling
- Comprehensive logging
- Health check endpoints
- Auto-initialization of admin user

### Growth Potential

The architecture supports future expansion:

- Additional roles (moderator, premium user)
- New features (streaks, bookmarks, notes, spaced repetition)
- Analytics and reporting
- Third-party integrations
- Mobile API support

This backend provides a solid foundation for building a comprehensive DSA learning platform that can scale with user growth and feature expansion.

---

*Documentation Version: 1.0*
*Last Updated: February 2025*
