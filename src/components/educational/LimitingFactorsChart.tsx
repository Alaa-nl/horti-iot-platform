import React from 'react';
import { RadialBar, MultiRadialBar } from './RadialBar';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface Factor {
  name: string;
  value: number; // 0-100 percentage of optimal
  color: string;
  status: 'limiting' | 'adequate' | 'optimal';
}

interface LimitingFactorsChartProps {
  factors: Factor[];
  title?: string;
  actualValues?: {
    parLight?: number;
    co2Level?: number;
    temperature?: number;
    humidity?: number;
  };
}

export const LimitingFactorsChart: React.FC<LimitingFactorsChartProps> = ({
  factors,
  title = "Limiting Factors Analysis",
  actualValues
}) => {
  // Find the most limiting factor
  const mostLimiting = factors.reduce((prev, current) =>
    prev.value < current.value ? prev : current
  );

  // Define min/max ranges and get actual values for each factor
  const getFactorDetails = (factorName: string) => {
    switch (factorName) {
      case 'Light (PAR)':
        return {
          minValue: '0',
          maxValue: '1500',
          actualValue: actualValues?.parLight ? `${actualValues.parLight} μmol` : undefined
        };
      case 'CO₂ Level':
        return {
          minValue: '200',
          maxValue: '1500',
          actualValue: actualValues?.co2Level ? `${actualValues.co2Level} ppm` : undefined
        };
      case 'Temperature':
        return {
          minValue: '10°C',
          maxValue: '40°C',
          actualValue: actualValues?.temperature ? `${actualValues.temperature}°C` : undefined
        };
      case 'VPDi (Water)':
        return {
          minValue: '0',
          maxValue: '3 kPa',
          actualValue: actualValues?.humidity ? `${actualValues.humidity}% RH` : undefined
        };
      default:
        return {};
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {title}
      </h4>

      {/* Radial bar charts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {factors.map((factor, index) => {
          const details = getFactorDetails(factor.name);
          return (
            <RadialBar
              key={index}
              label={factor.name}
              value={factor.value}
              minValue={details.minValue}
              maxValue={details.maxValue}
              actualValue={details.actualValue}
              size={150}
            />
          );
        })}
      </div>

      {/* Most limiting factor indicator */}
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Most Limiting Factor
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {mostLimiting.name} is currently limiting growth at {mostLimiting.value}%
            </p>
          </div>
          {mostLimiting.status === 'limiting' ?
            <AlertTriangle className="w-6 h-6 text-orange-500" /> :
           mostLimiting.status === 'adequate' ?
            <AlertCircle className="w-6 h-6 text-yellow-500" /> :
            <CheckCircle className="w-6 h-6 text-green-500" />}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center justify-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
          <span className="text-gray-700 dark:text-gray-300">Limiting &lt;60%</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
          <span className="text-gray-700 dark:text-gray-300">Adequate 60-80%</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
          <span className="text-gray-700 dark:text-gray-300">Optimal &gt;80%</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate factor percentages
export const calculateLimitingFactors = (
  parLight: number,
  co2Level: number,
  temperature: number,
  humidity: number,
  vpdi: number
): Factor[] => {
  // Light factor (optimal 400-600 μmol/m²/s)
  let lightPercent;
  if (parLight < 200) lightPercent = (parLight / 200) * 60;
  else if (parLight <= 600) lightPercent = 80 + ((parLight - 200) / 400) * 20;
  else lightPercent = Math.max(80, 100 - ((parLight - 600) / 400) * 20);

  // CO2 factor (optimal 800-1000 ppm)
  let co2Percent;
  if (co2Level < 400) co2Percent = (co2Level / 400) * 60;
  else if (co2Level <= 1000) co2Percent = 60 + ((co2Level - 400) / 600) * 40;
  else co2Percent = Math.max(80, 100 - ((co2Level - 1000) / 500) * 20);

  // Temperature factor (optimal 22-26°C)
  let tempPercent;
  if (temperature < 18) tempPercent = Math.max(20, (temperature / 18) * 60);
  else if (temperature >= 22 && temperature <= 26) tempPercent = 100;
  else if (temperature < 22) tempPercent = 60 + ((temperature - 18) / 4) * 40;
  else if (temperature <= 30) tempPercent = 100 - ((temperature - 26) / 4) * 30;
  else tempPercent = Math.max(20, 70 - ((temperature - 30) / 10) * 50);

  // Humidity/VPDi factor (optimal VPDi 0.8-1.2 kPa)
  let vpdiPercent;
  if (vpdi < 0.5) vpdiPercent = Math.max(30, (vpdi / 0.5) * 60);
  else if (vpdi >= 0.8 && vpdi <= 1.2) vpdiPercent = 100;
  else if (vpdi < 0.8) vpdiPercent = 60 + ((vpdi - 0.5) / 0.3) * 40;
  else if (vpdi <= 2.0) vpdiPercent = 100 - ((vpdi - 1.2) / 0.8) * 40;
  else vpdiPercent = Math.max(20, 60 - ((vpdi - 2.0) / 1.0) * 40);

  const factors: Factor[] = [
    {
      name: 'Light (PAR)',
      value: Math.round(lightPercent),
      color: lightPercent < 60 ? 'bg-red-500' : lightPercent < 80 ? 'bg-yellow-500' : 'bg-green-500',
      status: lightPercent < 60 ? 'limiting' : lightPercent < 80 ? 'adequate' : 'optimal'
    },
    {
      name: 'CO₂ Level',
      value: Math.round(co2Percent),
      color: co2Percent < 60 ? 'bg-red-500' : co2Percent < 80 ? 'bg-yellow-500' : 'bg-green-500',
      status: co2Percent < 60 ? 'limiting' : co2Percent < 80 ? 'adequate' : 'optimal'
    },
    {
      name: 'Temperature',
      value: Math.round(tempPercent),
      color: tempPercent < 60 ? 'bg-red-500' : tempPercent < 80 ? 'bg-yellow-500' : 'bg-green-500',
      status: tempPercent < 60 ? 'limiting' : tempPercent < 80 ? 'adequate' : 'optimal'
    },
    {
      name: 'VPDi (Water)',
      value: Math.round(vpdiPercent),
      color: vpdiPercent < 60 ? 'bg-red-500' : vpdiPercent < 80 ? 'bg-yellow-500' : 'bg-green-500',
      status: vpdiPercent < 60 ? 'limiting' : vpdiPercent < 80 ? 'adequate' : 'optimal'
    }
  ];

  return factors.sort((a, b) => a.value - b.value); // Sort by most limiting
};