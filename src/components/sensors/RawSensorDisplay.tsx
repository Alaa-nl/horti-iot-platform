// Raw Sensor Display Component - Shows exact sensor readings from database
// Displays raw data at 5-minute intervals without any aggregation
// Data flow: PhytoSense API → Database → This Component

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { sensorDataService, SyncStatus } from '../../services/sensorDataService';
import { AlertCircle, RefreshCw, Download, Clock, Database, Activity } from 'lucide-react';

interface ChartDataPoint {
  time: string;
  fullTime: string;
  diameter?: number | null;
  sapFlow?: number | null;
  sensorCode: string;
}

const RawSensorDisplay: React.FC = () => {
  // State management
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<string>('all');
  const [selectedRange, setSelectedRange] = useState<'hour' | 'day' | 'week'>('day');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Available sensors from sync status
  const availableSensors = syncStatus?.sensors.map(s => s.sensor_code) || [];

  /**
   * Fetch data from database
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get date range based on selection
      const range = sensorDataService.getDateRange(selectedRange);

      // Fetch raw sensor data
      const sensorData = await sensorDataService.fetchSensorData(
        selectedSensor === 'all' ? undefined : selectedSensor,
        range.start,
        range.end,
        selectedRange === 'hour' ? 1000 : selectedRange === 'day' ? 5000 : 20000
      );

      // Format for chart display
      const chartData: ChartDataPoint[] = sensorData.map(point => ({
        time: format(new Date(point.timestamp), selectedRange === 'hour' ? 'HH:mm:ss' : 'MMM dd HH:mm'),
        fullTime: format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        diameter: point.diameter,
        sapFlow: point.sapFlow,
        sensorCode: point.sensorCode
      }));

      // Sort by time (ascending for proper chart display)
      chartData.sort((a, b) => new Date(a.fullTime).getTime() - new Date(b.fullTime).getTime());

      setData(chartData);
      setLastUpdate(new Date());

      // Also fetch sync status
      const status = await sensorDataService.getSyncStatus();
      setSyncStatus(status);

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sensor data');
    } finally {
      setLoading(false);
    }
  }, [selectedSensor, selectedRange]);

  /**
   * Trigger manual sync
   */
  const handleManualSync = async () => {
    try {
      setLoading(true);
      const result = await sensorDataService.triggerSync();
      alert(result.message);
      // Refresh data after sync
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error('Failed to trigger sync:', err);
      alert('Failed to trigger data sync');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export data as CSV
   */
  const handleExport = async () => {
    try {
      const range = sensorDataService.getDateRange(selectedRange);
      await sensorDataService.exportData(
        selectedSensor === 'all' ? undefined : selectedSensor,
        range.start,
        range.end
      );
    } catch (err) {
      console.error('Failed to export data:', err);
      alert('Failed to export data');
    }
  };

  /**
   * Backfill historical data
   */
  const handleBackfill = async () => {
    const days = prompt('Enter number of days to backfill (max 365):', '30');
    if (days) {
      try {
        setLoading(true);
        const result = await sensorDataService.backfillHistoricalData(parseInt(days));
        alert(result.message);
        // Refresh data after backfill
        setTimeout(fetchData, 5000);
      } catch (err) {
        console.error('Failed to backfill:', err);
        alert('Failed to backfill historical data');
      } finally {
        setLoading(false);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 minutes (matching sensor interval)
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchData]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            {payload[0]?.payload?.fullTime}
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Sensor: {payload[0]?.payload?.sensorCode}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value !== null && entry.value !== undefined ? entry.value.toFixed(3) : 'N/A'}
              {entry.name === 'Diameter' ? ' mm' : entry.name === 'Sap Flow' ? ' g/h' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-8 h-8 text-green-600" />
              Raw Sensor Data Display
            </h2>
            <p className="text-gray-600 mt-1">
              Showing exact 5-minute interval readings stored in database (no aggregation)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSync}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleBackfill}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              Backfill Data
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sensor</label>
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Sensors</option>
              {availableSensors.map(sensor => (
                <option key={sensor} value={sensor}>{sensor}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value as 'hour' | 'day' | 'week')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="hour">Last Hour</option>
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Auto-refresh (5 min)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sync Status Panel */}
      {syncStatus && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Data Synchronization Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {syncStatus.sensors.map(sensor => (
              <div key={sensor.sensor_code} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{sensor.sensor_code}</span>
                  {sensor.is_live ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs">
                      <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                      Live
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">Offline</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Records: {sensor.total_records.toLocaleString()}</div>
                  <div>Latest: {format(new Date(sensor.latest_data), 'HH:mm:ss')}</div>
                  <div>
                    {sensorDataService.isLiveData(sensor.latest_data) ? (
                      <span className="text-green-600">Up to date</span>
                    ) : (
                      <span className="text-amber-600">Needs sync</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {syncStatus.isSyncing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-blue-700">Data synchronization in progress...</span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Data Info */}
      {lastUpdate && data.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-600">Data Points:</span>
                <span className="font-semibold text-gray-900 ml-1">{data.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Interval:</span>
                <span className="font-semibold text-gray-900 ml-1">5 minutes (raw)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Last Update:</span>
                <span className="font-semibold text-gray-900 ml-1">
                  {format(lastUpdate, 'HH:mm:ss')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Real-Time Sensor Measurements</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                stroke="#6B7280"
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="diameter"
                orientation="left"
                tick={{ fontSize: 11 }}
                stroke="#10B981"
                label={{
                  value: 'Stem Diameter (mm)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#10B981' }
                }}
              />
              <YAxis
                yAxisId="sapflow"
                orientation="right"
                tick={{ fontSize: 11 }}
                stroke="#3B82F6"
                label={{
                  value: 'Sap Flow (g/h)',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 12, fill: '#3B82F6' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="line"
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line
                yAxisId="diameter"
                type="monotone"
                dataKey="diameter"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Stem Diameter"
                connectNulls
              />
              <Line
                yAxisId="sapflow"
                type="monotone"
                dataKey="sapFlow"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Sap Flow"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Table */}
      {!loading && data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Latest Raw Readings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sensor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diameter (mm)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sap Flow (g/h)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.slice(-20).reverse().map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.fullTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.sensorCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {row.diameter !== null && row.diameter !== undefined ? row.diameter.toFixed(3) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {row.sapFlow !== null && row.sapFlow !== undefined ? row.sapFlow.toFixed(3) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {sensorDataService.isLiveData(row.fullTime) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Historical
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading sensor data...</p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && data.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-4">
            No sensor data found for the selected time range.
          </p>
          <button
            onClick={handleBackfill}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Backfill Historical Data
          </button>
        </div>
      )}
    </div>
  );
};

export default RawSensorDisplay;