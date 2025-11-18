import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  zone: string;
}

interface HeatmapProps {
  greenhouseId?: string;
}

const GreenhouseHeatmap: React.FC<HeatmapProps> = ({ greenhouseId }) => {
  // Data types for the heatmap - simplified for compact view
  const dataTypes = [
    { id: 'temperature', name: 'Temp', unit: '°C', min: 18, max: 30, optimal: 24, icon: '🌡️' },
    { id: 'humidity', name: 'Humid', unit: '%', min: 40, max: 90, optimal: 65, icon: '💧' },
    { id: 'light', name: 'Light', unit: 'lux', min: 0, max: 1500, optimal: 800, icon: '💡' },
    { id: 'co2', name: 'CO2', unit: 'ppm', min: 300, max: 1200, optimal: 800, icon: '💨' }
  ];

  const [selectedDataType, setSelectedDataType] = useState(dataTypes[0]);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Generate mock data for the heatmap (6x5 grid for compact view)
  const generateHeatmapData = useMemo(() => {
    const rows = 5;
    const cols = 6;
    const data: HeatmapCell[] = [];

    // Create realistic patterns based on data type
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let value: number;
        const zone = `${String.fromCharCode(65 + Math.floor(y / 2))}${Math.floor(x / 2) + 1}`;

        // Generate values with realistic patterns
        switch (selectedDataType.id) {
          case 'temperature':
            // Higher temperature near edges (sun exposure)
            const tempDistance = Math.min(x, cols - 1 - x, y, rows - 1 - y);
            value = selectedDataType.optimal + (3 - tempDistance) * 1.5 + (Math.random() - 0.5) * 2;
            break;
          case 'humidity':
            // Higher humidity in center (irrigation systems)
            const humidityDistance = Math.sqrt(Math.pow(x - cols/2, 2) + Math.pow(y - rows/2, 2));
            value = selectedDataType.optimal + (5 - humidityDistance) * 3 + (Math.random() - 0.5) * 5;
            break;
          case 'light':
            // More light on south side (assuming y=0 is south)
            value = selectedDataType.optimal + (rows - y) * 50 + (Math.random() - 0.5) * 100;
            break;
          case 'co2':
            // CO2 varies with ventilation patterns
            value = selectedDataType.optimal + Math.sin(x * 0.5) * 100 + Math.cos(y * 0.7) * 50 + (Math.random() - 0.5) * 50;
            break;
          default:
            value = selectedDataType.optimal + (Math.random() - 0.5) * 10;
        }

        // Clamp values within min/max range
        value = Math.max(selectedDataType.min, Math.min(selectedDataType.max, value));

        data.push({ x, y, value: Math.round(value * 10) / 10, zone });
      }
    }

    return data;
  }, [selectedDataType]);

  // Get color for cell based on value
  const getCellColor = (value: number) => {
    const { min, max, optimal } = selectedDataType;

    // Color gradient from blue (cold/low) -> green (optimal) -> red (hot/high)
    if (value < optimal) {
      const ratio = (value - min) / (optimal - min);
      if (ratio < 0.5) {
        // Deep blue to light blue
        return `rgba(59, 130, 246, ${0.3 + ratio * 0.7})`;
      } else {
        // Light blue to green
        const greenRatio = (ratio - 0.5) * 2;
        return `rgba(${59 + (34 - 59) * greenRatio}, ${130 + (197 - 130) * greenRatio}, ${246 + (94 - 246) * greenRatio}, ${0.65 + greenRatio * 0.35})`;
      }
    } else {
      const ratio = (value - optimal) / (max - optimal);
      if (ratio < 0.5) {
        // Green to yellow
        const yellowRatio = ratio * 2;
        return `rgba(${34 + (251 - 34) * yellowRatio}, ${197 + (191 - 197) * yellowRatio}, ${94 + (36 - 94) * yellowRatio}, ${1 - yellowRatio * 0.2})`;
      } else {
        // Yellow to red
        const redRatio = (ratio - 0.5) * 2;
        return `rgba(${251 + (239 - 251) * redRatio}, ${191 + (68 - 191) * redRatio}, ${36 + (44 - 36) * redRatio}, ${0.8 + redRatio * 0.2})`;
      }
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const values = generateHeatmapData.map(cell => cell.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const optimalCount = values.filter(v => Math.abs(v - selectedDataType.optimal) < (selectedDataType.max - selectedDataType.min) * 0.1).length;

    return {
      average: Math.round(avg * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      optimalPercentage: Math.round((optimalCount / values.length) * 100)
    };
  }, [generateHeatmapData, selectedDataType]);

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-6">
        <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground">Heat Map</h3>
          <div className="badge-success">
            {selectedDataType.icon} Live
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">Greenhouse zones monitoring</p>
      </div>

      {/* Compact Data Type Selector */}
      <div className="grid grid-cols-4 gap-1 mb-4">
        {dataTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedDataType(type)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              selectedDataType.id === type.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border hover:bg-secondary'
            }`}
          >
            <span className="mr-1">{type.icon}</span>
            {type.name}
          </button>
        ))}
      </div>

      {/* Compact Heatmap Grid */}
      <div className="relative">
        <div className="grid grid-cols-6 gap-0.5 p-2 bg-secondary/50 rounded-lg border">
          {generateHeatmapData.map((cell, index) => (
            <motion.div
              key={`${cell.x}-${cell.y}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.005 }}
              className="aspect-square relative group cursor-pointer"
              onMouseEnter={() => setHoveredCell(cell)}
              onMouseLeave={() => setHoveredCell(null)}
              style={{
                backgroundColor: getCellColor(cell.value),
                borderRadius: '2px'
              }}
            >
              {/* Show value on hover */}
              {hoveredCell && hoveredCell.x === cell.x && hoveredCell.y === cell.y && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                  <div className="font-bold">{cell.zone}: {cell.value}{selectedDataType.unit}</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Compact Legend */}
        <div className="mt-3 p-2 bg-card rounded border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Range</span>
            <span className="text-xs font-medium">
              {selectedDataType.min}-{selectedDataType.max}{selectedDataType.unit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 relative">
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-3 bg-foreground rounded-full"
              style={{
                left: `${((selectedDataType.optimal - selectedDataType.min) / (selectedDataType.max - selectedDataType.min)) * 100}%`
              }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground mt-1">
            Optimal: {selectedDataType.optimal}{selectedDataType.unit}
          </div>
        </div>

        {/* Compact Statistics */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-card rounded p-2 border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg</span>
              <span className="text-xs font-bold">{stats.average}{selectedDataType.unit}</span>
            </div>
          </div>
          <div className="bg-card rounded p-2 border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Optimal</span>
              <span className="text-xs font-bold text-green-500">{stats.optimalPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default GreenhouseHeatmap;