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

// Helper function to parse XML and aggregate data
function parseAndAggregateXML(xmlData, aggregationMode) {
  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, 'text/xml');

  // Extract all data points
  const valueElements = xmlDoc.getElementsByTagName('DeviceTransformationChannelValue');
  const rawData = [];

  for (let i = 0; i < valueElements.length; i++) {
    const element = valueElements[i];
    const dateTime = element.getAttribute('DateTime');
    const value = element.getAttribute('Value');

    if (dateTime && value) {
      rawData.push({
        dateTime: new Date(dateTime),
        value: parseFloat(value)
      });
    }
  }

  // Sort by date
  rawData.sort((a, b) => a.dateTime - b.dateTime);

  console.log(`Parsed ${rawData.length} data points, aggregation mode: ${aggregationMode}`);

  // Apply aggregation based on mode
  if (aggregationMode === 'raw' || !aggregationMode) {
    return rawData;
  }

  const aggregated = [];
  let intervalMs;

  switch (aggregationMode) {
    case 'hourly':
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case '6hour':
      intervalMs = 6 * 60 * 60 * 1000; // 6 hours
      break;
    case 'daily':
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case 'weekly':
      intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
    default:
      return rawData;
  }

  if (rawData.length === 0) return [];

  // Group data by intervals
  let currentBucket = [];
  let bucketStart = rawData[0].dateTime.getTime();

  rawData.forEach(point => {
    const pointTime = point.dateTime.getTime();

    if (pointTime - bucketStart < intervalMs) {
      currentBucket.push(point);
    } else {
      // Calculate average for current bucket
      if (currentBucket.length > 0) {
        const avg = currentBucket.reduce((sum, p) => sum + p.value, 0) / currentBucket.length;
        const bucketMidpoint = new Date(bucketStart + intervalMs / 2);
        aggregated.push({
          dateTime: bucketMidpoint,
          value: parseFloat(avg.toFixed(3))
        });
      }

      // Start new bucket
      bucketStart = Math.floor(pointTime / intervalMs) * intervalMs;
      currentBucket = [point];
    }
  });

  // Add last bucket
  if (currentBucket.length > 0) {
    const avg = currentBucket.reduce((sum, p) => sum + p.value, 0) / currentBucket.length;
    const bucketMidpoint = new Date(bucketStart + intervalMs / 2);
    aggregated.push({
      dateTime: bucketMidpoint,
      value: parseFloat(avg.toFixed(3))
    });
  }

  console.log(`Aggregated to ${aggregated.length} data points`);
  return aggregated;
}

// Proxy endpoint for PhytoSense data with server-side aggregation
app.get('/api/phytosense/data/:dtid', async (req, res) => {
  try {
    const { dtid } = req.params;
    const { aggregation, ...otherParams } = req.query;

    // Build the full URL
    const url = `${PHYTOSENSE_CONFIG.baseUrl}/${PHYTOSENSE_CONFIG.account}/DeviceTransformation/${dtid}`;

    // Add app_key to query params
    const params = {
      app_key: PHYTOSENSE_CONFIG.appKey,
      ...otherParams
    };

    console.log('Proxying request to:', url);
    console.log('With params:', params);
    console.log('Aggregation mode:', aggregation || 'none');

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
      timeout: 60000, // 60 seconds timeout for large data
      maxContentLength: 100000000, // 100MB max
      maxBodyLength: 100000000
    });

    // Always parse and return JSON (even for raw mode)
    const parsedData = parseAndAggregateXML(response.data, aggregation || 'raw');
    res.json({
      success: true,
      aggregation: aggregation || 'raw',
      dataPoints: parsedData.length,
      data: parsedData
    });
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