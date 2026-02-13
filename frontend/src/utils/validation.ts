/**
 * Password validation utility
 * Matches backend validation requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */

export const validatePassword = (pass: string): string | null => {
  if (pass.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(pass)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(pass)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(pass)) {
    return 'Password must contain at least one number';
  }
  return null;
};

/**
 * Email validation utility
 * Basic email format validation
 */
export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'Email is required';
  }
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return 'Please provide a valid email address';
  }
  return null;
};

/**
 * Name validation utility
 */
export const validateName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long';
  }
  return null;
};
