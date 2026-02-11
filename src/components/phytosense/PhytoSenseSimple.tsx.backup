// PhytoSense Simple Panel - Minimal, Safe Implementation
// Focuses on stability and preventing crashes

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';

interface PhytoSenseSimpleProps {
  className?: string;
}

// Simplified device list
const DEVICES = [
  { id: 'stem051-2024', name: 'Stem051 - 2024 Active', setupId: 1508, diameterTDID: 39999, sapFlowTDID: 39987 },
  { id: 'stem136-2024', name: 'Stem136 - 2024 Active', setupId: 1508, diameterTDID: 40007, sapFlowTDID: 39981 },
];

const PhytoSenseSimple: React.FC<PhytoSenseSimpleProps> = ({ className = '' }) => {
  const [selectedDevice, setSelectedDevice] = useState(0);
  const [measurementType, setMeasurementType] = useState<'diameter' | 'sapflow'>('diameter');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [rawData, setRawData] = useState<any>(null);

  const fetchData = async () => {
    const device = DEVICES[selectedDevice];
    if (!device) return;

    setLoading(true);
    setError(null);
    setData([]);

    try {
      // Calculate date range (max 30 days to prevent issues)
      const safeDays = Math.min(days, 30);
      const endDate = new Date();
      const startDate = subDays(endDate, safeDays);

      // Build URL
      const tdid = measurementType === 'diameter' ? device.diameterTDID : device.sapFlowTDID;
      const params = new URLSearchParams({
        setup_id: device.setupId.toString(),
        channel: '0',
        after: startDate.toISOString(),
        before: endDate.toISOString()
      });

      const url = `http://localhost:3003/api/phytosense/data/${tdid}?${params}`;

      console.log('Fetching from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const xmlText = await response.text();

      // Simple XML parsing
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid data format');
      }

      // Extract values (max 50 points for safety)
      const valueElements = xmlDoc.querySelectorAll('DeviceTransformationChannelValue');
      const values: any[] = [];

      // Sample data to prevent too many points
      const step = Math.max(1, Math.floor(valueElements.length / 50));

      valueElements.forEach((element, index) => {
        if (index % step === 0 && values.length < 50) {
          const dateTime = element.getAttribute('DateTime');
          const value = element.getAttribute('Value');

          if (dateTime && value) {
            values.push({
              time: format(new Date(dateTime), 'MMM dd HH:mm'),
              value: parseFloat(value).toFixed(2)
            });
          }
        }
      });

      setData(values);
      setRawData({ device: device.name, type: measurementType, points: valueElements.length, data: values });

      console.log(`Loaded ${values.length} points from ${valueElements.length} total`);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!rawData || !rawData.data || rawData.data.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create data sheet
      const wsData = XLSX.utils.json_to_sheet(rawData.data);
      XLSX.utils.book_append_sheet(wb, wsData, 'Data');

      // Create info sheet
      const wsInfo = XLSX.utils.json_to_sheet([
        { Property: 'Device', Value: rawData.device },
        { Property: 'Measurement', Value: rawData.type },
        { Property: 'Total Points', Value: rawData.points },
        { Property: 'Export Date', Value: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
      ]);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Info');

      // Download file
      const fileName = `PhytoSense_${rawData.type}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PhytoSense Data (2grow)</h2>
        <p className="text-sm text-gray-600">Simple data viewer with Excel export</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {DEVICES.map((device, index) => (
              <option key={device.id} value={index}>{device.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Measurement</label>
          <select
            value={measurementType}
            onChange={(e) => setMeasurementType(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="diameter">Diameter</option>
            <option value="sapflow">Sap Flow</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="1">Last 24 hours</option>
            <option value="3">Last 3 days</option>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Loading...' : 'Load Data'}
          </button>
          <button
            onClick={exportToExcel}
            disabled={!data.length}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Status */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Chart */}
      {data.length > 0 && (
        <div>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              Showing {data.length} data points • {measurementType === 'diameter' ? 'Diameter (mm)' : 'Sap Flow (g/h)'}
            </p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" fontSize={11} interval="preserveStartEnd" />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={measurementType === 'diameter' ? '#10B981' : '#3B82F6'}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* No data message */}
      {!loading && !error && data.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Select options and click "Load Data" to view measurements</p>
        </div>
      )}
    </div>
  );
};

export default PhytoSenseSimple;