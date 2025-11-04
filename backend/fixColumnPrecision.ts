/**
 * Fix Column Precision
 * Changes the sap_flow and stem_diameter columns from NUMERIC(10,2) to NUMERIC(15,10)
 * This will allow storing full precision values from the API
 */

import database from './src/utils/database';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function fixColumnPrecision() {
  console.log('🔧 FIXING COLUMN PRECISION\n');
  console.log('Current: NUMERIC(10,2) - only 2 decimal places');
  console.log('Target:  NUMERIC(15,10) - up to 10 decimal places\n');

  try {
    // Step 1: Check current column definitions
    console.log('📊 Current column definitions:');
    const currentDef = await database.query(`
      SELECT
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'sap_flow'
        AND column_name IN ('sap_flow_value', 'stem_diameter_value')
    `);

    currentDef.rows.forEach((row: any) => {
      console.log(`  ${row.column_name}: ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
    });

    // Step 2: ALTER the columns to support more precision
    console.log('\n🔄 Altering column types...\n');

    // Alter sap_flow_value column
    console.log('  Altering sap_flow_value to NUMERIC(15,10)...');
    await database.query(`
      ALTER TABLE sap_flow
      ALTER COLUMN sap_flow_value TYPE NUMERIC(15,10)
    `);
    console.log('  ✅ sap_flow_value altered');

    // Alter stem_diameter_value column
    console.log('  Altering stem_diameter_value to NUMERIC(15,10)...');
    await database.query(`
      ALTER TABLE sap_flow
      ALTER COLUMN stem_diameter_value TYPE NUMERIC(15,10)
    `);
    console.log('  ✅ stem_diameter_value altered');

    // Step 3: Verify the changes
    console.log('\n📊 New column definitions:');
    const newDef = await database.query(`
      SELECT
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'sap_flow'
        AND column_name IN ('sap_flow_value', 'stem_diameter_value')
    `);

    newDef.rows.forEach((row: any) => {
      console.log(`  ${row.column_name}: ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
    });

    // Step 4: Test with a full precision value
    console.log('\n🧪 Testing with full precision value...');

    const testValue = 7.29693165904037;
    await database.query(`
      UPDATE sap_flow
      SET stem_diameter_value = $1
      WHERE timestamp = '2023-03-03T21:00:50.000Z' AND sensor_code = 'Stem051'
    `, [testValue]);

    const verifyResult = await database.query(`
      SELECT
        stem_diameter_value,
        stem_diameter_value::text as text_value
      FROM sap_flow
      WHERE timestamp = '2023-03-03T21:00:50.000Z' AND sensor_code = 'Stem051'
    `);

    const storedValue = verifyResult.rows[0]?.text_value;
    console.log(`  Input:  ${testValue}`);
    console.log(`  Stored: ${storedValue}`);

    if (storedValue && storedValue.includes('7.2969316590')) {
      console.log('  ✅ Full precision preserved!');
    } else {
      console.log('  ⚠️ Precision may still be limited');
    }

    console.log('\n✅ COLUMN PRECISION FIXED!');
    console.log('\nNext steps:');
    console.log('1. Re-import all data from PhytoSense API with full precision');
    console.log('2. Update export functions to show full precision values');
    console.log('3. Test that exports match Let\'s Grow format');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await database.close();
  }
}

// Run the fix
fixColumnPrecision().catch(console.error);