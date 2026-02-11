// PhytoSense Optimized Component - Raw Data Display
// Shows exact 5-minute interval sensor data without any aggregation

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
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">PhytoSense Data</h2>
          <Badge variant="default">
            📊 Analysis Tool
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
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <Button
          onClick={fetchData}
          disabled={loading}
          variant="default"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </Button>
        <Button
          onClick={exportQuick}
          disabled={chartData.length === 0}
          variant="secondary"
        >
          Export to Excel
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Data Info Panel */}
      {dataInfo && chartData.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Period</span>
              <p className="font-semibold text-foreground text-sm">{dataInfo.dateFrom} - {dataInfo.dateTo}</p>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Interval</span>
              <p className="font-semibold text-foreground text-sm">{dataInfo.intervalMinutes} min</p>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Points</span>
              <p className="font-semibold text-foreground text-sm">{chartData.length.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Diameter</span>
              <p className="font-semibold text-foreground text-sm">{dataInfo.diameterPoints.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Sap Flow</span>
              <p className="font-semibold text-foreground text-sm">{dataInfo.sapFlowPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart - High Performance uPlot */}
      {chartData.length > 0 && (
        <div className="w-full">
          <PhytoSenseChart
            data={chartData}
            measurementType={measurementType}
            height={500}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && chartData.length === 0 && (
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </Card>
  );
};

export default PhytoSenseOptimized;
