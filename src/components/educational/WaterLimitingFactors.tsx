import React from 'react';
import { CircularGauge } from './CircularGauge';

interface WaterLimitingFactorsProps {
  rootZoneTemp: number;
  vpdi: number;
  irrigationRate: number;
  stomatalConductance: number;
  waterDemand?: number; // Optional, for calculating irrigation adequacy
}

export const WaterLimitingFactors: React.FC<WaterLimitingFactorsProps> = ({
  rootZoneTemp,
  vpdi,
  irrigationRate,
  stomatalConductance,
  waterDemand = 5 // Default water demand L/m²/h
}) => {
  // Calculate factor percentages

  // 1. Root Zone Temperature (optimal 20-22°C)
  let rootTempPercent;
  if (rootZoneTemp >= 20 && rootZoneTemp <= 22) {
    rootTempPercent = 100;
  } else if (rootZoneTemp < 20) {
    // Below optimal
    if (rootZoneTemp < 10) rootTempPercent = 30;
    else rootTempPercent = 60 + ((rootZoneTemp - 10) / 10) * 40;
  } else {
    // Above optimal
    if (rootZoneTemp > 30) rootTempPercent = 40;
    else rootTempPercent = 100 - ((rootZoneTemp - 22) / 8) * 60;
  }

  // 2. VPDi (optimal 0.8-1.2 kPa)
  let vpdiPercent;
  if (vpdi >= 0.8 && vpdi <= 1.2) {
    vpdiPercent = 100;
  } else if (vpdi < 0.8) {
    if (vpdi < 0.3) vpdiPercent = 40;
    else vpdiPercent = 40 + ((vpdi - 0.3) / 0.5) * 60;
  } else {
    // Above optimal
    if (vpdi > 2.5) vpdiPercent = 30;
    else vpdiPercent = 100 - ((vpdi - 1.2) / 1.3) * 70;
  }

  // 3. Irrigation Adequacy
  const irrigationPercent = Math.min(100, (irrigationRate / waterDemand) * 100);

  // 4. Stomatal Conductance (max 800 mmol/m²/s)
  const stomatalPercent = Math.min(100, (stomatalConductance / 800) * 100);

  const factors = [
    {
      name: 'Root Zone Temp',
      value: Math.round(rootTempPercent),
      actual: `${rootZoneTemp.toFixed(1)}°C`
    },
    {
      name: 'VPDi (Plant)',
      value: Math.round(vpdiPercent),
      actual: `${vpdi.toFixed(2)} kPa`
    },
    {
      name: 'Irrigation',
      value: Math.round(irrigationPercent),
      actual: `${irrigationRate.toFixed(1)} L/m²/h`
    },
    {
      name: 'Stomatal Flow',
      value: Math.round(stomatalPercent),
      actual: `${Math.round(stomatalConductance)} mmol/m²/s`
    }
  ];

  // Find the most limiting factor
  const mostLimiting = factors.reduce((prev, current) =>
    prev.value < current.value ? prev : current
  );

  const getStatus = (value: number) => {
    if (value < 60) return { text: 'limiting', emoji: '⚠️' };
    if (value < 80) return { text: 'adequate', emoji: '🔶' };
    return { text: 'optimal', emoji: '✅' };
  };

  const limitingStatus = getStatus(mostLimiting.value);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        💧 Water Limiting Factors (as requested by supervisor)
      </h4>

      {/* Circular gauges grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        {factors.map((factor, index) => (
          <CircularGauge
            key={index}
            label={factor.name}
            value={factor.value}
            size={110}
            actualValue={factor.actual}
          />
        ))}
      </div>

      {/* Most limiting factor indicator */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Most Limiting Water Factor
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {mostLimiting.name} is currently {limitingStatus.text} at {mostLimiting.value}% ({mostLimiting.actual})
            </p>
          </div>
          <div className="text-2xl">
            {limitingStatus.emoji}
          </div>
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