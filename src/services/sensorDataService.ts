// Sensor Data Service - Frontend service for fetching sensor data from database
// This service fetches raw sensor data stored in the database
// No aggregation - always returns exact sensor readings at 5-minute intervals

import { logger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface SensorDataPoint {
  timestamp: string;
  sensorCode: string;
  sapFlow: number | null;
  diameter: number | null;
  dataQuality: string;
  plantId?: string;
  greenhouseId?: string;
}

export interface SensorStatistics {
  sensorCode: string;
  totalMeasurements: number;
  sapFlow: {
    average: number | null;
    minimum: number | null;
    maximum: number | null;
  };
  diameter: {
    average: number | null;
    minimum: number | null;
    maximum: number | null;
  };
  dateRange: {
    first: string;
    last: string;
  };
}

export interface SyncStatus {
  sensors: Array<{
    sensor_code: string;
    total_records: number;
    earliest_data: string;
    latest_data: string;
    is_live: boolean;
  }>;
  isSyncing: boolean;
  lastCheck: string;
}

class SensorDataService {
  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    // Try both possible token keys
    return localStorage.getItem('token') || localStorage.getItem('auth_token');
  }

  /**
   * Fetch raw sensor data from database
   * @param sensorCode - Optional filter by sensor code
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @param limit - Maximum number of records (default 10000)
   */
  public async fetchSensorData(
    sensorCode?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 10000
  ): Promise<SensorDataPoint[]> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const params = new URLSearchParams();
    if (sensorCode) params.append('sensorCode', sensorCode);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    params.append('limit', limit.toString());

    try {
      logger.info('Fetching sensor data from database', {
        sensorCode,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        limit
      });

      const response = await fetch(`${API_URL}/sensors/data?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      logger.info(`Fetched ${result.data.length} sensor data points (raw data)`);

      return result.data;
    } catch (error) {
      logger.error('Failed to fetch sensor data:', error);
      throw error;
    }
  }

  /**
   * Get latest readings for all sensors
   */
  public async fetchLatestReadings(): Promise<SensorDataPoint[]> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    try {
      logger.info('Fetching latest sensor readings');

      const response = await fetch(`${API_URL}/sensors/latest`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      logger.info(`Fetched latest readings for ${result.data.length} sensors`);

      return result.data;
    } catch (error) {
      logger.error('Failed to fetch latest readings:', error);
      throw error;
    }
  }

  /**
   * Get sync status for all sensors
   */
  public async getSyncStatus(): Promise<SyncStatus> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    try {
      const response = await fetch(`${API_URL}/sensors/sync-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      throw error;
    }
  }

  /**
   * Trigger manual data sync
   */
  public async triggerSync(): Promise<{ success: boolean; message: string }> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    try {
      logger.info('Triggering manual data sync');

      const response = await fetch(`${API_URL}/sensors/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      logger.info('Manual sync triggered successfully');
      return result;
    } catch (error) {
      logger.error('Failed to trigger sync:', error);
      throw error;
    }
  }

  /**
   * Backfill historical data
   * @param days - Number of days to backfill (max 365)
   */
  public async backfillHistoricalData(days: number = 30): Promise<{ success: boolean; message: string }> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    try {
      logger.info(`Triggering historical data backfill for ${days} days`);

      const response = await fetch(`${API_URL}/sensors/backfill`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      logger.info('Historical backfill triggered successfully');
      return result;
    } catch (error) {
      logger.error('Failed to trigger backfill:', error);
      throw error;
    }
  }

  /**
   * Get sensor statistics
   * @param sensorCode - Optional filter by sensor code
   * @param days - Number of days to analyze (default 7)
   */
  public async getStatistics(sensorCode?: string, days: number = 7): Promise<SensorStatistics[]> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const params = new URLSearchParams();
    if (sensorCode) params.append('sensorCode', sensorCode);
    params.append('days', days.toString());

    try {
      const response = await fetch(`${API_URL}/sensors/statistics?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.statistics;
    } catch (error) {
      logger.error('Failed to get statistics:', error);
      throw error;
    }
  }

  /**
   * Export sensor data as CSV
   * @param sensorCode - Optional filter by sensor code
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   */
  public async exportData(
    sensorCode?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const params = new URLSearchParams();
    if (sensorCode) params.append('sensorCode', sensorCode);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    params.append('format', 'csv');

    try {
      logger.info('Exporting sensor data as CSV');

      const response = await fetch(`${API_URL}/sensors/export?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the CSV content
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sensor_data_${Date.now()}.csv`;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      logger.info('Data exported successfully');
    } catch (error) {
      logger.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Format date for display
   */
  public formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  }

  /**
   * Check if data is live (within last 10 minutes)
   */
  public isLiveData(timestamp: string | Date): boolean {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    return diffMinutes <= 10;
  }

  /**
   * Get date range for different presets
   */
  public getDateRange(preset: 'hour' | 'day' | 'week' | 'month'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case 'hour':
        start.setHours(end.getHours() - 1);
        break;
      case 'day':
        start.setDate(end.getDate() - 1);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
    }

    return { start, end };
  }
}

// Export singleton instance
export const sensorDataService = new SensorDataService();
export default sensorDataService;