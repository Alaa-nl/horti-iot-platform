import { Greenhouse } from '../types/greenhouse';
import apiService from './apiService';

// Service to manage greenhouse data - ALL DATA COMES FROM DATABASE
class GreenhouseService {
  private currentGreenhouse: Greenhouse | null = null;

  // Get all greenhouses - REQUIRES DATABASE
  async getAllGreenhouses(): Promise<Greenhouse[]> {
    const response = await apiService.get<{ greenhouses: Greenhouse[] }>('/greenhouses', false);
    if (response.success && response.data) {
      return response.data.greenhouses;
    }
    throw new Error('Failed to fetch greenhouses from database');
  }

  // Get greenhouse by ID - REQUIRES DATABASE
  async getGreenhouseById(id: string): Promise<Greenhouse | null> {
    const response = await apiService.get<{ greenhouse: Greenhouse }>(`/greenhouses/${id}`, false);
    if (response.success && response.data) {
      return response.data.greenhouse;
    }
    throw new Error(`Failed to fetch greenhouse ${id} from database`);
  }

  // Get sensor readings for greenhouse - REQUIRES DATABASE
  async getGreenhouseSensorReadings(id: string, hours: number = 24): Promise<any> {
    const response = await apiService.get<any>(`/greenhouses/${id}/readings?hours=${hours}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(`Failed to fetch sensor readings for greenhouse ${id}`);
  }

  // Get weather data for greenhouse - REQUIRES DATABASE
  async getGreenhouseWeather(id: string, days: number = 7): Promise<any> {
    const response = await apiService.get<any>(`/greenhouses/${id}/weather?days=${days}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(`Failed to fetch weather data for greenhouse ${id}`);
  }

  // Set current greenhouse
  setCurrentGreenhouse(greenhouse: Greenhouse | null): void {
    this.currentGreenhouse = greenhouse;
  }

  // Get current greenhouse
  getCurrentGreenhouse(): Greenhouse | null {
    return this.currentGreenhouse;
  }

  // Save greenhouse selection to localStorage
  saveGreenhouseSelection(id: string): void {
    localStorage.setItem('selectedGreenhouseId', id);
  }

  // Load saved greenhouse selection - REQUIRES DATABASE
  async loadSavedGreenhouse(): Promise<Greenhouse | null> {
    const savedId = localStorage.getItem('selectedGreenhouseId');
    if (savedId) {
      try {
        return await this.getGreenhouseById(savedId);
      } catch (error) {
        console.error('Failed to load saved greenhouse:', error);
        // If saved greenhouse fails, try to get first available
        const greenhouses = await this.getAllGreenhouses();
        return greenhouses[0] || null;
      }
    }
    // Default to first greenhouse from database
    const greenhouses = await this.getAllGreenhouses();
    return greenhouses[0] || null;
  }

  // Check if API is available
  async checkApiStatus(): Promise<boolean> {
    try {
      return await apiService.healthCheck();
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const greenhouseService = new GreenhouseService();