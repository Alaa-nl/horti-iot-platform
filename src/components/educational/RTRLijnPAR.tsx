import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Sun, Thermometer, TrendingUp } from 'lucide-react';

interface RTRDataPoint {
  week: number;
  day: number;
  stralingsSom: number;  // MOL/m2 or joule/cm2
  etmaalTemperatuur: number;
  gerealiseerdeRTR: number;
}

interface RTRLijnPARProps {
  period: 'short-term' | 'long-term';
}

// Sample RTR data based on the PDF - this would normally come from your API
const sampleRTRData: RTRDataPoint[] = [
  // Week 1
  { week: 1, day: 1, stralingsSom: 14.12, etmaalTemperatuur: 16.1, gerealiseerdeRTR: 0.16 },
  { week: 1, day: 2, stralingsSom: 14.23, etmaalTemperatuur: 16.3, gerealiseerdeRTR: 0.58 },
  { week: 1, day: 3, stralingsSom: 14.37, etmaalTemperatuur: 17.1, gerealiseerdeRTR: 2.25 },
  { week: 1, day: 4, stralingsSom: 14.08, etmaalTemperatuur: 17.3, gerealiseerdeRTR: 2.72 },
  { week: 1, day: 5, stralingsSom: 13.99, etmaalTemperatuur: 16.9, gerealiseerdeRTR: 1.88 },
  { week: 1, day: 6, stralingsSom: 14.22, etmaalTemperatuur: 15.9, gerealiseerdeRTR: -0.26 },
  { week: 1, day: 7, stralingsSom: 14.17, etmaalTemperatuur: 16.0, gerealiseerdeRTR: -0.05 },
  // Week 2
  { week: 2, day: 1, stralingsSom: 13.89, etmaalTemperatuur: 16.6, gerealiseerdeRTR: 1.25 },
  { week: 2, day: 2, stralingsSom: 14.06, etmaalTemperatuur: 17.3, gerealiseerdeRTR: 2.72 },
  { week: 2, day: 3, stralingsSom: 13.33, etmaalTemperatuur: 17.3, gerealiseerdeRTR: 2.87 },
  { week: 2, day: 4, stralingsSom: 14.04, etmaalTemperatuur: 17.5, gerealiseerdeRTR: 3.16 },
  { week: 2, day: 5, stralingsSom: 8.52, etmaalTemperatuur: 16.2, gerealiseerdeRTR: 0.62 },
  { week: 2, day: 6, stralingsSom: 4.93, etmaalTemperatuur: 16.9, gerealiseerdeRTR: 5.34 },
  { week: 2, day: 7, stralingsSom: 4.48, etmaalTemperatuur: 16.5, gerealiseerdeRTR: 3.19 },
  // Week 3
  { week: 3, day: 1, stralingsSom: 4.68, etmaalTemperatuur: 15.9, gerealiseerdeRTR: -0.79 },
  { week: 3, day: 2, stralingsSom: 4.10, etmaalTemperatuur: 17.0, gerealiseerdeRTR: 7.15 },
  { week: 3, day: 3, stralingsSom: 4.10, etmaalTemperatuur: 17.6, gerealiseerdeRTR: 11.54 },
  { week: 3, day: 4, stralingsSom: 4.19, etmaalTemperatuur: 15.7, gerealiseerdeRTR: -2.31 },
  { week: 3, day: 5, stralingsSom: 3.31, etmaalTemperatuur: 15.7, gerealiseerdeRTR: -2.93 },
  { week: 3, day: 6, stralingsSom: 0.84, etmaalTemperatuur: 15.5, gerealiseerdeRTR: -18.68 },
  { week: 3, day: 7, stralingsSom: 1.38, etmaalTemperatuur: 15.6, gerealiseerdeRTR: -9.20 },
];

export const RTRLijnPAR: React.FC<RTRLijnPARProps> = ({ period }) => {
  const chartData = sampleRTRData.map((point, index) => ({
    ...point,
    label: `W${point.week}D${point.day}`,
    index: index + 1
  }));

  // Calculate RTR formula based on data (y = 0.0534x + 16.023 from PDF)
  const rtrFormula = "y = 0.0534x + 16.023";
  const targetRTR = 6; // Target RTR per 30 mol/m²
  const baseTemperature = 16.023;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" />
          RTR lijn PAR Analysis
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Formula: {rtrFormula}
        </div>
      </div>

      {/* RTR Temperature Relationship Chart */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Temperature vs Radiation Sum (RTR Relationship)
        </h5>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="stralingsSom"
              label={{ value: 'Radiation Sum (MOL/m²)', position: 'insideBottom', offset: -5 }}
              domain={[0, 16]}
            />
            <YAxis
              label={{ value: 'Daily Temperature (°C)', angle: -90, position: 'insideLeft' }}
              domain={[15, 18]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 p-2 border border-gray-300 dark:border-gray-600 rounded shadow">
                      <p className="text-sm font-semibold">Week {data.week}, Day {data.day}</p>
                      <p className="text-xs">Radiation: {data.stralingsSom} MOL/m²</p>
                      <p className="text-xs">Temperature: {data.etmaalTemperatuur}°C</p>
                      <p className="text-xs">RTR: {data.gerealiseerdeRTR}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Daily Values" data={chartData} fill="#3b82f6" />
            {/* Add trend line */}
            <Line
              type="monotone"
              dataKey={(x: any) => 0.0534 * x + 16.023}
              stroke="#ef4444"
              strokeDasharray="5 5"
              dot={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Realized RTR Over Time */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Realized RTR Over Time
        </h5>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis
              label={{ value: 'RTR Value', angle: -90, position: 'insideLeft' }}
              domain={[-20, 15]}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="gerealiseerdeRTR"
              stroke="#10b981"
              name="Realized RTR"
              strokeWidth={2}
            />
            {/* Reference line at 0 */}
            <Line
              type="monotone"
              dataKey={() => 0}
              stroke="#6b7280"
              strokeDasharray="3 3"
              name="Reference (0)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Target RTR
            </span>
          </div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-200">
            {targetRTR} per 30 mol/m²
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-300">
              Base Temperature
            </span>
          </div>
          <div className="text-lg font-bold text-green-900 dark:text-green-200">
            {baseTemperature.toFixed(1)}°C
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              R² Value
            </span>
          </div>
          <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
            0.1708
          </div>
        </div>
      </div>

      {/* Optimal Temperature Difference Table */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Temperature Optimization Status
        </h5>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>• Values in <span className="text-green-600 dark:text-green-400">green</span> indicate optimal RTR (0-3)</p>
          <p>• Values in <span className="text-yellow-600 dark:text-yellow-400">yellow</span> indicate moderate deviation (3-6)</p>
          <p>• Values in <span className="text-red-600 dark:text-red-400">red</span> indicate high deviation (&gt;6 or &lt;0)</p>
        </div>
      </div>
    </div>
  );
};