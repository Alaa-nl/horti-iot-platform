// PhytoSense Optimized Component - Raw Data Display
// Shows exact 5-minute interval sensor data without any aggregation

import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';

interface PhytoSenseOptimizedProps {
  className?: string;
}

// Full device configurations including historical data - CORRECTED TDIDs
const DEVICES = [
  { id: 'stem051-2022', name: 'Stem051 - NL 2022 MKB Raak', setupId: 1324, fromDate: '2022-10-19T00:00:00', toDate: '2023-06-01T09:42:23', diameterTDID: 33387, sapFlowTDID: 33385, cropType: 'General' },
  { id: 'stem127-2022', name: 'Stem127 - NL 2022 MKB Raak', setupId: 1324, fromDate: '2022-10-19T00:00:00', toDate: '2023-06-01T09:42:23', diameterTDID: 33388, sapFlowTDID: 33386, cropType: 'General' },
  { id: 'stem051-tomato', name: 'Stem051 - NL 2023 Tomato', setupId: 1445, fromDate: '2023-06-23T00:00:00', toDate: '2023-08-25T13:30:00', diameterTDID: 39916, sapFlowTDID: 38210, cropType: 'Tomato' },
  { id: 'stem136-tomato', name: 'Stem136 - NL 2023 Tomato', setupId: 1445, fromDate: '2023-06-23T00:00:00', toDate: '2023-08-25T13:30:00', diameterTDID: 39915, sapFlowTDID: 38211, cropType: 'Tomato' },
  { id: 'stem051-cucumber', name: 'Stem051 - NL 2023 Cucumber', setupId: 1445, fromDate: '2023-08-25T13:30:00', toDate: '2023-10-20T00:00:00', diameterTDID: 39916, sapFlowTDID: 38210, cropType: 'Cucumber' },
  { id: 'stem136-cucumber', name: 'Stem136 - NL 2023 Cucumber', setupId: 1445, fromDate: '2023-08-25T13:30:00', toDate: '2023-10-20T00:00:00', diameterTDID: 39915, sapFlowTDID: 38211, cropType: 'Cucumber' },
  { id: 'stem051-2024', name: 'Stem051 - NL 2023-2024 MKB Raak', setupId: 1508, fromDate: '2023-11-01T00:00:00', toDate: '2024-10-15T12:00:00', diameterTDID: 39987, sapFlowTDID: 39999, cropType: 'General' },
  { id: 'stem136-2024', name: 'Stem136 - NL 2023-2024 MKB Raak', setupId: 1508, fromDate: '2023-11-01T00:00:00', toDate: '2024-10-15T12:00:00', diameterTDID: 39981, sapFlowTDID: 40007, cropType: 'General' },
];

type MeasurementType = 'both' | 'diameter' | 'sapflow';

interface ChartDataPoint {
  time: string;
  fullTimestamp: string;  // Store full timestamp for display
  diameter?: number;
  sapFlow?: number;
}

const PhytoSenseOptimized: React.FC<PhytoSenseOptimizedProps> = ({ className = '' }) => {
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(6); // Default to most recent device
  const [measurementType, setMeasurementType] = useState<MeasurementType>('both');
  const [dateRange, setDateRange] = useState<'device' | '7days' | '30days' | '90days' | '1year' | 'custom'>('device');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  // Removed aggregationMode - always fetch raw data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [dataInfo, setDataInfo] = useState<{
    diameterPoints: number;
    sapFlowPoints: number;
    dateFrom: string;
    dateTo: string;
    intervalMinutes: number; // Show actual data interval
  } | null>(null);

  const selectedDevice = useMemo(() => DEVICES[selectedDeviceIndex], [selectedDeviceIndex]);

  // Removed aggregation calculation - always fetch raw data

  // Get date range for API call
  const getDateRange = useCallback((): { after: string; before: string } => {
    const now = new Date();

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return {
        after: new Date(customStartDate).toISOString(),
        before: new Date(customEndDate).toISOString()
      };
    }

    if (dateRange === 'device') {
      return {
        after: selectedDevice.fromDate,
        before: selectedDevice.toDate
      };
    }

    let days = 7;
    switch (dateRange) {
      case '7days': days = 7; break;
      case '30days': days = 30; break;
      case '90days': days = 90; break;
      case '1year': days = 365; break;
    }

    return {
      after: subDays(now, days).toISOString(),
      before: now.toISOString()
    };
  }, [dateRange, customStartDate, customEndDate, selectedDevice]);

  // Fetch data from backend - using DATABASE for historical data (>5 mins old)
  const fetchData = useCallback(async () => {
    if (!selectedDevice) return;

    setLoading(true);
    setError(null);
    setChartData([]);

    try {
      // Get auth token (your app uses 'auth_token' key)
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please log in to view data');
        setLoading(false);
        return;
      }

      const dates = getDateRange();
      const startDate = new Date(dates.after);
      const endDate = new Date(dates.before);

      console.log(`📊 Fetching data from YOUR DATABASE (${dates.after} to ${dates.before})`);

      // Get API URL from environment
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

      // Extract sensor code from device name (e.g., "Stem051 - NL 2023 Tomato" -> "Stem051")
      const sensorCode = selectedDevice.name.split(' - ')[0];

      // FETCH FROM DATABASE - All historical data comes from YOUR database
      const databaseUrl = `${API_URL}/sensors/data?sensorCode=${sensorCode}&startDate=${dates.after}&endDate=${dates.before}&limit=50000`;

      const response = await fetch(databaseUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch data from database');
      }

      // Process database results
      const dataPoints = result.data || [];

      if (dataPoints.length === 0) {
        throw new Error('No data available for this sensor in the selected date range.');
      }

      // Filter data based on measurement type
      const filteredData = dataPoints.filter((point: any) => {
        if (measurementType === 'both') return true;
        if (measurementType === 'diameter') return point.diameter !== null;
        if (measurementType === 'sapflow') return point.sapFlow !== null;
        return true;
      });

      // Create chart data from database results
      const dataMap = new Map<string, ChartDataPoint>();

      filteredData.forEach((point: any) => {
        const timestamp = new Date(point.timestamp);
        const time = format(timestamp, 'MMM dd HH:mm');
        const fullTimestamp = format(timestamp, 'yyyy-MM-dd HH:mm:ss');

        dataMap.set(point.timestamp, {
          time,
          fullTimestamp,
          diameter: point.diameter,
          sapFlow: point.sapFlow
        });
      });

      // Sort by date
      const sortedData = Array.from(dataMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(entry => entry[1]);

      setChartData(sortedData);
      setDataInfo({
        diameterPoints: filteredData.filter((p: any) => p.diameter !== null).length,
        sapFlowPoints: filteredData.filter((p: any) => p.sapFlow !== null).length,
        dateFrom: format(startDate, 'MMM dd, yyyy HH:mm'),
        dateTo: format(endDate, 'MMM dd, yyyy HH:mm'),
        intervalMinutes: 5 // Database stores 5-minute interval raw data
      });

      console.log(`✅ Loaded ${sortedData.length} data points from YOUR DATABASE (5-min intervals)`);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, measurementType, getDateRange]);

  // Export to Excel - Quick export (displayed data)
  const exportQuick = useCallback(() => {
    if (chartData.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Data sheet - include full timestamp
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
        { Property: 'Data Type', Value: 'RAW (No Aggregation)' },
        { Property: 'Interval', Value: '5 minutes' },
        { Property: 'Total Points', Value: chartData.length },
        { Property: 'Export Date', Value: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
      ]);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Info');

      const fileName = `PhytoSense_${selectedDevice.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  }, [chartData, selectedDevice, dataInfo]);

  return (
    <div className={`card-elevated p-6 hover:-translate-y-1 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">PhytoSense Historical Data</h2>
          <div className="badge-info">
            📊 Analysis Tool
          </div>
        </div>
        <p className="text-sm text-gray-600">
          View and export historical sap flow and stem diameter measurements from all devices (2022-2024)
        </p>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Device Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
          <select
            value={selectedDeviceIndex}
            onChange={(e) => setSelectedDeviceIndex(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Measurement</label>
          <select
            value={measurementType}
            onChange={(e) => setMeasurementType(e.target.value as MeasurementType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="both">Both (Diameter & Sap Flow)</option>
            <option value="diameter">Diameter Only</option>
            <option value="sapflow">Sap Flow Only</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="datetime-local"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}

      {/* Database Data Info */}
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-green-900">💾 Data Source: YOUR DATABASE</span>
          <span className="text-xs text-green-700">Historical data • 5-minute intervals • No aggregation</span>
        </div>
        <div className="text-xs text-green-600 mt-1">
          All data older than 5 minutes is served from your local database for speed and reliability
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-6 py-2 bg-horti-green-600 text-white rounded-lg hover:bg-horti-green-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
        <button
          onClick={exportQuick}
          disabled={chartData.length === 0}
          className="px-6 py-2 bg-horti-blue-600 text-white rounded-lg hover:bg-horti-blue-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          Export to Excel
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-700">{error}</p>
        </div>
      )}

      {/* Data Info Panel */}
      {dataInfo && chartData.length > 0 && (
        <div className="bg-horti-green-50 border border-horti-green-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Period:</span>
              <p className="font-semibold text-gray-900">{dataInfo.dateFrom} - {dataInfo.dateTo}</p>
            </div>
            <div>
              <span className="text-gray-600">Data Interval:</span>
              <p className="font-semibold text-gray-900">{dataInfo.intervalMinutes} minutes (RAW)</p>
            </div>
            <div>
              <span className="text-gray-600">Chart Points:</span>
              <p className="font-semibold text-gray-900">{chartData.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Diameter Data:</span>
              <p className="font-semibold text-gray-900">{dataInfo.diameterPoints} points</p>
            </div>
            <div>
              <span className="text-gray-600">Sap Flow Data:</span>
              <p className="font-semibold text-gray-900">{dataInfo.sapFlowPoints} points</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                stroke="#6B7280"
                interval="preserveStartEnd"
              />
              {(measurementType === 'both' || measurementType === 'diameter') && (
                <YAxis
                  yAxisId="diameter"
                  orientation="left"
                  tick={{ fontSize: 11 }}
                  stroke="#10B981"
                  label={{ value: 'Diameter (mm)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
              )}
              {(measurementType === 'both' || measurementType === 'sapflow') && (
                <YAxis
                  yAxisId="sapflow"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  stroke="#3B82F6"
                  label={{ value: 'Sap Flow (g/h)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {(measurementType === 'both' || measurementType === 'diameter') && (
                <Line
                  yAxisId="diameter"
                  type="monotone"
                  dataKey="diameter"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Diameter (mm)"
                />
              )}
              {(measurementType === 'both' || measurementType === 'sapflow') && (
                <Line
                  yAxisId="sapflow"
                  type="monotone"
                  dataKey="sapFlow"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="Sap Flow (g/h)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && chartData.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Select options and click "Fetch Data" to view measurements</p>
        </div>
      )}
    </div>
  );
};

export default PhytoSenseOptimized;
