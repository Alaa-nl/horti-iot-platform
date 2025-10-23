// PhytoSense (2grow) API Service
// Handles all communication with the 2grow PhytoSense API for plant monitoring data

import { logger } from '../utils/logger';

// API Configuration
const API_CONFIG = {
  baseUrl: 'https://www.phytosense.net/PhytoSense/v1',
  account: 'Pebble',
  appKey: 'e8d9e660e023afc3bb3a03f9a59e8213',
  auth: {
    username: 'aaldrobe',
    password: 'u4E4Zb100a8v'
  }
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

export const DEVICE_CONFIGS: DeviceConfig[] = [
  {
    setupId: 1324,
    name: 'Stem051 - NL 2022 MKB Raak',
    fromDate: '2022-10-19T00:00:00',
    toDate: '2023-06-01T09:42:23',
    diameterTDID: 33385,
    diameterChannelId: 0,
    sapFlowTDID: 33387,
    sapFlowChannelId: 0,
    cropType: 'General'
  },
  {
    setupId: 1324,
    name: 'Stem127 - NL 2022 MKB Raak',
    fromDate: '2022-10-19T00:00:00',
    toDate: '2023-06-01T09:42:23',
    diameterTDID: 33386,
    diameterChannelId: 0,
    sapFlowTDID: 33388,
    sapFlowChannelId: 0,
    cropType: 'General'
  },
  {
    setupId: 1445,
    name: 'Stem051 - NL 2023 Tomato',
    fromDate: '2023-06-23T00:00:00',
    toDate: '2023-08-25T13:30:00',
    diameterTDID: 38210,
    diameterChannelId: 0,
    sapFlowTDID: 39916,
    sapFlowChannelId: 0,
    cropType: 'Tomato'
  },
  {
    setupId: 1445,
    name: 'Stem136 - NL 2023 Tomato',
    fromDate: '2023-06-23T00:00:00',
    toDate: '2023-08-25T13:30:00',
    diameterTDID: 38211,
    diameterChannelId: 0,
    sapFlowTDID: 39915,
    sapFlowChannelId: 0,
    cropType: 'Tomato'
  },
  {
    setupId: 1445,
    name: 'Stem051 - NL 2023 Cucumber',
    fromDate: '2023-08-25T13:30:00',
    toDate: '2023-10-20T00:00:00',
    diameterTDID: 38210,
    diameterChannelId: 0,
    sapFlowTDID: 39916,
    sapFlowChannelId: 0,
    cropType: 'Cucumber'
  },
  {
    setupId: 1445,
    name: 'Stem136 - NL 2023 Cucumber',
    fromDate: '2023-08-25T13:30:00',
    toDate: '2023-10-20T00:00:00',
    diameterTDID: 38211,
    diameterChannelId: 0,
    sapFlowTDID: 39915,
    sapFlowChannelId: 0,
    cropType: 'Cucumber'
  },
  {
    setupId: 1508,
    name: 'Stem051 - NL 2023-2024 MKB Raak',
    fromDate: '2023-11-01T00:00:00',
    toDate: '2024-10-15T12:00:00',
    diameterTDID: 39999,
    diameterChannelId: 0,
    sapFlowTDID: 39987,
    sapFlowChannelId: 0,
    cropType: 'General'
  },
  {
    setupId: 1508,
    name: 'Stem136 - NL 2023-2024 MKB Raak',
    fromDate: '2023-11-01T00:00:00',
    toDate: '2024-10-15T12:00:00',
    diameterTDID: 40007,
    diameterChannelId: 0,
    sapFlowTDID: 39981,
    sapFlowChannelId: 0,
    cropType: 'General'
  }
];

// Data types
export interface PhytoSenseDataPoint {
  dateTime: string;
  value: number;
}

export interface PhytoSenseResponse {
  deviceTransformationId: number;
  deviceTransformationChannelId: number;
  getDateTime: string;
  values: PhytoSenseDataPoint[];
}

export interface DateRange {
  after?: string;
  before?: string;
  from?: string;
  till?: string;
}

class PhytoSenseService {
  private authHeader: string;

  constructor() {
    // Create basic auth header
    const credentials = btoa(`${API_CONFIG.auth.username}:${API_CONFIG.auth.password}`);
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Build the API URL with query parameters
   * Using local proxy to bypass CORS
   */
  private buildUrl(
    dtid: number,
    setupId: number,
    channelId: number,
    dateRange?: DateRange
  ): string {
    // Use local proxy server instead of direct API
    const proxyUrl = 'http://localhost:3003/api/phytosense/data';

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

    return `${proxyUrl}/${dtid}?${params.toString()}`;
  }

  /**
   * Parse XML response to JavaScript object using browser-compatible DOMParser
   */
  private parseXMLResponse(xmlText: string): PhytoSenseResponse {
    try {
      // Use browser's built-in DOMParser for XML parsing
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing error: ' + parserError.textContent);
      }

      // Extract root element attributes
      const rootElement = xmlDoc.querySelector('DeviceTransformationChannelValues');
      if (!rootElement) {
        throw new Error('Invalid XML structure: missing root element');
      }

      const deviceTransformationId = parseInt(rootElement.getAttribute('DeviceTransformationId') || '0');
      const deviceTransformationChannelId = parseInt(rootElement.getAttribute('DeviceTransformationChannelId') || '0');
      const getDateTime = rootElement.getAttribute('GetDateTime') || '';

      // Extract all value elements
      const valueElements = xmlDoc.querySelectorAll('DeviceTransformationChannelValue');
      const values: PhytoSenseDataPoint[] = [];

      valueElements.forEach(element => {
        const dateTime = element.getAttribute('DateTime');
        const value = element.getAttribute('Value');

        if (dateTime && value) {
          values.push({
            dateTime: dateTime,
            value: parseFloat(value)
          });
        }
      });

      return {
        deviceTransformationId,
        deviceTransformationChannelId,
        getDateTime,
        values
      };
    } catch (error) {
      logger.error('Error parsing XML response:', error);
      throw new Error('Failed to parse PhytoSense API response');
    }
  }

  /**
   * Fetch data for a specific measurement type
   */
  public async fetchData(
    dtid: number,
    setupId: number,
    channelId: number,
    dateRange?: DateRange
  ): Promise<PhytoSenseResponse> {
    const url = this.buildUrl(dtid, setupId, channelId, dateRange);

    try {
      logger.info('Fetching PhytoSense data:', { url, dateRange });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml',
        },
        // No Authorization header needed - proxy handles authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const data = this.parseXMLResponse(xmlText);

      logger.info('PhytoSense data fetched successfully:', {
        dataPoints: data.values.length
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
   * Get active devices (those with current or recent data)
   */
  public getActiveDevices(): DeviceConfig[] {
    const now = new Date();
    return DEVICE_CONFIGS.filter(device => {
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
  public getAllDevices(): DeviceConfig[] {
    return DEVICE_CONFIGS;
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