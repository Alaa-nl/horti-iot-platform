// Data Sync Service - Fetches from PhytoSense API and stores in database
// This service runs continuously to sync sensor data from API to database
// Data flow: PhytoSense API → Database → Frontend

import { CronJob } from 'cron';
import { format } from 'date-fns';
import { phytoSenseService } from './phytosense.service';
import database from '../utils/database';
import { logger } from '../utils/logger';

interface DeviceData {
  dateTime: string | Date;
  value: number;
}

class DataSyncService {
  private syncJob: CronJob | null = null;
  private isSyncing: boolean = false;

  /**
   * Start the data sync service
   * Runs every 5 minutes to match sensor data interval
   */
  public start(): void {
    // Run every 5 minutes (matching sensor data interval)
    this.syncJob = new CronJob('*/5 * * * *', async () => {
      if (!this.isSyncing) {
        await this.syncAllDevices();
      }
    });

    this.syncJob.start();
    logger.info('Data sync service started - syncing every 5 minutes');

    // Initial sync on startup
    this.performInitialSync();
  }

  /**
   * Stop the sync service
   */
  public stop(): void {
    if (this.syncJob) {
      this.syncJob.stop();
      logger.info('Data sync service stopped');
    }
  }

  /**
   * Perform initial sync on startup
   */
  private async performInitialSync(): Promise<void> {
    logger.info('Performing initial data sync...');
    await this.syncAllDevices();
  }

  /**
   * Sync all active devices
   */
  private async syncAllDevices(): Promise<void> {
    if (this.isSyncing) {
      logger.warn('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;

    try {
      const devices = phytoSenseService.getDevices();
      logger.info(`Starting sync for ${devices.length} devices`);

      for (const device of devices) {
        // Only sync active devices
        if (device.toDate) {
          const endDate = new Date(device.toDate);
          const now = new Date();
          // Skip if device data ended more than 30 days ago
          if (endDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
            logger.debug(`Skipping inactive device: ${device.name}`);
            continue;
          }
        }

        await this.syncDeviceData(device);
      }

      logger.info('Data sync completed successfully');
    } catch (error) {
      logger.error('Data sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync single device data
   */
  private async syncDeviceData(device: any): Promise<void> {
    try {
      logger.debug(`Syncing device: ${device.name}`);

      // Get greenhouse ID (or create if doesn't exist)
      const greenhouseId = await this.getOrCreateGreenhouseId();

      // Get plant ID for this device
      const plantId = await this.getOrCreatePlantId(device.name, greenhouseId);

      // Get last synced timestamp from database
      const lastSyncQuery = `
        SELECT MAX(timestamp) as last_sync
        FROM sap_flow
        WHERE sensor_code = $1
      `;

      const result = await database.query(lastSyncQuery, [device.name]);
      let lastSync = result.rows[0]?.last_sync;

      // If no previous sync, start from device's from_date or last 7 days
      if (!lastSync) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const deviceFromDate = new Date(device.fromDate);
        lastSync = deviceFromDate > sevenDaysAgo ? deviceFromDate : sevenDaysAgo;
      } else {
        // Add 1 minute to avoid duplicate entries
        lastSync = new Date(new Date(lastSync).getTime() + 60000);
      }

      const now = new Date();

      // Don't sync if last sync is within last 5 minutes
      if (lastSync >= new Date(now.getTime() - 5 * 60 * 1000)) {
        logger.debug(`${device.name}: Already up to date`);
        return;
      }

      logger.info(`${device.name}: Fetching data from ${lastSync.toISOString()} to ${now.toISOString()}`);

      // Prepare parameters for API call
      const params = {
        setup_id: device.setupId,
        channel: device.diameterChannelId || 0,
        after: lastSync.toISOString(),
        before: now.toISOString()
      };

      // Fetch diameter data (raw, no aggregation)
      let diameterData: DeviceData[] = [];
      try {
        const diameterResponse = await phytoSenseService.fetchData(
          device.diameterTDID,
          params,
          'raw' // Always fetch raw data
        );
        diameterData = diameterResponse.data || [];
        logger.debug(`${device.name}: Fetched ${diameterData.length} diameter points`);
      } catch (error: any) {
        logger.error(`${device.name}: Failed to fetch diameter data:`, error.message);
      }

      // Fetch sap flow data (raw, no aggregation)
      let sapFlowData: DeviceData[] = [];
      try {
        const sapFlowParams = {
          ...params,
          channel: device.sapFlowChannelId || 0
        };
        const sapFlowResponse = await phytoSenseService.fetchData(
          device.sapFlowTDID,
          sapFlowParams,
          'raw' // Always fetch raw data
        );
        sapFlowData = sapFlowResponse.data || [];
        logger.debug(`${device.name}: Fetched ${sapFlowData.length} sap flow points`);
      } catch (error: any) {
        logger.error(`${device.name}: Failed to fetch sap flow data:`, error.message);
      }

      // Store in database if we have any data
      if (diameterData.length > 0 || sapFlowData.length > 0) {
        await this.storeInDatabase(
          greenhouseId,
          plantId,
          device.name,
          diameterData,
          sapFlowData
        );

        logger.info(`${device.name}: Stored ${diameterData.length} diameter and ${sapFlowData.length} sap flow measurements`);
      } else {
        logger.debug(`${device.name}: No new data to sync`);
      }

    } catch (error: any) {
      logger.error(`Failed to sync device ${device.name}:`, error.message);
    }
  }

  /**
   * Store data in database (using existing sap_flow table)
   */
  private async storeInDatabase(
    greenhouseId: string,
    plantId: string,
    sensorCode: string,
    diameterData: DeviceData[],
    sapFlowData: DeviceData[]
  ): Promise<void> {
    // Combine diameter and sap flow data by timestamp
    const dataMap = new Map<string, { diameter?: number; sapFlow?: number }>();

    // Process diameter data
    diameterData.forEach(point => {
      const timestamp = point.dateTime instanceof Date ? point.dateTime.toISOString() : point.dateTime;
      dataMap.set(timestamp, {
        diameter: point.value
      });
    });

    // Process sap flow data
    sapFlowData.forEach(point => {
      const timestamp = point.dateTime instanceof Date ? point.dateTime.toISOString() : point.dateTime;
      const existing = dataMap.get(timestamp) || {};
      dataMap.set(timestamp, {
        ...existing,
        sapFlow: point.value
      });
    });

    // Extract device info from sensorCode (e.g., "Stem051 - NL 2023 Tomato" -> "Stem051", "NL 2023 Tomato")
    const parts = sensorCode.split(' - ');
    const deviceName = parts[0];
    const fullDeviceName = sensorCode;

    // Prepare insert query for sap_flow table with ON CONFLICT to handle duplicates
    const insertQuery = `
      INSERT INTO sap_flow (
        timestamp,
        time,
        sap_flow_value,
        sensor_code,
        device_id,
        device_name,
        full_device_name,
        stem_diameter_value,
        is_valid,
        is_interpolated,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (timestamp, sensor_code) DO UPDATE
      SET
        sap_flow_value = COALESCE(EXCLUDED.sap_flow_value, sap_flow.sap_flow_value),
        stem_diameter_value = COALESCE(EXCLUDED.stem_diameter_value, sap_flow.stem_diameter_value),
        updated_at = NOW()
    `;

    // Insert data in batches for better performance
    const batchSize = 100;
    const entries = Array.from(dataMap.entries());

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);

      // Use transaction for batch insert
      const client = await database.getClient();
      try {
        await client.query('BEGIN');

        for (const [timestamp, data] of batch) {
          const dateObj = new Date(timestamp);
          const timeOnly = format(dateObj, 'HH:mm');

          await client.query(insertQuery, [
            timestamp,                    // timestamp
            timeOnly,                     // time (HH:mm format)
            data.sapFlow || null,         // sap_flow_value
            deviceName,                   // sensor_code (e.g., "Stem051")
            '0',                         // device_id (keeping as string '0' for compatibility)
            deviceName,                   // device_name
            fullDeviceName,              // full_device_name
            data.diameter || null,        // stem_diameter_value
            true,                        // is_valid
            false,                       // is_interpolated
            new Date()                   // created_at
          ]);
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }

  /**
   * Get or create greenhouse ID
   */
  private async getOrCreateGreenhouseId(): Promise<string> {
    // First, check if greenhouse exists
    let result = await database.query(
      'SELECT id FROM greenhouses WHERE name = $1',
      ['World Horti Center Lab']
    );

    if (result.rows.length === 0) {
      // Create greenhouse if doesn't exist
      result = await database.query(
        `INSERT INTO greenhouses (
          name,
          location,
          area_m2,
          crop_type,
          dimensions,
          climate_system,
          lighting_system,
          co2_target_ppm
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          'World Horti Center Lab',
          'World Horti Center, Naaldwijk, Netherlands',
          80, // 12.5m x 6.4m
          'tomato',
          JSON.stringify({ length: 12.5, width: 6.4, height: 6.0, unit: 'm' }),
          'Hoogendoorn and Priva',
          'LED - DLI 18 mol/m2 per day',
          1000
        ]
      );
      logger.info('Created greenhouse: World Horti Center Lab');
    }

    return result.rows[0].id;
  }

  /**
   * Get or create plant ID
   */
  private async getOrCreatePlantId(plantCode: string, greenhouseId: string): Promise<string> {
    // Extract the actual plant code (e.g., "Stem051" from "Stem051 - NL 2023 Tomato")
    const actualCode = plantCode.split(' ')[0].toLowerCase();

    let result = await database.query(
      'SELECT id FROM plants WHERE plant_code = $1',
      [actualCode]
    );

    if (result.rows.length === 0) {
      // Create plant if doesn't exist
      result = await database.query(
        `INSERT INTO plants (
          greenhouse_id,
          plant_code,
          is_monitored,
          variety,
          created_at
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [greenhouseId, actualCode, true, 'Xandor XR', new Date()]
      );
      logger.info(`Created plant: ${actualCode}`);
    }

    return result.rows[0].id;
  }

  /**
   * Get sync status for monitoring
   */
  public async getSyncStatus(): Promise<any> {
    try {
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

      return {
        sensors: result.rows,
        isSyncing: this.isSyncing,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      throw error;
    }
  }

  /**
   * Manual sync trigger
   */
  public async triggerManualSync(): Promise<void> {
    logger.info('Manual sync triggered');
    await this.syncAllDevices();
  }

  /**
   * Backfill historical data
   */
  public async backfillHistoricalData(days: number = 30): Promise<void> {
    logger.info(`Starting historical data backfill for ${days} days`);

    // Temporarily update sync to go back further
    const devices = phytoSenseService.getDevices();

    for (const device of devices) {
      try {
        const greenhouseId = await this.getOrCreateGreenhouseId();
        const plantId = await this.getOrCreatePlantId(device.name, greenhouseId);

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

        // Make sure we don't go before device's from_date
        const deviceFromDate = new Date(device.fromDate);
        const actualStartDate = deviceFromDate > startDate ? deviceFromDate : startDate;

        logger.info(`${device.name}: Backfilling from ${actualStartDate.toISOString()} to ${endDate.toISOString()}`);

        const params = {
          setup_id: device.setupId,
          channel: 0,
          after: actualStartDate.toISOString(),
          before: endDate.toISOString()
        };

        // Fetch all historical data
        const [diameterResponse, sapFlowResponse] = await Promise.all([
          phytoSenseService.fetchData(device.diameterTDID, params, 'raw'),
          phytoSenseService.fetchData(device.sapFlowTDID, params, 'raw')
        ]);

        await this.storeInDatabase(
          greenhouseId,
          plantId,
          device.name,
          diameterResponse.data || [],
          sapFlowResponse.data || []
        );

        logger.info(`${device.name}: Backfilled ${diameterResponse.data?.length || 0} diameter and ${sapFlowResponse.data?.length || 0} sap flow measurements`);

      } catch (error: any) {
        logger.error(`Failed to backfill ${device.name}:`, error.message);
      }
    }

    logger.info('Historical data backfill completed');
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();