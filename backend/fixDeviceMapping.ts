/**
 * Fix Device TDID Mapping
 * The TDIDs for diameter and sap flow are swapped in the configuration
 * This script corrects the mapping based on actual API responses
 */

import database from './src/utils/database';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// CORRECTED device configurations
// The original configurations had diameter and sap flow TDIDs swapped
const CORRECTED_DEVICES = [
  {
    setupId: 1324,
    name: 'Stem051 - NL 2022 MKB Raak',
    fromDate: '2022-10-19T00:00:00',
    toDate: '2023-06-01T09:42:23',
    diameterTDID: 33387,  // WAS 33385 - SWAPPED!
    sapFlowTDID: 33385,   // WAS 33387 - SWAPPED!
  },
  {
    setupId: 1324,
    name: 'Stem127 - NL 2022 MKB Raak',
    fromDate: '2022-10-19T00:00:00',
    toDate: '2023-06-01T09:42:23',
    diameterTDID: 33388,  // WAS 33386 - SWAPPED!
    sapFlowTDID: 33386,   // WAS 33388 - SWAPPED!
  },
  {
    setupId: 1445,
    name: 'Stem051 - NL 2023 Tomato',
    fromDate: '2023-06-23T00:00:00',
    toDate: '2023-08-25T13:30:00',
    diameterTDID: 39916,  // WAS 38210 - SWAPPED!
    sapFlowTDID: 38210,   // WAS 39916 - SWAPPED!
  },
  {
    setupId: 1445,
    name: 'Stem136 - NL 2023 Tomato',
    fromDate: '2023-06-23T00:00:00',
    toDate: '2023-08-25T13:30:00',
    diameterTDID: 39915,  // WAS 38211 - SWAPPED!
    sapFlowTDID: 38211,   // WAS 39915 - SWAPPED!
  },
  {
    setupId: 1445,
    name: 'Stem051 - NL 2023 Cucumber',
    fromDate: '2023-08-25T13:30:00',
    toDate: '2023-10-20T00:00:00',
    diameterTDID: 39916,  // WAS 38210 - SWAPPED!
    sapFlowTDID: 38210,   // WAS 39916 - SWAPPED!
  },
  {
    setupId: 1445,
    name: 'Stem136 - NL 2023 Cucumber',
    fromDate: '2023-08-25T13:30:00',
    toDate: '2023-10-20T00:00:00',
    diameterTDID: 39915,  // WAS 38211 - SWAPPED!
    sapFlowTDID: 38211,   // WAS 39915 - SWAPPED!
  },
  {
    setupId: 1508,
    name: 'Stem051 - NL 2023-2024 MKB Raak',
    fromDate: '2023-11-01T00:00:00',
    toDate: '2024-10-15T12:00:00',
    diameterTDID: 39987,  // WAS 39999 - SWAPPED!
    sapFlowTDID: 39999,   // WAS 39987 - SWAPPED!
  },
  {
    setupId: 1508,
    name: 'Stem136 - NL 2023-2024 MKB Raak',
    fromDate: '2023-11-01T00:00:00',
    toDate: '2024-10-15T12:00:00',
    diameterTDID: 39981,  // WAS 40007 - SWAPPED!
    sapFlowTDID: 40007,   // WAS 39981 - SWAPPED!
  }
];

async function fixDataMapping() {
  console.log('🔧 FIXING DEVICE TDID MAPPING\n');
  console.log('The original configuration had diameter and sap flow TDIDs swapped.');
  console.log('This script will swap the values in the database to correct the mapping.\n');

  try {
    // First, verify the table structure
    const checkTable = await database.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sap_flow'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.error('❌ Table sap_flow does not exist!');
      return;
    }

    // Count existing records
    const countBefore = await database.query('SELECT COUNT(*) FROM sap_flow');
    console.log(`📊 Records in database: ${countBefore.rows[0].count}\n`);

    // Get sample of data before fix
    console.log('Sample data BEFORE fix:');
    const sampleBefore = await database.query(`
      SELECT timestamp, sensor_code, sap_flow_value, stem_diameter_value
      FROM sap_flow
      WHERE sensor_code = 'Stem051'
        AND timestamp >= '2023-03-02 22:00:00'
        AND timestamp <= '2023-03-02 22:10:00'
      ORDER BY timestamp
      LIMIT 5
    `);

    sampleBefore.rows.forEach((row: any) => {
      console.log(`  ${row.timestamp.toISOString()} | Sap: ${row.sap_flow_value} | Diameter: ${row.stem_diameter_value}`);
    });

    console.log('\n🔄 Swapping sap_flow_value and stem_diameter_value columns...\n');

    // SWAP THE COLUMNS
    const swapQuery = `
      UPDATE sap_flow
      SET
        sap_flow_value = stem_diameter_value,
        stem_diameter_value = sap_flow_value,
        updated_at = CURRENT_TIMESTAMP
    `;

    const result = await database.query(swapQuery);
    console.log(`✅ Updated ${result.rowCount} records\n`);

    // Get sample of data after fix
    console.log('Sample data AFTER fix:');
    const sampleAfter = await database.query(`
      SELECT timestamp, sensor_code, sap_flow_value, stem_diameter_value
      FROM sap_flow
      WHERE sensor_code = 'Stem051'
        AND timestamp >= '2023-03-02 22:00:00'
        AND timestamp <= '2023-03-02 22:10:00'
      ORDER BY timestamp
      LIMIT 5
    `);

    sampleAfter.rows.forEach((row: any) => {
      console.log(`  ${row.timestamp.toISOString()} | Sap: ${row.sap_flow_value} | Diameter: ${row.stem_diameter_value}`);
    });

    // Verify the fix worked
    console.log('\n📋 Verification:');
    const verify = await database.query(`
      SELECT
        AVG(CASE WHEN sap_flow_value IS NOT NULL THEN sap_flow_value ELSE 0 END) as avg_sap,
        AVG(CASE WHEN stem_diameter_value IS NOT NULL THEN stem_diameter_value ELSE 0 END) as avg_diameter
      FROM sap_flow
      WHERE timestamp >= '2023-03-01' AND timestamp <= '2023-03-31'
    `);

    const avgSap = parseFloat(verify.rows[0].avg_sap);
    const avgDiameter = parseFloat(verify.rows[0].avg_diameter);

    console.log(`  Average sap flow: ${avgSap.toFixed(2)} g/h`);
    console.log(`  Average diameter: ${avgDiameter.toFixed(2)} mm`);

    if (avgSap > 10 && avgSap < 50 && avgDiameter > 3 && avgDiameter < 15) {
      console.log('\n✅ VALUES LOOK CORRECT!');
      console.log('  - Sap flow is in expected range (10-50 g/h)');
      console.log('  - Diameter is in expected range (3-15 mm)');
    } else {
      console.log('\n⚠️ Values might still need adjustment');
    }

    console.log('\n🎯 FIX COMPLETED!');
    console.log('\nNext steps:');
    console.log('1. Update phytoSenseService.ts with corrected TDIDs');
    console.log('2. Update dataSync.service.ts with corrected TDIDs');
    console.log('3. Test the API endpoints to verify data is correct');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await database.close();
  }
}

// Run the fix
fixDataMapping().catch(console.error);