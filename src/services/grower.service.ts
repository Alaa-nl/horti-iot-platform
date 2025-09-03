import api from './api';
import { FinancialData, ROIData, InvestmentData, RevenueData } from '../types';

export const growerService = {
  // Financial data endpoints
  async getFinancialSummary(): Promise<FinancialData> {
    const response = await api.get<FinancialData>('/financial/summary');
    return response.data;
  },

  async getRevenueData(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<RevenueData[]> {
    const response = await api.get<RevenueData[]>('/financial/revenue', { params });
    return response.data;
  },

  // ROI Analysis
  async getROIAnalysis(): Promise<ROIData> {
    const response = await api.get<ROIData>('/financial/roi');
    return response.data;
  },

  async calculateROI(investmentData: InvestmentData): Promise<ROIData> {
    const response = await api.post<ROIData>('/financial/roi/calculate', investmentData);
    return response.data;
  },

  // Profitability projections
  async getProfitabilityProjections(months: number = 12): Promise<any> {
    const response = await api.get('/financial/projections', {
      params: { months }
    });
    return response.data;
  },

  // Investment tracking
  async getInvestments(): Promise<InvestmentData[]> {
    const response = await api.get<InvestmentData[]>('/financial/investments');
    return response.data;
  },

  async addInvestment(investment: Partial<InvestmentData>): Promise<InvestmentData> {
    const response = await api.post<InvestmentData>('/financial/investments', investment);
    return response.data;
  },

  // Reports
  async generateReport(type: 'monthly' | 'quarterly' | 'annual'): Promise<Blob> {
    const response = await api.get('/financial/report', {
      params: { type },
      responseType: 'blob'
    });
    return response.data;
  }
};