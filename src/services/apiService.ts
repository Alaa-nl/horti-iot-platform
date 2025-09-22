// API Service for HORTI-IOT Platform
// Handles all communication with the backend API

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: this.createHeaders(includeAuth),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
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

  // DELETE request
  public async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
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
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;