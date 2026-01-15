import React from 'react';
import { RadialBar, MultiRadialBar } from './RadialBar';
import { Droplet, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

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

  // 1. Water Flow Rate (L/m²/s) - Convert from L/m²/h to L/m²/s for display
  const waterFlowRate = irrigationRate / 3600; // Convert to per second
  let waterFlowPercent;
  const optimalWaterFlow = 0.0014; // ~5 L/m²/h converted to L/m²/s
  if (waterFlowRate >= optimalWaterFlow * 0.8 && waterFlowRate <= optimalWaterFlow * 1.2) {
    waterFlowPercent = 100;
  } else if (waterFlowRate < optimalWaterFlow * 0.8) {
    waterFlowPercent = Math.max(30, (waterFlowRate / (optimalWaterFlow * 0.8)) * 100);
  } else {
    waterFlowPercent = Math.max(60, 100 - ((waterFlowRate - optimalWaterFlow * 1.2) / (optimalWaterFlow * 0.8)) * 40);
  }

  // 2. VPDi Plant-Greenhouse Air (optimal 0.8-1.2 kPa)
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

  // 3. Root Zone Temperature (optimal 20-22°C)
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

  // 4. Stomatal Conductance (max 800 mmol/m²/s)
  const stomatalPercent = Math.min(100, (stomatalConductance / 800) * 100);

  const factors = [
    {
      name: 'Water Flow',
      value: Math.round(waterFlowPercent),
      actual: `${(waterFlowRate * 1000).toFixed(3)} L/m²/s`
    },
    {
      name: 'VPDi Plant-GH Air',
      value: Math.round(vpdiPercent),
      actual: `${vpdi.toFixed(2)} kPa`
    },
    {
      name: 'Root Zone Temp',
      value: Math.round(rootTempPercent),
      actual: `${rootZoneTemp.toFixed(1)}°C`
    },
    {
      name: 'Stomatal Conduct.',
      value: Math.round(stomatalPercent),
      actual: `${Math.round(stomatalConductance)} mmol/m²/s`
    }
  ];

  // Find the most limiting factor
  const mostLimiting = factors.reduce((prev, current) =>
    prev.value < current.value ? prev : current
  );

  const getStatus = (value: number) => {
    if (value < 60) return { text: 'limiting', icon: <AlertTriangle className="w-6 h-6 text-orange-500" /> };
    if (value < 80) return { text: 'adequate', icon: <AlertCircle className="w-6 h-6 text-yellow-500" /> };
    return { text: 'optimal', icon: <CheckCircle className="w-6 h-6 text-green-500" /> };
  };

  const limitingStatus = getStatus(mostLimiting.value);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Droplet className="w-5 h-5 text-blue-500" />
        Water Limiting Factors
      </h4>

      {/* Radial bar charts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {factors.map((factor, index) => {
          // Define min/max ranges for water factors
          let minValue = '';
          let maxValue = '';

          switch (factor.name) {
            case 'Water Flow':
              minValue = '0';
              maxValue = '0.003 L/m²/s';
              break;
            case 'VPDi Plant-GH Air':
              minValue = '0';
              maxValue = '3 kPa';
              break;
            case 'Root Zone Temp':
              minValue = '15°C';
              maxValue = '30°C';
              break;
            case 'Stomatal Conduct.':
              minValue = '0';
              maxValue = '800 mmol/m²/s';
              break;
          }

          return (
            <RadialBar
              key={index}
              label={factor.name}
              value={factor.value}
              actualValue={factor.actual}
              minValue={minValue}
              maxValue={maxValue}
              size={150}
            />
          );
        })}
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
          {limitingStatus.icon}
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