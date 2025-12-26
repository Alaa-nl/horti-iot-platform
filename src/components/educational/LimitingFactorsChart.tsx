import React from 'react';

interface Factor {
  name: string;
  value: number; // 0-100 percentage of optimal
  color: string;
  status: 'limiting' | 'adequate' | 'optimal';
}

interface LimitingFactorsChartProps {
  factors: Factor[];
  title?: string;
}

export const LimitingFactorsChart: React.FC<LimitingFactorsChartProps> = ({
  factors,
  title = "Limiting Factors Analysis"
}) => {
  // Find the most limiting factor
  const mostLimiting = factors.reduce((prev, current) =>
    prev.value < current.value ? prev : current
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h4>

      {/* Visual bars for each factor */}
      <div className="space-y-3">
        {factors.map((factor, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {factor.name}
              </span>
              <span className={`text-xs font-bold ${
                factor.status === 'limiting' ? 'text-red-600 dark:text-red-400' :
                factor.status === 'optimal' ? 'text-green-600 dark:text-green-400' :
                'text-yellow-600 dark:text-yellow-400'
              }`}>
                {factor.value}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${factor.color}`}
                style={{ width: `${factor.value}%` }}
              />
              {/* Optimal range indicator */}
              <div className="absolute top-0 left-[80%] w-0.5 h-4 bg-gray-400 dark:bg-gray-500" />
              <div className="absolute top-0 left-[100%] w-0.5 h-4 bg-gray-400 dark:bg-gray-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Most limiting factor indicator */}
      <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <span className="font-semibold">Most Limiting:</span> {mostLimiting.name} at {mostLimiting.value}%
        </p>
      </div>

      {/* Legend */}
      <div className="mt-3 flex justify-around text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1" />
          <span className="text-gray-600 dark:text-gray-400">Limiting (&lt;60%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1" />
          <span className="text-gray-600 dark:text-gray-400">Adequate (60-80%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1" />
          <span className="text-gray-600 dark:text-gray-400">Optimal (&gt;80%)</span>
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