import React from 'react';
import { RadialBar, MultiRadialBar } from './RadialBar';
import { Sun, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface EnergyLimitingFactorsProps {
  netRadiation: number;
  parInput: number;
  leafAirDeltaT: number;
  latentHeat: number;
  sensibleHeat: number;
  bowenRatio: number;
  totalOutput?: number; // Optional, for calculating latent heat percentage
}

export const EnergyLimitingFactors: React.FC<EnergyLimitingFactorsProps> = ({
  netRadiation,
  parInput,
  leafAirDeltaT,
  latentHeat,
  sensibleHeat,
  bowenRatio,
  totalOutput = Math.abs(latentHeat) + Math.abs(sensibleHeat) + 100 // Estimate if not provided
}) => {
  // Calculate factor percentages

  // 1. Radiation Balance (efficiency of radiation capture)
  let radiationPercent;
  if (parInput === 0) {
    radiationPercent = 0;
  } else {
    const radiationEfficiency = (netRadiation / parInput);
    if (radiationEfficiency > 0.8) radiationPercent = 100;
    else if (radiationEfficiency > 0.6) radiationPercent = 80 + (radiationEfficiency - 0.6) * 100;
    else if (radiationEfficiency > 0.4) radiationPercent = 60 + (radiationEfficiency - 0.4) * 100;
    else radiationPercent = Math.max(30, radiationEfficiency * 150);
  }

  // 2. Leaf-Air Temperature Difference (optimal 0-2°C)
  let leafAirPercent;
  const absDeltaT = Math.abs(leafAirDeltaT);
  if (absDeltaT <= 2) {
    leafAirPercent = 100 - (absDeltaT / 2) * 20; // Small penalty for any difference
  } else if (absDeltaT <= 5) {
    leafAirPercent = 80 - ((absDeltaT - 2) / 3) * 40;
  } else {
    leafAirPercent = Math.max(20, 40 - ((absDeltaT - 5) / 5) * 20);
  }

  // 3. Latent Heat Transfer (transpiration cooling efficiency)
  const latentPercent = totalOutput === 0 ? 0 :
    Math.min(100, Math.max(30, (Math.abs(latentHeat) / totalOutput) * 100 * 2));

  // 4. Sensible Heat Control (based on Bowen ratio, optimal 0.5-1.5)
  let bowenPercent;
  if (bowenRatio >= 0.5 && bowenRatio <= 1.5) {
    bowenPercent = 100 - Math.abs(bowenRatio - 1) * 20; // Slight penalty from 1.0
  } else if (bowenRatio < 0.5) {
    bowenPercent = Math.max(40, 80 - (0.5 - bowenRatio) * 80);
  } else if (bowenRatio <= 3) {
    bowenPercent = 80 - ((bowenRatio - 1.5) / 1.5) * 40;
  } else {
    bowenPercent = Math.max(20, 40 - ((bowenRatio - 3) / 2) * 20);
  }

  const factors = [
    {
      name: 'Radiation Use',
      value: Math.round(radiationPercent),
      actual: `${netRadiation.toFixed(0)} W/m²`
    },
    {
      name: 'Leaf-Air ΔT',
      value: Math.round(leafAirPercent),
      actual: `${leafAirDeltaT.toFixed(1)}°C`
    },
    {
      name: 'Latent Cooling',
      value: Math.round(latentPercent),
      actual: `${Math.abs(latentHeat).toFixed(0)} W/m²`
    },
    {
      name: 'Heat Balance',
      value: Math.round(bowenPercent),
      actual: `BR: ${bowenRatio.toFixed(1)}`
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
        <Sun className="w-5 h-5 text-yellow-500" />
        Energy Limiting Factors
      </h4>

      {/* Radial bar charts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {factors.map((factor, index) => {
          // Define min/max ranges for energy factors
          let minValue = '';
          let maxValue = '';

          switch (factor.name) {
            case 'Radiation Use':
              minValue = '0';
              maxValue = '1000';
              break;
            case 'Leaf-Air ΔT':
              minValue = '-5°C';
              maxValue = '+5°C';
              break;
            case 'Latent Cooling':
              minValue = '0';
              maxValue = '500';
              break;
            case 'Heat Balance':
              minValue = '0';
              maxValue = '3';
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
      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
              Most Limiting Energy Factor
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