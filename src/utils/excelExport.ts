// Excel Export Utility
// Handles exporting PhytoSense data to Excel format

import * as XLSX from 'xlsx';
import { PhytoSenseDataPoint } from '../services/phytoSenseService';
import { format } from 'date-fns';

export interface ExportData {
  deviceName: string;
  measurementType: 'Diameter' | 'Sap Flow';
  data: PhytoSenseDataPoint[];
  metadata?: {
    setupId: number;
    tdid: number;
    channelId: number;
    cropType?: string;
    exportDate: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export interface ExportOptions {
  fileName?: string;
  includeMetadata?: boolean;
  includeCharts?: boolean;
  dateFormat?: string;
}

class ExcelExportService {
  /**
   * Export single device data to Excel
   */
  public exportSingleDevice(
    exportData: ExportData,
    options: ExportOptions = {}
  ): void {
    const {
      fileName = `${exportData.deviceName}_${exportData.measurementType}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      includeMetadata = true,
      dateFormat = 'yyyy-MM-dd HH:mm:ss'
    } = options;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Create data worksheet
    const wsData = this.createDataWorksheet(exportData.data, dateFormat, exportData.measurementType);
    XLSX.utils.book_append_sheet(wb, wsData, 'Data');

    // Add metadata sheet if requested
    if (includeMetadata && exportData.metadata) {
      const wsMeta = this.createMetadataWorksheet(exportData);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadata');
    }

    // Add summary statistics sheet
    const wsStats = this.createStatisticsWorksheet(exportData.data, exportData.measurementType);
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistics');

    // Write the file
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Export multiple devices data to Excel
   */
  public exportMultipleDevices(
    devices: ExportData[],
    options: ExportOptions = {}
  ): void {
    const {
      fileName = `PhytoSense_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      includeMetadata = true,
      dateFormat = 'yyyy-MM-dd HH:mm:ss'
    } = options;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Add overview sheet
    const wsOverview = this.createOverviewWorksheet(devices);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

    // Add sheet for each device
    devices.forEach((device, index) => {
      const sheetName = this.sanitizeSheetName(`${device.deviceName}_${device.measurementType}`, index);
      const wsData = this.createDataWorksheet(device.data, dateFormat, device.measurementType);
      XLSX.utils.book_append_sheet(wb, wsData, sheetName);
    });

    // Add combined statistics sheet
    const wsCombinedStats = this.createCombinedStatisticsWorksheet(devices);
    XLSX.utils.book_append_sheet(wb, wsCombinedStats, 'Combined Statistics');

    // Write the file
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Create data worksheet with formatted data
   */
  private createDataWorksheet(
    data: PhytoSenseDataPoint[],
    dateFormat: string,
    measurementType: string
  ): XLSX.WorkSheet {
    // Transform data for Excel
    const excelData = data.map(point => ({
      'Date/Time': format(new Date(point.dateTime), dateFormat),
      'Timestamp': point.dateTime,
      [`${measurementType} Value`]: point.value,
      'Unit': measurementType === 'Diameter' ? 'mm' : 'g/h'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Date/Time
      { wch: 25 }, // Timestamp
      { wch: 15 }, // Value
      { wch: 10 }  // Unit
    ];

    // Add number formatting for values
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let row = 1; row <= range.e.r; row++) {
      const cell = ws[`C${row + 1}`]; // Value column
      if (cell && typeof cell.v === 'number') {
        cell.z = '0.00'; // Format with 2 decimal places
      }
    }

    return ws;
  }

  /**
   * Create metadata worksheet
   */
  private createMetadataWorksheet(exportData: ExportData): XLSX.WorkSheet {
    const metadata = [
      ['Device Information'],
      ['Device Name:', exportData.deviceName],
      ['Measurement Type:', exportData.measurementType],
      ['Crop Type:', exportData.metadata?.cropType || 'N/A'],
      [],
      ['Technical Details'],
      ['Setup ID:', exportData.metadata?.setupId],
      ['Transformation ID:', exportData.metadata?.tdid],
      ['Channel ID:', exportData.metadata?.channelId],
      [],
      ['Export Information'],
      ['Export Date:', exportData.metadata?.exportDate],
      ['Date Range Start:', exportData.metadata?.dateRange?.start || 'N/A'],
      ['Date Range End:', exportData.metadata?.dateRange?.end || 'N/A'],
      ['Total Data Points:', exportData.data.length],
    ];

    const ws = XLSX.utils.aoa_to_sheet(metadata);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 40 }
    ];

    // Style headers
    ws['A1'] = { ...ws['A1'], s: { font: { bold: true, sz: 14 } } };
    ws['A6'] = { ...ws['A6'], s: { font: { bold: true, sz: 14 } } };
    ws['A11'] = { ...ws['A11'], s: { font: { bold: true, sz: 14 } } };

    return ws;
  }

  /**
   * Create statistics worksheet
   */
  private createStatisticsWorksheet(
    data: PhytoSenseDataPoint[],
    measurementType: string
  ): XLSX.WorkSheet {
    const values = data.map(d => d.value);
    const sortedValues = [...values].sort((a, b) => a - b);

    const statistics = [
      ['Statistical Analysis'],
      [],
      ['Metric', 'Value', 'Unit'],
      ['Count', data.length, 'points'],
      ['Mean', this.calculateMean(values).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
      ['Median', this.calculateMedian(sortedValues).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
      ['Min', Math.min(...values).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
      ['Max', Math.max(...values).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
      ['Std Dev', this.calculateStdDev(values).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
      [],
      ['Percentiles'],
      ['25th (Q1)', this.calculatePercentile(sortedValues, 25).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
      ['50th (Q2)', this.calculatePercentile(sortedValues, 50).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
      ['75th (Q3)', this.calculatePercentile(sortedValues, 75).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
      ['95th', this.calculatePercentile(sortedValues, 95).toFixed(2), measurementType === 'Diameter' ? 'mm' : 'g/h'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(statistics);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 10 }
    ];

    // Style headers
    ws['A1'] = { ...ws['A1'], s: { font: { bold: true, sz: 14 } } };
    ws['A3'] = { ...ws['A3'], s: { font: { bold: true } } };
    ws['B3'] = { ...ws['B3'], s: { font: { bold: true } } };
    ws['C3'] = { ...ws['C3'], s: { font: { bold: true } } };
    ws['A11'] = { ...ws['A11'], s: { font: { bold: true, sz: 12 } } };

    return ws;
  }

  /**
   * Create overview worksheet for multiple devices
   */
  private createOverviewWorksheet(devices: ExportData[]): XLSX.WorkSheet {
    const overview = [
      ['PhytoSense Data Export Overview'],
      [],
      ['Export Date:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      ['Total Devices:', devices.length],
      [],
      ['Device Summary'],
      ['Device Name', 'Measurement Type', 'Data Points', 'Start Date', 'End Date', 'Mean Value'],
    ];

    devices.forEach(device => {
      const values = device.data.map(d => d.value);
      const dates = device.data.map(d => new Date(d.dateTime));
      const startDate = dates.length > 0 ? format(Math.min(...dates.map(d => d.getTime())), 'yyyy-MM-dd') : 'N/A';
      const endDate = dates.length > 0 ? format(Math.max(...dates.map(d => d.getTime())), 'yyyy-MM-dd') : 'N/A';

      overview.push([
        device.deviceName,
        device.measurementType,
        device.data.length,
        startDate,
        endDate,
        values.length > 0 ? this.calculateMean(values).toFixed(2) : 'N/A'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(overview);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 }
    ];

    return ws;
  }

  /**
   * Create combined statistics worksheet
   */
  private createCombinedStatisticsWorksheet(devices: ExportData[]): XLSX.WorkSheet {
    const stats: any[] = [
      ['Combined Statistics Analysis'],
      [],
      ['Device', 'Type', 'Count', 'Mean', 'Min', 'Max', 'Std Dev']
    ];

    devices.forEach(device => {
      const values = device.data.map(d => d.value);
      if (values.length > 0) {
        stats.push([
          device.deviceName,
          device.measurementType,
          values.length,
          this.calculateMean(values).toFixed(2),
          Math.min(...values).toFixed(2),
          Math.max(...values).toFixed(2),
          this.calculateStdDev(values).toFixed(2)
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(stats);
    ws['!cols'] = [
      { wch: 30 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 }
    ];

    return ws;
  }

  /**
   * Sanitize sheet name to meet Excel requirements
   */
  private sanitizeSheetName(name: string, index: number): string {
    // Excel sheet names cannot contain: \ / ? * [ ]
    let sanitized = name.replace(/[\\\/\?\*\[\]]/g, '_');

    // Limit to 31 characters (Excel limit)
    if (sanitized.length > 31) {
      sanitized = sanitized.substring(0, 28) + '...' + index;
    }

    return sanitized;
  }

  /**
   * Statistical calculation helpers
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateMedian(sortedValues: number[]): number {
    if (sortedValues.length === 0) return 0;
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }
}

// Export singleton instance
export const excelExportService = new ExcelExportService();
export default excelExportService;