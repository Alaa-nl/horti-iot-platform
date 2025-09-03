import api from './api';
import { ClimateData, SensorData, MLPrediction, CameraImage } from '../types';

const ML_SERVICE_URL = process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:8000';

export const researcherService = {
  // Climate data endpoints
  async getClimateData(params?: {
    startDate?: string;
    endDate?: string;
    interval?: string;
  }): Promise<ClimateData[]> {
    const response = await api.get<ClimateData[]>('/climate/data', { params });
    return response.data;
  },

  async getCurrentClimate(): Promise<ClimateData> {
    const response = await api.get<ClimateData>('/climate/current');
    return response.data;
  },

  // Sensor data endpoints
  async getSensorData(sensorId?: string): Promise<SensorData[]> {
    const response = await api.get<SensorData[]>('/sensors/data', {
      params: { sensorId }
    });
    return response.data;
  },

  async getSensorList(): Promise<any[]> {
    const response = await api.get('/sensors/list');
    return response.data;
  },

  // ML predictions
  async runMLPrediction(data: {
    temperature: number;
    humidity: number;
    co2: number;
    light: number;
  }): Promise<MLPrediction> {
    const response = await api.post<MLPrediction>(`${ML_SERVICE_URL}/predict`, data);
    return response.data;
  },

  async getMLHistory(): Promise<MLPrediction[]> {
    const response = await api.get<MLPrediction[]>('/ml/history');
    return response.data;
  },

  // Camera images
  async getCameraImages(params?: {
    date?: string;
    limit?: number;
  }): Promise<CameraImage[]> {
    const response = await api.get<CameraImage[]>('/camera/images', { params });
    return response.data;
  },

  async uploadCameraImage(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('image', file);
    await api.post('/camera/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};