/**
 * Utility functions for error handling
 */

/**
 * Extract error message from API error response
 * Backend format: { success: false, message: "...", errors: [...] }
 */
export const extractErrorMessage = (err: any, defaultMessage = 'An error occurred'): string => {
  if (!err) return defaultMessage;
  
  // Handle specific error types
  if (err.message === 'Network Error') {
    return 'Network error: Cannot connect to server. Please try again.';
  }
  
  // Extract from API response
  if (err.response?.data?.message) {
    let message = err.response.data.message;
    if (err.response.data.errors?.length > 0) {
      message += ': ' + err.response.data.errors.join(', ');
    }
    return message;
  }
  
  if (err.response?.data?.errors?.length > 0) {
    return err.response.data.errors.join(', ');
  }
  
  if (err.message) {
    return err.message;
  }
  
  return defaultMessage;
};

/**
 * Log error only in development mode
 * Note: Vite uses import.meta.env instead of process.env
 */
export const logError = (context: string, err: any): void => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, err);
  }
};
