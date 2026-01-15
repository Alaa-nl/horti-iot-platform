import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Calendar } from 'lucide-react';

interface ParameterData {
  name: string;
  unit: string;
  data: { time: string | number; value: number }[];
  color: string;
  min?: number;
  max?: number;
  optimal?: { min: number; max: number };
}

interface ParametersOverviewProps {
  period: 'short-term' | 'long-term';
}

// Generate sample data for demonstration
const generateHourlyData = (baseValue: number, variation: number, optimal?: { min: number; max: number }) => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const value = baseValue + Math.sin(i / 3) * variation + Math.random() * (variation / 2);
    const constrainedValue = optimal
      ? Math.max(optimal.min * 0.8, Math.min(optimal.max * 1.2, value))
      : value;
    data.push({
      time: `${i}:00`,
      value: parseFloat(constrainedValue.toFixed(2))
    });
  }
  return data;
};

const generateWeeklyData = (baseValue: number, variation: number, optimal?: { min: number; max: number }) => {
  const data = [];
  for (let i = 1; i <= 52; i++) {
    const seasonalFactor = Math.sin((i - 13) * 2 * Math.PI / 52);
    const value = baseValue + seasonalFactor * variation + Math.random() * (variation / 3);
    const constrainedValue = optimal
      ? Math.max(optimal.min * 0.8, Math.min(optimal.max * 1.2, value))
      : value;
    data.push({
      time: i,
      value: parseFloat(constrainedValue.toFixed(2))
    });
  }
  return data;
};

// Define 24 parameters for short-term (hourly) view
const shortTermParameters: ParameterData[] = [
  { name: 'Temperature', unit: '°C', data: generateHourlyData(24, 3, { min: 20, max: 28 }), color: '#ef4444', optimal: { min: 22, max: 26 } },
  { name: 'Humidity', unit: '%', data: generateHourlyData(70, 10, { min: 60, max: 80 }), color: '#3b82f6', optimal: { min: 65, max: 75 } },
  { name: 'CO₂ Level', unit: 'ppm', data: generateHourlyData(800, 100, { min: 600, max: 1000 }), color: '#10b981', optimal: { min: 700, max: 900 } },
  { name: 'PAR Light', unit: 'μmol/m²/s', data: generateHourlyData(400, 200, { min: 200, max: 800 }), color: '#f59e0b', optimal: { min: 300, max: 600 } },
  { name: 'VPD', unit: 'kPa', data: generateHourlyData(1.0, 0.3, { min: 0.8, max: 1.2 }), color: '#8b5cf6', optimal: { min: 0.8, max: 1.2 } },
  { name: 'Leaf Temperature', unit: '°C', data: generateHourlyData(25, 2, { min: 22, max: 28 }), color: '#ec4899', optimal: { min: 23, max: 27 } },
  { name: 'Root Temperature', unit: '°C', data: generateHourlyData(20, 1.5, { min: 18, max: 22 }), color: '#14b8a6', optimal: { min: 19, max: 21 } },
  { name: 'Air Speed', unit: 'm/s', data: generateHourlyData(1.2, 0.3, { min: 0.8, max: 2 }), color: '#06b6d4', optimal: { min: 1, max: 1.5 } },
  { name: 'Transpiration', unit: 'L/m²/h', data: generateHourlyData(2.5, 0.8, { min: 1.5, max: 3.5 }), color: '#0ea5e9', optimal: { min: 2, max: 3 } },
  { name: 'Net Radiation', unit: 'W/m²', data: generateHourlyData(300, 150, { min: 100, max: 500 }), color: '#fbbf24', optimal: { min: 200, max: 400 } },
  { name: 'Photosynthesis', unit: 'μmol/m²/s', data: generateHourlyData(15, 5, { min: 10, max: 25 }), color: '#84cc16', optimal: { min: 12, max: 20 } },
  { name: 'Respiration', unit: 'μmol/m²/s', data: generateHourlyData(3, 1, { min: 2, max: 5 }), color: '#dc2626', optimal: { min: 2.5, max: 4 } },
  { name: 'Stomatal Conductance', unit: 'mmol/m²/s', data: generateHourlyData(250, 50, { min: 200, max: 400 }), color: '#059669', optimal: { min: 220, max: 350 } },
  { name: 'Water Uptake', unit: 'L/m²/h', data: generateHourlyData(2.2, 0.5, { min: 1.5, max: 3 }), color: '#2563eb', optimal: { min: 1.8, max: 2.8 } },
  { name: 'Irrigation Rate', unit: 'L/m²/h', data: generateHourlyData(2.5, 0.3, { min: 2, max: 3 }), color: '#1e40af', optimal: { min: 2.2, max: 2.8 } },
  { name: 'EC Level', unit: 'mS/cm', data: generateHourlyData(2.0, 0.3, { min: 1.5, max: 2.5 }), color: '#7c3aed', optimal: { min: 1.8, max: 2.2 } },
  { name: 'pH Level', unit: '', data: generateHourlyData(6.0, 0.3, { min: 5.5, max: 6.5 }), color: '#a855f7', optimal: { min: 5.8, max: 6.2 } },
  { name: 'DLI', unit: 'mol/m²', data: generateHourlyData(0.8, 0.4, { min: 0.4, max: 1.5 }), color: '#eab308', optimal: { min: 0.6, max: 1.2 } },
  { name: 'Enthalpy', unit: 'kJ/kg', data: generateHourlyData(50, 10, { min: 40, max: 70 }), color: '#f97316', optimal: { min: 45, max: 60 } },
  { name: 'Sensible Heat', unit: 'W/m²', data: generateHourlyData(150, 50, { min: 100, max: 250 }), color: '#ea580c', optimal: { min: 120, max: 200 } },
  { name: 'Latent Heat', unit: 'W/m²', data: generateHourlyData(200, 60, { min: 150, max: 300 }), color: '#0891b2', optimal: { min: 170, max: 250 } },
  { name: 'WUE', unit: 'g/L', data: generateHourlyData(5, 1, { min: 4, max: 7 }), color: '#0d9488', optimal: { min: 4.5, max: 6 } },
  { name: 'Bowen Ratio', unit: '', data: generateHourlyData(0.75, 0.25, { min: 0.5, max: 1 }), color: '#15803d', optimal: { min: 0.6, max: 0.9 } },
  { name: 'RTR', unit: '°C', data: generateHourlyData(2, 1, { min: 0, max: 4 }), color: '#b91c1c', optimal: { min: 1, max: 3 } }
];

// Define 52 parameters for long-term (weekly) view - same parameters but more for seasonal variation
const longTermParameters: ParameterData[] = [
  // Climate parameters (12)
  { name: 'Avg Temperature', unit: '°C', data: generateWeeklyData(22, 5, { min: 18, max: 28 }), color: '#ef4444', optimal: { min: 20, max: 26 } },
  { name: 'Avg Humidity', unit: '%', data: generateWeeklyData(70, 15, { min: 55, max: 85 }), color: '#3b82f6', optimal: { min: 60, max: 80 } },
  { name: 'Avg CO₂', unit: 'ppm', data: generateWeeklyData(850, 150, { min: 600, max: 1100 }), color: '#10b981', optimal: { min: 700, max: 1000 } },
  { name: 'Total PAR', unit: 'mol/m²', data: generateWeeklyData(25, 10, { min: 15, max: 40 }), color: '#f59e0b', optimal: { min: 20, max: 35 } },
  { name: 'Avg VPD', unit: 'kPa', data: generateWeeklyData(1.0, 0.4, { min: 0.6, max: 1.4 }), color: '#8b5cf6', optimal: { min: 0.8, max: 1.2 } },
  { name: 'Max Temperature', unit: '°C', data: generateWeeklyData(28, 5, { min: 24, max: 35 }), color: '#dc2626', optimal: { min: 26, max: 32 } },
  { name: 'Min Temperature', unit: '°C', data: generateWeeklyData(18, 4, { min: 14, max: 22 }), color: '#2563eb', optimal: { min: 16, max: 20 } },
  { name: 'Temperature Range', unit: '°C', data: generateWeeklyData(10, 3, { min: 6, max: 15 }), color: '#ea580c', optimal: { min: 8, max: 12 } },
  { name: 'Radiation Sum', unit: 'MJ/m²', data: generateWeeklyData(150, 50, { min: 80, max: 250 }), color: '#fbbf24', optimal: { min: 100, max: 200 } },
  { name: 'Avg Wind Speed', unit: 'm/s', data: generateWeeklyData(1.0, 0.5, { min: 0.5, max: 2 }), color: '#06b6d4', optimal: { min: 0.8, max: 1.5 } },
  { name: 'Avg Pressure', unit: 'hPa', data: generateWeeklyData(1013, 10, { min: 1000, max: 1030 }), color: '#6b7280', optimal: { min: 1008, max: 1020 } },
  { name: 'UV Index', unit: '', data: generateWeeklyData(3, 2, { min: 1, max: 7 }), color: '#a855f7', optimal: { min: 2, max: 5 } },

  // Water parameters (10)
  { name: 'Total Irrigation', unit: 'L/m²', data: generateWeeklyData(420, 100, { min: 250, max: 600 }), color: '#1e40af', optimal: { min: 350, max: 500 } },
  { name: 'Total Drainage', unit: 'L/m²', data: generateWeeklyData(84, 30, { min: 50, max: 150 }), color: '#1e3a8a', optimal: { min: 70, max: 100 } },
  { name: 'Avg EC', unit: 'mS/cm', data: generateWeeklyData(2.0, 0.5, { min: 1.5, max: 3 }), color: '#7c3aed', optimal: { min: 1.8, max: 2.5 } },
  { name: 'Avg pH', unit: '', data: generateWeeklyData(6.0, 0.5, { min: 5.5, max: 6.8 }), color: '#9333ea', optimal: { min: 5.8, max: 6.3 } },
  { name: 'Water Uptake', unit: 'L/m²', data: generateWeeklyData(370, 80, { min: 250, max: 500 }), color: '#0ea5e9', optimal: { min: 300, max: 450 } },
  { name: 'Transpiration Total', unit: 'L/m²', data: generateWeeklyData(350, 75, { min: 230, max: 480 }), color: '#0284c7', optimal: { min: 280, max: 420 } },
  { name: 'Drainage %', unit: '%', data: generateWeeklyData(20, 8, { min: 10, max: 35 }), color: '#075985', optimal: { min: 15, max: 25 } },
  { name: 'WUE Weekly', unit: 'kg/m³', data: generateWeeklyData(25, 5, { min: 18, max: 35 }), color: '#0d9488', optimal: { min: 20, max: 30 } },
  { name: 'Root Zone Moisture', unit: '%', data: generateWeeklyData(65, 10, { min: 50, max: 80 }), color: '#14b8a6', optimal: { min: 55, max: 75 } },
  { name: 'Nutrient Uptake', unit: 'g/m²', data: generateWeeklyData(15, 4, { min: 10, max: 25 }), color: '#047857', optimal: { min: 12, max: 20 } },

  // Growth parameters (10)
  { name: 'Biomass Production', unit: 'kg/m²', data: generateWeeklyData(0.5, 0.2, { min: 0.2, max: 0.9 }), color: '#15803d', optimal: { min: 0.3, max: 0.7 } },
  { name: 'Net Assimilation', unit: 'mol/m²', data: generateWeeklyData(2.5, 0.8, { min: 1.5, max: 4 }), color: '#84cc16', optimal: { min: 2, max: 3.5 } },
  { name: 'LAI', unit: 'm²/m²', data: generateWeeklyData(3.5, 1, { min: 2, max: 5 }), color: '#65a30d', optimal: { min: 2.5, max: 4.5 } },
  { name: 'Stem Length', unit: 'cm', data: generateWeeklyData(10, 3, { min: 5, max: 15 }), color: '#4ade80', optimal: { min: 7, max: 12 } },
  { name: 'Fruit Load', unit: 'kg/m²', data: generateWeeklyData(2, 0.8, { min: 0.5, max: 3.5 }), color: '#f87171', optimal: { min: 1, max: 3 } },
  { name: 'Harvest', unit: 'kg/m²', data: generateWeeklyData(1.5, 0.6, { min: 0, max: 2.5 }), color: '#fb923c', optimal: { min: 0.5, max: 2 } },
  { name: 'Growth Rate', unit: 'g/m²/day', data: generateWeeklyData(70, 20, { min: 40, max: 120 }), color: '#fcd34d', optimal: { min: 50, max: 100 } },
  { name: 'Development Rate', unit: '°C·d', data: generateWeeklyData(150, 30, { min: 100, max: 200 }), color: '#bef264', optimal: { min: 120, max: 180 } },
  { name: 'Fruit Number', unit: '#/m²', data: generateWeeklyData(50, 15, { min: 30, max: 80 }), color: '#fb7185', optimal: { min: 40, max: 70 } },
  { name: 'Avg Fruit Weight', unit: 'g', data: generateWeeklyData(150, 30, { min: 100, max: 250 }), color: '#f472b6', optimal: { min: 120, max: 200 } },

  // Energy parameters (10)
  { name: 'Total Radiation', unit: 'MJ/m²', data: generateWeeklyData(180, 60, { min: 100, max: 300 }), color: '#fde047', optimal: { min: 130, max: 250 } },
  { name: 'Net Energy', unit: 'MJ/m²', data: generateWeeklyData(90, 30, { min: 50, max: 150 }), color: '#facc15', optimal: { min: 70, max: 120 } },
  { name: 'Heating Energy', unit: 'MJ/m²', data: generateWeeklyData(40, 25, { min: 0, max: 100 }), color: '#ea580c', optimal: { min: 10, max: 60 } },
  { name: 'Cooling Energy', unit: 'MJ/m²', data: generateWeeklyData(20, 15, { min: 0, max: 60 }), color: '#0891b2', optimal: { min: 5, max: 40 } },
  { name: 'Artificial Light', unit: 'mol/m²', data: generateWeeklyData(100, 40, { min: 0, max: 200 }), color: '#eab308', optimal: { min: 50, max: 150 } },
  { name: 'Photochemical Energy', unit: 'MJ/m²', data: generateWeeklyData(5, 2, { min: 2, max: 10 }), color: '#22c55e', optimal: { min: 3, max: 8 } },
  { name: 'Sensible Heat Flux', unit: 'MJ/m²', data: generateWeeklyData(30, 10, { min: 15, max: 50 }), color: '#f97316', optimal: { min: 20, max: 40 } },
  { name: 'Latent Heat Flux', unit: 'MJ/m²', data: generateWeeklyData(40, 12, { min: 20, max: 60 }), color: '#06b6d4', optimal: { min: 25, max: 50 } },
  { name: 'Bowen Ratio Weekly', unit: '', data: generateWeeklyData(0.75, 0.3, { min: 0.4, max: 1.2 }), color: '#8b5cf6', optimal: { min: 0.5, max: 1 } },
  { name: 'Energy Efficiency', unit: '%', data: generateWeeklyData(65, 10, { min: 50, max: 85 }), color: '#10b981', optimal: { min: 55, max: 75 } },

  // Nutrient parameters (10)
  { name: 'N Uptake', unit: 'g/m²', data: generateWeeklyData(5, 1.5, { min: 3, max: 8 }), color: '#059669', optimal: { min: 4, max: 6.5 } },
  { name: 'P Uptake', unit: 'g/m²', data: generateWeeklyData(1.5, 0.5, { min: 0.8, max: 2.5 }), color: '#be185d', optimal: { min: 1, max: 2 } },
  { name: 'K Uptake', unit: 'g/m²', data: generateWeeklyData(7, 2, { min: 4, max: 12 }), color: '#e11d48', optimal: { min: 5, max: 10 } },
  { name: 'Ca Uptake', unit: 'g/m²', data: generateWeeklyData(3, 1, { min: 1.5, max: 5 }), color: '#64748b', optimal: { min: 2, max: 4 } },
  { name: 'Mg Uptake', unit: 'g/m²', data: generateWeeklyData(1.2, 0.4, { min: 0.6, max: 2 }), color: '#16a34a', optimal: { min: 0.8, max: 1.6 } },
  { name: 'S Uptake', unit: 'g/m²', data: generateWeeklyData(0.8, 0.3, { min: 0.4, max: 1.5 }), color: '#fbbf24', optimal: { min: 0.5, max: 1.2 } },
  { name: 'Fe Availability', unit: 'mg/L', data: generateWeeklyData(2.5, 0.8, { min: 1.5, max: 4 }), color: '#a16207', optimal: { min: 2, max: 3.5 } },
  { name: 'Nutrient EC', unit: 'mS/cm', data: generateWeeklyData(2.2, 0.5, { min: 1.5, max: 3 }), color: '#7c2d12', optimal: { min: 1.8, max: 2.6 } },
  { name: 'Substrate pH', unit: '', data: generateWeeklyData(6.0, 0.4, { min: 5.5, max: 6.8 }), color: '#581c87', optimal: { min: 5.8, max: 6.3 } },
  { name: 'Nutrient Balance', unit: 'index', data: generateWeeklyData(100, 15, { min: 80, max: 120 }), color: '#0f766e', optimal: { min: 90, max: 110 } },

  // Additional monitoring parameters (10)
  { name: 'Pest Pressure', unit: 'index', data: generateWeeklyData(20, 10, { min: 0, max: 50 }), color: '#991b1b', optimal: { min: 0, max: 20 } },
  { name: 'Disease Index', unit: 'index', data: generateWeeklyData(15, 8, { min: 0, max: 40 }), color: '#7f1d1d', optimal: { min: 0, max: 15 } },
  { name: 'Stress Index', unit: '', data: generateWeeklyData(25, 10, { min: 0, max: 50 }), color: '#f59e0b', optimal: { min: 0, max: 30 } },
  { name: 'Quality Score', unit: 'points', data: generateWeeklyData(85, 10, { min: 60, max: 100 }), color: '#22d3ee', optimal: { min: 75, max: 95 } },
  { name: 'RTR Weekly', unit: '°C', data: generateWeeklyData(3, 2, { min: -2, max: 8 }), color: '#ec4899', optimal: { min: 1, max: 5 } },
  { name: 'DLI Weekly Avg', unit: 'mol/m²/day', data: generateWeeklyData(20, 8, { min: 10, max: 35 }), color: '#f472b6', optimal: { min: 15, max: 30 } },
  { name: 'Productivity Index', unit: '', data: generateWeeklyData(100, 20, { min: 60, max: 140 }), color: '#2dd4bf', optimal: { min: 80, max: 120 } },
  { name: 'Resource Efficiency', unit: '%', data: generateWeeklyData(75, 15, { min: 50, max: 100 }), color: '#34d399', optimal: { min: 65, max: 90 } },
  { name: 'Climate Score', unit: 'points', data: generateWeeklyData(80, 12, { min: 50, max: 100 }), color: '#60a5fa', optimal: { min: 70, max: 90 } },
  { name: 'Yield Forecast', unit: 'kg/m²', data: generateWeeklyData(1.8, 0.5, { min: 1, max: 3 }), color: '#c084fc', optimal: { min: 1.5, max: 2.5 } }
];

export const ParametersOverview: React.FC<ParametersOverviewProps> = ({ period }) => {
  const parameters = period === 'short-term' ? shortTermParameters.slice(0, 24) : longTermParameters.slice(0, 52);
  const timeLabel = period === 'short-term' ? 'Hour' : 'Week';
  const gridCols = period === 'short-term' ? 'grid-cols-3' : 'grid-cols-4';

  // Mini chart component for each parameter
  const MiniParameterChart: React.FC<{ param: ParameterData }> = ({ param }) => {
    const isInOptimalRange = param.optimal && param.data.every(d =>
      d.value >= param.optimal!.min && d.value <= param.optimal!.max
    );

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
            {param.name}
          </h6>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {param.unit}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={param.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={param.color}
              strokeWidth={1.5}
              dot={false}
            />
            {param.optimal && (
              <>
                <Line
                  type="monotone"
                  dataKey={() => param.optimal!.min}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth={0.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={() => param.optimal!.max}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth={0.5}
                  dot={false}
                />
              </>
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-gray-800 p-1 border border-gray-300 dark:border-gray-600 rounded shadow text-xs">
                      <p>{`${timeLabel}: ${payload[0].payload.time}`}</p>
                      <p style={{ color: param.color }}>
                        {`${param.name}: ${payload[0].value} ${param.unit}`}
                      </p>
                      {param.optimal && (
                        <p className="text-green-600 dark:text-green-400">
                          Optimal: {param.optimal.min}-{param.optimal.max}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Latest: {param.data[param.data.length - 1].value}
          </span>
          {param.optimal && (
            <span className={`text-xs ${isInOptimalRange ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {isInOptimalRange ? '✓' : '!'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {period === 'short-term' ? (
              <>
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                24 Parameters Overview (Hourly)
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                52 Parameters Overview (Weekly)
              </>
            )}
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {period === 'short-term' ? 'Last 24 hours' : 'Last 52 weeks'}
          </div>
        </div>

        <div className={`grid ${gridCols} gap-3`}>
          {parameters.map((param, index) => (
            <MiniParameterChart key={index} param={param} />
          ))}
        </div>

        {/* Summary Statistics */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Parameters Summary
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className="text-green-600 dark:text-green-400 font-bold text-lg">
                {parameters.filter(p => p.optimal && p.data.every(d =>
                  d.value >= p.optimal!.min && d.value <= p.optimal!.max
                )).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Optimal</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">
                {parameters.filter(p => p.optimal && p.data.some(d =>
                  d.value < p.optimal!.min * 0.9 || d.value > p.optimal!.max * 1.1
                )).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {parameters.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};