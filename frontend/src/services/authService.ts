import api from '../api/axios';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '../types/auth.types';

// Backend wraps response in data field: { success, message, data: {...} }
interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiSuccessResponse<AuthResponse>>('/auth/login', credentials);
    // Extract data from wrapped response
    return response.data.data;
  },

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiSuccessResponse<{ user: User; token: string }>>('/auth/register', data);
    // Extract data from wrapped response
    // Register doesn't return completedProblemIds, so add empty array
    return {
      ...response.data.data,
      completedProblemIds: [],
    };
  },

  // Get current authenticated user
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiSuccessResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  },

  // Get completed problem IDs (for progress restoration)
  async getProgress(): Promise<string[]> {
    const response = await api.get<ApiSuccessResponse<{ completedProblemIds: string[] }>>('/auth/progress');
    return response.data.data.completedProblemIds;
  },

  // Logout user (client-side notification to backend)
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors - token is cleared client-side anyway
    }
  },
};
