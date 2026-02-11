/**
 * Re-import Data with Full Precision
 * This script fetches data from PhytoSense API with full decimal precision
 * and stores it correctly in the database
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before importing services
dotenv.config({ path: path.join(__dirname, '.env') });

import { format } from 'date-fns';
import { phytoSenseService } from './src/services/phytosense.service';
import database from './src/utils/database';

// Test with March 2023 data first
async function reimportWithPrecision() {
  console.log('🔬 RE-IMPORTING DATA WITH FULL PRECISION\n');

  try {
    // Test with a small sample first
    const device = {
      name: 'Stem051 - NL 2022 MKB Raak',
      setupId: 1324,
      diameterTDID: 33387,  // Corrected TDID
      sapFlowTDID: 33385,   // Corrected TDID
    };

    const params = {
      setup_id: device.setupId,
      channel: 0,
      after: '2023-03-03T22:00:00',
      before: '2023-03-03T23:00:00'  // Just 1 hour for testing
    };

    console.log('📡 Fetching data from API with full precision...\n');

    // Fetch data from API
    const [diameterResp, sapFlowResp] = await Promise.all([
      phytoSenseService.fetchData(device.diameterTDID, params, 'raw'),
      phytoSenseService.fetchData(device.sapFlowTDID, params, 'raw')
    ]);

    console.log(`Found ${diameterResp.dataPoints} diameter points`);
    console.log(`Found ${sapFlowResp.dataPoints} sap flow points\n`);

    // Show sample of raw API values with full precision
    if (diameterResp.data && diameterResp.data.length > 0) {
      console.log('Sample DIAMETER values from API (full precision):');
      diameterResp.data.slice(0, 5).forEach((point: any) => {
        // Show the EXACT value from API without any formatting
        console.log(`  ${new Date(point.dateTime).toISOString()} → ${point.value} (${typeof point.value})`);
      });
      console.log('');
    }

    if (sapFlowResp.data && sapFlowResp.data.length > 0) {
      console.log('Sample SAP FLOW values from API (full precision):');
      sapFlowResp.data.slice(0, 5).forEach((point: any) => {
        console.log(`  ${new Date(point.dateTime).toISOString()} → ${point.value} (${typeof point.value})`);
      });
      console.log('');
    }

    // Combine data by timestamp
    const dataMap = new Map<string, { diameter?: number; sapFlow?: number }>();

    diameterResp.data?.forEach((point: any) => {
      const timestamp = new Date(point.dateTime).toISOString();
      dataMap.set(timestamp, { diameter: point.value });
    });

    sapFlowResp.data?.forEach((point: any) => {
      const timestamp = new Date(point.dateTime).toISOString();
      const existing = dataMap.get(timestamp) || {};
      dataMap.set(timestamp, { ...existing, sapFlow: point.value });
    });

    console.log('📝 Updating database with full precision values...\n');

    // Update database with FULL PRECISION
    const updateQuery = `
      UPDATE sap_flow
      SET
        sap_flow_value = $1,
        stem_diameter_value = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE timestamp = $3 AND sensor_code = $4
    `;

    let updateCount = 0;
    const client = await database.getClient();

    try {
      await client.query('BEGIN');

      for (const [timestamp, data] of dataMap.entries()) {
        // Use the EXACT numeric values without any rounding
        const result = await client.query(updateQuery, [
          data.sapFlow !== undefined ? data.sapFlow : null,  // Keep exact precision
          data.diameter !== undefined ? data.diameter : null, // Keep exact precision
          timestamp,
          'Stem051'
        ]);

        if (result.rowCount && result.rowCount > 0) {
          updateCount++;
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Updated ${updateCount} records with full precision\n`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Verify the precision was preserved
    console.log('🔍 Verifying precision in database...\n');
    const verifyQuery = `
      SELECT
        timestamp,
        sap_flow_value,
        stem_diameter_value,
        sap_flow_value::text as sap_text,
        stem_diameter_value::text as diam_text
      FROM sap_flow
      WHERE sensor_code = 'Stem051'
        AND timestamp >= '2023-03-03T22:00:00'
        AND timestamp <= '2023-03-03T22:10:00'
      ORDER BY timestamp
      LIMIT 5
    `;

    const verifyResult = await database.query(verifyQuery);

    console.log('Database values after update:');
    verifyResult.rows.forEach((row: any) => {
      console.log(`${row.timestamp.toISOString()}`);
      console.log(`  Sap Flow: ${row.sap_text || 'null'}`);
      console.log(`  Diameter: ${row.diam_text || 'null'}`);
    });

    console.log('\n✅ PRECISION TEST COMPLETE!');
    console.log('\nTo re-import ALL data with full precision:');
    console.log('1. Modify this script to process all devices and date ranges');
    console.log('2. Run the full import (this will take time)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await database.close();
  }
}

// Run the reimport
reimportWithPrecision().catch(console.error);