// PhytoSense Data Panel Component
// Displays 2grow sensor data with date range selection and Excel export

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import phytoSenseService, { DeviceConfig, PhytoSenseResponse, DateRange } from '../../services/phytoSenseService';
import excelExportService, { ExportData } from '../../utils/excelExport';
import { logger } from '../../utils/logger';

interface PhytoSensePanelProps {
  className?: string;
}

interface ChartDataPoint {
  time: string;
  diameter?: number;
  sapFlow?: number;
}

type MeasurementType = 'diameter' | 'sapFlow' | 'both';
type DateRangePreset = '7days' | '14days' | '30days' | '60days' | 'custom';

const PhytoSensePanel: React.FC<PhytoSensePanelProps> = ({ className = '' }) => {
  // State management
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig | null>(null);
  const [devices, setDevices] = useState<DeviceConfig[]>([]);
  const [measurementType, setMeasurementType] = useState<MeasurementType>('both');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [diameterData, setDiameterData] = useState<PhytoSenseResponse | null>(null);
  const [sapFlowData, setSapFlowData] = useState<PhytoSenseResponse | null>(null);

  // Initialize devices on mount
  useEffect(() => {
    const allDevices = phytoSenseService.getAllDevices();
    setDevices(allDevices);
    if (allDevices.length > 0) {
      setSelectedDevice(allDevices[allDevices.length - 1]); // Select most recent device by default
    }
  }, []);

  // Calculate date range based on preset
  const getDateRange = (): DateRange => {
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
      case '60days': days = 60; break;
      default: days = 7;
    }

    const startDate = startOfDay(subDays(now, days));
    const endDate = endOfDay(now);

    return {
      after: startDate.toISOString(),
      before: endDate.toISOString()
    };
  };

  // Fetch data when device or date range changes
  const fetchData = async () => {
    if (!selectedDevice) return;

    setLoading(true);
    setError(null);

    try {
      const dateRange = getDateRange();
      const promises: Promise<any>[] = [];

      // Fetch based on selected measurement type
      if (measurementType === 'diameter' || measurementType === 'both') {
        promises.push(phytoSenseService.fetchDiameterData(selectedDevice, dateRange));
      }
      if (measurementType === 'sapFlow' || measurementType === 'both') {
        promises.push(phytoSenseService.fetchSapFlowData(selectedDevice, dateRange));
      }

      const results = await Promise.all(promises);

      // Process results
      let diameterResp: PhytoSenseResponse | null = null;
      let sapFlowResp: PhytoSenseResponse | null = null;

      if (measurementType === 'diameter') {
        diameterResp = results[0];
      } else if (measurementType === 'sapFlow') {
        sapFlowResp = results[0];
      } else {
        diameterResp = results[0];
        sapFlowResp = results[1];
      }

      setDiameterData(diameterResp);
      setSapFlowData(sapFlowResp);

      // Combine data for chart
      const combinedData = combineDataForChart(diameterResp, sapFlowResp);
      setChartData(combinedData);

      logger.info('Data fetched successfully', {
        device: selectedDevice.name,
        dataPoints: combinedData.length
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      logger.error('Error fetching PhytoSense data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Combine diameter and sap flow data for chart
  const combineDataForChart = (
    diameterResp: PhytoSenseResponse | null,
    sapFlowResp: PhytoSenseResponse | null
  ): ChartDataPoint[] => {
    const dataMap = new Map<string, ChartDataPoint>();

    // Add diameter data
    if (diameterResp) {
      diameterResp.values.forEach(point => {
        const time = format(new Date(point.dateTime), 'MMM dd HH:mm');
        dataMap.set(point.dateTime, {
          time,
          diameter: point.value
        });
      });
    }

    // Add sap flow data
    if (sapFlowResp) {
      sapFlowResp.values.forEach(point => {
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
  };

  // Handle Excel export
  const handleExport = () => {
    if (!selectedDevice) return;

    const exportDataArray: ExportData[] = [];
    const dateRange = getDateRange();
    const metadata = {
      setupId: selectedDevice.setupId,
      cropType: selectedDevice.cropType,
      exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      dateRange: {
        start: dateRange.from || dateRange.after || '',
        end: dateRange.till || dateRange.before || ''
      }
    };

    if (diameterData && diameterData.values.length > 0) {
      exportDataArray.push({
        deviceName: selectedDevice.name,
        measurementType: 'Diameter',
        data: diameterData.values,
        metadata: {
          ...metadata,
          tdid: selectedDevice.diameterTDID,
          channelId: selectedDevice.diameterChannelId
        }
      });
    }

    if (sapFlowData && sapFlowData.values.length > 0) {
      exportDataArray.push({
        deviceName: selectedDevice.name,
        measurementType: 'Sap Flow',
        data: sapFlowData.values,
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

    if (exportDataArray.length === 1) {
      excelExportService.exportSingleDevice(exportDataArray[0]);
    } else {
      excelExportService.exportMultipleDevices(exportDataArray);
    }
  };

  // Auto-fetch data when dependencies change
  useEffect(() => {
    if (selectedDevice) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice, measurementType, dateRangePreset, customStartDate, customEndDate]);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PhytoSense (2grow) Data</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time plant monitoring data</p>
        </div>
        <button
          onClick={handleExport}
          disabled={loading || chartData.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <span>📊</span>
          Export to Excel
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Device Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Device
          </label>
          <select
            value={selectedDevice?.name || ''}
            onChange={(e) => {
              const device = devices.find(d => d.name === e.target.value);
              setSelectedDevice(device || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Choose a device...</option>
            {devices.map((device, index) => (
              <option key={`device-${index}-${device.setupId}-${device.diameterTDID}-${device.fromDate}`} value={device.name}>
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
            <option value="60days">Last 60 Days</option>
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PhytoSense data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </p>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && chartData.length > 0 && (
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

      {/* No Data State */}
      {!loading && !error && chartData.length === 0 && (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">No data available for the selected parameters</p>
            <p className="text-sm text-gray-500">Try selecting a different device or date range</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhytoSensePanel;