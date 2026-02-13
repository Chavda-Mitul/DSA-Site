import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthContextType, AuthState, LoginCredentials, RegisterData } from '../types/auth.types';
import { authService } from '../services/authService';
import { resetSessionState } from '../api/axios';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  initializing: true,
  completedProblemIds: [],
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  // Handle session expired event from axios interceptor
  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.warn('Session expired:', customEvent.detail?.message);
      
      // Clear auth state
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        initializing: false,
        completedProblemIds: [],
      });
      
      // Reset session state in axios
      resetSessionState();
      
      // Navigate to login
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('auth:sessionExpired', handleSessionExpired);
    };
  }, [navigate]);

  // Initialize auth on app load - check for stored token
  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setState((prev) => ({ ...prev, initializing: false }));
      return;
    }

    try {
      // Fetch user and progress in parallel for better performance
      const [user, completedProblemIds] = await Promise.all([
        authService.getCurrentUser(),
        authService.getProgress(),
      ]);

      setState({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        initializing: false,
        completedProblemIds,
      });
    } catch {
      // Token is invalid - clear it
      localStorage.removeItem('token');
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        initializing: false,
        completedProblemIds: [],
      });
    }
  }, []);

  // Login user
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      
      const response = await authService.login(credentials);
      
      // Store token
      localStorage.setItem('token', response.token);
      
      // Reset session state after successful login
      resetSessionState();
      
      // Update state
      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        loading: false,
        initializing: false,
        completedProblemIds: response.completedProblemIds,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  // Register user
  const register = useCallback(async (data: RegisterData) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      
      const response = await authService.register(data);
      
      // Store token
      localStorage.setItem('token', response.token);
      
      // Reset session state after successful registration
      resetSessionState();
      
      // Update state
      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        loading: false,
        initializing: false,
        completedProblemIds: response.completedProblemIds,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    }
    
    // Clear token
    localStorage.removeItem('token');
    
    // Reset session state
    resetSessionState();
    
    // Reset state
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      initializing: false,
      completedProblemIds: [],
    });
    
    // Navigate to login
    navigate('/login', { replace: true });
  }, [navigate]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
