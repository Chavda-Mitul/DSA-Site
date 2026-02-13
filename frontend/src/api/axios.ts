import axios, { type AxiosError } from 'axios';

// Extend Window interface for custom property
declare global {
  interface Window {
    sessionExpiredDispatched?: boolean;
  }
}

const TOKEN_KEY = 'token';

// Session expired handling - robust implementation
let isSessionExpired = false;
let isProcessingLogout = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    // Reset session expired flag on successful requests (except auth endpoints)
    const isAuthEndpoint = config.url?.includes('/auth/');
    if (!isAuthEndpoint && isSessionExpired && !isProcessingLogout) {
      isSessionExpired = false;
    }
    
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // Ignore if already processing logout or session already expired
    if (isProcessingLogout || isSessionExpired) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = error.config?.url || '';
    
    // Don't trigger session expired for auth endpoints (login/register/logout)
    const isAuthEndpoint = url.includes('/auth/login') || 
                           url.includes('/auth/register') || 
                           url.includes('/auth/logout');
    
    if (status === 401 && !isAuthEndpoint) {
      // Set processing flag to prevent race conditions
      isProcessingLogout = true;
      isSessionExpired = true;
      
      // Clear token immediately
      localStorage.removeItem(TOKEN_KEY);
      
      // Dispatch custom event with debounce protection
      if (!window.sessionExpiredDispatched) {
        window.sessionExpiredDispatched = true;
        
        window.dispatchEvent(
          new CustomEvent('auth:sessionExpired', {
            detail: { message: 'Session expired. Please login again.' },
          })
        );
        
        // Reset dispatch flag after a delay
        setTimeout(() => {
          window.sessionExpiredDispatched = false;
        }, 1000);
      }
      
      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingLogout = false;
      }, 500);
    }
    
    return Promise.reject(error);
  }
);

// Export function to manually reset session state (for logout)
export const resetSessionState = () => {
  isSessionExpired = false;
  isProcessingLogout = false;
  window.sessionExpiredDispatched = false;
};

export default api;
