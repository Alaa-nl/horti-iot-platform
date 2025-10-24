import apiService, { ApiResponse } from './apiService';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'researcher' | 'grower' | 'farmer';
  phone_number?: string;
  department?: string;
  location?: string;
}

export interface UserListResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  phone_number?: string;
  department?: string;
  location?: string;
  created_at: string;
  last_login?: string;
}

export interface GreenhouseAccess {
  user_id: string;
  greenhouse_id: string;
  permission_type: 'view' | 'edit' | 'manage';
  action: 'grant' | 'revoke';
}

class AdminService {

  public async createUser(userData: CreateUserData): Promise<ApiResponse<UserListResponse>> {
    try {
      return await apiService.post<UserListResponse>('/admin/users', userData);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  public async getUsers(filters?: { role?: string; is_active?: boolean }): Promise<ApiResponse<{ users: UserListResponse[] }>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.role) queryParams.append('role', filters.role);
      if (filters?.is_active !== undefined) queryParams.append('is_active', String(filters.is_active));

      const url = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiService.get<{ users: UserListResponse[] }>(url);
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  public async resetUserPassword(userId: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.post('/admin/users/reset-password', {
        user_id: userId,
        new_password: newPassword
      });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  public async toggleUserStatus(userId: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.patch(`/admin/users/${userId}/toggle-status`);
    } catch (error) {
      console.error('Toggle user status error:', error);
      throw error;
    }
  }

  public async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  public async manageGreenhouseAccess(accessData: GreenhouseAccess): Promise<ApiResponse<void>> {
    try {
      return await apiService.post('/admin/greenhouse-access', accessData);
    } catch (error) {
      console.error('Manage greenhouse access error:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;