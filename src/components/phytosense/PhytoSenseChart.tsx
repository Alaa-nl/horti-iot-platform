// High-Performance Chart Component using uPlot
// Optimized for rendering 100k+ data points without performance issues

import React, { useMemo } from 'react';
import UplotReact from 'uplot-react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

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
  height = 400
}) => {
  // Transform data for uPlot (requires timestamps as seconds and separate arrays for each series)
  const { plotData, options } = useMemo((): { plotData: any[], options: uPlot.Options } => {
    if (!data || data.length === 0) {
      // Return minimal valid options for empty data
      return {
        plotData: [[], []],
        options: {
          width: 800,
          height: height,
          series: [],
          axes: []
        }
      };
    }

    // Convert timestamps to Unix timestamps (seconds)
    const timestamps = data.map(d => new Date(d.fullTimestamp).getTime() / 1000);

    // Extract diameter and sap flow values
    const diameterValues = data.map(d => d.diameter ?? null);
    const sapFlowValues = data.map(d => d.sapFlow ?? null);

    // Build series configuration based on measurement type
    const series: uPlot.Series[] = [
      {
        // First series is always the x-axis (timestamp)
      }
    ];

    let plotData: any[] = [timestamps];

    if (measurementType === 'both' || measurementType === 'diameter') {
      series.push({
        label: 'Diameter (mm)',
        stroke: '#10B981',
        width: 2,
        spanGaps: false,
        points: { show: false }
      });
      plotData.push(diameterValues);
    }

    if (measurementType === 'both' || measurementType === 'sapflow') {
      series.push({
        label: 'Sap Flow (g/h)',
        stroke: '#3B82F6',
        width: 2,
        spanGaps: false,
        points: { show: false },
        scale: measurementType === 'both' ? 'sapflow' : undefined
      });
      plotData.push(sapFlowValues);
    }

    // Configure axes
    const axes: uPlot.Axis[] = [
      {
        // X-axis (time)
        stroke: '#6B7280',
        grid: {
          stroke: '#E5E7EB',
          width: 1
        },
        space: 80,
        values: (u: uPlot, vals: number[]) => vals.map((v: number) => {
          const date = new Date(v * 1000);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const month = date.toLocaleDateString('en-US', { month: 'short' });
          const day = date.getDate();
          return `${month} ${day} ${hours}:${minutes}`;
        })
      }
    ];

    // Add Y-axis for diameter
    if (measurementType === 'both' || measurementType === 'diameter') {
      axes.push({
        stroke: '#10B981',
        grid: {
          stroke: '#E5E7EB',
          width: 1
        },
        scale: 'y',
        label: 'Diameter (mm)',
        labelSize: 30,
        size: 60,
        side: 3 // Left side
      });
    }

    // Add Y-axis for sap flow
    if (measurementType === 'both' || measurementType === 'sapflow') {
      axes.push({
        stroke: '#3B82F6',
        grid: measurementType === 'both' ? { show: false } : {
          stroke: '#E5E7EB',
          width: 1
        },
        scale: measurementType === 'both' ? 'sapflow' : 'y',
        label: 'Sap Flow (g/h)',
        labelSize: 30,
        size: 60,
        side: measurementType === 'both' ? 1 : 3 // Right side if both, left if only sapflow
      });
    }

    // Configure scales
    const scales: Record<string, any> = {
      x: {
        time: true
      },
      y: {
        auto: true,
        range: (u: uPlot, min: number, max: number) => {
          // Add 10% padding
          const padding = (max - min) * 0.1;
          return [min - padding, max + padding];
        }
      }
    };

    if (measurementType === 'both') {
      scales.sapflow = {
        auto: true,
        range: (u: uPlot, min: number, max: number) => {
          const padding = (max - min) * 0.1;
          return [min - padding, max + padding];
        }
      };
    }

    const options: uPlot.Options = {
      width: 800, // Will be overridden by parent container
      height: height,
      series,
      axes,
      scales,
      cursor: {
        lock: true,
        focus: {
          prox: 16
        },
        sync: {
          key: 'phytosense'
        },
        drag: {
          x: true,
          y: false
        }
      },
      legend: {
        show: true,
        live: true
      },
      plugins: [
        // Tooltip plugin
        {
          hooks: {
            init: (u) => {
              const tooltip = document.createElement('div');
              tooltip.className = 'uplot-tooltip';
              tooltip.style.cssText = `
                display: none;
                position: absolute;
                background: rgba(249, 250, 251, 0.98);
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 12px;
                pointer-events: none;
                z-index: 100;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              `;
              u.over.appendChild(tooltip);

              u.over.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
              });
            },
            setCursor: (u) => {
              const { left, top, idx } = u.cursor;
              const tooltip = u.over.querySelector('.uplot-tooltip') as HTMLElement;

              if (!tooltip || idx === null || idx === undefined) {
                if (tooltip) tooltip.style.display = 'none';
                return;
              }

              const timestamp = u.data[0][idx];
              const date = new Date(timestamp * 1000);
              const formattedDate = date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              let html = `<div style="font-weight: 600; margin-bottom: 4px;">${formattedDate}</div>`;

              let seriesIdx = 1;
              if (measurementType === 'both' || measurementType === 'diameter') {
                const diameterValue = u.data[seriesIdx][idx];
                if (diameterValue !== null && diameterValue !== undefined) {
                  html += `<div style="color: #10B981;">Diameter: ${diameterValue.toFixed(4)} mm</div>`;
                }
                seriesIdx++;
              }

              if (measurementType === 'both' || measurementType === 'sapflow') {
                const sapFlowValue = u.data[seriesIdx][idx];
                if (sapFlowValue !== null && sapFlowValue !== undefined) {
                  html += `<div style="color: #3B82F6;">Sap Flow: ${sapFlowValue.toFixed(4)} g/h</div>`;
                }
              }

              tooltip.innerHTML = html;
              tooltip.style.display = 'block';

              // Position tooltip
              const tooltipRect = tooltip.getBoundingClientRect();
              const plotRect = u.over.getBoundingClientRect();

              let tooltipLeft = left! + 10;
              let tooltipTop = top! - 10;

              // Keep tooltip within plot bounds
              if (tooltipLeft + tooltipRect.width > plotRect.width) {
                tooltipLeft = left! - tooltipRect.width - 10;
              }
              if (tooltipTop + tooltipRect.height > plotRect.height) {
                tooltipTop = plotRect.height - tooltipRect.height - 10;
              }

              tooltip.style.left = tooltipLeft + 'px';
              tooltip.style.top = tooltipTop + 'px';
            }
          }
        }
      ]
    };

    return { plotData, options };
  }, [data, measurementType, height]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center" style={{ height }}>
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div style={{ width: '100%', height: height }}>
        <UplotReact
          options={options}
          data={plotData}
        />
      </div>
      <div className="mt-2 text-xs text-gray-600 text-center">
        <span className="font-medium">💡 Tip:</span> Drag to zoom, double-click to reset • Rendering {data.length.toLocaleString()} points
      </div>
    </div>
  );
};

export default PhytoSenseChart;
