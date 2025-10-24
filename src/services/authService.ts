import apiService, { ApiResponse } from './apiService';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'grower' | 'farmer';
  is_active: boolean;
  profile_photo?: string;
  bio?: string;
  phone_number?: string;
  department?: string;
  location?: string;
  created_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'researcher' | 'grower' | 'farmer';
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_in: string;
}

class AuthService {

  // Login user
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Ensure we only send email and password (remove any extra fields)
      const loginData = {
        email: credentials.email,
        password: credentials.password
      };
      const response = await apiService.post<AuthResponse>('/auth/login', loginData, false);

      if (response.success && response.data) {
        // Store token
        apiService.setAuthToken(response.data.token);

        // Store user data
        localStorage.setItem('user_data', JSON.stringify(response.data.user));

        return response.data;
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  public async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register', userData, false);

      if (response.success && response.data) {
        // Store token
        apiService.setAuthToken(response.data.token);

        // Store user data
        localStorage.setItem('user_data', JSON.stringify(response.data.user));

        return response.data;
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Get current user
  public async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<{ user: User }>('/auth/me');

      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        return response.data.user;
      }

      throw new Error(response.message || 'Failed to get user data');
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  // Verify token
  public async verifyToken(): Promise<boolean> {
    try {
      const response = await apiService.get<{ user: User }>('/auth/verify');
      return response.success;
    } catch (error) {
      logger.error('Token verification error:', error);
      return false;
    }
  }

  // Logout user
  public async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiService.post('/auth/logout');
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API success
      this.clearLocalStorage();
    }
  }

  // Get stored user data
  public getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      logger.error('Error parsing stored user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return apiService.isAuthenticated() && !!this.getStoredUser();
  }

  // Check if user has specific role
  public hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  }

  // Check if user is admin
  public isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is researcher
  public isResearcher(): boolean {
    return this.hasRole('researcher');
  }

  // Check if user is grower
  public isGrower(): boolean {
    return this.hasRole('grower');
  }

  // Check if user is farmer
  public isFarmer(): boolean {
    return this.hasRole('farmer');
  }

  // Clear local storage
  private clearLocalStorage(): void {
    apiService.clearAuthToken();
    localStorage.removeItem('user_data');
  }

  // Initialize auth service (check token validity)
  public async initialize(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      // Verify token is still valid
      const isValid = await this.verifyToken();
      if (!isValid) {
        this.clearLocalStorage();
        return null;
      }

      // Get fresh user data
      return await this.getCurrentUser();
    } catch (error) {
      logger.error('Auth initialization error:', error);
      this.clearLocalStorage();
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;