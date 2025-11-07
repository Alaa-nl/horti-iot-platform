/**
 * Test the PhytoSense proxy endpoint
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testProxy() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('     TESTING PHYTOSENSE PROXY ENDPOINT                         ');
  console.log('════════════════════════════════════════════════════════════════');

  try {
    // First, get an auth token (you'll need to adjust these credentials)
    const authResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@it.com',
      password: 'admin123'
    });

    const token = authResponse.data.token || authResponse.data.data?.token;
    console.log('\n✅ Successfully authenticated');
    console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'Not found'}`);

    // Test the proxy with December 31, 2023
    console.log('\n📡 Testing proxy with December 31, 2023...');

    const proxyResponse = await axios.post(
      'http://localhost:3000/api/phytosense-proxy/fetch',
      {
        tdid: 40007,  // Diameter TDID for stem051
        setupId: 1508,
        startDate: '2023-12-31T00:00:00',
        endDate: '2024-01-01T00:00:00'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (proxyResponse.data.success) {
      const data = proxyResponse.data.data;
      console.log(`\n✅ Proxy successful! Got ${data.length} data points`);

      if (data.length > 0) {
        console.log('\n📊 Sample data:');
        console.log(`   First: ${data[0].dateTime} = ${data[0].value}`);
        console.log(`   Last:  ${data[data.length - 1].dateTime} = ${data[data.length - 1].value}`);

        // Find 21:00:00
        const at2100 = data.find((d: any) => d.dateTime.includes('21:00:00'));
        if (at2100) {
          console.log(`\n🎯 At 21:00:00: ${at2100.value}`);
          console.log(`   Expected from 2grow: 10.11975146`);
        }
      }
    } else {
      console.log(`\n❌ Proxy returned no data: ${proxyResponse.data.message}`);
    }

    // Also test the /test endpoint
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Testing /test endpoint...');

    const testResponse = await axios.get(
      'http://localhost:3000/api/phytosense-proxy/test',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('\nTest endpoint result:', testResponse.data);

  } catch (error: any) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('Test complete!');
  console.log('════════════════════════════════════════════════════════════════');
}

testProxy().catch(console.error);