/**
 * Test PhytoSense API directly
 * Verify what data the API returns for diameter vs sap flow
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

import { phytoSenseService } from './src/services/phytosense.service';

async function testPhytoSenseAPI() {
  console.log('🔍 Testing PhytoSense API directly...\n');

  try {
    // Test device: Stem051 - NL 2022 MKB Raak (active in March 2023)
    const device = {
      name: 'Stem051 - NL 2022 MKB Raak',
      setupId: 1324,
      diameterTDID: 33385,  // TDID for diameter measurements
      sapFlowTDID: 33387,   // TDID for sap flow measurements
    };

    console.log('📡 Device: ' + device.name);
    console.log('   Diameter TDID: ' + device.diameterTDID);
    console.log('   Sap Flow TDID: ' + device.sapFlowTDID);
    console.log('');

    // Fetch a small sample for March 2, 2023
    const params = {
      setup_id: device.setupId,
      channel: 0,
      after: '2023-03-02T23:00:00',
      before: '2023-03-02T23:10:00'  // Just 10 minutes of data
    };

    console.log('1️⃣ Fetching DIAMETER data (TDID: ' + device.diameterTDID + ')...');
    const diameterResponse = await phytoSenseService.fetchData(
      device.diameterTDID,
      params,
      'raw'
    );

    console.log(`   Found ${diameterResponse.dataPoints} diameter measurements\n`);

    if (diameterResponse.data && diameterResponse.data.length > 0) {
      console.log('   First 5 diameter values:');
      diameterResponse.data.slice(0, 5).forEach((point: any) => {
        const date = new Date(point.dateTime);
        console.log(`   ${date.toISOString()} → ${point.value}`);
      });
    }

    console.log('\n2️⃣ Fetching SAP FLOW data (TDID: ' + device.sapFlowTDID + ')...');
    const sapFlowResponse = await phytoSenseService.fetchData(
      device.sapFlowTDID,
      params,
      'raw'
    );

    console.log(`   Found ${sapFlowResponse.dataPoints} sap flow measurements\n`);

    if (sapFlowResponse.data && sapFlowResponse.data.length > 0) {
      console.log('   First 5 sap flow values:');
      sapFlowResponse.data.slice(0, 5).forEach((point: any) => {
        const date = new Date(point.dateTime);
        console.log(`   ${date.toISOString()} → ${point.value}`);
      });
    }

    // Compare the values with what we expect
    console.log('\n3️⃣ Comparing with expected values from screenshots:');
    console.log('   Expected at 2023-03-02 23:00:00:');
    console.log('   - Diameter: 4.49 (from your screenshot)');

    const diameterAt2300 = diameterResponse.data.find(
      (p: any) => new Date(p.dateTime).toISOString() === '2023-03-02T23:00:00.000Z'
    );
    const sapFlowAt2300 = sapFlowResponse.data.find(
      (p: any) => new Date(p.dateTime).toISOString() === '2023-03-02T23:00:00.000Z'
    );

    console.log('\n   Actual from API:');
    console.log(`   - Diameter value: ${diameterAt2300?.value || 'NOT FOUND'}`);
    console.log(`   - Sap Flow value: ${sapFlowAt2300?.value || 'NOT FOUND'}`);

    if (diameterAt2300?.value === 4.49) {
      console.log('\n   ❌ ERROR: Diameter TDID returns what should be sap flow!');
      console.log('   The TDIDs might be swapped in the configuration!');
    } else if (sapFlowAt2300?.value === 4.49) {
      console.log('\n   ❌ ERROR: Sap Flow TDID returns what should be diameter!');
      console.log('   The TDIDs are definitely swapped!');
    }

    console.log('\n✅ API test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPhytoSenseAPI().catch(console.error);