// Sensor Data Routes - Query sensor data from database
// These endpoints serve raw sensor data stored in the database
// No aggregation - always returns exact sensor readings

import { Router, Request, Response } from 'express';
import database from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { dataSyncService } from '../services/dataSync.service';

const router = Router();

/**
 * GET /api/sensors/data
 * Get raw sensor data from database
 *
 * @query sensorCode - Optional sensor code filter
 * @query startDate - Optional start date (ISO string)
 * @query endDate - Optional end date (ISO string)
 * @query limit - Maximum number of records (default 10000, max 50000)
 */
router.get('/data', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      sensorCode,
      startDate,
      endDate,
      limit = '10000'
    } = req.query;

    // Validate and sanitize limit
    const recordLimit = Math.min(parseInt(limit as string) || 10000, 50000);

    // Build query dynamically
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (sensorCode) {
      conditions.push(`sensor_code = $${paramIndex}`);
      params.push(sensorCode);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    // Add limit
    params.push(recordLimit);

    // Query raw data from database (using existing sap_flow table)
    const query = `
      SELECT
        timestamp,
        sensor_code,
        sap_flow_value as "sapFlow",
        stem_diameter_value as "diameter",
        device_name,
        full_device_name
      FROM sap_flow
      WHERE ${conditions.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex}
    `;

    logger.debug('Executing sensor data query', { conditions, params });

    const result = await database.query(query, params);

    // Format response
    const formattedData = result.rows.map((row: any) => ({
      timestamp: row.timestamp,
      sensorCode: row.sensor_code,
      sapFlow: row.sapFlow ? parseFloat(row.sapFlow) : null,
      diameter: row.diameter ? parseFloat(row.diameter) : null,
      deviceName: row.device_name,
      fullDeviceName: row.full_device_name
    }));

    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
      isRawData: true, // Always raw, no aggregation
      query: {
        sensorCode,
        startDate,
        endDate,
        limit: recordLimit
      }
    });

  } catch (error: any) {
    logger.error('Failed to fetch sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/sensors/latest
 * Get latest readings for all sensors
 */
router.get('/latest', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const query = `
      SELECT DISTINCT ON (sensor_code)
        sensor_code,
        timestamp,
        sap_flow_value as "sapFlow",
        stem_diameter_value as "diameter",
        device_name,
        full_device_name
      FROM sap_flow
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      ORDER BY sensor_code, timestamp DESC
    `;

    const result = await database.query(query);

    // Format response
    const formattedData = result.rows.map((row: any) => ({
      sensorCode: row.sensor_code,
      timestamp: row.timestamp,
      sapFlow: row.sapFlow ? parseFloat(row.sapFlow) : null,
      diameter: row.diameter ? parseFloat(row.diameter) : null,
      deviceName: row.device_name,
      fullDeviceName: row.full_device_name
    }));

    res.json({
      success: true,
      data: formattedData,
      lastUpdate: new Date().toISOString(),
      count: formattedData.length
    });

  } catch (error: any) {
    logger.error('Failed to fetch latest data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/sensors/sync-status
 * Check data sync status for all sensors
 */
router.get('/sync-status', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    // Get sync status from sap_flow table
    const query = `
      SELECT
        sensor_code,
        COUNT(*) as total_records,
        MIN(timestamp) as earliest_data,
        MAX(timestamp) as latest_data,
        MAX(timestamp) > NOW() - INTERVAL '10 minutes' as is_live
      FROM sap_flow
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY sensor_code
      ORDER BY sensor_code
    `;

    const result = await database.query(query);

    const status = {
      sensors: result.rows,
      isSyncing: false,
      lastCheck: new Date().toISOString()
    };

    res.json({
      success: true,
      ...status
    });

  } catch (error: any) {
    logger.error('Failed to get sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/sensors/sync
 * Manually trigger data sync
 */
router.post('/sync', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    // Check if user has admin role (you can add role checking here)
    const user = (req as any).user;

    logger.info(`Manual sync triggered by user: ${user.email}`);

    // Trigger sync asynchronously
    dataSyncService.triggerManualSync().catch(error => {
      logger.error('Manual sync failed:', error);
    });

    res.json({
      success: true,
      message: 'Data sync triggered successfully. Check sync status for progress.'
    });

  } catch (error: any) {
    logger.error('Failed to trigger sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger data sync',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/sensors/backfill
 * Backfill historical data (admin only)
 *
 * @body days - Number of days to backfill (default 30, max 365)
 */
router.post('/backfill', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { days = 30 } = req.body;
    const user = (req as any).user;

    // Limit to 365 days for safety
    const backfillDays = Math.min(parseInt(days) || 30, 365);

    logger.info(`Historical data backfill triggered by ${user.email} for ${backfillDays} days`);

    // Trigger backfill asynchronously
    dataSyncService.backfillHistoricalData(backfillDays).catch(error => {
      logger.error('Historical backfill failed:', error);
    });

    res.json({
      success: true,
      message: `Historical data backfill started for ${backfillDays} days. This may take several minutes.`,
      days: backfillDays
    });

  } catch (error: any) {
    logger.error('Failed to trigger backfill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger historical data backfill',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/sensors/statistics
 * Get sensor data statistics
 */
router.get('/statistics', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { sensorCode, days = '7' } = req.query;

    const conditions: string[] = [`timestamp > NOW() - INTERVAL '${parseInt(days as string)} days'`];
    const params: any[] = [];

    if (sensorCode) {
      conditions.push('sensor_code = $1');
      params.push(sensorCode);
    }

    const query = `
      SELECT
        sensor_code,
        COUNT(*) as total_measurements,
        AVG(sap_flow_value) as avg_sap_flow,
        MIN(sap_flow_value) as min_sap_flow,
        MAX(sap_flow_value) as max_sap_flow,
        AVG(stem_diameter_value) as avg_diameter,
        MIN(stem_diameter_value) as min_diameter,
        MAX(stem_diameter_value) as max_diameter,
        MIN(timestamp) as first_reading,
        MAX(timestamp) as last_reading
      FROM sap_flow
      WHERE ${conditions.join(' AND ')}
      GROUP BY sensor_code
      ORDER BY sensor_code
    `;

    const result = await database.query(query, params);

    // Format statistics
    const statistics = result.rows.map((row: any) => ({
      sensorCode: row.sensor_code,
      totalMeasurements: parseInt(row.total_measurements),
      sapFlow: {
        average: row.avg_sap_flow ? parseFloat(row.avg_sap_flow) : null,
        minimum: row.min_sap_flow ? parseFloat(row.min_sap_flow) : null,
        maximum: row.max_sap_flow ? parseFloat(row.max_sap_flow) : null
      },
      diameter: {
        average: row.avg_diameter ? parseFloat(row.avg_diameter) : null,
        minimum: row.min_diameter ? parseFloat(row.min_diameter) : null,
        maximum: row.max_diameter ? parseFloat(row.max_diameter) : null
      },
      dateRange: {
        first: row.first_reading,
        last: row.last_reading
      }
    }));

    res.json({
      success: true,
      statistics,
      period: `${days} days`
    });

  } catch (error: any) {
    logger.error('Failed to get statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sensor statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/sensors/export
 * Export sensor data as CSV
 */
router.get('/export', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      sensorCode,
      startDate,
      endDate,
      format = 'csv'
    } = req.query;

    // Build query
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (sensorCode) {
      conditions.push(`sensor_code = $${paramIndex}`);
      params.push(sensorCode);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const query = `
      SELECT
        timestamp,
        sensor_code,
        sap_flow_value,
        stem_diameter_value,
        device_name
      FROM sap_flow
      WHERE ${conditions.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT 100000
    `;

    const result = await database.query(query, params);

    if (format === 'csv') {
      // Generate CSV
      const headers = 'Timestamp,Sensor Code,Sap Flow (g/h),Diameter (mm),Device\n';
      const csv = headers + result.rows.map((row: any) =>
        `${row.timestamp},${row.sensor_code},${row.sap_flow_value || ''},${row.stem_diameter_value || ''},${row.device_name || ''}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sensor_data_${Date.now()}.csv`);
      res.send(csv);
    } else {
      // Return as JSON
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    }

  } catch (error: any) {
    logger.error('Failed to export data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;