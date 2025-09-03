// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
  role: 'researcher' | 'grower';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'researcher' | 'grower';
  createdAt: string;
  lastLogin: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Researcher types
export interface ClimateData {
  id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
  light: number;
  vpd?: number;
  dewPoint?: number;
}

export interface SensorData {
  id: string;
  sensorId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'active' | 'inactive' | 'error';
}

export interface MLPrediction {
  id: string;
  timestamp: string;
  inputData: {
    temperature: number;
    humidity: number;
    co2: number;
    light: number;
  };
  predictions: {
    optimalWatering: number;
    diseaseRisk: number;
    growthRate: number;
    harvestTime: string;
  };
  recommendations: string[];
  confidence: number;
}

export interface CameraImage {
  id: string;
  url: string;
  timestamp: string;
  metadata: {
    location: string;
    cameraId: string;
    resolution: string;
  };
  analysis?: {
    plantHealth: number;
    pestDetected: boolean;
    growthStage: string;
  };
}

// Grower types
export interface FinancialData {
  totalInvestment: number;
  monthlyRevenue: number;
  operatingCosts: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  costs: number;
  profit: number;
  cropType?: string;
}

export interface ROIData {
  currentROI: number;
  projectedROI: number;
  breakEvenPoint: string;
  paybackPeriod: number;
  irr: number;
  npv: number;
}

export interface InvestmentData {
  id: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  expectedReturn: number;
  actualReturn?: number;
  status: 'active' | 'completed' | 'cancelled';
}

// Common types
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// WebSocket event types for real-time updates
export interface WSEvent {
  type: 'climate_update' | 'sensor_update' | 'alert' | 'ml_result';
  data: any;
  timestamp: string;
}