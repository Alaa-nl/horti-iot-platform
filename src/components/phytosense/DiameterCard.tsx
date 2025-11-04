import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DiameterData {
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

interface DiameterCardProps {
  className?: string;
}

const DiameterCard: React.FC<DiameterCardProps> = ({ className = '' }) => {
  const [diameter, setDiameter] = useState<DiameterData>({
    current: 0,
    unit: 'μm',
    data: [],
    lastUpdated: '',
    isLive: false,
    timeRange: 'Last 24 hours'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch diameter data from PhytoSense API
  const fetchDiameterData = useCallback(async () => {
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

      // Device configurations (NL 2023-2024 MKB Raak) - CORRECTED TDIDs
      const devices = [
        {
          name: 'Stem051',
          setupId: 1508,
          diameterTDID: 39987,  // CORRECTED - was 39999
          toDate: '2024-10-15T12:00:00'
        },
        {
          name: 'Stem136',
          setupId: 1508,
          diameterTDID: 39981,  // CORRECTED - was 40007
          toDate: '2024-10-15T12:00:00'
        }
      ];

      const now = new Date();
      const deviceEndDate = new Date(devices[0].toDate);
      const daysAgo = Math.floor((now.getTime() - deviceEndDate.getTime()) / (1000 * 60 * 60 * 24));
      const isDeviceActive = daysAgo < 7;

      // Helper function to fetch diameter data
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

        console.log(`Fetching diameter data from ${deviceName} (${hourRange}h window):`, url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        console.log(`${deviceName} diameter API response:`, result);

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

      // Try diameter from both devices (24 hours)
      for (const device of devices) {
        fetchedData = await fetchData(device.name, device.setupId, device.diameterTDID, 24);
        if (fetchedData) break;
      }

      // Try diameter from both devices (7 days)
      if (!fetchedData) {
        console.log('No diameter data in last 24h from any device, trying 7 days...');
        for (const device of devices) {
          fetchedData = await fetchData(device.name, device.setupId, device.diameterTDID, 168);
          if (fetchedData) break;
        }
      }

      // If still no data found, use last known good data or show error
      if (!fetchedData) {
        const cached = localStorage.getItem('lastKnownDiameter');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          const hoursSinceLastData = Math.floor(
            (Date.now() - new Date(parsedCache.timestamp).getTime()) / (1000 * 60 * 60)
          );

          setDiameter({
            current: parsedCache.value,
            unit: 'μm',
            data: parsedCache.dataPoints || [],
            lastUpdated: parsedCache.timestamp,
            isLive: false,
            timeRange: `Last known (${hoursSinceLastData}h ago)`,
            deviceName: parsedCache.deviceName
          });

          setError(`Sensors offline. Showing last known value from ${hoursSinceLastData} hours ago.`);
        } else {
          setError('Diameter sensors (Stem051 & Stem136) are currently offline. No historical data available.');
        }
        setLoading(false);
        return;
      }

      // Process the data
      const chartData = fetchedData.data.map((point: any) => {
        const date = new Date(point.dateTime);
        return {
          time: format(date, 'MMM dd HH:mm'),
          value: Math.round(point.value * 100) / 100 // More precision for diameter
        };
      });

      const currentValue = chartData[chartData.length - 1]?.value || 0;

      const newDiameterData = {
        current: currentValue,
        unit: 'μm',
        data: chartData,
        lastUpdated: format(new Date(), 'MMM dd HH:mm'),
        isLive: isDeviceActive,
        timeRange: fetchedData.timeRange,
        deviceName: fetchedData.deviceName
      };

      setDiameter(newDiameterData);

      // Cache successful data
      localStorage.setItem('lastKnownDiameter', JSON.stringify({
        value: currentValue,
        timestamp: new Date().toISOString(),
        deviceName: fetchedData.deviceName,
        dataPoints: chartData.slice(-24) // Keep last 24 points for mini chart
      }));

      console.log(`Successfully loaded diameter data from ${fetchedData.deviceName} (${chartData.length} points) - ${fetchedData.timeRange}`);

    } catch (err) {
      console.error('Error fetching diameter data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh data every 60 seconds (same as sap flow for consistency)
  useEffect(() => {
    fetchDiameterData();

    const interval = setInterval(() => {
      fetchDiameterData();
    }, 60000); // 60 seconds - same as sap flow

    return () => clearInterval(interval);
  }, [fetchDiameterData]);

  return (
    <div className={`card-elevated p-6 hover:-translate-y-2 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">
            Stem Diameter
          </h3>
          {loading ? (
            <div className="badge-info">
              Loading...
            </div>
          ) : diameter.isLive ? (
            <div className="badge-success animate-pulse-soft">
              ⚡ Live
            </div>
          ) : diameter.data.length > 0 ? (
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
          {diameter.deviceName && `${diameter.deviceName} • `}
          {diameter.timeRange}
          {diameter.isLive && ' • Updates every 60s'}
        </p>
      </div>

      {error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-700 text-sm">{error}</p>
          <button
            onClick={fetchDiameterData}
            className="mt-2 text-amber-700 underline hover:no-underline text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Current Value */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 mb-4 border border-blue-200/50">
            <p className="text-sm text-gray-700 mb-1 font-medium">
              Current Diameter
            </p>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-blue-700">{diameter.current}</span>
              <span className="text-base text-blue-600 ml-2 font-semibold">{diameter.unit}</span>
            </div>
            {diameter.lastUpdated && (
              <div className="mt-3 pt-3 border-t border-blue-300/50">
                <span className="text-xs text-gray-700 font-medium">
                  Last Updated: {diameter.lastUpdated}
                </span>
              </div>
            )}
          </div>

          {/* Historical Chart */}
          {diameter.data.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={diameter.data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
                  label={{ value: 'Diameter (μm)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: any) => [`${value} μm`, 'Diameter']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
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

export default DiameterCard;