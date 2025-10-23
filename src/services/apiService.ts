// API Service for HORTI-IOT Platform
// Handles all communication with the backend API

import { logger } from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authentication token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Set authentication token
  public setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  // Clear authentication token
  public clearAuthToken(): void {
    localStorage.removeItem('auth_token');
  }

  // Create headers for requests
  private createHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method with timeout
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true,
    timeoutMs: number = 30000 // 30 seconds default timeout
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      headers: this.createHeaders(includeAuth),
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 || data.message?.includes('expired') || data.message?.includes('Token has expired')) {
          logger.warn('Token expired, clearing auth and redirecting to login');
          this.clearAuthToken();
          localStorage.removeItem('user_data');

          // Redirect to login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }

          throw new Error('Your session has expired. Please login again.');
        }

        // Include validation errors if present
        const errorMessage = data.errors
          ? `${data.message}: ${data.errors.map((e: any) => e.message).join(', ')}`
          : data.message || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).details = data.errors; // Attach errors for detailed handling
        throw error;
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('API request timeout:', endpoint);
        throw new Error('Request timeout. Please try again.');
      }

      logger.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  public async get<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  // POST request
  public async post<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  // PUT request
  public async put<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  // PATCH request
  public async patch<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  // DELETE request
  public async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }

  // POST FormData request (for file uploads)
  public async postFormData<T>(
    endpoint: string,
    formData: FormData,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {};
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      method: 'POST',
      headers,
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      logger.error('FormData API request failed:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token;
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;