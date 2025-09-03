import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { FinancialData, RevenueData } from '../types';

// Mock data for demonstration
const mockFinancialData: FinancialData = {
  totalInvestment: 150000,
  monthlyRevenue: 22500,
  operatingCosts: 15000,
  netProfit: 7500,
  profitMargin: 33.3,
  roi: 18.5,
};

const mockRevenueData: RevenueData[] = [
  { date: '2024-01', revenue: 18000, costs: 12000, profit: 6000, cropType: 'Lettuce' },
  { date: '2024-02', revenue: 19500, costs: 13500, profit: 6000, cropType: 'Lettuce' },
  { date: '2024-03', revenue: 21000, costs: 14000, profit: 7000, cropType: 'Tomatoes' },
  { date: '2024-04', revenue: 22500, costs: 15000, profit: 7500, cropType: 'Tomatoes' },
  { date: '2024-05', revenue: 25000, costs: 16000, profit: 9000, cropType: 'Herbs' },
  { date: '2024-06', revenue: 24000, costs: 15500, profit: 8500, cropType: 'Herbs' },
];

const mockCropData = [
  { name: 'Tomatoes', value: 45, color: '#EF4444', revenue: 67500 },
  { name: 'Lettuce', value: 30, color: '#22C55E', revenue: 45000 },
  { name: 'Herbs', value: 25, color: '#3B82F6', revenue: 37500 },
];

const mockInvestments = [
  { category: 'Equipment', amount: 85000, percentage: 56.7 },
  { category: 'Infrastructure', amount: 45000, percentage: 30.0 },
  { category: 'Seeds & Supplies', amount: 12000, percentage: 8.0 },
  { category: 'Technology', amount: 8000, percentage: 5.3 },
];

const GrowerDashboard: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData>(mockFinancialData);
  const [revenueData] = useState<RevenueData[]>(mockRevenueData);

  useEffect(() => {
    // Simulate real-time financial updates
    const interval = setInterval(() => {
      setFinancialData(prev => ({
        ...prev,
        monthlyRevenue: prev.monthlyRevenue + (Math.random() - 0.5) * 1000,
        netProfit: prev.netProfit + (Math.random() - 0.5) * 500,
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr + '-01').toLocaleDateString('en-US', { month: 'short' });
  };

  const chartData = revenueData.filter(item => item && item.date).map(item => ({
    month: formatMonth(item.date),
    revenue: Math.round(Number(item.revenue || 0)),
    costs: Math.round(Number(item.costs || 0)),
    profit: Math.round(Number(item.profit || 0)),
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Financial Data Updated</span>
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(financialData.monthlyRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">↗ +8.2% from last month</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-xl">💰</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(financialData.netProfit)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {financialData.profitMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 text-xl">📈</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ROI</p>
                <p className="text-3xl font-bold text-purple-600">
                  {financialData.roi.toFixed(1)}%
                </p>
                <p className="text-xs text-green-600 mt-1">↗ Above target (15%)</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 text-xl">🎯</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Operating Costs</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(financialData.operatingCosts)}
                </p>
                <p className="text-xs text-green-600 mt-1">↘ -3.1% efficiency gain</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-orange-600 text-xl">💸</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Costs Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Costs</h3>
            <div className="h-64">
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                    <Bar dataKey="costs" fill="#ef4444" name="Costs" />
                  </BarChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </Card>

          {/* Profit Trend Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend</h3>
            <div className="h-64">
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crop Performance */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Revenue Distribution</h3>
            <div className="h-48">
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockCropData.filter(item => item && typeof item.value === 'number')}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mockCropData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
            <div className="space-y-2 mt-2">
              {mockCropData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-800">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Investment Breakdown */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Allocation</h3>
            <div className="space-y-4">
              {mockInvestments.map((investment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{investment.category}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(investment.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-horti-green-500 to-horti-blue-500 h-2 rounded-full" 
                      style={{ width: `${investment.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {investment.percentage}% of total investment
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Actions</h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors duration-200"
              >
                📊 Generate Financial Report
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors duration-200"
              >
                💎 Investment Analysis
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors duration-200"
              >
                🎯 ROI Calculator
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors duration-200"
              >
                📈 Market Analysis
              </motion.button>
            </div>

            {/* Key Insights */}
            <div className="mt-6 p-4 bg-gradient-to-r from-horti-green-50 to-horti-blue-50 rounded-lg border border-horti-green-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Key Insights</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Tomatoes showing highest ROI (45%)</li>
                <li>• Operating costs decreased 3.1%</li>
                <li>• Q2 profit exceeded target by 12%</li>
                <li>• Equipment investment paying off</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Future Projections */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Profitability Projection</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(45000)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Projected Monthly Profit</div>
              <div className="text-xs text-green-600 mt-2">+28% growth expected</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">8.2 months</div>
              <div className="text-sm text-gray-600 mt-1">Break-even Point</div>
              <div className="text-xs text-blue-600 mt-2">2 months ahead of schedule</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(540000)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Annual Revenue Target</div>
              <div className="text-xs text-purple-600 mt-2">95% probability of success</div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default GrowerDashboard;