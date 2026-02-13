# Phase 1: Backend Foundation + Scalable Database Architecture (TypeScript)

## Overview

This document outlines the implementation plan for Phase 1 of the DSA Sheet application - a production-ready MERN stack backend built with **TypeScript** for type safety, better IDE support, and maintainability.

---

## 1. Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts                 # MongoDB connection with error handling
│   │   └── env.ts                # Type-safe environment configuration
│   ├── models/
│   │   ├── User.model.ts         # User schema with authentication methods
│   │   ├── Topic.model.ts        # Topic schema with slug generation
│   │   ├── Problem.model.ts      # Problem schema with references
│   │   ├── UserProgress.model.ts # Progress tracking schema
│   │   └── AdminLog.model.ts     # Audit logging schema
│   ├── routes/
│   │   ├── index.ts              # Route aggregator
│   │   ├── auth.routes.ts        # Authentication endpoints
│   │   ├── user.routes.ts        # User management endpoints
│   │   ├── topic.routes.ts       # Topic CRUD endpoints
│   │   ├── problem.routes.ts     # Problem CRUD endpoints
│   │   └── progress.routes.ts    # Progress tracking endpoints
│   ├── controllers/
│   │   ├── auth.controller.ts    # Authentication logic
│   │   ├── user.controller.ts    # User management logic
│   │   ├── topic.controller.ts   # Topic CRUD logic
│   │   ├── problem.controller.ts # Problem CRUD logic
│   │   └── progress.controller.ts# Progress tracking logic
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT verification middleware
│   │   ├── admin.middleware.ts   # Admin role authorization
│   │   ├── error.middleware.ts   # Global error handler
│   │   └── validate.middleware.ts# Request validation with Joi
│   ├── utils/
│   │   ├── ApiError.ts           # Custom error class with status codes
│   │   ├── ApiResponse.ts        # Standardized API response format
│   │   ├── asyncHandler.ts       # Async/await error wrapper
│   │   ├── logger.ts             # Logging utility
│   │   └── adminInit.ts          # Admin user initialization
│   ├── types/
│   │   ├── index.ts              # Type exports
│   │   ├── express.d.ts          # Express type extensions
│   │   └── models.types.ts       # Model interface definitions
│   ├── validators/
│   │   ├── auth.validator.ts     # Auth validation schemas
│   │   ├── topic.validator.ts    # Topic validation schemas
│   │   ├── problem.validator.ts  # Problem validation schemas
│   │   └── progress.validator.ts # Progress validation schemas
│   └── server.ts                 # Application entry point
├── .env.example                  # Environment template
├── .gitignore
├── package.json
├── tsconfig.json                 # TypeScript configuration
└── nodemon.json                  # Nodemon config for development
```

---

## 2. Why TypeScript?

| Benefit | Description |
|---------|-------------|
| **Type Safety** | Catch errors at compile time, not runtime |
| **Better IDE Support** | Autocomplete, refactoring, go-to-definition |
| **Self-Documenting** | Types serve as documentation |
| **Easier Refactoring** | Compiler catches breaking changes |
| **Interface Contracts** | Clear API contracts between modules |

---

## 3. Database Schema Design

### 3.1 Users Collection

| Field | Type | Constraints |
|-------|------|-------------|
| name | string | Required, 2-100 chars |
| email | string | Required, unique, indexed |
| passwordHash | string | Required, excluded from queries |
| role | 'user' \| 'admin' | Default: 'user' |
| isActive | boolean | Default: true |
| lastLoginAt | Date | Optional |
| timestamps | auto | createdAt, updatedAt |

### 3.2 Topics Collection

| Field | Type | Constraints |
|-------|------|-------------|
| title | string | Required, 3-200 chars |
| slug | string | Unique, auto-generated |
| description | string | Optional, max 1000 chars |
| order | number | Required, indexed |
| isActive | boolean | Default: true |
| createdBy | ObjectId | Reference to User |
| timestamps | auto | createdAt, updatedAt |

### 3.3 Problems Collection

| Field | Type | Constraints |
|-------|------|-------------|
| title | string | Required, 3-300 chars |
| slug | string | Unique, auto-generated |
| topicId | ObjectId | Required, indexed |
| difficulty | 'Easy' \| 'Medium' \| 'Hard' | Required, indexed |
| youtubeUrl | string | Optional, URL format |
| leetcodeUrl | string | Optional, URL format |
| articleUrl | string | Optional, URL format |
| tags | string[] | Array, indexed |
| order | number | Required |
| isActive | boolean | Default: true |
| createdBy | ObjectId | Reference to User |
| timestamps | auto | createdAt, updatedAt |

### 3.4 UserProgress Collection

| Field | Type | Constraints |
|-------|------|-------------|
| userId | ObjectId | Required, indexed |
| problemId | ObjectId | Required, indexed |
| status | 'not_started' \| 'completed' | Default: 'not_started' |
| completedAt | Date | Optional |
| timestamps | auto | createdAt, updatedAt |

**Compound Index:** (userId, problemId) - unique

### 3.5 AdminLogs Collection

| Field | Type | Constraints |
|-------|------|-------------|
| adminId | ObjectId | Required, indexed |
| actionType | ActionType enum | Required |
| entityId | ObjectId | Optional |
| entityType | 'problem' \| 'topic' \| 'user' | Optional |
| metadata | object | Additional details |
| timestamp | Date | Default: now, indexed |

---

## 4. Implementation Checklist

- [x] Create TypeScript project structure
- [x] Configure TypeScript compiler
- [x] Set up environment configuration
- [x] Create MongoDB connection module
- [x] Implement all Mongoose models with types
- [x] Create authentication middleware
- [x] Create admin authorization middleware
- [x] Create error handling middleware
- [x] Create validation middleware
- [x] Set up utility classes
- [x] Implement admin initialization
- [x] Create route structure
- [x] Create controller structure

---

## 5. Commands

```bash
# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck
```

---

*Phase 1 TypeScript Implementation*
