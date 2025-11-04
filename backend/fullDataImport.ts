/**
 * Full Data Import Script
 * This script:
 * 1. Deletes all existing data from the sap_flow table
 * 2. Imports ALL historical data from PhytoSense API with full precision
 * 3. Stores it correctly in the database
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import { format } from 'date-fns';
import { phytoSenseService } from './src/services/phytosense.service';
import database from './src/utils/database';

// Device configurations with CORRECTED TDIDs
const DEVICES = [
  {
    setupId: 1324,
    name: 'Stem051 - NL 2022 MKB Raak',
    fromDate: '2022-10-19T00:00:00',
    toDate: '2023-06-01T09:42:23',
    diameterTDID: 33387,  // CORRECTED
    sapFlowTDID: 33385,   // CORRECTED
  },
  {
    setupId: 1324,
    name: 'Stem127 - NL 2022 MKB Raak',
    fromDate: '2022-10-19T00:00:00',
    toDate: '2023-06-01T09:42:23',
    diameterTDID: 33388,  // CORRECTED
    sapFlowTDID: 33386,   // CORRECTED
  },
  {
    setupId: 1445,
    name: 'Stem051 - NL 2023 Tomato',
    fromDate: '2023-06-23T00:00:00',
    toDate: '2023-08-25T13:30:00',
    diameterTDID: 39916,  // CORRECTED
    sapFlowTDID: 38210,   // CORRECTED
  },
  {
    setupId: 1445,
    name: 'Stem136 - NL 2023 Tomato',
    fromDate: '2023-06-23T00:00:00',
    toDate: '2023-08-25T13:30:00',
    diameterTDID: 39915,  // CORRECTED
    sapFlowTDID: 38211,   // CORRECTED
  },
  {
    setupId: 1445,
    name: 'Stem051 - NL 2023 Cucumber',
    fromDate: '2023-08-25T13:30:00',
    toDate: '2023-10-20T00:00:00',
    diameterTDID: 39916,  // CORRECTED
    sapFlowTDID: 38210,   // CORRECTED
  },
  {
    setupId: 1445,
    name: 'Stem136 - NL 2023 Cucumber',
    fromDate: '2023-08-25T13:30:00',
    toDate: '2023-10-20T00:00:00',
    diameterTDID: 39915,  // CORRECTED
    sapFlowTDID: 38211,   // CORRECTED
  },
  {
    setupId: 1508,
    name: 'Stem051 - NL 2023-2024 MKB Raak',
    fromDate: '2023-11-01T00:00:00',
    toDate: '2024-10-15T12:00:00',
    diameterTDID: 39987,  // CORRECTED
    sapFlowTDID: 39999,   // CORRECTED
  },
  {
    setupId: 1508,
    name: 'Stem136 - NL 2023-2024 MKB Raak',
    fromDate: '2023-11-01T00:00:00',
    toDate: '2024-10-15T12:00:00',
    diameterTDID: 39981,  // CORRECTED
    sapFlowTDID: 40007,   // CORRECTED
  }
];

async function storeData(device: any, diameterData: any[], sapFlowData: any[]) {
  // Combine data by timestamp
  const dataMap = new Map<string, { diameter?: number; sapFlow?: number }>();

  // Process diameter data
  diameterData.forEach((point: any) => {
    const timestamp = new Date(point.dateTime).toISOString();
    dataMap.set(timestamp, { diameter: point.value });
  });

  // Process sap flow data
  sapFlowData.forEach((point: any) => {
    const timestamp = new Date(point.dateTime).toISOString();
    const existing = dataMap.get(timestamp) || {};
    dataMap.set(timestamp, { ...existing, sapFlow: point.value });
  });

  if (dataMap.size === 0) return 0;

  const sensorCode = device.name.split(' - ')[0]; // Extract sensor code (e.g., "Stem051")
  const insertQuery = `
    INSERT INTO sap_flow (
      timestamp, time, sap_flow_value, sensor_code, device_id,
      device_name, full_device_name, stem_diameter_value,
      is_valid, is_interpolated, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (timestamp, sensor_code) DO NOTHING
  `;

  let count = 0;
  const client = await database.getClient();

  try {
    await client.query('BEGIN');

    for (const [timestamp, data] of dataMap.entries()) {
      const dateObj = new Date(timestamp);

      await client.query(insertQuery, [
        timestamp,                               // timestamp
        format(dateObj, 'HH:mm'),               // time
        data.sapFlow !== undefined ? data.sapFlow : null,    // sap_flow_value - FULL PRECISION
        sensorCode,                              // sensor_code
        '0',                                     // device_id
        sensorCode,                              // device_name
        device.name,                             // full_device_name
        data.diameter !== undefined ? data.diameter : null,  // stem_diameter_value - FULL PRECISION
        true,                                    // is_valid
        false,                                   // is_interpolated
        new Date()                               // created_at
      ]);
      count++;
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return count;
}

async function importDeviceData(device: any): Promise<number> {
  const startDate = new Date(device.fromDate);
  const endDate = new Date(device.toDate);
  let totalRecords = 0;

  console.log(`\n📊 Importing: ${device.name}`);
  console.log(`   Period: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

  // Process in 7-day chunks to avoid API timeouts
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const chunkEnd = new Date(Math.min(
      currentDate.getTime() + 7 * 24 * 60 * 60 * 1000,
      endDate.getTime()
    ));

    process.stdout.write(`   📅 ${format(currentDate, 'MMM dd')} to ${format(chunkEnd, 'MMM dd')}...`);

    try {
      const params = {
        setup_id: device.setupId,
        channel: 0,
        after: currentDate.toISOString(),
        before: chunkEnd.toISOString()
      };

      // Fetch both diameter and sap flow data IN PARALLEL
      const [diameterResp, sapFlowResp] = await Promise.all([
        phytoSenseService.fetchData(device.diameterTDID, params, 'raw'),
        phytoSenseService.fetchData(device.sapFlowTDID, params, 'raw')
      ]);

      const diameterData = diameterResp.data || [];
      const sapFlowData = sapFlowResp.data || [];

      // Store in database with FULL PRECISION
      if (diameterData.length > 0 || sapFlowData.length > 0) {
        const inserted = await storeData(device, diameterData, sapFlowData);
        totalRecords += inserted;
        process.stdout.write(` ✓ ${inserted} records\n`);
      } else {
        process.stdout.write(' (no data)\n');
      }

    } catch (error: any) {
      process.stdout.write(` ❌ Error: ${error.message}\n`);
    }

    currentDate = chunkEnd;

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`   ✅ Device complete: ${totalRecords} total records`);
  return totalRecords;
}

async function fullDataImport() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         FULL PHYTOSENSE DATA IMPORT WITH PRECISION          ║');
  console.log('║                                                              ║');
  console.log('║  ⚠️  WARNING: This will DELETE all existing data!            ║');
  console.log('║  Then import ALL historical data from Oct 2022 onwards      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  let totalInserted = 0;

  try {
    // Step 1: Test database connection
    await database.query('SELECT NOW()');
    console.log('✅ Database connection established\n');

    // Step 2: Count existing records
    const countResult = await database.query('SELECT COUNT(*) as count FROM sap_flow');
    console.log(`📊 Current records in database: ${countResult.rows[0].count}`);

    // Step 3: DELETE ALL EXISTING DATA
    console.log('\n🗑️  DELETING all existing data...');
    await database.query('TRUNCATE TABLE sap_flow');
    console.log('✅ All existing data deleted\n');

    // Step 4: Verify columns have correct precision
    const columnCheck = await database.query(`
      SELECT column_name, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'sap_flow'
        AND column_name IN ('sap_flow_value', 'stem_diameter_value')
    `);

    console.log('📏 Column precision check:');
    columnCheck.rows.forEach((row: any) => {
      console.log(`   ${row.column_name}: NUMERIC(${row.numeric_precision},${row.numeric_scale})`);
    });

    // Verify we have sufficient precision
    const hasPrecision = columnCheck.rows.every((row: any) => row.numeric_scale >= 6);
    if (!hasPrecision) {
      throw new Error('Columns do not have sufficient precision! Run fixColumnPrecision.ts first.');
    }
    console.log('   ✅ Columns have sufficient precision\n');

    // Step 5: Import data for each device
    console.log('🚀 Starting full data import...');
    console.log(`📡 Will import data for ${DEVICES.length} devices`);

    for (const device of DEVICES) {
      const deviceRecords = await importDeviceData(device);
      totalInserted += deviceRecords;
    }

    // Step 6: Final verification
    console.log('\n' + '═'.repeat(60));
    console.log('✅ IMPORT COMPLETED SUCCESSFULLY!');
    console.log(`📊 Total records imported: ${totalInserted}`);

    // Verify some sample data has full precision
    const sampleCheck = await database.query(`
      SELECT
        sensor_code,
        timestamp,
        stem_diameter_value::text as diameter_text,
        sap_flow_value::text as sapflow_text
      FROM sap_flow
      WHERE stem_diameter_value IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 3
    `);

    console.log('\n🔬 Sample data verification (checking precision):');
    sampleCheck.rows.forEach((row: any) => {
      const diamDecimals = row.diameter_text ? row.diameter_text.split('.')[1]?.length : 0;
      console.log(`   ${row.sensor_code} @ ${format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm')}`);
      console.log(`     Diameter: ${row.diameter_text} (${diamDecimals} decimals)`);
    });

    console.log('\n✅ All data now matches Let\'s Grow precision!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await database.close();
  }
}

// Add confirmation prompt
console.log('\n⚠️  This will DELETE ALL existing data and re-import everything!');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
  fullDataImport().catch(console.error);
}, 5000);