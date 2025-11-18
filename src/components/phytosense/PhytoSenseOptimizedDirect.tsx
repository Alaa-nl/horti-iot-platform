// PhytoSense Optimized Component - Direct API Access
// Fetches data directly from PhytoSense API without using the database

import React, { useState, useCallback, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';
import PhytoSenseChart from './PhytoSenseChart';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface PhytoSenseOptimizedProps {
  className?: string;
}

// Component uses backend proxy to fetch from PhytoSense API (avoids CORS issues)

// Full device configurations with CORRECTED 2grow-compatible TDIDs
const DEVICES = [
  { id: 'stem051-2022', name: 'Stem051 - NL 2022 MKB Raak', setupId: 1324, fromDate: '2022-10-19T00:00:00', toDate: '2023-06-01T09:42:23', diameterTDID: 33385, sapFlowTDID: 33387, cropType: 'General' },
  { id: 'stem127-2022', name: 'Stem127 - NL 2022 MKB Raak', setupId: 1324, fromDate: '2022-10-19T00:00:00', toDate: '2023-06-01T09:42:23', diameterTDID: 33386, sapFlowTDID: 33388, cropType: 'General' },
  { id: 'stem051-tomato', name: 'Stem051 - NL 2023 Tomato', setupId: 1445, fromDate: '2023-06-23T00:00:00', toDate: '2023-08-25T13:30:00', diameterTDID: 38210, sapFlowTDID: 39916, cropType: 'Tomato' },
  { id: 'stem136-tomato', name: 'Stem136 - NL 2023 Tomato', setupId: 1445, fromDate: '2023-06-23T00:00:00', toDate: '2023-08-25T13:30:00', diameterTDID: 38211, sapFlowTDID: 39915, cropType: 'Tomato' },
  { id: 'stem051-cucumber', name: 'Stem051 - NL 2023 Cucumber', setupId: 1445, fromDate: '2023-08-25T13:30:00', toDate: '2023-10-20T00:00:00', diameterTDID: 38210, sapFlowTDID: 39916, cropType: 'Cucumber' },
  { id: 'stem136-cucumber', name: 'Stem136 - NL 2023 Cucumber', setupId: 1445, fromDate: '2023-08-25T13:30:00', toDate: '2023-10-20T00:00:00', diameterTDID: 38211, sapFlowTDID: 39915, cropType: 'Cucumber' },
  { id: 'stem051-2024', name: 'Stem051 - NL 2023-2024 MKB Raak', setupId: 1508, fromDate: '2023-11-01T00:00:00', toDate: '2024-10-15T12:00:00', diameterTDID: 40007, sapFlowTDID: 39987, cropType: 'General' },  // 2grow-compatible
  { id: 'stem136-2024', name: 'Stem136 - NL 2023-2024 MKB Raak', setupId: 1508, fromDate: '2023-11-01T00:00:00', toDate: '2024-10-15T12:00:00', diameterTDID: 40007, sapFlowTDID: 39981, cropType: 'General' },  // 2grow-compatible
];

type MeasurementType = 'both' | 'diameter' | 'sapflow';

interface ChartDataPoint {
  time: string;
  fullTimestamp: string;
  diameter?: number;
  sapFlow?: number;
}

// Parse XML response from PhytoSense API
function parseXmlResponse(xmlString: string): { dateTime: string; value: number }[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const values: { dateTime: string; value: number }[] = [];
  const valueElements = xmlDoc.getElementsByTagName('DeviceTransformationChannelValue');

  for (let i = 0; i < valueElements.length; i++) {
    const element = valueElements[i];
    const dateTime = element.getAttribute('DateTime');
    const value = element.getAttribute('Value');

    if (dateTime && value) {
      values.push({
        dateTime,
        value: parseFloat(value)
      });
    }
  }

  return values;
}

// Fetch data through backend proxy to avoid CORS issues
async function fetchFromPhytoSenseAPI(
  tdid: number,
  setupId: number,
  startDate: string,
  endDate: string
): Promise<{ dateTime: string; value: number }[]> {
  console.log(`  📡 Fetching TDID ${tdid} via backend proxy`);
  console.log(`     From: ${startDate}`);
  console.log(`     To:   ${endDate}`);

  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Please log in to fetch data');
    }

    // Use backend proxy to avoid CORS
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    const proxyUrl = `${API_URL}/phytosense-proxy/fetch`;

    console.log(`     Proxy URL: ${proxyUrl}`);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tdid,
        setupId,
        startDate,
        endDate
      })
    });

    if (!response.ok) {
      console.error(`    ❌ HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const data = result.data || [];
      console.log(`    ✅ Got ${data.length} data points from backend proxy`);

      // Show first and last data point for debugging
      if (data.length > 0) {
        console.log(`       First: ${data[0].dateTime} = ${data[0].value}`);
        console.log(`       Last:  ${data[data.length - 1].dateTime} = ${data[data.length - 1].value}`);
      }

      return data;
    } else {
      console.log(`    ❌ ${result.message || 'No data available'}`);
      return [];
    }
  } catch (error) {
    console.error(`    ❌ Error fetching from proxy:`, error);
    return [];
  }
}

const PhytoSenseOptimizedDirect: React.FC<PhytoSenseOptimizedProps> = ({ className = '' }) => {
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(6); // Default to most recent device
  const [measurementType, setMeasurementType] = useState<MeasurementType>('both');
  const [dateRange, setDateRange] = useState<'device' | '7days' | '30days' | '90days' | '1year' | 'custom'>('device');
  const [customStartDate, setCustomStartDate] = useState('2023-12-31T00:00');
  const [customEndDate, setCustomEndDate] = useState('2024-01-01T00:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [dataInfo, setDataInfo] = useState<any>(null);

  const selectedDevice = useMemo(() => DEVICES[selectedDeviceIndex], [selectedDeviceIndex]);

  // Calculate date range based on selection
  const getDateRange = useCallback(() => {
    const now = new Date();

    if (dateRange === 'device') {
      return {
        after: selectedDevice.fromDate,
        before: selectedDevice.toDate
      };
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      return {
        after: new Date(customStartDate).toISOString(),
        before: new Date(customEndDate).toISOString()
      };
    }

    // Calculate days back
    let days = 7;
    switch (dateRange) {
      case '30days': days = 30; break;
      case '90days': days = 90; break;
      case '1year': days = 365; break;
    }

    return {
      after: subDays(now, days).toISOString(),
      before: now.toISOString()
    };
  }, [dateRange, customStartDate, customEndDate, selectedDevice]);

  // Fetch data directly from PhytoSense API
  const fetchData = useCallback(async () => {
    if (!selectedDevice) return;

    setLoading(true);
    setError(null);
    setChartData([]);

    try {
      const dates = getDateRange();
      const startDate = new Date(dates.after);
      const endDate = new Date(dates.before);

      console.log(`📊 Fetching data DIRECTLY from PhytoSense API`);
      console.log(`   Raw dates: ${dates.after} to ${dates.before}`);
      console.log(`   Parsed dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`   Device: ${selectedDevice.name}`);
      console.log(`   Diameter TDID: ${selectedDevice.diameterTDID}`);
      console.log(`   SapFlow TDID: ${selectedDevice.sapFlowTDID}`);

      // Check if we're trying to fetch a large date range
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 30) {
        console.log(`   ⚠️ Large date range (${daysDiff} days) - fetching may take some time...`);
      }

      // Fetch both diameter and sap flow data in parallel
      const [diameterData, sapFlowData] = await Promise.all([
        fetchFromPhytoSenseAPI(
          selectedDevice.diameterTDID,
          selectedDevice.setupId,
          dates.after,
          dates.before
        ),
        fetchFromPhytoSenseAPI(
          selectedDevice.sapFlowTDID,
          selectedDevice.setupId,
          dates.after,
          dates.before
        )
      ]);

      // Combine data by timestamp
      const dataMap = new Map<string, ChartDataPoint>();

      // Process diameter data
      diameterData.forEach(point => {
        const timestamp = new Date(point.dateTime);
        const time = format(timestamp, 'MMM dd HH:mm');
        const fullTimestamp = format(timestamp, 'yyyy-MM-dd HH:mm:ss');

        dataMap.set(point.dateTime, {
          time,
          fullTimestamp,
          diameter: point.value,
          sapFlow: undefined
        });
      });

      // Add sap flow data
      sapFlowData.forEach(point => {
        const existing = dataMap.get(point.dateTime);
        if (existing) {
          existing.sapFlow = point.value;
        } else {
          const timestamp = new Date(point.dateTime);
          const time = format(timestamp, 'MMM dd HH:mm');
          const fullTimestamp = format(timestamp, 'yyyy-MM-dd HH:mm:ss');

          dataMap.set(point.dateTime, {
            time,
            fullTimestamp,
            diameter: undefined,
            sapFlow: point.value
          });
        }
      });

      if (dataMap.size === 0) {
        throw new Error('No data available from PhytoSense API for the selected date range.');
      }

      // Filter based on measurement type
      let filteredMap = new Map<string, ChartDataPoint>();

      dataMap.forEach((value, key) => {
        if (measurementType === 'both') {
          filteredMap.set(key, value);
        } else if (measurementType === 'diameter' && value.diameter !== undefined) {
          filteredMap.set(key, value);
        } else if (measurementType === 'sapflow' && value.sapFlow !== undefined) {
          filteredMap.set(key, value);
        }
      });

      // Sort by date
      const sortedData = Array.from(filteredMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(entry => entry[1]);

      setChartData(sortedData);

      // Calculate stats
      const diameterPoints = sortedData.filter(p => p.diameter !== undefined).length;
      const sapFlowPoints = sortedData.filter(p => p.sapFlow !== undefined).length;

      setDataInfo({
        diameterPoints,
        sapFlowPoints,
        dateFrom: format(startDate, 'MMM dd, yyyy HH:mm'),
        dateTo: format(endDate, 'MMM dd, yyyy HH:mm'),
        intervalMinutes: 5,
        source: 'PhytoSense API (via Backend)'
      });

      console.log(`✅ Loaded ${sortedData.length} data points directly from PhytoSense API`);
      console.log(`   Diameter points: ${diameterPoints}`);
      console.log(`   SapFlow points: ${sapFlowPoints}`);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data from PhytoSense API');
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, measurementType, getDateRange]);

  // Test with known working date
  const testKnownDate = () => {
    console.log('🧪 Testing with known working date: December 31, 2023');
    setDateRange('custom');
    setCustomStartDate('2023-12-31T00:00');
    setCustomEndDate('2024-01-01T00:00');
  };

  // Export to Excel
  const handleExport = useCallback(() => {
    if (!chartData.length || !selectedDevice) return;

    try {
      const wb = XLSX.utils.book_new();

      // Data sheet
      const exportData = chartData.map(point => ({
        'Timestamp': point.fullTimestamp || point.time,
        'Diameter (mm)': point.diameter || '',
        'Sap Flow (g/h)': point.sapFlow || ''
      }));
      const wsData = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, wsData, 'Data');

      // Info sheet
      const wsInfo = XLSX.utils.json_to_sheet([
        { Property: 'Device', Value: selectedDevice.name },
        { Property: 'Crop Type', Value: selectedDevice.cropType },
        { Property: 'Date From', Value: dataInfo?.dateFrom || '' },
        { Property: 'Date To', Value: dataInfo?.dateTo || '' },
        { Property: 'Data Source', Value: 'PhytoSense API (Direct)' },
        { Property: 'Interval', Value: '5 minutes' },
        { Property: 'Total Points', Value: chartData.length },
        { Property: 'Export Date', Value: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
      ]);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Info');

      const fileName = `PhytoSense_Direct_${selectedDevice.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  }, [chartData, selectedDevice, dataInfo]);

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">PhytoSense Data (API)</h2>
          <Badge variant="default" className="bg-green-600">
            🔌 API via Backend Proxy
          </Badge>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Device Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Device</label>
          <select
            value={selectedDeviceIndex}
            onChange={(e) => setSelectedDeviceIndex(Number(e.target.value))}
            className="select-elevated"
          >
            {DEVICES.map((device, index) => (
              <option key={device.id} value={index}>
                {device.name}
              </option>
            ))}
          </select>
        </div>

        {/* Measurement Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Measurement</label>
          <select
            value={measurementType}
            onChange={(e) => setMeasurementType(e.target.value as MeasurementType)}
            className="select-elevated"
          >
            <option value="both">Both (Diameter & Sap Flow)</option>
            <option value="diameter">Diameter Only</option>
            <option value="sapflow">Sap Flow Only</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="select-elevated"
          >
            <option value="device">Full Device Period</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
              <input
                type="datetime-local"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>Selected range: {customStartDate ? new Date(customStartDate).toLocaleString() : 'Not set'} to {customEndDate ? new Date(customEndDate).toLocaleString() : 'Not set'}</p>
            <p className="text-xs mt-1">💡 Tip: Click "Test Dec 31, 2023" to use a known working date</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-4">
        <Button
          onClick={fetchData}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? 'Fetching from API...' : 'Fetch Data from API'}
        </Button>
        <Button
          onClick={testKnownDate}
          disabled={loading}
          variant="outline"
          className="border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          Test Dec 31, 2023
        </Button>
        <Button
          onClick={handleExport}
          disabled={!chartData.length}
          variant="outline"
        >
          Export to Excel
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Data Info */}
      {dataInfo && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">Source:</span>
              <p className="text-green-600 dark:text-green-300">{dataInfo.source}</p>
            </div>
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">Period:</span>
              <p className="text-green-600 dark:text-green-300">{dataInfo.dateFrom} - {dataInfo.dateTo}</p>
            </div>
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">Diameter Points:</span>
              <p className="text-green-600 dark:text-green-300">{dataInfo.diameterPoints}</p>
            </div>
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">Sap Flow Points:</span>
              <p className="text-green-600 dark:text-green-300">{dataInfo.sapFlowPoints}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && !loading && (
        <PhytoSenseChart
          data={chartData}
          measurementType={measurementType}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && chartData.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p>Click "Fetch Data from API" to load sensor data directly from PhytoSense</p>
        </div>
      )}
    </Card>
  );
};

export default PhytoSenseOptimizedDirect;