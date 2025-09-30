const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testGreenhouseCRUD() {
  try {
    console.log('🧪 Testing Greenhouse CRUD Operations\n');

    // Step 1: Login as admin
    console.log('1. 🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@it.com',
      password: 'admin123'
    });

    const { access_token, user } = loginResponse.data.data;
    console.log(`   ✅ Logged in successfully as ${user.email} (${user.role})`);

    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get existing greenhouses
    console.log('\n2. 📊 Fetching existing greenhouses...');
    const getResponse = await axios.get(`${BASE_URL}/greenhouses`, { headers });
    console.log(`   ✅ Found ${getResponse.data.data.count} existing greenhouses`);

    // Step 3: Create a new greenhouse
    console.log('\n3. 🏗️  Creating a new greenhouse...');
    const newGreenhouse = {
      name: 'Test Greenhouse CRUD',
      location: 'Test Farm, Netherlands',
      area_m2: 500,
      crop_type: 'tomato',
      variety: 'Cherry Tomatoes',
      co2_target_ppm: 800,
      temperature_range_c: '20-25°C',
      configuration: {
        automated: true,
        sensors: ['temperature', 'humidity', 'co2']
      }
    };

    const createResponse = await axios.post(`${BASE_URL}/greenhouses`, newGreenhouse, { headers });
    const createdGreenhouse = createResponse.data.data.greenhouse;
    console.log(`   ✅ Greenhouse created successfully: ${createdGreenhouse.name} (ID: ${createdGreenhouse.id})`);

    // Step 4: Update the greenhouse
    console.log('\n4. ✏️  Updating the greenhouse...');
    const updateData = {
      name: 'Updated Test Greenhouse',
      area_m2: 600,
      variety: 'Beef Tomatoes'
    };

    const updateResponse = await axios.put(`${BASE_URL}/greenhouses/${createdGreenhouse.id}`, updateData, { headers });
    const updatedGreenhouse = updateResponse.data.data.greenhouse;
    console.log(`   ✅ Greenhouse updated: ${updatedGreenhouse.name}, Area: ${updatedGreenhouse.area_m2}m²`);

    // Step 5: Get specific greenhouse
    console.log('\n5. 🔍 Fetching specific greenhouse...');
    const getOneResponse = await axios.get(`${BASE_URL}/greenhouses/${createdGreenhouse.id}`, { headers });
    const fetchedGreenhouse = getOneResponse.data.data.greenhouse;
    console.log(`   ✅ Fetched greenhouse: ${fetchedGreenhouse.name} at ${fetchedGreenhouse.location}`);

    // Step 6: Test researcher permissions (if we have another user)
    console.log('\n6. 👨‍🔬 Testing researcher access...');
    // Note: This would require a researcher user to be created first
    console.log('   ℹ️  Skipping researcher test (would need researcher account)');

    // Step 7: Delete the greenhouse (Admin only)
    console.log('\n7. 🗑️  Deleting the test greenhouse...');
    const deleteResponse = await axios.delete(`${BASE_URL}/greenhouses/${createdGreenhouse.id}`, { headers });
    console.log(`   ✅ Greenhouse deleted successfully: ${deleteResponse.data.message}`);

    console.log('\n🎉 All Greenhouse CRUD tests passed!');
    console.log('\n📋 Summary of available operations:');
    console.log('   • GET /api/greenhouses - List all greenhouses (Public)');
    console.log('   • GET /api/greenhouses/:id - Get specific greenhouse (Public)');
    console.log('   • POST /api/greenhouses - Create greenhouse (Admin/Researcher)');
    console.log('   • PUT /api/greenhouses/:id - Update greenhouse (Admin/Researcher)');
    console.log('   • DELETE /api/greenhouses/:id - Delete greenhouse (Admin only)');
    console.log('   • GET /api/greenhouses/:id/sensors - Get sensors (Admin/Researcher/Grower)');
    console.log('   • GET /api/greenhouses/:id/readings - Get readings (Admin/Researcher/Grower)');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// Run the test
testGreenhouseCRUD();