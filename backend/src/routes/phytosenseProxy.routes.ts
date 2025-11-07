/**
 * PhytoSense API Proxy Routes
 * Proxies requests to PhytoSense API to avoid CORS issues
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// PhytoSense API Configuration
const API_CONFIG = {
  baseUrl: 'https://www.phytosense.net/PhytoSense/v1',
  account: 'Pebble',
  appKey: 'e8d9e660e023afc3bb3a03f9a59e8213',
  username: 'aaldrobe',
  password: 'u4E4Zb100a8v'
};

/**
 * POST /api/phytosense-proxy/fetch
 * Proxy request to PhytoSense API
 */
router.post('/fetch', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { tdid, setupId, startDate, endDate } = req.body;

    if (!tdid || !setupId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: tdid, setupId, startDate, endDate'
      });
    }

    logger.info('Proxying PhytoSense API request', {
      tdid,
      setupId,
      startDate,
      endDate
    });

    // Create axios client with basic auth
    const client = axios.create({
      baseURL: API_CONFIG.baseUrl,
      auth: {
        username: API_CONFIG.username,
        password: API_CONFIG.password
      },
      headers: {
        'Accept': 'application/xml, text/xml'
      },
      timeout: 60000 // 60 seconds
    });

    // Build the URL
    const url = `/${API_CONFIG.account}/DeviceTransformation/${tdid}`;

    // Build query parameters
    const params = {
      app_key: API_CONFIG.appKey,
      setup_id: setupId,
      channel: 0,
      after: startDate,
      before: endDate
    };

    logger.debug('Making PhytoSense API request', { url, params });

    // Make the request
    const response = await client.get(url, { params });

    // Parse XML response
    if (typeof response.data === 'string' && response.data.includes('</PhytoSenseReply>')) {
      const { DOMParser } = await import('xmldom');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, 'text/xml');

      const valueElements = xmlDoc.getElementsByTagName('DeviceTransformationChannelValue');
      const dataPoints: any[] = [];

      for (let i = 0; i < valueElements.length; i++) {
        const element = valueElements[i];
        const dateTime = element.getAttribute('DateTime');
        const value = element.getAttribute('Value');

        if (dateTime && value) {
          dataPoints.push({
            dateTime,
            value: parseFloat(value)
          });
        }
      }

      logger.info(`Successfully fetched ${dataPoints.length} data points from PhytoSense`);

      return res.json({
        success: true,
        data: dataPoints,
        count: dataPoints.length
      });
    } else {
      logger.warn('Invalid XML response from PhytoSense API');
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'No data available for the specified parameters'
      });
    }

  } catch (error: any) {
    logger.error('PhytoSense proxy error:', error);

    // Check if it's a 500 error (often means no data)
    if (error.response?.status === 500) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'No data available for the specified date range'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch data from PhytoSense API',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/phytosense-proxy/test
 * Test the proxy with a known working date
 */
router.get('/test', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    logger.info('Testing PhytoSense proxy with December 31, 2023');

    // Test with known working parameters
    const testParams = {
      tdid: 40007, // Diameter TDID for stem051
      setupId: 1508,
      startDate: '2023-12-31T00:00:00',
      endDate: '2024-01-01T00:00:00'
    };

    // Create axios client
    const client = axios.create({
      baseURL: API_CONFIG.baseUrl,
      auth: {
        username: API_CONFIG.username,
        password: API_CONFIG.password
      },
      timeout: 30000
    });

    const url = `/${API_CONFIG.account}/DeviceTransformation/${testParams.tdid}`;
    const params = {
      app_key: API_CONFIG.appKey,
      setup_id: testParams.setupId,
      channel: 0,
      after: testParams.startDate,
      before: testParams.endDate
    };

    const response = await client.get(url, { params });

    if (typeof response.data === 'string' && response.data.includes('</PhytoSenseReply>')) {
      const { DOMParser } = await import('xmldom');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, 'text/xml');
      const valueElements = xmlDoc.getElementsByTagName('DeviceTransformationChannelValue');

      res.json({
        success: true,
        message: `Test successful! Found ${valueElements.length} data points for December 31, 2023`,
        testParams,
        sampleData: valueElements.length > 0 ? {
          first: {
            dateTime: valueElements[0].getAttribute('DateTime'),
            value: valueElements[0].getAttribute('Value')
          }
        } : null
      });
    } else {
      res.json({
        success: false,
        message: 'Test failed - invalid response format'
      });
    }

  } catch (error: any) {
    logger.error('PhytoSense proxy test error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;