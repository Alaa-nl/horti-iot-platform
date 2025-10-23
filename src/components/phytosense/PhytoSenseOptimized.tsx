// PhytoSense Optimized Component - Smart Data Aggregation
// Handles historical data (2022-2024) without crashes using adaptive resolution

import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, differenceInDays } from 'date-fns';
import * as XLSX from 'xlsx';

interface PhytoSenseOptimizedProps {
  className?: string;
}

// Full device configurations including historical data
const DEVICES = [
  { id: 'stem051-2022', name: 'Stem051 - NL 2022 MKB Raak', setupId: 1324, fromDate: '2022-10-19T00:00:00', toDate: '2023-06-01T09:42:23', diameterTDID: 33385, sapFlowTDID: 33387, cropType: 'General' },
  { id: 'stem127-2022', name: 'Stem127 - NL 2022 MKB Raak', setupId: 1324, fromDate: '2022-10-19T00:00:00', toDate: '2023-06-01T09:42:23', diameterTDID: 33386, sapFlowTDID: 33388, cropType: 'General' },
  { id: 'stem051-tomato', name: 'Stem051 - NL 2023 Tomato', setupId: 1445, fromDate: '2023-06-23T00:00:00', toDate: '2023-08-25T13:30:00', diameterTDID: 38210, sapFlowTDID: 39916, cropType: 'Tomato' },
  { id: 'stem136-tomato', name: 'Stem136 - NL 2023 Tomato', setupId: 1445, fromDate: '2023-06-23T00:00:00', toDate: '2023-08-25T13:30:00', diameterTDID: 38211, sapFlowTDID: 39915, cropType: 'Tomato' },
  { id: 'stem051-cucumber', name: 'Stem051 - NL 2023 Cucumber', setupId: 1445, fromDate: '2023-08-25T13:30:00', toDate: '2023-10-20T00:00:00', diameterTDID: 38210, sapFlowTDID: 39916, cropType: 'Cucumber' },
  { id: 'stem136-cucumber', name: 'Stem136 - NL 2023 Cucumber', setupId: 1445, fromDate: '2023-08-25T13:30:00', toDate: '2023-10-20T00:00:00', diameterTDID: 38211, sapFlowTDID: 39915, cropType: 'Cucumber' },
  { id: 'stem051-2024', name: 'Stem051 - NL 2023-2024 MKB Raak', setupId: 1508, fromDate: '2023-11-01T00:00:00', toDate: '2024-10-15T12:00:00', diameterTDID: 39999, sapFlowTDID: 39987, cropType: 'General' },
  { id: 'stem136-2024', name: 'Stem136 - NL 2023-2024 MKB Raak', setupId: 1508, fromDate: '2023-11-01T00:00:00', toDate: '2024-10-15T12:00:00', diameterTDID: 40007, sapFlowTDID: 39981, cropType: 'General' },
];

type MeasurementType = 'both' | 'diameter' | 'sapflow';
type AggregationMode = 'auto' | 'hourly' | '6hour' | 'daily' | 'weekly';

interface ChartDataPoint {
  time: string;
  diameter?: number;
  sapFlow?: number;
}

const PhytoSenseOptimized: React.FC<PhytoSenseOptimizedProps> = ({ className = '' }) => {
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(6); // Default to most recent device
  const [measurementType, setMeasurementType] = useState<MeasurementType>('both');
  const [dateRange, setDateRange] = useState<'device' | '7days' | '30days' | '90days' | '1year' | 'custom'>('device');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [aggregationMode, setAggregationMode] = useState<AggregationMode>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [dataInfo, setDataInfo] = useState<{
    diameterPoints: number;
    sapFlowPoints: number;
    aggregation: string;
    dateFrom: string;
    dateTo: string;
  } | null>(null);

  const selectedDevice = useMemo(() => DEVICES[selectedDeviceIndex], [selectedDeviceIndex]);

  // Calculate optimal aggregation based on date range
  const calculateAggregation = useCallback((startDate: Date, endDate: Date, mode: AggregationMode): string => {
    if (mode !== 'auto') return mode;

    const days = differenceInDays(endDate, startDate);

    if (days <= 7) return 'hourly'; // ≤ 7 days: hourly averages (max ~168 points)
    if (days <= 30) return 'hourly'; // 8-30 days: hourly (max ~720 points)
    if (days <= 90) return '6hour'; // 31-90 days: 6-hour intervals (max ~360 points)
    if (days <= 365) return 'daily'; // 91-365 days: daily (max ~365 points)
    return 'weekly'; // > 365 days: weekly averages
  }, []);

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

  // Fetch data from backend API with aggregation
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
      const aggMode = calculateAggregation(startDate, endDate, aggregationMode);

      console.log(`Fetching data from ${dates.after} to ${dates.before} with aggregation: ${aggMode}`);

      const promises: Promise<any>[] = [];
      const types: ('diameter' | 'sapflow')[] = [];

      // Fetch diameter data if needed
      if (measurementType === 'both' || measurementType === 'diameter') {
        const diameterUrl = `http://localhost:3001/api/phytosense/data/${selectedDevice.diameterTDID}?setup_id=${selectedDevice.setupId}&channel=0&after=${dates.after}&before=${dates.before}&aggregation=${aggMode}`;
        promises.push(
          fetch(diameterUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(r => r.json())
        );
        types.push('diameter');
      }

      // Fetch sap flow data if needed
      if (measurementType === 'both' || measurementType === 'sapflow') {
        const sapFlowUrl = `http://localhost:3001/api/phytosense/data/${selectedDevice.sapFlowTDID}?setup_id=${selectedDevice.setupId}&channel=0&after=${dates.after}&before=${dates.before}&aggregation=${aggMode}`;
        promises.push(
          fetch(sapFlowUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(r => r.json())
        );
        types.push('sapflow');
      }

      const results = await Promise.all(promises);

      // Process results
      let diameterData: any[] = [];
      let sapFlowData: any[] = [];

      results.forEach((result, index) => {
        if (!result.success) {
          const errorMsg = result.message || result.error || 'Failed to fetch data';
          console.warn(`Warning: ${types[index]} data could not be loaded:`, errorMsg);
          // Continue with partial data instead of throwing error
        } else {
          if (types[index] === 'diameter') {
            diameterData = result.data || [];
          } else {
            sapFlowData = result.data || [];
          }
        }
      });

      // If both datasets failed, then throw error
      if (diameterData.length === 0 && sapFlowData.length === 0) {
        throw new Error('Unable to fetch any data. Please try a different date range or device.');
      }

      // Combine data for chart
      const dataMap = new Map<string, ChartDataPoint>();

      diameterData.forEach(point => {
        const time = format(new Date(point.dateTime), 'MMM dd HH:mm');
        dataMap.set(point.dateTime, { time, diameter: point.value });
      });

      sapFlowData.forEach(point => {
        const time = format(new Date(point.dateTime), 'MMM dd HH:mm');
        const existing = dataMap.get(point.dateTime);
        if (existing) {
          existing.sapFlow = point.value;
        } else {
          dataMap.set(point.dateTime, { time, sapFlow: point.value });
        }
      });

      // Sort by date
      const sortedData = Array.from(dataMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(entry => entry[1]);

      setChartData(sortedData);
      setDataInfo({
        diameterPoints: diameterData.length,
        sapFlowPoints: sapFlowData.length,
        aggregation: aggMode,
        dateFrom: format(startDate, 'MMM dd, yyyy'),
        dateTo: format(endDate, 'MMM dd, yyyy')
      });

      console.log(`Loaded ${sortedData.length} chart points (Diameter: ${diameterData.length}, SapFlow: ${sapFlowData.length})`);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, measurementType, getDateRange, calculateAggregation, aggregationMode]);

  // Export to Excel - Quick export (displayed data)
  const exportQuick = useCallback(() => {
    if (chartData.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Data sheet
      const wsData = XLSX.utils.json_to_sheet(chartData);
      XLSX.utils.book_append_sheet(wb, wsData, 'Data');

      // Info sheet
      const wsInfo = XLSX.utils.json_to_sheet([
        { Property: 'Device', Value: selectedDevice.name },
        { Property: 'Crop Type', Value: selectedDevice.cropType },
        { Property: 'Date From', Value: dataInfo?.dateFrom || '' },
        { Property: 'Date To', Value: dataInfo?.dateTo || '' },
        { Property: 'Aggregation', Value: dataInfo?.aggregation || '' },
        { Property: 'Chart Points', Value: chartData.length },
        { Property: 'Export Date', Value: format(new Date(), 'MMM dd, yyyy HH:mm') }
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
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PhytoSense Data (2grow) - Historical View</h2>
        <p className="text-sm text-gray-600">
          Sap flow and stem diameter measurements with smart aggregation for performance
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
                {device.name} ({device.cropType})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Period: {format(new Date(selectedDevice.fromDate), 'MMM yyyy')} - {format(new Date(selectedDevice.toDate), 'MMM yyyy')}
          </p>
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

      {/* Aggregation Mode (Advanced) */}
      <div className="mb-6">
        <details className="bg-gray-50 rounded-lg p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Advanced: Data Aggregation Mode (Current: {aggregationMode})
          </summary>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
            {(['auto', 'hourly', '6hour', 'daily', 'weekly'] as AggregationMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setAggregationMode(mode)}
                className={`px-3 py-1 rounded text-sm ${
                  aggregationMode === mode
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Auto mode automatically selects optimal aggregation based on date range (hourly for ≤30 days, daily for longer periods)
          </p>
        </details>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
        <button
          onClick={exportQuick}
          disabled={chartData.length === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          Export to Excel
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Data Info Panel */}
      {dataInfo && chartData.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Period:</span>
              <p className="font-semibold text-gray-900">{dataInfo.dateFrom} - {dataInfo.dateTo}</p>
            </div>
            <div>
              <span className="text-gray-600">Aggregation:</span>
              <p className="font-semibold text-gray-900">{dataInfo.aggregation.toUpperCase()}</p>
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
          <p className="text-sm text-gray-500 mt-2">
            All historical data from 2022-2024 is available with smart aggregation
          </p>
        </div>
      )}
    </div>
  );
};

export default PhytoSenseOptimized;
