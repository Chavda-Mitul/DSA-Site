/**
 * ===========================================
 * LOGGING UTILITY
 * ===========================================
 *
 * This module provides a simple logging utility with different log levels.
 * In a production application, you might want to replace this with a more
 * robust solution like Winston or Pino.
 *
 * LOG LEVELS:
 * - info: General information (blue)
 * - success: Successful operations (green)
 * - warn: Warnings (yellow)
 * - error: Errors (red)
 * - debug: Debug information (magenta) - only in development
 *
 * USAGE:
 * ```typescript
 * import logger from './utils/logger';
 *
 * logger.info('Server started');
 * logger.success('User created successfully');
 * logger.warn('Deprecated endpoint used');
 * logger.error('Database connection failed');
 * logger.debug('Variable value:', someVar);
 * ```
 */

import env from '../config/env';

/**
 * ANSI color codes for terminal output
 * These codes change the text color in the terminal
 */
const colors = {
  reset: '\x1b[0m',      // Reset to default
  red: '\x1b[31m',       // Error messages
  green: '\x1b[32m',     // Success messages
  yellow: '\x1b[33m',    // Warning messages
  blue: '\x1b[34m',      // Info messages
  magenta: '\x1b[35m',   // Debug messages
  cyan: '\x1b[36m',      // Timestamps
  gray: '\x1b[90m',      // Dim text
} as const;

/**
 * Format timestamp for log messages
 * Format: HH:MM:SS
 */
const getTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format the log prefix with timestamp and level
 */
const formatPrefix = (level: string, color: string): string => {
  const timestamp = getTimestamp();
  return `${colors.gray}[${timestamp}]${colors.reset} ${color}[${level}]${colors.reset}`;
};

/**
 * Logger object with methods for different log levels
 */
const logger = {
  /**
   * Log informational messages
   * Use for general application events
   *
   * @example
   * logger.info('Server starting on port', 5000);
   */
  info: (...args: unknown[]): void => {
    const prefix = formatPrefix('INFO', colors.blue);
    console.log(prefix, ...args);
  },

  /**
   * Log success messages
   * Use for successful operations
   *
   * @example
   * logger.success('Database connected successfully');
   */
  success: (...args: unknown[]): void => {
    const prefix = formatPrefix('SUCCESS', colors.green);
    console.log(prefix, ...args);
  },

  /**
   * Log warning messages
   * Use for non-critical issues that should be addressed
   *
   * @example
   * logger.warn('API rate limit approaching');
   */
  warn: (...args: unknown[]): void => {
    const prefix = formatPrefix('WARN', colors.yellow);
    console.warn(prefix, ...args);
  },

  /**
   * Log error messages
   * Use for errors that need attention
   *
   * @example
   * logger.error('Failed to create user:', error.message);
   */
  error: (...args: unknown[]): void => {
    const prefix = formatPrefix('ERROR', colors.red);
    console.error(prefix, ...args);
  },

  /**
   * Log debug messages (only in development)
   * Use for detailed debugging information
   *
   * @example
   * logger.debug('Request body:', req.body);
   */
  debug: (...args: unknown[]): void => {
    // Only log debug messages in development
    if (env.isDevelopment) {
      const prefix = formatPrefix('DEBUG', colors.magenta);
      console.log(prefix, ...args);
    }
  },

  /**
   * Log HTTP request information
   * Used by custom request logging middleware
   *
   * @example
   * logger.http('GET', '/api/users', 200, '45ms');
   */
  http: (method: string, url: string, status: number, duration: string): void => {
    const statusColor = status >= 400 ? colors.red : status >= 300 ? colors.yellow : colors.green;
    const prefix = formatPrefix('HTTP', colors.cyan);
    console.log(
      prefix,
      `${colors.blue}${method}${colors.reset}`,
      url,
      `${statusColor}${status}${colors.reset}`,
      `${colors.gray}${duration}${colors.reset}`
    );
  },
};

export default logger;
