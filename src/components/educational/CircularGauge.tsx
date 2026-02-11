import React from 'react';

interface CircularGaugeProps {
  label: string;
  value: number; // 0-100 percentage
  size?: number; // Size of the gauge in pixels
  strokeWidth?: number;
  actualValue?: string; // Optional actual value to display (e.g., "20°C")
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  label,
  value,
  size = 120,
  strokeWidth = 10,
  actualValue
}) => {
  // Ensure value is within 0-100 range
  const safeValue = Math.max(0, Math.min(100, value));

  // Use 99.99 for 100% to avoid SVG rendering issues
  const renderValue = safeValue === 100 ? 99.99 : safeValue;

  // Determine color based on value
  const getColor = (val: number): string => {
    if (val < 60) return '#ef4444'; // red-500
    if (val < 80) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  const getStatus = (val: number): string => {
    if (val < 60) return 'Limiting';
    if (val < 80) return 'Adequate';
    return 'Optimal';
  };

  const color = getColor(safeValue);
  const status = getStatus(safeValue);

  // Calculate SVG properties
  const viewBoxSize = size;
  const center = viewBoxSize / 2;
  const radius = (viewBoxSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // We want a 270-degree arc (3/4 of the circle)
  const arcLength = circumference * 0.75;
  const progressLength = (renderValue / 100) * arcLength;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative transition-transform duration-300 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="transform -rotate-90"
        >
          {/* Definitions for gradients and filters */}
          <defs>
            {/* Gradient for the progress arc */}
            <linearGradient id={`gauge-gradient-${label.replace(/\s+/g, '-')}-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </linearGradient>

            {/* Shadow/glow effect */}
            <filter id={`gauge-glow-${label.replace(/\s+/g, '-')}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background arc (270 degrees) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className="stroke-gray-300 dark:stroke-gray-700 opacity-30"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(135 ${center} ${center})`}
          />

          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progressLength} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(135 ${center} ${center})`}
            style={{
              filter: `drop-shadow(0 0 4px ${color})`,
              transition: 'stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.95
            }}
          />

          {/* Decorative marks at 0%, 50%, 100% */}
          {[0, 50, 100].map((mark) => {
            const angle = (mark / 100) * 270 + 135;
            const markRadius = radius - strokeWidth / 2;
            const radian = (angle * Math.PI) / 180;
            const x = center + markRadius * Math.cos(radian);
            const y = center + markRadius * Math.sin(radian);

            return (
              <circle
                key={mark}
                cx={x}
                cy={y}
                r="2"
                className="fill-gray-400 dark:fill-gray-600"
                opacity="0.5"
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Percentage display */}
          <div className="text-center">
            <div
              className="text-2xl font-bold tabular-nums"
              style={{
                color,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {safeValue}%
            </div>
            {/* Status label */}
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {status}
            </div>
          </div>
        </div>
      </div>

      {/* Label below gauge */}
      <div className="mt-2 text-center">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </div>
        {actualValue && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {actualValue}
          </div>
        )}
      </div>
    </div>
  );
};

// Mini version for compact display
export const MiniCircularGauge: React.FC<{
  value: number;
  size?: number;
}> = ({ value, size = 40 }) => {
  const getColor = (val: number): string => {
    if (val < 60) return '#ef4444';
    if (val < 80) return '#eab308';
    return '#22c55e';
  };

  const color = getColor(value);
  const center = size / 2;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const offset = arcLength - (arcLength * value) / 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-gray-300 dark:stroke-gray-700"
          strokeWidth="3"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {value}
        </span>
      </div>
    </div>
  );
};