import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface SapFlowData {
  current: number;
  unit: string;
  data: Array<{
    time: string;
    value: number;
  }>;
  lastUpdated: string;
  isLive: boolean;
  timeRange: string;
  deviceName?: string;
}

interface SapFlowCardProps {
  className?: string;
}

const SapFlowCard: React.FC<SapFlowCardProps> = ({ className = '' }) => {
  const [sapFlow, setSapFlow] = useState<SapFlowData>({
    current: 0,
    unit: 'g/h',
    data: [],
    lastUpdated: '',
    isLive: false,
    timeRange: 'Last 24 hours'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sap flow data from PhytoSense API with NO fallback to diameter
  const fetchSapFlowData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please log in to view data');
        setLoading(false);
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

      // Device configurations (NL 2023-2024 MKB Raak)
      const devices = [
        {
          name: 'Stem051',
          setupId: 1508,
          sapFlowTDID: 39987,
          toDate: '2024-10-15T12:00:00'
        },
        {
          name: 'Stem136',
          setupId: 1508,
          sapFlowTDID: 39981,
          toDate: '2024-10-15T12:00:00'
        }
      ];

      const now = new Date();
      const deviceEndDate = new Date(devices[0].toDate);
      const daysAgo = Math.floor((now.getTime() - deviceEndDate.getTime()) / (1000 * 60 * 60 * 24));
      const isDeviceActive = daysAgo < 7;

      // Helper function to fetch sap flow data
      const fetchData = async (deviceName: string, setupId: number, tdId: number, hourRange: number) => {
        let before, after;
        if (isDeviceActive) {
          before = now.toISOString();
          after = new Date(now.getTime() - hourRange * 60 * 60 * 1000).toISOString();
        } else {
          before = devices[0].toDate;
          after = new Date(deviceEndDate.getTime() - hourRange * 60 * 60 * 1000).toISOString();
        }

        const url = `${API_URL}/phytosense/data/${tdId}?setup_id=${setupId}&channel=0&after=${after}&before=${before}&aggregation=hourly`;

        console.log(`Fetching sap flow data from ${deviceName} (${hourRange}h window):`, url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        console.log(`${deviceName} sap flow API response:`, result);

        if (result.success && result.data && result.data.length > 0) {
          return {
            data: result.data,
            deviceName,
            timeRange: hourRange >= 168 ? `Last ${Math.floor(hourRange / 24)} days` : `Last ${hourRange} hours`
          };
        }
        return null;
      };

      let fetchedData = null;

      // Try sap flow from both devices (24 hours)
      for (const device of devices) {
        fetchedData = await fetchData(device.name, device.setupId, device.sapFlowTDID, 24);
        if (fetchedData) break;
      }

      // Try sap flow from both devices (7 days)
      if (!fetchedData) {
        console.log('No sap flow data in last 24h from any device, trying 7 days...');
        for (const device of devices) {
          fetchedData = await fetchData(device.name, device.setupId, device.sapFlowTDID, 168);
          if (fetchedData) break;
        }
      }

      // If still no data found, use last known good data or show error
      if (!fetchedData) {
        const cached = localStorage.getItem('lastKnownSapFlow');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          const hoursSinceLastData = Math.floor(
            (Date.now() - new Date(parsedCache.timestamp).getTime()) / (1000 * 60 * 60)
          );

          setSapFlow({
            current: parsedCache.value,
            unit: 'g/h',
            data: parsedCache.dataPoints || [],
            lastUpdated: parsedCache.timestamp,
            isLive: false,
            timeRange: `Last known (${hoursSinceLastData}h ago)`,
            deviceName: parsedCache.deviceName
          });

          setError(`Sensors offline. Showing last known value from ${hoursSinceLastData} hours ago.`);
        } else {
          setError('Sap flow sensors (Stem051 & Stem136) are currently offline. No historical data available.');
        }
        setLoading(false);
        return;
      }

      // Process the data
      const chartData = fetchedData.data.map((point: any) => {
        const date = new Date(point.dateTime);
        return {
          time: format(date, 'MMM dd HH:mm'),
          value: Math.round(point.value * 10) / 10
        };
      });

      const currentValue = chartData[chartData.length - 1]?.value || 0;

      const newSapFlowData = {
        current: currentValue,
        unit: 'g/h',
        data: chartData,
        lastUpdated: format(new Date(), 'MMM dd HH:mm'),
        isLive: isDeviceActive,
        timeRange: fetchedData.timeRange,
        deviceName: fetchedData.deviceName
      };

      setSapFlow(newSapFlowData);

      // Cache successful data
      localStorage.setItem('lastKnownSapFlow', JSON.stringify({
        value: currentValue,
        timestamp: new Date().toISOString(),
        deviceName: fetchedData.deviceName,
        dataPoints: chartData.slice(-24) // Keep last 24 points for mini chart
      }));

      console.log(`Successfully loaded sap flow data from ${fetchedData.deviceName} (${chartData.length} points) - ${fetchedData.timeRange}`);

    } catch (err) {
      console.error('Error fetching sap flow data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh data every 60 seconds if live
  useEffect(() => {
    fetchSapFlowData();

    const interval = setInterval(() => {
      fetchSapFlowData();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [fetchSapFlowData]);

  return (
    <div className={`card-elevated p-6 hover:-translate-y-2 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">
            Sap Flow
          </h3>
          {loading ? (
            <div className="badge-info">
              Loading...
            </div>
          ) : sapFlow.isLive ? (
            <div className="badge-success animate-pulse-soft">
              ⚡ Live
            </div>
          ) : sapFlow.data.length > 0 ? (
            <div className="badge-warning">
              Recent Data
            </div>
          ) : (
            <div className="badge-error">
              Offline
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 font-medium">
          {sapFlow.deviceName && `${sapFlow.deviceName} • `}
          {sapFlow.timeRange}
          {sapFlow.isLive && ' • Updates every 60s'}
        </p>
      </div>

      {error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-700 text-sm">{error}</p>
          <button
            onClick={fetchSapFlowData}
            className="mt-2 text-amber-700 underline hover:no-underline text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Current Value */}
          <div className="bg-gradient-to-br from-horti-green-50 to-horti-green-100/50 rounded-xl p-4 mb-4 border border-horti-green-200/50">
            <p className="text-sm text-gray-700 mb-1 font-medium">
              Current Flow Rate
            </p>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-horti-green-700">{sapFlow.current}</span>
              <span className="text-base text-horti-green-600 ml-2 font-semibold">{sapFlow.unit}</span>
            </div>
            {sapFlow.lastUpdated && (
              <div className="mt-3 pt-3 border-t border-horti-green-300/50">
                <span className="text-xs text-gray-700 font-medium">
                  Last Updated: {sapFlow.lastUpdated}
                </span>
              </div>
            )}
          </div>

          {/* Historical Chart */}
          {sapFlow.data.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sapFlow.data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Sap Flow (g/h)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: any) => [`${value} g/h`, 'Sap Flow']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
};

export default SapFlowCard;