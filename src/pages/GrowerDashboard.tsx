import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { RevenueData } from '../types';

// Enhanced financial data with investment tracking
interface SimplifiedFinancialData {
  monthlyRevenue: number;
  operatingCosts: {
    operations: number;
    labor: number;
    materials: number;
    total: number;
  };
  revenuePerM2: number;
  roi: number;
  paybackPeriod: number;
  investments: {
    initial: number;
    greenhouse: number;
    equipment: number;
    technology: number;
    total: number;
  };
  yearOverYear: {
    revenue: number;
    costs: number;
    profit: number;
  };
}

const mockSimplifiedFinancialData: SimplifiedFinancialData = {
  monthlyRevenue: 28500,
  operatingCosts: {
    operations: 13300,
    labor: 7200,
    materials: 6800,
    total: 27300
  },
  revenuePerM2: 356.25,
  roi: 22.8,
  paybackPeriod: 28.5,
  investments: {
    initial: 385000,
    greenhouse: 180000,
    equipment: 125000,
    technology: 80000,
    total: 385000
  },
  yearOverYear: {
    revenue: 12.5,
    costs: -3.2,
    profit: 28.7
  }
};

// Extended revenue data with 18 months history for year-over-year comparison
const mockRevenueData: RevenueData[] = [
  // Previous year data (2023)
  { date: '2023-01', revenue: 21000, costs: 20500, profit: 500, cropType: 'Tomato', yieldKgM2: 61.2, marketPrice: 4.05 },
  { date: '2023-02', revenue: 22100, costs: 20300, profit: 1800, cropType: 'Tomato', yieldKgM2: 63.5, marketPrice: 4.10 },
  { date: '2023-03', revenue: 23500, costs: 20100, profit: 3400, cropType: 'Tomato', yieldKgM2: 66.8, marketPrice: 4.12 },
  { date: '2023-04', revenue: 24800, costs: 19900, profit: 4900, cropType: 'Tomato', yieldKgM2: 69.2, marketPrice: 4.08 },
  { date: '2023-05', revenue: 26200, costs: 19700, profit: 6500, cropType: 'Tomato', yieldKgM2: 72.5, marketPrice: 4.15 },
  { date: '2023-06', revenue: 27800, costs: 19500, profit: 8300, cropType: 'Tomato', yieldKgM2: 75.2, marketPrice: 4.18 },
  { date: '2023-07', revenue: 29200, costs: 19800, profit: 9400, cropType: 'Tomato', yieldKgM2: 77.8, marketPrice: 4.20 },
  { date: '2023-08', revenue: 28500, costs: 20200, profit: 8300, cropType: 'Tomato', yieldKgM2: 76.5, marketPrice: 4.15 },
  { date: '2023-09', revenue: 26800, costs: 20500, profit: 6300, cropType: 'Tomato', yieldKgM2: 73.2, marketPrice: 4.10 },
  { date: '2023-10', revenue: 25200, costs: 20800, profit: 4400, cropType: 'Tomato', yieldKgM2: 70.5, marketPrice: 4.05 },
  { date: '2023-11', revenue: 23500, costs: 21000, profit: 2500, cropType: 'Tomato', yieldKgM2: 67.8, marketPrice: 4.00 },
  { date: '2023-12', revenue: 22800, costs: 21200, profit: 1600, cropType: 'Tomato', yieldKgM2: 65.2, marketPrice: 4.02 },
  // Current year data (2024)
  { date: '2024-01', revenue: 24000, costs: 21000, profit: 3000, cropType: 'Tomato', yieldKgM2: 68.2, marketPrice: 4.15 },
  { date: '2024-02', revenue: 25200, costs: 20800, profit: 4400, cropType: 'Tomato', yieldKgM2: 71.5, marketPrice: 4.20 },
  { date: '2024-03', revenue: 26800, costs: 20200, profit: 6600, cropType: 'Tomato', yieldKgM2: 75.8, marketPrice: 4.25 },
  { date: '2024-04', revenue: 28500, costs: 19500, profit: 9000, cropType: 'Tomato', yieldKgM2: 79.2, marketPrice: 4.18 },
  { date: '2024-05', revenue: 30200, costs: 19800, profit: 10400, cropType: 'Tomato', yieldKgM2: 82.5, marketPrice: 4.22 },
  { date: '2024-06', revenue: 32100, costs: 20100, profit: 12000, cropType: 'Tomato', yieldKgM2: 85.2, marketPrice: 4.28 }
];

const GrowerDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('12months');
  const [financialData, setFinancialData] = useState<SimplifiedFinancialData>(mockSimplifiedFinancialData);
  const [revenueData] = useState<RevenueData[]>(mockRevenueData);
  const [showYearComparison, setShowYearComparison] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFinancialData(prev => ({
        ...prev,
        monthlyRevenue: prev.monthlyRevenue + (Math.random() - 0.5) * 1200,
        revenuePerM2: prev.revenuePerM2 + (Math.random() - 0.5) * 15,
        roi: prev.roi + (Math.random() - 0.5) * 0.5
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Filter data based on time range
  const getFilteredData = () => {
    const data = [...revenueData];
    
    if (timeRange === '6months') {
      return data.slice(-6);
    } else if (timeRange === 'ytd') {
      return data.filter(d => d.date.startsWith('2024'));
    }
    return data.slice(-12);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farm Business Overview</h1>
            <p className="text-lg text-gray-600 mt-1">Your Investment Performance</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-lg font-semibold text-green-600">Today</p>
          </div>
        </div>

        {/* Key Business Metrics - Extra Simple */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center p-6">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-sm text-gray-600 mb-1">This Month's Profit</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(financialData.monthlyRevenue - financialData.operatingCosts.total)}
              </p>
              <p className="text-sm text-green-600 mt-2">+{financialData.yearOverYear.profit}% vs last year</p>
            </div>
          </Card>

          <Card>
            <div className="text-center p-6">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-sm text-gray-600 mb-1">Annual Return</p>
              <p className="text-3xl font-bold text-purple-600">
                {financialData.roi.toFixed(1)}%
              </p>
              <p className="text-sm text-purple-600 mt-2">Excellent Performance!</p>
            </div>
          </Card>

          <Card>
            <div className="text-center p-6">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-sm text-gray-600 mb-1">Break-even in</p>
              <p className="text-3xl font-bold text-blue-600">
                {(financialData.paybackPeriod - 10).toFixed(0)} months
              </p>
              <p className="text-sm text-blue-600 mt-2">Ahead of schedule</p>
            </div>
          </Card>
        </div>

        {/* Your Investment Status */}
        <Card>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Investment Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">💵 Total Invested</p>
                  <p className="text-sm text-gray-600">Your initial investment</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(financialData.investments.total)}</p>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">💸 Already Earned Back</p>
                  <p className="text-sm text-gray-600">Money returned so far</p>
                </div>
                <p className="text-xl font-bold text-green-600">{formatCurrency(financialData.investments.total * 0.35)}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="16" fill="none" />
                  <circle 
                    cx="80" cy="80" r="70" 
                    stroke="#10b981" 
                    strokeWidth="16" 
                    fill="none"
                    strokeDasharray={`${35 * 4.4} 440`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">35%</span>
                  <span className="text-sm text-gray-600">Paid Back</span>
                </div>
              </div>
              <p className="text-center mt-3 text-green-600 font-semibold">Great Progress! 💪</p>
            </div>
          </div>
        </Card>

        {/* Simple Revenue Trend */}
        <Card>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 How Much You're Making</h3>
          <div className="h-64 mb-4">
            <ErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getFilteredData().slice(-6).map(item => ({
                  month: formatMonth(item.date).slice(0, 3),
                  profit: item.revenue - item.costs,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{fontSize: 14}} />
                  <YAxis tick={{fontSize: 14}} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), "Monthly Profit"]} 
                    labelStyle={{color: '#374151', fontSize: '14px'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-gray-700">Growing</p>
              <p className="text-lg font-bold text-green-600">📈 +{financialData.yearOverYear.profit}%</p>
            </div>
            <div className="text-center p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-gray-700">This Month</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(financialData.monthlyRevenue - financialData.operatingCosts.total)}</p>
            </div>
            <div className="text-center p-3 bg-purple-100 rounded-lg">
              <p className="text-sm text-gray-700">Best Season</p>
              <p className="text-lg font-bold text-purple-600">☀️ Summer</p>
            </div>
          </div>
        </Card>

        {/* What's Coming Next - Future Plans */}
        <Card>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🔮 What's Coming Next</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📈</span>
                  <div>
                    <p className="font-semibold text-gray-800">Next Month's Profit</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(1400)}</p>
                    <p className="text-sm text-gray-600">Looking good!</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">💰</span>
                  <div>
                    <p className="font-semibold text-gray-800">3-Month Total Profit</p>
                    <p className="text-xl font-bold text-blue-600">€47,200</p>
                    <p className="text-sm text-gray-600">Keep up the great work!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-semibold text-gray-800">Ways to Save Money</p>
                    <p className="text-sm text-gray-600">Adjust LED lights to save €890/month</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <p className="font-semibold text-gray-800">Growth Opportunity</p>
                    <p className="text-sm text-gray-600">Consider expanding by 20% to make even more!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default GrowerDashboard;