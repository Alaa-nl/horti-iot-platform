import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Scatter } from 'recharts';
import { Sun, Thermometer, TrendingUp, Clock, Calendar } from 'lucide-react';

interface RTRDataPoint {
  time: string | number;
  temperature: number;
  dli: number;  // mol/m² (for weekly) or calculated from PAR (for hourly)
  expectedTemp: number;
  rtrDeviation: number;
  label?: string;
}

interface RTRLijnPARProps {
  period: 'short-term' | 'long-term';
  currentPAR?: number; // Current PAR value from sliders (optional, for reference)
  currentTemperature?: number; // Current temperature from sliders (optional, for reference)
  currentDLI?: number; // Current calculated DLI (optional, for reference)
}

// Generate hourly data for short-term analysis (24 hours)
const generateHourlyRTRData = (): RTRDataPoint[] => {
  const data: RTRDataPoint[] = [];
  const baseTemp = 24;
  const basePAR = 400;

  for (let hour = 0; hour < 24; hour++) {
    // Simulate PAR variation throughout the day (higher during midday)
    let par: number;
    if (hour < 6 || hour > 18) {
      par = 0; // Night time
    } else {
      // Bell curve for daylight hours
      const dayHour = hour - 6;
      par = basePAR + 200 * Math.sin((dayHour / 12) * Math.PI) + (Math.random() - 0.5) * 100;
    }

    // Calculate hourly DLI contribution (convert μmol/m²/s to mol/m²/h)
    const hourlyDLI = (par * 3600) / 1000000; // 3600 seconds in an hour, 1,000,000 μmol in a mol

    // Temperature varies with some lag behind light
    const tempVariation = 3 * Math.sin((hour - 2) / 24 * 2 * Math.PI);
    const temperature = baseTemp + tempVariation + (Math.random() - 0.5) * 2;

    // Calculate expected temperature based on RTR formula
    const expectedTemp = 16.023 + (hourlyDLI * 0.0534);
    const rtrDeviation = temperature - expectedTemp;

    data.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      temperature: parseFloat(temperature.toFixed(2)),
      dli: parseFloat(hourlyDLI.toFixed(3)),
      expectedTemp: parseFloat(expectedTemp.toFixed(2)),
      rtrDeviation: parseFloat(rtrDeviation.toFixed(2)),
      label: `${hour}:00`
    });
  }

  return data;
};

// Generate weekly data for long-term analysis (52 weeks)
const generateWeeklyRTRData = (): RTRDataPoint[] => {
  const data: RTRDataPoint[] = [];
  const baseTemp = 22;
  const baseDLI = 25; // mol/m²/week average

  for (let week = 1; week <= 52; week++) {
    // Seasonal variation in light (higher in summer)
    const seasonalFactor = Math.sin((week - 13) * 2 * Math.PI / 52);
    const weeklyDLI = baseDLI + seasonalFactor * 10 + (Math.random() - 0.5) * 5;

    // Temperature also follows seasonal pattern but with some lag
    const tempSeasonalFactor = Math.sin((week - 15) * 2 * Math.PI / 52);
    const temperature = baseTemp + tempSeasonalFactor * 5 + (Math.random() - 0.5) * 2;

    // Calculate expected temperature based on RTR formula
    const expectedTemp = 16.023 + (weeklyDLI * 0.0534);
    const rtrDeviation = temperature - expectedTemp;

    data.push({
      time: week,
      temperature: parseFloat(temperature.toFixed(2)),
      dli: parseFloat(weeklyDLI.toFixed(1)),
      expectedTemp: parseFloat(expectedTemp.toFixed(2)),
      rtrDeviation: parseFloat(rtrDeviation.toFixed(2)),
      label: `Week ${week}`
    });
  }

  return data;
};

export const RTRLijnPAR: React.FC<RTRLijnPARProps> = ({
  period,
  currentPAR = 400,
  currentTemperature = 24,
  currentDLI = 17.3
}) => {
  // Generate data based on period
  const rtrData = period === 'short-term' ? generateHourlyRTRData() : generateWeeklyRTRData();

  // Calculate statistics
  const avgDLI = rtrData.reduce((sum, d) => sum + d.dli, 0) / rtrData.length;
  const avgTemp = rtrData.reduce((sum, d) => sum + d.temperature, 0) / rtrData.length;
  const avgDeviation = rtrData.reduce((sum, d) => sum + d.rtrDeviation, 0) / rtrData.length;
  const maxDeviation = Math.max(...rtrData.map(d => Math.abs(d.rtrDeviation)));

  // RTR formula constants
  const rtrFormula = "T = 16.023 + 0.0534 × DLI";
  const rtrSlope = 0.0534; // °C per mol/m²
  const baseTemperature = 16.023; // Base temperature in °C

  // Add current point for real-time reference (only if we have current values)
  const currentPoint = currentPAR && currentTemperature ? {
    time: 'Now',
    temperature: currentTemperature,
    dli: period === 'short-term' ? (currentPAR * 3600) / 1000000 : currentDLI,
    expectedTemp: baseTemperature + (currentDLI * rtrSlope),
    rtrDeviation: currentTemperature - (baseTemperature + (currentDLI * rtrSlope)),
    label: 'Current',
    isCurrent: true
  } : null;

  // Combine data with current point if available
  const chartData = currentPoint ? [...rtrData, currentPoint] : rtrData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" />
          RTR Analysis - {period === 'short-term' ? '24 Hour' : '52 Week'} Overview
        </h4>
        <div className="flex items-center gap-4">
          {period === 'short-term' ? (
            <Clock className="w-4 h-4 text-gray-500" />
          ) : (
            <Calendar className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {rtrFormula}
          </span>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg DLI</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {avgDLI.toFixed(period === 'short-term' ? 3 : 1)} {period === 'short-term' ? 'mol/h' : 'mol/week'}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Temperature</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{avgTemp.toFixed(1)}°C</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg RTR Deviation</p>
          <p className={`text-sm font-bold ${Math.abs(avgDeviation) < 2 ? 'text-green-600' : Math.abs(avgDeviation) < 4 ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgDeviation > 0 ? '+' : ''}{avgDeviation.toFixed(2)}°C
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Max Deviation</p>
          <p className={`text-sm font-bold ${maxDeviation < 3 ? 'text-green-600' : maxDeviation < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
            ±{maxDeviation.toFixed(2)}°C
          </p>
        </div>
      </div>

      {/* Temperature vs DLI Scatter Plot */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Temperature vs Light Integral (DLI)
        </h5>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="dli"
              label={{
                value: period === 'short-term' ? 'Hourly Light Integral (mol/h)' : 'Weekly DLI (mol/week)',
                position: 'insideBottom',
                offset: -5
              }}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className={`bg-white dark:bg-gray-800 p-3 border rounded shadow ${
                      data.isCurrent ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      <p className="text-sm font-bold mb-1">
                        {data.isCurrent ? '🟢 Current Settings' : data.label}
                      </p>
                      <p className="text-xs">DLI: {data.dli.toFixed(period === 'short-term' ? 3 : 1)} {period === 'short-term' ? 'mol/h' : 'mol'}</p>
                      <p className="text-xs">Actual Temp: {data.temperature}°C</p>
                      <p className="text-xs">Expected Temp: {data.expectedTemp}°C</p>
                      <p className={`text-xs font-bold ${
                        Math.abs(data.rtrDeviation) < 2 ? 'text-green-600' :
                        Math.abs(data.rtrDeviation) < 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        Deviation: {data.rtrDeviation > 0 ? '+' : ''}{data.rtrDeviation}°C
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Actual temperature points */}
            <Scatter
              name="Actual Temperature"
              dataKey="temperature"
              fill="#3b82f6"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.isCurrent) {
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={8} fill="#10b981" stroke="#047857" strokeWidth={2} />
                      <circle cx={cx} cy={cy} r={3} fill="#ffffff" />
                    </g>
                  );
                }
                return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" fillOpacity={0.8} />;
              }}
            />
            {/* RTR trend line */}
            <Line
              type="monotone"
              dataKey="expectedTemp"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Expected (RTR)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RTR Deviation Over Time */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          RTR Deviation Over Time
        </h5>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={rtrData} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              label={{
                value: period === 'short-term' ? 'Hour' : 'Week',
                position: 'insideBottom',
                offset: -5
              }}
            />
            <YAxis
              label={{ value: 'Deviation (°C)', angle: -90, position: 'insideLeft' }}
              domain={[
                (dataMin: number) => Math.floor(Math.min(dataMin, -2)),
                (dataMax: number) => Math.ceil(Math.max(dataMax, 2))
              ]}
            />
            <Tooltip />
            <Legend />
            {/* Deviation line */}
            <Line
              type="monotone"
              dataKey="rtrDeviation"
              stroke="#10b981"
              name="Temperature Deviation from RTR"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            {/* Zero reference line */}
            <Line
              type="monotone"
              dataKey={() => 0}
              stroke="#6b7280"
              strokeDasharray="3 3"
              name="Optimal (0 deviation)"
              dot={false}
            />
            {/* Acceptable range lines */}
            <Line
              type="monotone"
              dataKey={() => 2}
              stroke="#fbbf24"
              strokeDasharray="2 2"
              strokeOpacity={0.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={() => -2}
              stroke="#fbbf24"
              strokeDasharray="2 2"
              strokeOpacity={0.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          RTR Interpretation Guide
        </h5>
        <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
          <p>• <span className="text-green-600 font-semibold">Green (±0-2°C)</span>: Optimal temperature-light balance</p>
          <p>• <span className="text-yellow-600 font-semibold">Yellow (±2-4°C)</span>: Acceptable but could be optimized</p>
          <p>• <span className="text-red-600 font-semibold">Red (&gt;±4°C)</span>: Significant imbalance requiring adjustment</p>
          <p className="pt-2 text-gray-600 dark:text-gray-400">
            {period === 'short-term'
              ? 'Hourly analysis shows intraday temperature-light dynamics. Night hours (0 DLI) are excluded from RTR calculation.'
              : 'Weekly analysis reveals seasonal patterns and long-term trends in greenhouse climate management.'}
          </p>
        </div>
      </div>

      {/* Current Settings Reference (if available) */}
      {currentPoint && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-green-700 dark:text-green-300">
              Current Slider Settings Reference
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-600 dark:text-gray-400">PAR: </span>
              <span className="font-bold text-green-700 dark:text-green-300">{currentPAR} μmol/m²/s</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Temp: </span>
              <span className="font-bold text-green-700 dark:text-green-300">{currentTemperature}°C</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">DLI: </span>
              <span className="font-bold text-green-700 dark:text-green-300">{currentDLI.toFixed(1)} mol/day</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">RTR Dev: </span>
              <span className={`font-bold ${
                Math.abs(currentPoint.rtrDeviation) < 2 ? 'text-green-600' :
                Math.abs(currentPoint.rtrDeviation) < 4 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {currentPoint.rtrDeviation > 0 ? '+' : ''}{currentPoint.rtrDeviation.toFixed(1)}°C
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};