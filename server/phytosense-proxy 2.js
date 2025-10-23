// PhytoSense API Proxy Server
// Simple Express server to proxy PhytoSense API requests and handle CORS

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// PhytoSense API configuration
const PHYTOSENSE_CONFIG = {
  baseUrl: 'https://www.phytosense.net/PhytoSense/v1',
  account: 'Pebble',
  appKey: 'e8d9e660e023afc3bb3a03f9a59e8213',
  auth: {
    username: 'aaldrobe',
    password: 'u4E4Zb100a8v'
  }
};

// Enable CORS for all origins (adjust as needed for production)
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Proxy endpoint for PhytoSense data
app.get('/api/phytosense/data/:dtid', async (req, res) => {
  try {
    const { dtid } = req.params;
    const queryParams = req.query;

    // Build the full URL
    const url = `${PHYTOSENSE_CONFIG.baseUrl}/${PHYTOSENSE_CONFIG.account}/DeviceTransformation/${dtid}`;

    // Add app_key to query params
    const params = {
      app_key: PHYTOSENSE_CONFIG.appKey,
      ...queryParams
    };

    console.log('Proxying request to:', url);
    console.log('With params:', params);

    // Make the request to PhytoSense API with Basic Auth
    const response = await axios.get(url, {
      params,
      auth: {
        username: PHYTOSENSE_CONFIG.auth.username,
        password: PHYTOSENSE_CONFIG.auth.password
      },
      headers: {
        'Accept': 'application/xml, text/xml',
        'User-Agent': 'HORTI-IOT-Platform/1.0'
      },
      timeout: 30000, // 30 seconds timeout
      maxContentLength: 50000000, // 50MB max
      maxBodyLength: 50000000
    });

    // Set appropriate headers for XML response
    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (error) {
    console.error('PhytoSense proxy error:', error.message);

    if (error.response) {
      // The request was made and the server responded with a status code
      res.status(error.response.status).json({
        success: false,
        message: `PhytoSense API error: ${error.response.statusText}`,
        error: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        success: false,
        message: 'PhytoSense API is unreachable',
        error: 'No response from PhytoSense API'
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        success: false,
        message: 'Failed to proxy PhytoSense request',
        error: error.message
      });
    }
  }
});

// Get list of available devices
app.get('/api/phytosense/devices', (req, res) => {
  const devices = [
    {
      setupId: 1324,
      name: 'Stem051 - NL 2022 MKB Raak',
      fromDate: '2022-10-19T00:00:00',
      toDate: '2023-06-01T09:42:23',
      diameterTDID: 33385,
      diameterChannelId: 0,
      sapFlowTDID: 33387,
      sapFlowChannelId: 0,
      cropType: 'General'
    },
    {
      setupId: 1324,
      name: 'Stem127 - NL 2022 MKB Raak',
      fromDate: '2022-10-19T00:00:00',
      toDate: '2023-06-01T09:42:23',
      diameterTDID: 33386,
      diameterChannelId: 0,
      sapFlowTDID: 33388,
      sapFlowChannelId: 0,
      cropType: 'General'
    },
    {
      setupId: 1445,
      name: 'Stem051 - NL 2023 Tomato',
      fromDate: '2023-06-23T00:00:00',
      toDate: '2023-08-25T13:30:00',
      diameterTDID: 38210,
      diameterChannelId: 0,
      sapFlowTDID: 39916,
      sapFlowChannelId: 0,
      cropType: 'Tomato'
    },
    {
      setupId: 1445,
      name: 'Stem136 - NL 2023 Tomato',
      fromDate: '2023-06-23T00:00:00',
      toDate: '2023-08-25T13:30:00',
      diameterTDID: 38211,
      diameterChannelId: 0,
      sapFlowTDID: 39915,
      sapFlowChannelId: 0,
      cropType: 'Tomato'
    },
    {
      setupId: 1445,
      name: 'Stem051 - NL 2023 Cucumber',
      fromDate: '2023-08-25T13:30:00',
      toDate: '2023-10-20T00:00:00',
      diameterTDID: 38210,
      diameterChannelId: 0,
      sapFlowTDID: 39916,
      sapFlowChannelId: 0,
      cropType: 'Cucumber'
    },
    {
      setupId: 1445,
      name: 'Stem136 - NL 2023 Cucumber',
      fromDate: '2023-08-25T13:30:00',
      toDate: '2023-10-20T00:00:00',
      diameterTDID: 38211,
      diameterChannelId: 0,
      sapFlowTDID: 39915,
      sapFlowChannelId: 0,
      cropType: 'Cucumber'
    },
    {
      setupId: 1508,
      name: 'Stem051 - NL 2023-2024 MKB Raak',
      fromDate: '2023-11-01T00:00:00',
      toDate: '2024-10-15T12:00:00',
      diameterTDID: 39999,
      diameterChannelId: 0,
      sapFlowTDID: 39987,
      sapFlowChannelId: 0,
      cropType: 'General'
    },
    {
      setupId: 1508,
      name: 'Stem136 - NL 2023-2024 MKB Raak',
      fromDate: '2023-11-01T00:00:00',
      toDate: '2024-10-15T12:00:00',
      diameterTDID: 40007,
      diameterChannelId: 0,
      sapFlowTDID: 39981,
      sapFlowChannelId: 0,
      cropType: 'General'
    }
  ];

  res.json({
    success: true,
    data: devices
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PhytoSense proxy server is running',
    timestamp: new Date().toISOString()
  });
});

// Default error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

const PORT = process.env.PROXY_PORT || 3001;

app.listen(PORT, () => {
  console.log(`PhytoSense proxy server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});