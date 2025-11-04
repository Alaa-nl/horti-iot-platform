/**
 * Test Data Consistency
 * Verify that the data in the sap_flow table matches expected format and values
 */

import database from './src/utils/database';
import dotenv from 'dotenv';
import { format } from 'date-fns';

// Load environment variables
dotenv.config();

async function testDataConsistency() {
  console.log('🔍 Testing Data Consistency in sap_flow table...\n');

  try {
    // 1. Check sample data for Stem051 - March 2, 2023 (from your screenshots)
    console.log('1️⃣ Checking data for March 2, 2023 (Stem051)...');
    const march2Data = await database.query(`
      SELECT
        timestamp,
        time,
        sensor_code,
        sap_flow_value,
        stem_diameter_value,
        device_name,
        full_device_name
      FROM sap_flow
      WHERE sensor_code = 'Stem051'
        AND timestamp >= '2023-03-02 23:00:00'
        AND timestamp <= '2023-03-03 01:00:00'
      ORDER BY timestamp
      LIMIT 20
    `);

    console.log(`Found ${march2Data.rows.length} records for March 2-3, 2023\n`);

    if (march2Data.rows.length > 0) {
      console.log('Sample data:');
      console.log('=============');
      march2Data.rows.slice(0, 5).forEach((row: any) => {
        const diameter = row.stem_diameter_value ? parseFloat(row.stem_diameter_value).toFixed(2) : 'NULL';
        const sapFlow = row.sap_flow_value ? parseFloat(row.sap_flow_value).toFixed(2) : 'NULL';
        console.log(`${format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm:ss')} | Diameter: ${diameter} | Sap Flow: ${sapFlow} | Device: ${row.device_name}`);
      });
    }

    // 2. Check data distribution across devices
    console.log('\n2️⃣ Data distribution across devices...');
    const deviceDistribution = await database.query(`
      SELECT
        sensor_code,
        COUNT(*) as record_count,
        MIN(timestamp) as earliest,
        MAX(timestamp) as latest,
        AVG(stem_diameter_value) as avg_diameter,
        AVG(sap_flow_value) as avg_sap_flow
      FROM sap_flow
      GROUP BY sensor_code
      ORDER BY sensor_code
    `);

    console.log('\nDevice Statistics:');
    console.log('==================');
    deviceDistribution.rows.forEach((row: any) => {
      console.log(`\n${row.sensor_code}:`);
      console.log(`  Records: ${row.record_count}`);
      console.log(`  Period: ${format(new Date(row.earliest), 'yyyy-MM-dd')} to ${format(new Date(row.latest), 'yyyy-MM-dd')}`);
      console.log(`  Avg Diameter: ${row.avg_diameter ? parseFloat(row.avg_diameter).toFixed(2) : 'N/A'} mm`);
      console.log(`  Avg Sap Flow: ${row.avg_sap_flow ? parseFloat(row.avg_sap_flow).toFixed(2) : 'N/A'} g/h`);
    });

    // 3. Check for data gaps (should be 5-minute intervals)
    console.log('\n3️⃣ Checking data intervals for Stem051...');
    const intervalCheck = await database.query(`
      WITH time_diffs AS (
        SELECT
          timestamp,
          LAG(timestamp) OVER (ORDER BY timestamp) as prev_timestamp,
          EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY timestamp))) / 60 as minutes_diff
        FROM sap_flow
        WHERE sensor_code = 'Stem051'
          AND timestamp >= '2023-03-01'
          AND timestamp <= '2023-03-02'
        ORDER BY timestamp
      )
      SELECT
        minutes_diff,
        COUNT(*) as occurrences
      FROM time_diffs
      WHERE minutes_diff IS NOT NULL
      GROUP BY minutes_diff
      ORDER BY occurrences DESC
      LIMIT 10
    `);

    console.log('\nTime interval distribution:');
    console.log('===========================');
    intervalCheck.rows.forEach((row: any) => {
      console.log(`${row.minutes_diff} minutes: ${row.occurrences} occurrences`);
    });

    // 4. Compare specific timestamps with your screenshots
    console.log('\n4️⃣ Verifying specific values from screenshots...');
    const specificChecks = [
      { timestamp: '2023-03-02 23:00:00', expectedDiameter: 4.49 },
      { timestamp: '2023-03-02 23:00:50', expectedDiameter: 4.65 },
      { timestamp: '2023-03-02 23:01:40', expectedDiameter: 5.44 },
      { timestamp: '2023-03-02 23:05:50', expectedDiameter: 7.06 },
    ];

    for (const check of specificChecks) {
      const result = await database.query(`
        SELECT timestamp, stem_diameter_value, sap_flow_value
        FROM sap_flow
        WHERE sensor_code = 'Stem051'
          AND timestamp = $1
      `, [check.timestamp]);

      if (result.rows.length > 0) {
        const actual = result.rows[0].stem_diameter_value ? parseFloat(result.rows[0].stem_diameter_value) : null;
        const match = actual && Math.abs(actual - check.expectedDiameter) < 0.01;
        const actualStr = actual ? actual.toFixed(2) : 'NULL';
        console.log(`${check.timestamp}: Expected ${check.expectedDiameter}, Got ${actualStr} ${match ? '✅' : '❌'}`);
      } else {
        console.log(`${check.timestamp}: No data found ❌`);
      }
    }

    // 5. Check for NULL values
    console.log('\n5️⃣ Checking for NULL values...');
    const nullCheck = await database.query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(sap_flow_value) as sap_flow_count,
        COUNT(stem_diameter_value) as diameter_count,
        COUNT(*) - COUNT(sap_flow_value) as null_sap_flow,
        COUNT(*) - COUNT(stem_diameter_value) as null_diameter
      FROM sap_flow
      WHERE timestamp >= '2023-03-01'
        AND timestamp <= '2023-03-31'
    `);

    const nullData = nullCheck.rows[0];
    console.log(`Total records: ${nullData.total_records}`);
    console.log(`Records with sap flow: ${nullData.sap_flow_count} (${((nullData.sap_flow_count / nullData.total_records) * 100).toFixed(1)}%)`);
    console.log(`Records with diameter: ${nullData.diameter_count} (${((nullData.diameter_count / nullData.total_records) * 100).toFixed(1)}%)`);

    console.log('\n✅ Data consistency check complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await database.close();
  }
}

// Run the test
testDataConsistency().catch(console.error);