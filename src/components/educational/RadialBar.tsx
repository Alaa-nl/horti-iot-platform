import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface RadialBarProps {
  label: string;
  value: number; // 0-100 percentage
  actualValue?: string; // Optional actual value to display (e.g., "20°C")
  minValue?: string; // Minimum value to display (e.g., "200 ppm")
  maxValue?: string; // Maximum value to display (e.g., "1500 ppm")
  currentValue?: number; // Current actual value (not percentage)
  size?: number; // Size of the chart
  showLabel?: boolean;
}

export const RadialBar: React.FC<RadialBarProps> = ({
  label,
  value,
  actualValue,
  minValue,
  maxValue,
  currentValue,
  size = 120,
  showLabel = true
}) => {
  // Ensure value is within 0-100 range
  const safeValue = Math.max(0, Math.min(100, value));

  const getColor = (val: number): string => {
    if (val < 60) return '#ef4444'; // red-500
    if (val < 80) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  const color = getColor(safeValue);

  const options: ApexOptions = {
    chart: {
      type: 'radialBar',
      sparkline: {
        enabled: true
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: '65%',
          background: 'transparent',
          position: 'front',
          dropShadow: {
            enabled: false
          }
        },
        track: {
          background: '#e5e7eb',
          strokeWidth: '100%',
          margin: 0,
          dropShadow: {
            enabled: false
          }
        },
        dataLabels: {
          show: true,
          name: {
            show: actualValue ? true : false,
            fontSize: '13px',
            fontFamily: 'inherit',
            fontWeight: 700,
            color: color, // Use the same color as the gauge
            offsetY: -12
          },
          value: {
            show: true,
            offsetY: actualValue ? 5 : 0,
            fontSize: '20px',
            fontFamily: 'inherit',
            fontWeight: 700,
            color: color,
            formatter: function (val: any) {
              return parseInt(val) + '%';
            }
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: [color],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: 'round'
    },
    colors: [color],
    labels: [actualValue || '']
  };

  const series = [safeValue];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Chart */}
        <ReactApexChart
          options={options}
          series={series}
          type="radialBar"
          height={size}
          width={size}
        />

        {/* Bottom values container - positioned inside the gauge area */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-between px-2">
          {/* Min value label on the left */}
          {minValue && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-500">
              {minValue}
            </div>
          )}

          {/* Max value label on the right */}
          {maxValue && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-500">
              {maxValue}
            </div>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="mt-1 text-center">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </div>
        </div>
      )}
    </div>
  );
};

interface MultiRadialBarProps {
  factors: {
    name: string;
    value: number;
    actual?: string;
  }[];
  title?: string;
}

export const MultiRadialBar: React.FC<MultiRadialBarProps> = ({
  factors,
  title
}) => {
  // Calculate values and colors for all factors
  const values = factors.map(f => Math.max(0, Math.min(100, f.value)));
  const labels = factors.map(f => f.name);

  const getColors = (values: number[]): string[] => {
    return values.map(val => {
      if (val < 60) return '#ef4444'; // red-500
      if (val < 80) return '#eab308'; // yellow-500
      return '#22c55e'; // green-500
    });
  };

  const colors = getColors(values);

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: 'radialBar',
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '30%',
          background: 'transparent',
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '14px'
          },
          value: {
            show: true,
            fontSize: '14px',
            formatter: function (val: any) {
              return parseInt(val) + '%';
            }
          },
          total: {
            show: true,
            label: 'Average',
            fontSize: '16px',
            fontWeight: 600,
            formatter: function (w: any) {
              const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
              return avg + '%';
            }
          }
        }
      }
    },
    colors: colors,
    labels: labels,
    legend: {
      show: true,
      floating: true,
      fontSize: '12px',
      position: 'left',
      offsetX: 0,
      offsetY: 0,
      labels: {
        useSeriesColors: true,
      },
      markers: {
        size: 0
      },
      formatter: function(seriesName: string, opts: any) {
        const actual = factors[opts.seriesIndex]?.actual;
        return actual ? `${seriesName}: ${actual}` : seriesName;
      },
      itemMargin: {
        vertical: 3
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        legend: {
          show: false
        }
      }
    }]
  };

  const series = values;

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h4>
      )}
      <ReactApexChart
        options={options}
        series={series}
        type="radialBar"
        height={350}
      />
    </div>
  );
};

// Compact version for smaller displays
export const MiniRadialBar: React.FC<{
  value: number;
  size?: number;
}> = ({ value, size = 60 }) => {
  const safeValue = Math.max(0, Math.min(100, value));

  const getColor = (val: number): string => {
    if (val < 60) return '#ef4444';
    if (val < 80) return '#eab308';
    return '#22c55e';
  };

  const color = getColor(safeValue);

  const options: ApexOptions = {
    chart: {
      type: 'radialBar',
      sparkline: {
        enabled: true
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          size: '60%',
          background: 'transparent',
        },
        track: {
          background: '#e5e7eb',
          strokeWidth: '100%',
        },
        dataLabels: {
          show: true,
          name: {
            show: false
          },
          value: {
            offsetY: -5,
            fontSize: '11px',
            fontWeight: 700,
            color: color,
            formatter: function (val: any) {
              return parseInt(val) + '%';
            }
          }
        }
      }
    },
    fill: {
      colors: [color]
    },
    stroke: {
      lineCap: 'round'
    },
    colors: [color]
  };

  const series = [safeValue];

  return (
    <div style={{ width: size, height: size }}>
      <ReactApexChart
        options={options}
        series={series}
        type="radialBar"
        height={size}
        width={size}
      />
    </div>
  );
};