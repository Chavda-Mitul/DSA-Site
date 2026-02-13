// User interface matching backend response
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth response from login/register endpoints
export interface AuthResponse {
  user: User;
  token: string;
  completedProblemIds: string[];
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Register data
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Auth context state
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initializing: boolean;
  completedProblemIds: string[];
}

// Auth context methods
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

// API Error response
export interface ApiError {
  message: string;
  statusCode: number;
}
