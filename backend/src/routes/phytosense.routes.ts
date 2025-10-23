// PhytoSense API Routes
// Provides endpoints for accessing PhytoSense data with authentication and aggregation

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { phytoSenseService, AggregationMode } from '../services/phytosense.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/phytosense/data/:dtid
 * Fetch PhytoSense data with optional aggregation
 *
 * @param dtid - Device Transformation ID
 * @query setup_id - Setup ID (required)
 * @query channel - Channel ID (required)
 * @query aggregation - Aggregation mode: raw | hourly | 6hour | daily | weekly
 * @query after - Start date (ISO string) - used with 'before'
 * @query before - End date (ISO string) - used with 'after'
 * @query from - Alternative start date - used with 'till'
 * @query till - Alternative end date - used with 'from'
 *
 * @returns JSON response with aggregated data
 */
router.get('/data/:dtid', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dtid } = req.params;
    const { aggregation, ...queryParams } = req.query;

    // Validate required parameters
    if (!queryParams.setup_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: setup_id'
      });
    }

    // Parse parameters
    const params = {
      setup_id: parseInt(queryParams.setup_id as string),
      channel: parseInt(queryParams.channel as string) || 0,
      after: queryParams.after as string,
      before: queryParams.before as string,
      from: queryParams.from as string,
      till: queryParams.till as string
    };

    // Parse aggregation mode
    const aggregationMode = (aggregation as AggregationMode) || 'raw';

    // Log request
    logger.info('PhytoSense data request', {
      dtid,
      params,
      aggregation: aggregationMode,
      user: (req as any).user?.email
    });

    // Fetch data using service
    const result = await phytoSenseService.fetchData(
      parseInt(dtid),
      params,
      aggregationMode
    );

    // Return successful response
    res.json(result);

  } catch (error: any) {
    logger.error('PhytoSense route error', {
      error: error.message,
      stack: error.stack
    });

    // Handle different error types
    if (error.status) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.error
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

/**
 * GET /api/phytosense/devices
 * Get list of available devices
 *
 * @returns Array of device configurations
 */
router.get('/devices', authenticateToken, async (req: Request, res: Response) => {
  try {
    const devices = phytoSenseService.getDevices();

    logger.info('PhytoSense devices requested', {
      user: (req as any).user?.email
    });

    res.json({
      success: true,
      data: devices
    });
  } catch (error: any) {
    logger.error('Error fetching devices', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/phytosense/health
 * Health check endpoint for PhytoSense integration
 *
 * @returns Health status of PhytoSense API connection
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await phytoSenseService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === 'healthy',
      ...health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Health check error', {
      error: error.message
    });

    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/phytosense/aggregate-suggestion
 * Get optimal aggregation mode suggestion for a date range
 *
 * @body startDate - Start date (ISO string)
 * @body endDate - End date (ISO string)
 *
 * @returns Suggested aggregation mode
 */
router.post('/aggregate-suggestion', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: startDate, endDate'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const suggestion = phytoSenseService.calculateOptimalAggregation(start, end);

    res.json({
      success: true,
      suggestion,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error: any) {
    logger.error('Aggregation suggestion error', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to calculate aggregation suggestion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;