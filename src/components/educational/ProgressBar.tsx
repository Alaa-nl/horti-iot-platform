import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface ProgressBarProps {
  label: string;
  value: number; // 0-100 percentage
  actualValue?: string; // Optional actual value to display (e.g., "20°C")
  showIcon?: boolean; // Show status icon
  compact?: boolean; // Compact mode for smaller displays
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  actualValue,
  showIcon = true,
  compact = false
}) => {
  // Ensure value is within 0-100 range
  const safeValue = Math.max(0, Math.min(100, value));

  const getColor = (val: number): string => {
    if (val < 60) return 'bg-red-500';
    if (val < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getColorHex = (val: number): string => {
    if (val < 60) return '#ef4444'; // red-500
    if (val < 80) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  const getStatus = (val: number): string => {
    if (val < 60) return 'Limiting';
    if (val < 80) return 'Adequate';
    return 'Optimal';
  };

  const getStatusIcon = (val: number) => {
    if (val < 60) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (val < 80) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const color = getColor(safeValue);
  const colorHex = getColorHex(safeValue);
  const status = getStatus(safeValue);

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <div className="flex items-center gap-1">
            {showIcon && getStatusIcon(safeValue)}
            <span className="text-xs font-bold" style={{ color: colorHex }}>
              {safeValue}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-4 rounded-full ${color} transition-all duration-700 ease-out relative`}
            style={{ width: `${safeValue}%` }}
          >
            <div
              className="absolute inset-0 bg-white opacity-20"
              style={{
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
                animation: 'shimmer 2s infinite'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
          {actualValue && (
            <span className="text-xs text-gray-500 dark:text-gray-400">({actualValue})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showIcon && getStatusIcon(safeValue)}
          <span className="text-sm font-bold" style={{ color: colorHex }}>
            {safeValue}%
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700 overflow-hidden shadow-inner">
        <div
          className={`h-6 rounded-full ${color} transition-all duration-700 ease-out relative shadow-sm`}
          style={{ width: `${safeValue}%` }}
        >
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />

          {/* Animated shimmer effect */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
              animation: 'shimmer 2s infinite',
              borderRadius: '9999px'
            }}
          />

          {/* Status text inside the bar */}
          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold drop-shadow-sm">
            {safeValue >= 20 && status}
          </span>
        </div>
      </div>

      {/* Status text below for narrow bars */}
      {safeValue < 20 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Status: {status}
        </div>
      )}
    </div>
  );
};

// Mini progress bar for compact displays
export const MiniProgressBar: React.FC<{
  value: number;
  showLabel?: boolean;
}> = ({ value, showLabel = true }) => {
  const safeValue = Math.max(0, Math.min(100, value));

  const getColor = (val: number): string => {
    if (val < 60) return 'bg-red-500';
    if (val < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-2 rounded-full ${getColor(safeValue)} transition-all duration-500`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 min-w-[2rem] text-right">
          {safeValue}%
        </span>
      )}
    </div>
  );
};

// CSS for shimmer animation (add to your global styles or in a style tag)
export const ProgressBarStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(200%);
      }
    }
  `}</style>
);