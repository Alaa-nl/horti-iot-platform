import React from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

interface CurrentValues {
  temperature?: number;
  leafTemperature?: number;
  humidity?: number;
  co2Level?: number;
  parLight?: number;
  rootTemperature?: number;
  irrigationRate?: number;
  airSpeed?: number;
  vpd?: number;
  vpdi?: number;
}

interface ParametersOverviewProps {
  period: 'short-term' | 'long-term';
  selectedBalance?: 'assimilate' | 'water' | 'energy';
  currentValues?: CurrentValues;
}

// Get current time in Netherlands timezone
const getNetherlandsTime = () => {
  const now = new Date();
  const netherlandsTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Amsterdam"}));
  return {
    hour: netherlandsTime.getHours(),
    date: netherlandsTime,
    weekNumber: getWeekNumber(netherlandsTime)
  };
};

// Calculate week number of the year
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Format hour for display (e.g., "14:00")
const formatHour = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

// Generate sample data for demonstration using actual values as baseline
const generateHourlyData = (baseValue: number, variation: number, optimal?: { min: number; max: number }) => {
  const data = [];
  const { hour: currentHour } = getNetherlandsTime();

  for (let i = 0; i < 24; i++) {
    // Hour 0 represents "NOW" - should match current slider values exactly
    let hourlyVariation: number;

    if (i === 0) {
      // Hour 0 is NOW - use exact value with minimal random variation
      hourlyVariation = (Math.random() - 0.5) * (variation / 20); // Very small variation
    }
    else {
      // Calculate actual hour for the pattern
      const actualHour = (currentHour + i) % 24;

      // Night time (22:00 - 06:00) - generally lower
      if (actualHour >= 22 || actualHour < 6) {
        hourlyVariation = -variation * 0.4 + (Math.random() - 0.5) * (variation / 4);
      }
      // Early morning (6:00 - 9:00)
      else if (actualHour >= 6 && actualHour < 9) {
        hourlyVariation = -variation * 0.2 + variation * 0.3 * ((actualHour - 6) / 3) + (Math.random() - 0.5) * (variation / 3);
      }
      // Morning to noon (9:00 - 12:00)
      else if (actualHour >= 9 && actualHour < 12) {
        hourlyVariation = variation * 0.3 + variation * 0.4 * ((actualHour - 9) / 3) + (Math.random() - 0.5) * (variation / 3);
      }
      // Peak afternoon (12:00 - 15:00)
      else if (actualHour >= 12 && actualHour < 15) {
        hourlyVariation = variation * 0.7 + (Math.random() - 0.5) * (variation / 4);
      }
      // Late afternoon (15:00 - 18:00)
      else if (actualHour >= 15 && actualHour < 18) {
        hourlyVariation = variation * 0.7 * ((18 - actualHour) / 3) + (Math.random() - 0.5) * (variation / 3);
      }
      // Evening (18:00 - 22:00)
      else {
        hourlyVariation = -variation * 0.2 * ((actualHour - 18) / 4) + (Math.random() - 0.5) * (variation / 4);
      }
    }

    const value = baseValue + hourlyVariation;
    const constrainedValue = optimal
      ? Math.max(optimal.min * 0.8, Math.min(optimal.max * 1.2, value))
      : value;

    // Calculate the actual time for this data point
    const hourForDisplay = (currentHour + i) % 24;
    const timeLabel = formatHour(hourForDisplay);

    data.push({
      time: timeLabel,
      value: parseFloat(constrainedValue.toFixed(2))
    });
  }
  return data;
};

// Special function for PAR light which should be 0 at night
const generateHourlyPARData = (baseValue: number, optimal?: { min: number; max: number }) => {
  const data = [];
  const { hour: currentHour } = getNetherlandsTime();

  for (let i = 0; i < 24; i++) {
    let value: number;
    const actualHour = (currentHour + i) % 24;

    if (i === 0) {
      // Hour 0 is NOW - use the current PAR value from slider
      // If it's night time in real life, it might still be artificially lit
      value = baseValue + (Math.random() - 0.5) * 20; // Small variation
    } else {
      // Netherlands daylight patterns (adjusted for season - assuming spring/summer)
      // Sunrise around 6:00, sunset around 20:00 (summer in Netherlands)
      if (actualHour < 5 || actualHour >= 21) {
        value = 0; // Complete darkness
      }
      // Dawn (5:00 - 7:00)
      else if (actualHour >= 5 && actualHour < 7) {
        value = baseValue * 0.2 * ((actualHour - 5) / 2) + Math.random() * 30;
      }
      // Morning rise (7:00 - 10:00)
      else if (actualHour >= 7 && actualHour < 10) {
        value = baseValue * (0.2 + 0.5 * ((actualHour - 7) / 3)) + (Math.random() - 0.5) * 80;
      }
      // Late morning to noon (10:00 - 13:00)
      else if (actualHour >= 10 && actualHour < 13) {
        value = baseValue * (0.7 + 0.3 * ((actualHour - 10) / 3)) + (Math.random() - 0.5) * 100;
      }
      // Peak hours (13:00 - 15:00)
      else if (actualHour >= 13 && actualHour < 15) {
        value = baseValue * (0.95 + Math.random() * 0.1);
      }
      // Afternoon decline (15:00 - 18:00)
      else if (actualHour >= 15 && actualHour < 18) {
        value = baseValue * (1 - 0.3 * ((actualHour - 15) / 3)) + (Math.random() - 0.5) * 80;
      }
      // Evening decline (18:00 - 21:00)
      else {
        value = baseValue * (0.7 - 0.7 * ((actualHour - 18) / 3)) + (Math.random() - 0.5) * 50;
      }
    }

    const constrainedValue = optimal && value > 0
      ? Math.max(optimal.min, Math.min(optimal.max * 1.2, value))
      : value;

    const hourForDisplay = (currentHour + i) % 24;
    const timeLabel = formatHour(hourForDisplay);

    data.push({
      time: timeLabel,
      value: parseFloat(Math.max(0, constrainedValue).toFixed(2))
    });
  }
  return data;
};

// Generate weekly data starting from current week
const generateWeeklyData = (baseValue: number, variation: number, optimal?: { min: number; max: number }) => {
  const data = [];
  const { weekNumber: currentWeek } = getNetherlandsTime();

  // Generate data for upcoming 52 weeks
  for (let i = 0; i < 52; i++) {
    const weekNum = ((currentWeek - 1 + i) % 52) + 1; // Calculate actual week number (1-52)

    // Seasonal variation based on actual week number
    // Peak summer around week 26 (end of June), winter around week 1 (January)
    const seasonalFactor = Math.sin((weekNum - 13) * 2 * Math.PI / 52);

    let value: number;
    if (i === 0) {
      // Current week - use exact value with minimal variation
      value = baseValue + (Math.random() - 0.5) * (variation / 20);
    } else {
      // Future weeks - add seasonal variation
      const weekDistance = i;
      const randomFactor = weekDistance < 4
        ? (Math.random() - 0.5) * (variation / 10)  // Small variation for near weeks
        : (Math.random() - 0.5) * (variation / 3);   // Larger variation for distant weeks

      value = baseValue + seasonalFactor * variation * 0.5 + randomFactor;
    }

    const constrainedValue = optimal
      ? Math.max(optimal.min * 0.8, Math.min(optimal.max * 1.2, value))
      : value;

    const timeLabel = `W${weekNum}`;

    data.push({
      time: timeLabel,
      value: parseFloat(constrainedValue.toFixed(2))
    });
  }
  return data;
};

// Define REAL calculated parameters for short-term (hourly) view based on balance type and current values
const getShortTermParameters = (selectedBalance?: 'assimilate' | 'water' | 'energy', currentValues?: CurrentValues): ParameterData[] => {
  // Use current values or defaults
  const temperature = currentValues?.temperature ?? 24;
  const leafTemperature = currentValues?.leafTemperature ?? 25;
  const humidity = currentValues?.humidity ?? 70;
  const co2Level = currentValues?.co2Level ?? 800;
  const parLight = currentValues?.parLight ?? 400;
  const rootTemperature = currentValues?.rootTemperature ?? 20;
  const irrigationRate = currentValues?.irrigationRate ?? 2.5;
  const airSpeed = currentValues?.airSpeed ?? 1.0;
  // const vpd = currentValues?.vpd ?? 1.0; // Not used in current implementation
  const vpdi = currentValues?.vpdi ?? 1.1;

  // Only include REAL calculated parameters - Updated per client feedback
  const realParams: ParameterData[] = [
    { name: 'Greenhouse Temperature', unit: '°C', data: generateHourlyData(temperature, 3, { min: 20, max: 28 }), color: '#ef4444', optimal: { min: 22, max: 26 } },
    { name: 'Relative Humidity', unit: '%', data: generateHourlyData(humidity, 10, { min: 60, max: 80 }), color: '#3b82f6', optimal: { min: 65, max: 75 } },
    { name: 'PAR Light', unit: 'μmol/m²/s', data: generateHourlyPARData(parLight, { min: 200, max: 800 }), color: '#f59e0b', optimal: { min: 300, max: 600 } },
    { name: 'CO₂ Level', unit: 'ppm', data: generateHourlyData(co2Level, 100, { min: 600, max: 1000 }), color: '#10b981', optimal: { min: 700, max: 900 } },
    { name: 'Leaf Temperature', unit: '°C', data: generateHourlyData(leafTemperature, 2, { min: 22, max: 28 }), color: '#ec4899', optimal: { min: 23, max: 27 } },
    // Skip VPD as per client feedback
    { name: 'VPDi leaf/greenhouse', unit: 'kPa', data: generateHourlyData(vpdi, 0.3, { min: 0.8, max: 1.2 }), color: '#a855f7', optimal: { min: 0.8, max: 1.2 } },
    // DLI in joules/cm²/day: 1 mol/m² = 1 MJ/m² = 100 J/cm²
    { name: 'DLI', unit: 'J/cm²/day', data: generateHourlyData(((parLight * 12 * 3600) / 1000000) * 100, 200, { min: 500, max: 3000 }), color: '#eab308', optimal: { min: 1000, max: 2500 } },
    // Also show DLI in mol/m²/day as requested
    { name: 'DLI', unit: 'mol/m²/day', data: generateHourlyData((parLight * 12 * 3600) / 1000000, 5, { min: 5, max: 30 }), color: '#fbbf24', optimal: { min: 10, max: 25 } }
    // Skip the lowest four graphics (Photosynthesis, Respiration, Net Assimilation, RTR) as per client feedback
  ];

  // Add balance-specific real parameters
  if (selectedBalance === 'water') {
    realParams.push(
      { name: 'Water Flow Rate', unit: 'L/m²/s', data: generateHourlyData(irrigationRate / 3600, (irrigationRate / 3600) * 0.3, { min: 0.001, max: 0.002 }), color: '#06b6d4', optimal: { min: 0.0012, max: 0.0016 } },
      { name: 'Root Temperature', unit: '°C', data: generateHourlyData(rootTemperature, 1.5, { min: 18, max: 22 }), color: '#14b8a6', optimal: { min: 19, max: 21 } },
      { name: 'Irrigation Rate', unit: 'L/m²/h', data: generateHourlyData(irrigationRate, 0.3, { min: 2, max: 3 }), color: '#1e40af', optimal: { min: 2.2, max: 2.8 } }
    );
  } else if (selectedBalance === 'energy') {
    realParams.push(
      { name: 'Net Radiation', unit: 'W/m²', data: generateHourlyData(parLight * 0.75, 150, { min: 100, max: 500 }), color: '#fbbf24', optimal: { min: 200, max: 400 } },
      { name: 'Air Speed', unit: 'm/s', data: generateHourlyData(airSpeed, 0.3, { min: 0.8, max: 2 }), color: '#06b6d4', optimal: { min: 1, max: 1.5 } },
      { name: 'Enthalpy', unit: 'kJ/kg', data: generateHourlyData(50, 10, { min: 40, max: 70 }), color: '#f97316', optimal: { min: 45, max: 60 } }
    );
  }

  return realParams;
};

// Define REAL calculated parameters for long-term (weekly) view
const getLongTermParameters = (selectedBalance?: 'assimilate' | 'water' | 'energy', currentValues?: CurrentValues): ParameterData[] => {
  // Use current values or defaults
  const temperature = currentValues?.temperature ?? 24;
  const leafTemperature = currentValues?.leafTemperature ?? 25;
  const humidity = currentValues?.humidity ?? 70;
  const co2Level = currentValues?.co2Level ?? 800;
  const parLight = currentValues?.parLight ?? 400;
  const rootTemperature = currentValues?.rootTemperature ?? 20;
  const irrigationRate = currentValues?.irrigationRate ?? 2.5;
  // const vpd = currentValues?.vpd ?? 1.0; // Not used in current implementation
  const vpdi = currentValues?.vpdi ?? 1.1;

  // Calculate weekly values from current values
  const weeklyDLI = (parLight * 12 * 3600 * 7) / 1000000; // Weekly total DLI
  const weeklyIrrigation = irrigationRate * 24 * 7; // Total weekly irrigation
  // const weeklyPhotosynthesis = parLight * 0.0375 * 12 * 7; // Not used - skipped per client feedback

  // Only include REAL calculated parameters - Updated per client feedback
  const realParams: ParameterData[] = [
    { name: 'Avg Temperature', unit: '°C', data: generateWeeklyData(temperature, 5, { min: 18, max: 28 }), color: '#ef4444', optimal: { min: 20, max: 26 } },
    { name: 'Avg Humidity', unit: '%', data: generateWeeklyData(humidity, 15, { min: 55, max: 85 }), color: '#3b82f6', optimal: { min: 60, max: 80 } },
    // Make Weekly PAR scale with actual PAR values
    { name: 'Weekly PAR Total', unit: 'mol/m²', data: generateWeeklyData((parLight * 12 * 3600 * 7) / 1000000, 50, { min: 50, max: 250 }), color: '#f59e0b', optimal: { min: 100, max: 200 } },
    { name: 'Avg CO₂', unit: 'ppm', data: generateWeeklyData(co2Level, 150, { min: 600, max: 1100 }), color: '#10b981', optimal: { min: 700, max: 1000 } },
    { name: 'Avg Leaf Temp', unit: '°C', data: generateWeeklyData(leafTemperature, 4, { min: 20, max: 30 }), color: '#ec4899', optimal: { min: 22, max: 28 } },
    // Skip Avg VPD as per client feedback
    { name: 'Avg VPDi', unit: 'kPa', data: generateWeeklyData(vpdi, 0.4, { min: 0.6, max: 1.4 }), color: '#a855f7', optimal: { min: 0.8, max: 1.2 } },
    { name: 'Weekly DLI', unit: 'mol/m²', data: generateWeeklyData(weeklyDLI, 50, { min: 80, max: 250 }), color: '#eab308', optimal: { min: 100, max: 200 } },
    // Skip Total Photosynthesis and Net Assimilation as per client feedback
    { name: 'RTR Weekly', unit: '°C', data: generateWeeklyData(1.5, 1, { min: 0, max: 4 }), color: '#b91c1c', optimal: { min: 0.5, max: 3 } }
  ];

  // Add balance-specific real parameters
  if (selectedBalance === 'water') {
    realParams.push(
      { name: 'Total Irrigation', unit: 'L/m²', data: generateWeeklyData(weeklyIrrigation, 100, { min: 250, max: 600 }), color: '#06b6d4', optimal: { min: 350, max: 500 } },
      { name: 'Avg Root Temp', unit: '°C', data: generateWeeklyData(rootTemperature, 3, { min: 16, max: 24 }), color: '#14b8a6', optimal: { min: 18, max: 22 } }
    );
  } else if (selectedBalance === 'energy') {
    realParams.push(
      { name: 'Total Radiation', unit: 'MJ/m²', data: generateWeeklyData(150, 50, { min: 80, max: 250 }), color: '#fbbf24', optimal: { min: 100, max: 200 } },
      // Change to Weekly Enthalpy difference plant/greenhouse
      { name: 'Weekly Enthalpy Diff (plant/GH)', unit: 'MJ/kg', data: generateWeeklyData(50, 20, { min: 10, max: 100 }), color: '#f97316', optimal: { min: 30, max: 70 } }
    );
  }

  return realParams;
};

export const ParametersOverview: React.FC<ParametersOverviewProps> = ({
  period,
  selectedBalance,
  currentValues
}) => {
  const { hour: currentHour, weekNumber: currentWeek } = getNetherlandsTime();

  const parameters = period === 'short-term'
    ? getShortTermParameters(selectedBalance, currentValues)
    : getLongTermParameters(selectedBalance, currentValues);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          {period === 'short-term' ? '24 hours view' : '52 weeks view'}
        </h4>
        <div className="flex items-center gap-2">
          {period === 'short-term' ? (
            <>
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                Netherlands Time: {formatHour(currentHour)}
              </span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                Current: Week {currentWeek}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Parameter Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {parameters.map((param, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {param.name}
              </h5>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {param.unit}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart
                data={param.data}
                margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
              >
                <XAxis
                  dataKey="time"
                  interval={period === 'short-term' ? 5 : 12}
                  tick={{ fontSize: 8, fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={30}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={param.color}
                  strokeWidth={1.5}
                  dot={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px'
                  }}
                  labelStyle={{ color: '#fff', fontSize: '10px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px' }}
                  formatter={(value: number, name: string) => [`${value} ${param.unit}`, param.name]}
                />
              </LineChart>
            </ResponsiveContainer>
            {/* Current value display */}
            <div className="mt-1 text-center">
              <span className="text-xs font-bold" style={{ color: param.color }}>
                Current: {param.data[0]?.value} {param.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};