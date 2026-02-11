/**
 * Clear and Re-import All Data Script
 * This script will:
 * 1. Check the current table structure
 * 2. Clear all existing data
 * 3. Import all available data from PhytoSense API
 */

import { format } from 'date-fns';
import { phytoSenseService } from './src/services/phytosense.service';
import database from './src/utils/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Device configurations with their full date ranges
const DEVICES = [
  { id: 'stem051-2022', name: 'Stem051 - NL 2022 MKB Raak', setupId: 1324, fromDate: '2022-10-19T00:00:00', toDate: '2023-06-01T09:42:23', diameterTDID: 33385, sapFlowTDID: 33387 },
  { id: 'stem127-2022', name: 'Stem127 - NL 2022 MKB Raak', setupId: 1324, fromDate: '2022-10-19T00:00:00', toDate: '2023-06-01T09:42:23', diameterTDID: 33386, sapFlowTDID: 33388 },
  { id: 'stem051-tomato', name: 'Stem051 - NL 2023 Tomato', setupId: 1445, fromDate: '2023-06-23T00:00:00', toDate: '2023-08-25T13:30:00', diameterTDID: 38210, sapFlowTDID: 39916 },
  { id: 'stem136-tomato', name: 'Stem136 - NL 2023 Tomato', setupId: 1445, fromDate: '2023-06-23T00:00:00', toDate: '2023-08-25T13:30:00', diameterTDID: 38211, sapFlowTDID: 39915 },
  { id: 'stem051-cucumber', name: 'Stem051 - NL 2023 Cucumber', setupId: 1445, fromDate: '2023-08-25T13:30:00', toDate: '2023-10-20T00:00:00', diameterTDID: 38210, sapFlowTDID: 39916 },
  { id: 'stem136-cucumber', name: 'Stem136 - NL 2023 Cucumber', setupId: 1445, fromDate: '2023-08-25T13:30:00', toDate: '2023-10-20T00:00:00', diameterTDID: 38211, sapFlowTDID: 39915 },
  { id: 'stem051-2024', name: 'Stem051 - NL 2023-2024 MKB Raak', setupId: 1508, fromDate: '2023-11-01T00:00:00', toDate: '2024-10-15T12:00:00', diameterTDID: 39999, sapFlowTDID: 39987 },
  { id: 'stem136-2024', name: 'Stem136 - NL 2023-2024 MKB Raak', setupId: 1508, fromDate: '2023-11-01T00:00:00', toDate: '2024-10-15T12:00:00', diameterTDID: 40007, sapFlowTDID: 39981 }
];

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        CLEAR AND RE-IMPORT ALL PHYTOSENSE DATA                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  let totalInserted = 0;

  try {
    // Step 1: Check database connection and table structure
    console.log('📊 Step 1: Checking database and table structure...');
    const structureResult = await database.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sap_flow'
      ORDER BY ordinal_position
    `);

    console.log('Current columns in sap_flow table:');
    structureResult.rows.forEach((row: any) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check what the timestamp column is actually called
    const timestampCol = structureResult.rows.find((r: any) =>
      r.column_name === 'timestamp' || r.column_name === 'date_time'
    );

    if (!timestampCol) {
      throw new Error('No timestamp or date_time column found in sap_flow table');
    }

    const TIMESTAMP_COLUMN = timestampCol.column_name;
    console.log(`\n✅ Using timestamp column: ${TIMESTAMP_COLUMN}`);

    // Step 2: Count existing records
    const countResult = await database.query('SELECT COUNT(*) as count FROM sap_flow');
    console.log(`📊 Current records in table: ${countResult.rows[0].count}`);

    // Step 3: Clear existing data
    console.log('\n🗑️  Step 2: Clearing existing data...');
    await database.query('TRUNCATE TABLE sap_flow');
    console.log('✅ All existing data cleared');

    // Step 4: PhytoSense service is already initialized as a singleton
    console.log('\n🔌 Step 3: PhytoSense service ready');

    // Step 5: Import data for each device
    console.log('\n📥 Step 4: Importing data from API...\n');

    for (const device of DEVICES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📡 Processing: ${device.name}`);
      console.log(`   Period: ${device.fromDate.substring(0,10)} to ${device.toDate.substring(0,10)}`);

      const startDate = new Date(device.fromDate);
      const endDate = new Date(device.toDate);
      let deviceRecords = 0;

      // Process in 7-day chunks
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

          // Fetch both diameter and sap flow data
          const [diameterResp, sapFlowResp] = await Promise.all([
            phytoSenseService.fetchData(device.diameterTDID, params, 'raw'),
            phytoSenseService.fetchData(device.sapFlowTDID, params, 'raw')
          ]);

          const diameterData = diameterResp.data || [];
          const sapFlowData = sapFlowResp.data || [];

          // Store in database
          if (diameterData.length > 0 || sapFlowData.length > 0) {
            const inserted = await storeData(device, diameterData, sapFlowData, TIMESTAMP_COLUMN);
            deviceRecords += inserted;
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

      console.log(`   ✅ Device complete: ${deviceRecords} total records`);
      totalInserted += deviceRecords;
    }

    // Step 6: Verify import
    console.log('\n' + '='.repeat(60));
    console.log('📊 Step 5: Verifying import...');

    const finalCount = await database.query('SELECT COUNT(*) as count FROM sap_flow');
    console.log(`Total records in database: ${finalCount.rows[0].count}`);

    // Get sample data to verify structure
    const sampleData = await database.query('SELECT * FROM sap_flow LIMIT 1');
    if (sampleData.rows.length > 0) {
      console.log('\nSample record:');
      const sample = sampleData.rows[0];
      console.log(`  ${TIMESTAMP_COLUMN}: ${sample[TIMESTAMP_COLUMN]}`);
      console.log(`  sensor_code: ${sample.sensor_code}`);
      console.log(`  sap_flow_value: ${sample.sap_flow_value}`);
      console.log(`  stem_diameter_value: ${sample.stem_diameter_value}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORT COMPLETED SUCCESSFULLY!');
    console.log(`📊 Total records imported: ${totalInserted}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await database.close();
    process.exit(0);
  }
}

async function storeData(device: any, diameterData: any[], sapFlowData: any[], timestampColumn: string) {
  const dataMap = new Map();

  // Combine data by timestamp
  diameterData.forEach(point => {
    dataMap.set(point.dateTime, { diameter: point.value });
  });

  sapFlowData.forEach(point => {
    const existing = dataMap.get(point.dateTime) || {};
    dataMap.set(point.dateTime, { ...existing, sapFlow: point.value });
  });

  const sensorCode = device.name.split(' - ')[0];

  const insertQuery = `
    INSERT INTO sap_flow (
      ${timestampColumn}, time, sap_flow_value, sensor_code, device_id,
      device_name, full_device_name, stem_diameter_value,
      is_valid, is_interpolated, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (${timestampColumn}, sensor_code) DO UPDATE
    SET
      sap_flow_value = COALESCE(EXCLUDED.sap_flow_value, sap_flow.sap_flow_value),
      stem_diameter_value = COALESCE(EXCLUDED.stem_diameter_value, sap_flow.stem_diameter_value)
  `;

  let count = 0;
  const client = await database.getClient();

  try {
    await client.query('BEGIN');

    for (const [timestamp, data] of dataMap.entries()) {
      const dateObj = new Date(timestamp);
      await client.query(insertQuery, [
        timestamp,
        format(dateObj, 'HH:mm'),
        data.sapFlow || null,
        sensorCode,
        '0',
        sensorCode,
        device.name,
        data.diameter || null,
        true,
        false,
        new Date()
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

// Run the script
main().catch(console.error);