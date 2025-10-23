// PhytoSense Data Panel Component V2 - Optimized Version
// Clean implementation with better performance and error handling

import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import phytoSenseService, { PhytoSenseResponse } from '../../services/phytoSenseService';
import excelExportService, { ExportData } from '../../utils/excelExport';
import { logger } from '../../utils/logger';

interface PhytoSensePanelV2Props {
  className?: string;
}

interface ChartDataPoint {
  time: string;
  diameter?: number;
  sapFlow?: number;
}

type MeasurementType = 'diameter' | 'sapFlow' | 'both';
type DateRangePreset = '7days' | '14days' | '30days' | 'custom';

const PhytoSensePanelV2: React.FC<PhytoSensePanelV2Props> = ({ className = '' }) => {
  // State management - initialized with defaults to prevent unnecessary re-renders
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number>(0);
  const [measurementType, setMeasurementType] = useState<MeasurementType>('both');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [lastFetchedData, setLastFetchedData] = useState<{
    diameter?: PhytoSenseResponse;
    sapFlow?: PhytoSenseResponse;
  }>({});

  // Get all devices - memoized to prevent recreation
  const devices = useMemo(() => phytoSenseService.getAllDevices(), []);

  // Get selected device
  const selectedDevice = useMemo(() =>
    devices[selectedDeviceIndex] || null,
    [devices, selectedDeviceIndex]
  );

  // Calculate date range - memoized
  const dateRange = useMemo(() => {
    if (dateRangePreset === 'custom' && customStartDate && customEndDate) {
      return {
        from: new Date(customStartDate).toISOString(),
        till: new Date(customEndDate).toISOString()
      };
    }

    const now = new Date();
    let days = 7;
    switch (dateRangePreset) {
      case '14days': days = 14; break;
      case '30days': days = 30; break;
      default: days = 7;
    }

    const startDate = startOfDay(subDays(now, days));
    const endDate = endOfDay(now);

    return {
      after: startDate.toISOString(),
      before: endDate.toISOString()
    };
  }, [dateRangePreset, customStartDate, customEndDate]);

  // Combine data for chart - pure function
  const combineDataForChart = useCallback((
    diameterResp: PhytoSenseResponse | null,
    sapFlowResp: PhytoSenseResponse | null
  ): ChartDataPoint[] => {
    const dataMap = new Map<string, ChartDataPoint>();

    // Add diameter data
    if (diameterResp?.values) {
      // Limit to last 100 points for performance
      const diameterValues = diameterResp.values.slice(-100);
      diameterValues.forEach(point => {
        const time = format(new Date(point.dateTime), 'MMM dd HH:mm');
        dataMap.set(point.dateTime, {
          time,
          diameter: point.value
        });
      });
    }

    // Add sap flow data
    if (sapFlowResp?.values) {
      // Limit to last 100 points for performance
      const sapFlowValues = sapFlowResp.values.slice(-100);
      sapFlowValues.forEach(point => {
        const time = format(new Date(point.dateTime), 'MMM dd HH:mm');
        const existing = dataMap.get(point.dateTime);
        if (existing) {
          existing.sapFlow = point.value;
        } else {
          dataMap.set(point.dateTime, {
            time,
            sapFlow: point.value
          });
        }
      });
    }

    // Sort by date and return
    return Array.from(dataMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(entry => entry[1]);
  }, []);

  // Fetch data - with proper error handling and no infinite loops
  const handleFetchData = useCallback(async () => {
    if (!selectedDevice) {
      setError('Please select a device');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const promises: Promise<PhytoSenseResponse>[] = [];
      const fetchTypes: ('diameter' | 'sapFlow')[] = [];

      // Only fetch what we need
      if (measurementType === 'diameter' || measurementType === 'both') {
        promises.push(phytoSenseService.fetchDiameterData(selectedDevice, dateRange));
        fetchTypes.push('diameter');
      }
      if (measurementType === 'sapFlow' || measurementType === 'both') {
        promises.push(phytoSenseService.fetchSapFlowData(selectedDevice, dateRange));
        fetchTypes.push('sapFlow');
      }

      const results = await Promise.all(promises);

      // Store fetched data
      const fetchedData: typeof lastFetchedData = {};
      fetchTypes.forEach((type, index) => {
        fetchedData[type] = results[index];
      });

      setLastFetchedData(fetchedData);

      // Combine data for chart
      const combinedData = combineDataForChart(
        fetchedData.diameter || null,
        fetchedData.sapFlow || null
      );

      setChartData(combinedData);

      logger.info('Data fetched successfully', {
        device: selectedDevice.name,
        dataPoints: combinedData.length
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      logger.error('Error fetching PhytoSense data:', err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, measurementType, dateRange, combineDataForChart]);

  // Handle Excel export
  const handleExport = useCallback(() => {
    if (!selectedDevice || !lastFetchedData) {
      setError('No data available to export');
      return;
    }

    const exportDataArray: ExportData[] = [];
    const metadata = {
      setupId: selectedDevice.setupId,
      cropType: selectedDevice.cropType,
      exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      dateRange: {
        start: dateRange.from || dateRange.after || '',
        end: dateRange.till || dateRange.before || ''
      }
    };

    if (lastFetchedData.diameter?.values?.length) {
      exportDataArray.push({
        deviceName: selectedDevice.name,
        measurementType: 'Diameter',
        data: lastFetchedData.diameter.values,
        metadata: {
          ...metadata,
          tdid: selectedDevice.diameterTDID,
          channelId: selectedDevice.diameterChannelId
        }
      });
    }

    if (lastFetchedData.sapFlow?.values?.length) {
      exportDataArray.push({
        deviceName: selectedDevice.name,
        measurementType: 'Sap Flow',
        data: lastFetchedData.sapFlow.values,
        metadata: {
          ...metadata,
          tdid: selectedDevice.sapFlowTDID,
          channelId: selectedDevice.sapFlowChannelId
        }
      });
    }

    if (exportDataArray.length === 0) {
      setError('No data available to export');
      return;
    }

    try {
      if (exportDataArray.length === 1) {
        excelExportService.exportSingleDevice(exportDataArray[0]);
      } else {
        excelExportService.exportMultipleDevices(exportDataArray);
      }
    } catch (err) {
      setError('Failed to export data');
      logger.error('Export error:', err);
    }
  }, [selectedDevice, lastFetchedData, dateRange]);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PhytoSense (2grow) Data</h2>
          <p className="text-sm text-gray-600 mt-1">Plant monitoring data visualization</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFetchData}
            disabled={loading || !selectedDevice}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Loading...
              </>
            ) : (
              <>
                <span>🔄</span>
                Fetch Data
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={loading || chartData.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span>📊</span>
            Export to Excel
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Device Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Device
          </label>
          <select
            value={selectedDeviceIndex}
            onChange={(e) => setSelectedDeviceIndex(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {devices.map((device, index) => (
              <option key={index} value={index}>
                {device.name} {device.toDate && new Date(device.toDate) < new Date() ? '(Historical)' : '(Active)'}
              </option>
            ))}
          </select>
        </div>

        {/* Measurement Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Measurement Type
          </label>
          <select
            value={measurementType}
            onChange={(e) => setMeasurementType(e.target.value as MeasurementType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="both">Both (Diameter & Sap Flow)</option>
            <option value="diameter">Diameter Only</option>
            <option value="sapFlow">Sap Flow Only</option>
          </select>
        </div>

        {/* Date Range Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={dateRangePreset}
            onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="14days">Last 14 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {dateRangePreset === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="datetime-local"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </p>
        </div>
      )}

      {/* Info Panel */}
      {selectedDevice && !loading && chartData.length === 0 && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-700">
            Click "Fetch Data" to load data for {selectedDevice.name}
          </p>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div>
          <div className="mb-4 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Device:</span>
                <span className="ml-2 font-semibold">{selectedDevice?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Crop Type:</span>
                <span className="ml-2 font-semibold">{selectedDevice?.cropType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Data Points:</span>
                <span className="ml-2 font-semibold">{chartData.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Setup ID:</span>
                <span className="ml-2 font-semibold">{selectedDevice?.setupId}</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
                interval="preserveStartEnd"
              />
              {measurementType !== 'sapFlow' && (
                <YAxis
                  yAxisId="diameter"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  stroke="#10B981"
                  label={{ value: 'Diameter (mm)', angle: -90, position: 'insideLeft' }}
                />
              )}
              {measurementType !== 'diameter' && (
                <YAxis
                  yAxisId="sapFlow"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#3B82F6"
                  label={{ value: 'Sap Flow (g/h)', angle: 90, position: 'insideRight' }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#111827', fontWeight: 'bold' }}
              />
              <Legend />
              {(measurementType === 'diameter' || measurementType === 'both') && (
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
              {(measurementType === 'sapFlow' || measurementType === 'both') && (
                <Line
                  yAxisId="sapFlow"
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
    </div>
  );
};

export default PhytoSensePanelV2;