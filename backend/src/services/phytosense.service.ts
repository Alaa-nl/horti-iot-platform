// PhytoSense Service - Business Logic Layer
// Handles all PhytoSense API interactions and data processing

import axios, { AxiosInstance } from 'axios';
import { DOMParser } from 'xmldom';
import { logger } from '../utils/logger';
import { phytoSenseConfig, PhytoSenseConfig } from '../config/phytosense.config';
import { cacheService } from './cache.service';

// Types
export type AggregationMode = 'raw' | 'hourly' | '6hour' | 'daily' | 'weekly';


export interface PhytoSenseDataPoint {
  dateTime: Date;
  value: number;
}

export interface PhytoSenseResponse {
  success: boolean;
  aggregation: AggregationMode;
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

export interface PhytoSenseDevice {
  setupId: number;
  name: string;
  fromDate: string;
  toDate: string;
  diameterTDID: number;
  diameterChannelId: number;
  sapFlowTDID: number;
  sapFlowChannelId: number;
  cropType: string;
}

class PhytoSenseService {
  private config: PhytoSenseConfig;
  private axiosInstance: AxiosInstance;
  private devices: PhytoSenseDevice[];

  constructor() {
    // Load validated configuration
    this.config = phytoSenseConfig;

    // Create axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      auth: {
        username: this.config.auth.username,
        password: this.config.auth.password
      },
      headers: {
        'Accept': 'application/xml, text/xml',
        'User-Agent': 'HORTI-IOT-Platform/1.0'
      },
      timeout: this.config.timeout,
      maxContentLength: this.config.maxContentLength,
      maxBodyLength: this.config.maxContentLength
    });

    // Device configurations - CORRECTED TDIDs (were previously swapped)
    this.devices = [
      {
        setupId: 1324,
        name: 'Stem051 - NL 2022 MKB Raak',
        fromDate: '2022-10-19T00:00:00',
        toDate: '2023-06-01T09:42:23',
        diameterTDID: 33387,  // CORRECTED: was 33385
        diameterChannelId: 0,
        sapFlowTDID: 33385,   // CORRECTED: was 33387
        sapFlowChannelId: 0,
        cropType: 'General'
      },
      {
        setupId: 1324,
        name: 'Stem127 - NL 2022 MKB Raak',
        fromDate: '2022-10-19T00:00:00',
        toDate: '2023-06-01T09:42:23',
        diameterTDID: 33388,  // CORRECTED: was 33386
        diameterChannelId: 0,
        sapFlowTDID: 33386,   // CORRECTED: was 33388
        sapFlowChannelId: 0,
        cropType: 'General'
      },
      {
        setupId: 1445,
        name: 'Stem051 - NL 2023 Tomato',
        fromDate: '2023-06-23T00:00:00',
        toDate: '2023-08-25T13:30:00',
        diameterTDID: 39916,  // CORRECTED: was 38210
        diameterChannelId: 0,
        sapFlowTDID: 38210,   // CORRECTED: was 39916
        sapFlowChannelId: 0,
        cropType: 'Tomato'
      },
      {
        setupId: 1445,
        name: 'Stem136 - NL 2023 Tomato',
        fromDate: '2023-06-23T00:00:00',
        toDate: '2023-08-25T13:30:00',
        diameterTDID: 39915,  // CORRECTED: was 38211
        diameterChannelId: 0,
        sapFlowTDID: 38211,   // CORRECTED: was 39915
        sapFlowChannelId: 0,
        cropType: 'Tomato'
      },
      {
        setupId: 1445,
        name: 'Stem051 - NL 2023 Cucumber',
        fromDate: '2023-08-25T13:30:00',
        toDate: '2023-10-20T00:00:00',
        diameterTDID: 39916,  // CORRECTED: was 38210
        diameterChannelId: 0,
        sapFlowTDID: 38210,   // CORRECTED: was 39916
        sapFlowChannelId: 0,
        cropType: 'Cucumber'
      },
      {
        setupId: 1445,
        name: 'Stem136 - NL 2023 Cucumber',
        fromDate: '2023-08-25T13:30:00',
        toDate: '2023-10-20T00:00:00',
        diameterTDID: 39915,  // CORRECTED: was 38211
        diameterChannelId: 0,
        sapFlowTDID: 38211,   // CORRECTED: was 39915
        sapFlowChannelId: 0,
        cropType: 'Cucumber'
      },
      {
        setupId: 1508,
        name: 'Stem051 - NL 2023-2024 MKB Raak',
        fromDate: '2023-11-01T00:00:00',
        toDate: '2024-10-15T12:00:00',
        diameterTDID: 39987,  // CORRECTED: was 39999
        diameterChannelId: 0,
        sapFlowTDID: 39999,   // CORRECTED: was 39987
        sapFlowChannelId: 0,
        cropType: 'General'
      },
      {
        setupId: 1508,
        name: 'Stem136 - NL 2023-2024 MKB Raak',
        fromDate: '2023-11-01T00:00:00',
        toDate: '2024-10-15T12:00:00',
        diameterTDID: 39981,  // CORRECTED: was 40007
        diameterChannelId: 0,
        sapFlowTDID: 40007,   // CORRECTED: was 39981
        sapFlowChannelId: 0,
        cropType: 'General'
      }
    ];
  }

  /**
   * Get all configured devices
   */
  public getDevices(): PhytoSenseDevice[] {
    return this.devices;
  }

  /**
   * Fetch data from PhytoSense API with retry logic and caching
   */
  public async fetchData(
    tdid: number,
    params: {
      setup_id: number;
      channel: number;
      after?: string;
      before?: string;
      from?: string;
      till?: string;
    },
    aggregation: AggregationMode = 'raw',
    retryCount: number = 0
  ): Promise<PhytoSenseResponse> {
    const maxRetries = 2;

    // Generate cache key
    const cacheKey = cacheService.generatePhytoSenseKey(tdid, params, aggregation);

    // Check cache first
    const cachedData = cacheService.get<PhytoSenseResponse>(cacheKey);
    if (cachedData) {
      logger.info('Returning cached PhytoSense data', {
        tdid,
        aggregation,
        dataPoints: cachedData.dataPoints
      });
      return cachedData;
    }

    try {
      // Build URL
      const url = `/${this.config.account}/DeviceTransformation/${tdid}`;

      // Add app_key to params
      const requestParams = {
        app_key: this.config.appKey,
        ...params
      };

      logger.info('Fetching PhytoSense data from API', {
        tdid,
        params: requestParams,
        aggregation,
        attempt: retryCount + 1
      });

      // Make request with increased timeout for large date ranges
      const dateRange = this.calculateDateRange(params);
      const timeout = dateRange > 180 ? 120000 : 60000; // 2 minutes for > 6 months, else 1 minute

      const response = await this.axiosInstance.get(url, {
        params: requestParams,
        timeout
      });

      // Check if response is complete XML
      const xmlData = response.data;
      if (typeof xmlData === 'string' && !xmlData.includes('</PhytoSenseReply>')) {
        throw new Error('Incomplete XML response received');
      }

      // Parse and aggregate XML data
      const parsedData = this.parseAndAggregateXML(xmlData, aggregation);

      // Build response
      const result: PhytoSenseResponse = {
        success: true,
        aggregation,
        dataPoints: parsedData.length,
        data: parsedData,
        metadata: {
          setupId: params.setup_id,
          tdid,
          channel: params.channel,
          dateRange: {
            from: params.after || params.from || '',
            till: params.before || params.till || ''
          }
        }
      };

      logger.info('PhytoSense data fetched successfully', {
        tdid,
        dataPoints: result.dataPoints,
        aggregation
      });

      // Cache the result with appropriate TTL
      const startDate = new Date(params.after || params.from || new Date());
      const endDate = new Date(params.before || params.till || new Date());
      const ttl = cacheService.calculateTTL(startDate, endDate);

      cacheService.set(cacheKey, result, ttl);
      logger.debug('Cached PhytoSense data', {
        tdid,
        aggregation,
        ttl
      });

      return result;

    } catch (error: any) {
      const isIncompleteXML = error.message === 'Incomplete XML response received' ||
                             (error.response?.data && typeof error.response.data === 'string' &&
                              !error.response.data.includes('</PhytoSenseReply>'));

      // Retry on incomplete XML or timeout errors
      if (retryCount < maxRetries && (isIncompleteXML || error.code === 'ECONNABORTED')) {
        logger.warn('Retrying PhytoSense request due to incomplete response', {
          tdid,
          attempt: retryCount + 1,
          error: error.message
        });

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));

        // If it's a large date range, try with smaller chunks
        if (retryCount === 1 && this.calculateDateRange(params) > 365) {
          return await this.fetchDataInChunks(tdid, params, aggregation);
        }

        return await this.fetchData(tdid, params, aggregation, retryCount + 1);
      }

      logger.error('PhytoSense API error', {
        tdid,
        error: error.message,
        response: error.response?.data?.substring?.(0, 500) // Limit logged response size
      });

      throw {
        success: false,
        message: error.response?.statusText || error.message || 'Failed to fetch PhytoSense data',
        status: error.response?.status || 500,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Calculate date range in days
   */
  private calculateDateRange(params: any): number {
    const startStr = params.after || params.from;
    const endStr = params.before || params.till;

    if (!startStr || !endStr) return 0;

    const start = new Date(startStr);
    const end = new Date(endStr);

    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Fetch data in smaller chunks for large date ranges
   */
  private async fetchDataInChunks(
    tdid: number,
    params: any,
    aggregation: AggregationMode
  ): Promise<PhytoSenseResponse> {
    const startStr = params.after || params.from;
    const endStr = params.before || params.till;

    if (!startStr || !endStr) {
      return await this.fetchData(tdid, params, aggregation);
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    const chunkSizeDays = 180; // 6 months chunks

    logger.info('Fetching data in chunks due to large date range', {
      tdid,
      dateRange: this.calculateDateRange(params),
      chunkSize: chunkSizeDays
    });

    const allData: PhytoSenseDataPoint[] = [];
    let currentStart = new Date(start);

    while (currentStart < end) {
      const currentEnd = new Date(Math.min(
        currentStart.getTime() + (chunkSizeDays * 24 * 60 * 60 * 1000),
        end.getTime()
      ));

      const chunkParams = {
        ...params,
        after: currentStart.toISOString(),
        before: currentEnd.toISOString()
      };

      try {
        const chunkResult = await this.fetchData(tdid, chunkParams, 'raw', 0);
        allData.push(...chunkResult.data);
      } catch (error: any) {
        logger.warn('Failed to fetch chunk, continuing with partial data', {
          tdid,
          chunkStart: currentStart.toISOString(),
          chunkEnd: currentEnd.toISOString(),
          error: error.message
        });
      }

      currentStart = new Date(currentEnd.getTime() + 1);
    }

    // Apply aggregation to combined data
    const aggregatedData = aggregation === 'raw'
      ? allData
      : this.aggregateData(allData, aggregation);

    return {
      success: true,
      aggregation,
      dataPoints: aggregatedData.length,
      data: aggregatedData,
      metadata: {
        setupId: params.setup_id,
        tdid,
        channel: params.channel,
        dateRange: {
          from: startStr,
          till: endStr
        }
      }
    };
  }

  /**
   * Parse XML and apply aggregation
   */
  private parseAndAggregateXML(xmlData: string, aggregationMode: AggregationMode): PhytoSenseDataPoint[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');

    // Extract all data points
    const valueElements = xmlDoc.getElementsByTagName('DeviceTransformationChannelValue');
    const rawData: PhytoSenseDataPoint[] = [];

    for (let i = 0; i < valueElements.length; i++) {
      const element = valueElements[i];
      const dateTime = element.getAttribute('DateTime');
      const value = element.getAttribute('Value');

      if (dateTime && value) {
        rawData.push({
          dateTime: new Date(dateTime),
          value: parseFloat(value)
        });
      }
    }

    // Sort by date
    rawData.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    logger.debug(`Parsed ${rawData.length} raw data points`);

    // Apply aggregation
    if (aggregationMode === 'raw' || !aggregationMode) {
      return rawData;
    }

    return this.aggregateData(rawData, aggregationMode);
  }

  /**
   * Aggregate data points based on the specified mode
   */
  private aggregateData(
    rawData: PhytoSenseDataPoint[],
    aggregationMode: AggregationMode
  ): PhytoSenseDataPoint[] {
    if (rawData.length === 0) return [];

    const aggregated: PhytoSenseDataPoint[] = [];
    let intervalMs: number;

    // Determine interval based on aggregation mode
    switch (aggregationMode) {
      case 'hourly':
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case '6hour':
        intervalMs = 6 * 60 * 60 * 1000; // 6 hours
        break;
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      default:
        return rawData;
    }

    // Group data by intervals
    let currentBucket: PhytoSenseDataPoint[] = [];
    let bucketStart = rawData[0].dateTime.getTime();

    rawData.forEach(point => {
      const pointTime = point.dateTime.getTime();

      if (pointTime - bucketStart < intervalMs) {
        currentBucket.push(point);
      } else {
        // Calculate average for current bucket
        if (currentBucket.length > 0) {
          const avgValue = currentBucket.reduce((sum, p) => sum + p.value, 0) / currentBucket.length;
          const bucketMidpoint = new Date(bucketStart + intervalMs / 2);
          aggregated.push({
            dateTime: bucketMidpoint,
            value: parseFloat(avgValue.toFixed(3))
          });
        }

        // Start new bucket
        bucketStart = Math.floor(pointTime / intervalMs) * intervalMs;
        currentBucket = [point];
      }
    });

    // Add last bucket
    if (currentBucket.length > 0) {
      const avgValue = currentBucket.reduce((sum, p) => sum + p.value, 0) / currentBucket.length;
      const bucketMidpoint = new Date(bucketStart + intervalMs / 2);
      aggregated.push({
        dateTime: bucketMidpoint,
        value: parseFloat(avgValue.toFixed(3))
      });
    }

    logger.debug(`Aggregated ${rawData.length} points to ${aggregated.length} points (${aggregationMode})`);

    return aggregated;
  }

  /**
   * Calculate optimal aggregation mode based on date range
   */
  public calculateOptimalAggregation(startDate: Date, endDate: Date): AggregationMode {
    const diffMs = endDate.getTime() - startDate.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);

    if (days <= 7) return 'raw';        // ≤ 7 days: raw 5-minute intervals
    if (days <= 30) return 'hourly';    // 8-30 days: hourly averages
    if (days <= 90) return '6hour';     // 31-90 days: 6-hour intervals
    if (days <= 365) return 'daily';    // 91-365 days: daily averages
    return 'weekly';                     // > 365 days: weekly averages
  }

  /**
   * Health check for PhytoSense API connectivity
   */
  public async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      // Try to fetch a small amount of data to test connectivity
      const testDevice = this.devices[0];
      const testDate = new Date();
      const testParams = {
        setup_id: testDevice.setupId,
        channel: 0,
        after: new Date(testDate.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        before: testDate.toISOString()
      };

      await this.fetchData(testDevice.diameterTDID, testParams, 'raw');

      return {
        status: 'healthy',
        message: 'PhytoSense API is accessible'
      };
    } catch (error: any) {
      logger.error('PhytoSense health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message || 'PhytoSense API is not accessible'
      };
    }
  }
}

// Export singleton instance
export const phytoSenseService = new PhytoSenseService();