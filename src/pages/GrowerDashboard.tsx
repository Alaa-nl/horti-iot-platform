import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { RevenueData } from '../types';

// Simplified financial data focusing on core business metrics
interface SimplifiedFinancialData {
  monthlyRevenue: number;
  operatingCosts: {
    operations: number; // energy + maintenance combined
    labor: number;
    materials: number; // seeds, nutrients, substrate
    total: number;
  };
  revenuePerM2: number; // €/m² key metric for growers
  roi: number; // annual return on investment
  paybackPeriod: number; // months to break even
}

const mockSimplifiedFinancialData: SimplifiedFinancialData = {
  monthlyRevenue: 28500,
  operatingCosts: {
    operations: 13300, // energy + maintenance combined (8500 + 4800)
    labor: 7200,
    materials: 6800,
    total: 27300
  },
  revenuePerM2: 356.25, // €356.25 per m²
  roi: 22.8, // annual return on investment
  paybackPeriod: 28.5, // months to break even
};

const mockRevenueData: RevenueData[] = [
  { 
    date: '2024-01', 
    revenue: 24000, 
    costs: 21000, 
    profit: 3000, 
    cropType: 'Xandor XR Tomato',
    yieldKgM2: 68.2,
    marketPrice: 4.15
  },
  { 
    date: '2024-02', 
    revenue: 25200, 
    costs: 20800, 
    profit: 4400, 
    cropType: 'Xandor XR Tomato',
    yieldKgM2: 71.5,
    marketPrice: 4.20
  },
  { 
    date: '2024-03', 
    revenue: 26800, 
    costs: 20200, 
    profit: 6600, 
    cropType: 'Xandor XR Tomato',
    yieldKgM2: 75.8,
    marketPrice: 4.25
  },
  { 
    date: '2024-04', 
    revenue: 28500, 
    costs: 19500, 
    profit: 9000, 
    cropType: 'Xandor XR Tomato',
    yieldKgM2: 79.2,
    marketPrice: 4.18
  },
  { 
    date: '2024-05', 
    revenue: 30200, 
    costs: 19800, 
    profit: 10400, 
    cropType: 'Xandor XR Tomato',
    yieldKgM2: 82.5,
    marketPrice: 4.22
  },
  { 
    date: '2024-06', 
    revenue: 32100, 
    costs: 20100, 
    profit: 12000, 
    cropType: 'Xandor XR Tomato',
    yieldKgM2: 85.2,
    marketPrice: 4.28
  }
];

// Simplified resource efficiency metrics
const resourceEfficiencyMetrics = [
  { 
    resource: 'Energy', 
    efficiency: 87,
    savings: 890
  },
  { 
    resource: 'Water', 
    efficiency: 85,
    savings: 320
  },
  { 
    resource: 'Materials', 
    efficiency: 92,
    savings: 280
  }
];


const GrowerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userPreferences, setUserPreferences] = useState({ showDetails: false, chartType: 'bar' });
  const [financialData, setFinancialData] = useState<SimplifiedFinancialData>(mockSimplifiedFinancialData);
  const [revenueData] = useState<RevenueData[]>(mockRevenueData);

  useEffect(() => {
    // Simulate real-time financial updates
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
    return new Date(dateStr + '-01').toLocaleDateString('en-US', { month: 'short' });
  };

  const chartData = revenueData.filter(item => item && item.date).map(item => ({
    month: formatMonth(item.date),
    revenue: Math.round(Number(item.revenue || 0)),
    costs: Math.round(Number(item.costs || 0)),
    profit: Math.round(Number(item.profit || 0)),
    yieldKgM2: Number(item.yieldKgM2 || 0).toFixed(1),
    marketPrice: Number(item.marketPrice || 0).toFixed(2),
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

        {/* Core Business Metrics - Simplified to 3 key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Revenue per m²</p>
              <p className="text-3xl font-bold text-green-600">
                €{financialData.revenuePerM2.toFixed(0)}
              </p>
              <p className="text-xs text-green-600 mt-1">monthly revenue/m²</p>
              <div className="mt-3">
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  +15% vs industry avg
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className="text-3xl font-bold text-purple-600">
                {financialData.roi.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 mt-1">annual return</p>
              <div className="mt-3">
                <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  Target: 18% ✓
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(financialData.roi / 25 * 100, 100)}%` }}></div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Break-even</p>
              <p className="text-3xl font-bold text-orange-600">
                {financialData.paybackPeriod.toFixed(1)}
              </p>
              <p className="text-xs text-orange-600 mt-1">months</p>
              <div className="mt-3">
                <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                  2.5 mo. early
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'costs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💰 Costs & Efficiency
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🤖 AI Insights
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="py-2 px-1 border-b-2 border-transparent text-gray-400 hover:text-gray-600 font-medium text-sm"
            >
              {showAdvanced ? '🔼' : '🔽'} Advanced
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Performance */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Performance</h3>
              <div className="h-64">
                <ErrorBoundary>
                  <ResponsiveContainer width="100%" height="100%">
                    {userPreferences.chartType === 'bar' ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="revenue" fill="#22c55e" name="Revenue (€)" />
                        <Bar dataKey="costs" fill="#ef4444" name="Costs (€)" />
                      </BarChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue (€)" />
                        <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} name="Costs (€)" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </ErrorBoundary>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Growth Rate</p>
                  <p className="text-lg font-bold text-green-600">+8.2%</p>
                </div>
                <button
                  onClick={() => setUserPreferences(prev => ({ ...prev, chartType: prev.chartType === 'bar' ? 'line' : 'bar' }))}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                >
                  {userPreferences.chartType === 'bar' ? '📊 Switch to Line' : '📈 Switch to Bar'}
                </button>
              </div>
            </Card>

            {/* Next Month Forecast */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Month Forecast</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(31200)}
                      </div>
                      <div className="text-sm text-gray-600">Projected Revenue</div>
                      <div className="text-xs text-green-600 mt-1">+9.5% from current month</div>
                    </div>
                    <div className="text-green-600">
                      <span className="text-3xl">📈</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">92%</div>
                      <div className="text-sm text-gray-600">Confidence Level</div>
                      <div className="text-xs text-blue-600 mt-1">AI prediction accuracy</div>
                    </div>
                    <div className="text-blue-600">
                      <span className="text-3xl">🎯</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simplified Operating Costs */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Costs (Monthly)</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⚡</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Operations</span>
                      <p className="text-xs text-gray-500">Energy + Maintenance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(financialData.operatingCosts.operations)}</span>
                    <p className="text-xs text-gray-500">49%</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">👥</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Labor</span>
                      <p className="text-xs text-gray-500">Skilled workers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(financialData.operatingCosts.labor)}</span>
                    <p className="text-xs text-gray-500">26%</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🌱</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Materials</span>
                      <p className="text-xs text-gray-500">Seeds, nutrients, substrate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(financialData.operatingCosts.materials)}</span>
                    <p className="text-xs text-gray-500">25%</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Resource Efficiency */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Efficiency</h3>
              <div className="space-y-4">
                {resourceEfficiencyMetrics.map((resource, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">{resource.resource}</span>
                      <span className="text-lg font-bold text-gray-900">{resource.efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          resource.efficiency >= 90 ? 'bg-green-500' : 
                          resource.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${resource.efficiency}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-gray-500">Current efficiency</span>
                      <span className="text-green-600 font-medium">Save €{resource.savings}/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Business Insights */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Business Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">💡</span> Top Optimization Opportunity
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">LED lighting schedule optimization could save €1,200/month while maintaining yield quality.</p>
                  <button className="mt-2 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">
                    
                  </button>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📊</span> Market Price Alert
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">Tomato prices expected to increase 8.2% next month. Consider delaying harvest by 5-7 days.</p>
                  <button className="mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">
                    
                  </button>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">🎯</span> Growth Recommendation
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">Plant health optimal. Consider expanding operation by 20% for maximum ROI efficiency.</p>
                  <button className="mt-2 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200">
                   
                  </button>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <button className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">📈 Export Financial Report</p>
                      <p className="text-xs text-gray-500">Generate monthly P&L statement</p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
                
               
                
               
               
              </div>
            </Card>
          </div>
        )}


        {/* Advanced Features - Progressive Disclosure */}
        {showAdvanced && (
          <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🔬 Advanced Analytics</h3>
              <button 
                onClick={() => setUserPreferences(prev => ({ ...prev, showDetails: !prev.showDetails }))}
                className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300"
              >
                {userPreferences.showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {userPreferences.showDetails && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Detailed Cost Breakdown</h4>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>LED Lighting</span>
                      <span>€5,200/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Climate Control</span>
                      <span>€3,300/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IoT Sensors & ML</span>
                      <span>€2,100/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maintenance</span>
                      <span>€2,700/mo</span>
                    </div>
                  </div>
                </Card>
                
                <Card>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">ROI Projections</h4>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Year 1 ROI</span>
                      <span className="text-green-600 font-medium">22.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Year 2 ROI</span>
                      <span className="text-green-600 font-medium">28.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>5-Year NPV</span>
                      <span className="text-green-600 font-medium">€285,000</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GrowerDashboard;