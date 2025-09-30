import apiService, { ApiResponse } from './apiService';
import { User } from './authService';

export interface UpdateProfileData {
  name?: string;
  phone_number?: string;
  department?: string;
  location?: string;
  bio?: string;
}

class ProfileService {

  public async getProfile(): Promise<ApiResponse<{ user: User }>> {
    try {
      return await apiService.get<{ user: User }>('/profile/me');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  public async updateProfile(profileData: UpdateProfileData): Promise<ApiResponse<{ user: User }>> {
    try {
      return await apiService.patch<{ user: User }>('/profile/me', profileData);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  public async uploadProfilePhoto(file: File): Promise<ApiResponse<{ user: User }>> {
    try {
      const formData = new FormData();
      formData.append('profile_photo', file);

      return await apiService.postFormData<{ user: User }>('/profile/me/photo', formData);
    } catch (error) {
      console.error('Upload profile photo error:', error);
      throw error;
    }
  }

  public async removeProfilePhoto(): Promise<ApiResponse<{ user: User }>> {
    try {
      return await apiService.delete<{ user: User }>('/profile/me/photo');
    } catch (error) {
      console.error('Remove profile photo error:', error);
      throw error;
    }
  }

  public async getOtherUserProfile(userId: string): Promise<ApiResponse<{ user: User }>> {
    try {
      return await apiService.get<{ user: User }>(`/profile/${userId}`);
    } catch (error) {
      console.error('Get other user profile error:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
export default profileService;