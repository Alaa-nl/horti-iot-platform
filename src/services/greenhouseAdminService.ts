import apiService, { ApiResponse } from './apiService';

export interface GreenhouseFormData {
  name: string;
  location: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  area_m2?: number;
  crop_type?: string;
  variety?: string;
  rootstock?: string;
  planting_date?: string;
  supplier?: string;
  substrate_info?: string;
  climate_system?: string;
  lighting_system?: string;
  growing_system?: string;
  co2_target_ppm?: number;
  temperature_range_c?: string;
  configuration?: any;
}

export interface GreenhouseListItem {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    region: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  details: {
    landArea: number;
    type: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  crops: {
    type: string;
    variety: string;
    plantingDate: Date | null;
    supplier: string;
  }[];
  equipment: {
    climate: {
      name: string;
      type: string;
      status: string;
    };
    lighting: {
      name: string;
      type: string;
      status: string;
    };
  };
  performance: {
    previousYield: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface GreenhouseFilters {
  search?: string;
  city?: string;
  crop_type?: string;
  sortBy?: 'name' | 'created_at' | 'area_m2';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class GreenhouseAdminService {
  async getAllGreenhouses(filters?: GreenhouseFilters): Promise<ApiResponse<{ greenhouses: GreenhouseListItem[], count: number }>> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.city) params.append('city', filters.city);
      if (filters?.crop_type) params.append('crop_type', filters.crop_type);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = `/greenhouses${queryString ? `?${queryString}` : ''}`;

      return await apiService.get<{ greenhouses: GreenhouseListItem[], count: number }>(url);
    } catch (error: any) {
      console.error('Get greenhouses error:', error);
      throw error;
    }
  }

  async getGreenhouseById(id: string): Promise<ApiResponse<{ greenhouse: GreenhouseListItem }>> {
    try {
      return await apiService.get<{ greenhouse: GreenhouseListItem }>(`/greenhouses/${id}`);
    } catch (error: any) {
      console.error('Get greenhouse error:', error);
      throw error;
    }
  }

  async createGreenhouse(data: GreenhouseFormData): Promise<ApiResponse<{ greenhouse: GreenhouseListItem }>> {
    try {
      return await apiService.post<{ greenhouse: GreenhouseListItem }>('/greenhouses', data);
    } catch (error: any) {
      console.error('Create greenhouse error:', error);
      throw error;
    }
  }

  async updateGreenhouse(id: string, data: Partial<GreenhouseFormData>): Promise<ApiResponse<{ greenhouse: GreenhouseListItem }>> {
    try {
      return await apiService.put<{ greenhouse: GreenhouseListItem }>(`/greenhouses/${id}`, data);
    } catch (error: any) {
      console.error('Update greenhouse error:', error);
      throw error;
    }
  }

  async deleteGreenhouse(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<void>(`/greenhouses/${id}`);
    } catch (error: any) {
      console.error('Delete greenhouse error:', error);
      throw error;
    }
  }
}

const greenhouseAdminService = new GreenhouseAdminService();
export default greenhouseAdminService;
