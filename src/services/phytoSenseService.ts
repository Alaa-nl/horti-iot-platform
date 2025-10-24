// PhytoSense (2grow) API Service
// Handles all communication with backend API for PhytoSense plant monitoring data

import { logger } from '../utils/logger';

// Backend API Configuration
const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
};

// Device configurations from the provided data
export interface DeviceConfig {
  setupId: number;
  name: string;
  fromDate: string;
  toDate: string | null;
  diameterTDID: number;
  diameterChannelId: number;
  sapFlowTDID: number;
  sapFlowChannelId: number;
  cropType?: string;
}

// Device configurations - now fetched from backend API instead of hardcoded

// Data types
export interface PhytoSenseDataPoint {
  dateTime: Date;
  value: number;
}

export interface PhytoSenseResponse {
  success: boolean;
  aggregation: string;
  dataPoints: number;
  data: PhytoSenseDataPoint[];
  metadata?: {
    setupId: number;
    tdid: number;
    channel: number;
    dateRange: {
      from: string;
      till: string;
    };
  };
}

export interface DateRange {
  after?: string;
  before?: string;
  from?: string;
  till?: string;
}

class PhytoSenseService {
  private devicesCache: DeviceConfig[] | null = null;

  /**
   * Get JWT token from local storage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Build the API URL with query parameters
   */
  private buildUrl(
    dtid: number,
    setupId: number,
    channelId: number,
    dateRange?: DateRange,
    aggregation?: string
  ): string {
    const apiUrl = `${API_CONFIG.baseUrl}/phytosense/data/${dtid}`;

    const params = new URLSearchParams({
      setup_id: setupId.toString(),
      channel: channelId.toString(),
    });

    // Add date range parameters if provided
    if (dateRange) {
      if (dateRange.after) params.append('after', dateRange.after);
      if (dateRange.before) params.append('before', dateRange.before);
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.till) params.append('till', dateRange.till);
    }

    // Add aggregation mode if provided
    if (aggregation) {
      params.append('aggregation', aggregation);
    }

    return `${apiUrl}?${params.toString()}`;
  }

  /**
   * Fetch data for a specific measurement type
   */
  public async fetchData(
    dtid: number,
    setupId: number,
    channelId: number,
    dateRange?: DateRange,
    aggregation?: string
  ): Promise<PhytoSenseResponse> {
    const url = this.buildUrl(dtid, setupId, channelId, dateRange, aggregation);
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    try {
      logger.info('Fetching PhytoSense data from backend:', { url, dateRange, aggregation });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 429) {
        const data = await response.json();
        throw new Error(data.message || 'Rate limit exceeded. Please try again later.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: PhytoSenseResponse = await response.json();

      logger.info('PhytoSense data fetched successfully:', {
        dataPoints: data.dataPoints,
        aggregation: data.aggregation
      });

      return data;
    } catch (error) {
      logger.error('Error fetching PhytoSense data:', error);
      throw error;
    }
  }

  /**
   * Fetch diameter data for a device
   */
  public async fetchDiameterData(
    device: DeviceConfig,
    dateRange?: DateRange
  ): Promise<PhytoSenseResponse> {
    return this.fetchData(
      device.diameterTDID,
      device.setupId,
      device.diameterChannelId,
      dateRange
    );
  }

  /**
   * Fetch sap flow data for a device
   */
  public async fetchSapFlowData(
    device: DeviceConfig,
    dateRange?: DateRange
  ): Promise<PhytoSenseResponse> {
    return this.fetchData(
      device.sapFlowTDID,
      device.setupId,
      device.sapFlowChannelId,
      dateRange
    );
  }

  /**
   * Fetch devices from backend API
   */
  public async fetchDevices(): Promise<DeviceConfig[]> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/phytosense/devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status}`);
      }

      const result = await response.json();
      this.devicesCache = result.data;
      return result.data;
    } catch (error) {
      logger.error('Error fetching devices:', error);
      throw error;
    }
  }

  /**
   * Get active devices (those with current or recent data)
   */
  public async getActiveDevices(): Promise<DeviceConfig[]> {
    const devices = this.devicesCache || await this.fetchDevices();
    const now = new Date();
    return devices.filter(device => {
      if (!device.toDate) return true; // No end date means currently active
      const endDate = new Date(device.toDate);
      // Consider devices active if they ended within the last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return endDate > thirtyDaysAgo;
    });
  }

  /**
   * Get all available devices
   */
  public async getAllDevices(): Promise<DeviceConfig[]> {
    return this.devicesCache || await this.fetchDevices();
  }

  /**
   * Format date for API (ISO format)
   */
  public formatDateForAPI(date: Date): string {
    return date.toISOString();
  }

  /**
   * Create date range for last N days
   */
  public getLastNDaysRange(days: number): DateRange {
    const now = new Date();
    const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      after: this.formatDateForAPI(pastDate),
      before: this.formatDateForAPI(now)
    };
  }

  /**
   * Create date range between two dates
   */
  public getDateRange(startDate: Date, endDate: Date): DateRange {
    return {
      from: this.formatDateForAPI(startDate),
      till: this.formatDateForAPI(endDate)
    };
  }
}

// Export singleton instance
export const phytoSenseService = new PhytoSenseService();
export default phytoSenseService;