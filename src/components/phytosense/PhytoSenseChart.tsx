// High-Performance Chart Component using Apache ECharts
// Optimized for rendering large datasets with excellent performance

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ChartDataPoint {
  time: string;
  fullTimestamp: string;
  diameter?: number;
  sapFlow?: number;
}

interface PhytoSenseChartProps {
  data: ChartDataPoint[];
  measurementType: 'both' | 'diameter' | 'sapflow';
  height?: number;
}

const PhytoSenseChart: React.FC<PhytoSenseChartProps> = ({
  data,
  measurementType,
  height = 500
}) => {
  const { theme } = useTheme();

  // Get theme colors
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const backgroundColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  // Configure ECharts options
  const options = useMemo(() => {
    if (!data || data.length === 0) {
      return {};
    }

    // Prepare data series
    const timestamps = data.map(d => d.fullTimestamp);
    const diameterData = data.map(d => d.diameter ?? null);
    const sapFlowData = data.map(d => d.sapFlow ?? null);

    const series: any[] = [];
    const yAxis: any[] = [];
    const legend: string[] = [];

    // Add Diameter series
    if (measurementType === 'both' || measurementType === 'diameter') {
      series.push({
        name: 'Diameter (mm)',
        type: 'line',
        data: diameterData,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#10B981',
          width: 2
        },
        itemStyle: {
          color: '#10B981'
        },
        yAxisIndex: 0
      });
      legend.push('Diameter (mm)');

      yAxis.push({
        type: 'value',
        name: 'Diameter (mm)',
        position: 'left',
        nameTextStyle: {
          color: '#10B981',
          fontSize: 13,
          fontWeight: 600
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#10B981'
          }
        },
        axisLabel: {
          color: '#10B981',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: gridColor,
            type: 'dashed'
          }
        }
      });
    }

    // Add Sap Flow series
    if (measurementType === 'both' || measurementType === 'sapflow') {
      series.push({
        name: 'Sap Flow (g/h)',
        type: 'line',
        data: sapFlowData,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#3B82F6',
          width: 2
        },
        itemStyle: {
          color: '#3B82F6'
        },
        yAxisIndex: measurementType === 'both' ? 1 : 0
      });
      legend.push('Sap Flow (g/h)');

      yAxis.push({
        type: 'value',
        name: 'Sap Flow (g/h)',
        position: measurementType === 'both' ? 'right' : 'left',
        nameTextStyle: {
          color: '#3B82F6',
          fontSize: 13,
          fontWeight: 600
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#3B82F6'
          }
        },
        axisLabel: {
          color: '#3B82F6',
          fontSize: 11
        },
        splitLine: {
          show: measurementType === 'both' ? false : true,
          lineStyle: {
            color: gridColor,
            type: 'dashed'
          }
        }
      });
    }

    return {
      backgroundColor: backgroundColor,
      tooltip: {
        trigger: 'axis',
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textStyle: {
          color: textColor
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';

          const timestamp = params[0].axisValue;
          let html = `<div style="font-weight: 600; margin-bottom: 6px;">${timestamp}</div>`;

          params.forEach((param: any) => {
            if (param.value !== null && param.value !== undefined) {
              html += `<div style="color: ${param.color};">
                ${param.seriesName}: <strong>${Number(param.value).toFixed(4)}</strong>
              </div>`;
            }
          });

          return html;
        }
      },
      legend: {
        data: legend,
        top: 10,
        textStyle: {
          color: textColor,
          fontSize: 13
        }
      },
      grid: {
        left: '60px',
        right: measurementType === 'both' ? '60px' : '20px',
        top: '50px',
        bottom: '80px',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        axisLabel: {
          color: textColor,
          fontSize: 11,
          rotate: 45,
          formatter: (value: string) => {
            const date = new Date(value);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const day = date.getDate();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${month} ${day} ${hours}:${minutes}`;
          }
        },
        axisLine: {
          lineStyle: {
            color: textColor
          }
        },
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: yAxis,
      series: series,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          height: 30,
          bottom: 20,
          handleStyle: {
            color: '#3B82F6'
          },
          textStyle: {
            color: textColor
          },
          borderColor: borderColor
        }
      ],
      animation: false // Disable animation for better performance with large datasets
    };
  }, [data, measurementType, textColor, gridColor, backgroundColor, borderColor]);

  if (!data || data.length === 0) {
    return (
      <div
        className="rounded-lg flex items-center justify-center bg-card text-muted-foreground"
        style={{ height }}
      >
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-lg p-4 border">
      <ReactECharts
        option={options}
        style={{ height: `${height}px`, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default PhytoSenseChart;
