import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';

interface TooltipProps {
  title: string;
  content: string;
  example?: string;
  icon?: 'info' | 'help';
}

export const EducationalTooltip: React.FC<TooltipProps> = ({
  title,
  content,
  example,
  icon = 'info'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = icon === 'info' ? Info : HelpCircle;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 text-blue-500 hover:text-blue-600 transition-colors"
        aria-label={title}
      >
        <Icon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg -top-2 left-6">
          <div className="relative">
            {/* Arrow pointing to icon */}
            <div className="absolute -left-6 top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white dark:border-r-gray-800" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {content}
            </p>
            {example && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-gray-700 rounded">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  Example:
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {example}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Educational content for plant balance concepts
export const tooltipContent = {
  photosynthesis: {
    title: "Photosynthesis",
    content: "The process where plants use light, CO2, and water to make food (sugar). Think of it as the plant's kitchen where it cooks its own meals!",
    example: "A tomato plant in bright light (600 μmol/m²/s) with good CO2 (800 ppm) can produce about 15-20 μmol/m²/s of sugar."
  },
  respiration: {
    title: "Respiration",
    content: "Plants 'breathe' and use energy just like us! They burn sugar for energy, especially at night or when it's warm.",
    example: "At 25°C, a plant uses about 1.5 μmol/m²/s of the sugar it made. When it's 30°C, this doubles!"
  },
  netAssimilation: {
    title: "Net Assimilation",
    content: "The plant's 'profit' - what's left after subtracting energy use (respiration) from energy production (photosynthesis).",
    example: "If photosynthesis = 15 and respiration = 2, net assimilation = 13. This is what the plant can use to grow!"
  },
  transpiration: {
    title: "Transpiration",
    content: "Water evaporation from leaves - like plant sweating! It cools the plant and pulls nutrients up from roots.",
    example: "On a sunny day, a tomato plant can lose 3-4 liters of water per square meter of leaves per hour."
  },
  vpd: {
    title: "VPD (Vapor Pressure Deficit)",
    content: "How 'thirsty' the air is. Dry air (high VPD) pulls more water from plants. Humid air (low VPD) pulls less.",
    example: "VPD of 1.0 kPa is ideal. Below 0.5 kPa = too humid (disease risk). Above 2.0 kPa = too dry (stressed plants)."
  },
  parLight: {
    title: "PAR Light",
    content: "The type of light plants can use for photosynthesis (400-700 nm wavelength). Not all light is 'food' for plants!",
    example: "Tomatoes need 200-300 μmol/m²/s minimum, work best at 400-600, and max out around 800 μmol/m²/s."
  },
  co2Level: {
    title: "CO2 Level",
    content: "Carbon dioxide - the main ingredient plants use to make sugar. More CO2 = more potential growth (up to a point).",
    example: "Normal air = 400 ppm. Greenhouses often add CO2 to reach 800-1000 ppm for 30% more growth!"
  },
  temperature: {
    title: "Temperature",
    content: "Affects all plant processes. Too cold = slow growth. Too hot = stress and high energy use.",
    example: "Most vegetables grow best at 20-25°C during the day, 16-18°C at night."
  },
  rootTemperature: {
    title: "Root Temperature",
    content: "Cold roots can't drink water well. Warm roots work faster but need more oxygen.",
    example: "18-22°C is perfect for most crops. Below 15°C = slow uptake. Above 25°C = oxygen problems."
  },
  waterBalance: {
    title: "Water Balance",
    content: "Like a bank account: Water IN (roots + irrigation) minus Water OUT (transpiration + growth) = Balance.",
    example: "If roots take 4 L/h and you irrigate 2 L/h (IN = 6), but plant uses 5 L/h (OUT), balance = +1 L/h (good!)"
  },
  energyBalance: {
    title: "Energy Balance",
    content: "How the plant manages heat: Energy IN (sun) minus Energy OUT (cooling by transpiration + photosynthesis).",
    example: "Too much sun + not enough water = overheating. Good transpiration = natural air conditioning!"
  },
  dli: {
    title: "Daily Light Integral",
    content: "Total amount of light per day - like counting total calories eaten. More light = more potential growth.",
    example: "Lettuce needs 12-14 mol/m²/day. Tomatoes need 20-30 mol/m²/day for good production."
  },
  wue: {
    title: "Water Use Efficiency",
    content: "How many grams of tomatoes you get per liter of water used. Higher = more efficient!",
    example: "Modern greenhouses achieve 30-40 g tomatoes per liter. Traditional farming: only 10-15 g/L."
  }
};

// Simple educational indicator component
export const EducationalIndicator: React.FC<{
  value: number;
  optimal: number;
  unit: string;
  label: string;
  tooltip: keyof typeof tooltipContent;
  thresholds?: {
    low: number;
    high: number;
  };
}> = ({ value, optimal, unit, label, tooltip, thresholds }) => {
  const getStatus = () => {
    if (!thresholds) {
      const ratio = value / optimal;
      if (ratio < 0.8) return { color: 'text-yellow-600', status: 'Low' };
      if (ratio > 1.2) return { color: 'text-orange-600', status: 'High' };
      return { color: 'text-green-600', status: 'Good' };
    }

    if (value < thresholds.low) return { color: 'text-yellow-600', status: 'Low' };
    if (value > thresholds.high) return { color: 'text-orange-600', status: 'High' };
    return { color: 'text-green-600', status: 'Good' };
  };

  const { color, status } = getStatus();

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </span>
        <EducationalTooltip {...tooltipContent[tooltip]} />
      </div>
      <div className="text-right">
        <div className={`text-lg font-bold ${color}`}>
          {value.toFixed(1)} {unit}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Status: {status}
        </div>
      </div>
    </div>
  );
};

// Learning objectives component
export const LearningObjectives: React.FC<{
  objectives: string[];
}> = ({ objectives }) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
      <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1.5 flex items-center">
        <span className="mr-1 text-xs">🎯</span>
        Learning Objectives
      </h4>
      <ul className="space-y-0.5">
        {objectives.slice(0, 3).map((objective, index) => (
          <li key={index} className="text-xs text-blue-800 dark:text-blue-200 flex items-start">
            <span className="mr-1">•</span>
            <span className="leading-snug">{objective}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};