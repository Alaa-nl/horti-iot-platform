/**
 * Comprehensive Backfill Script
 * Fetches ALL historical data from PhytoSense API and stores in database
 * Run: cd backend && npx ts-node backfillAllData.ts
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

// Run the backfill
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     PHYTOSENSE DATA BACKFILL - COMPLETE HISTORICAL IMPORT     ║');
  console.log('║                                                                ║');
  console.log('║  This will fetch ALL sensor data from October 2022 onwards    ║');
  console.log('║  and store it in your local database for fast access.         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🚀 Starting comprehensive data backfill...');
  console.log(`📊 Will fetch data for ${DEVICES.length} devices`);

  let totalInserted = 0;

  try {
    // Test database connection
    await database.query('SELECT NOW()');
    console.log('✅ Database connection established\n');

    // Initialize PhytoSense service
    await phytoSenseService.initialize();
    console.log('✅ PhytoSense service initialized\n');

    // Process each device
    for (const device of DEVICES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📡 Processing: ${device.name}`);
      console.log(`   Period: ${device.fromDate.substring(0,10)} to ${device.toDate.substring(0,10)}`);

      const startDate = new Date(device.fromDate);
      const endDate = new Date(device.toDate);
      let deviceRecords = 0;

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

          // Fetch both diameter and sap flow data
          const [diameterResp, sapFlowResp] = await Promise.all([
            phytoSenseService.fetchData(device.diameterTDID, params, 'raw'),
            phytoSenseService.fetchData(device.sapFlowTDID, params, 'raw')
          ]);

          const diameterData = diameterResp.data || [];
          const sapFlowData = sapFlowResp.data || [];

          // Store in database
          if (diameterData.length > 0 || sapFlowData.length > 0) {
            const inserted = await storeData(device, diameterData, sapFlowData);
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

    console.log('\n' + '='.repeat(60));
    console.log('✅ BACKFILL COMPLETED SUCCESSFULLY!');
    console.log(`📊 Total records inserted: ${totalInserted}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await database.end();
    process.exit(0);
  }
}

async function storeData(device: any, diameterData: any[], sapFlowData: any[]) {
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
      date_time, time, sap_flow_value, sensor_code, device_id,
      device_name, full_device_name, stem_diameter_value,
      is_valid, is_interpolated, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (date_time, sensor_code) DO UPDATE
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