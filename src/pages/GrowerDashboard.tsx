import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { FinancialData, RevenueData } from '../types';

// Enhanced financial data based on HORTI-IOT research and Dutch horticulture metrics
interface EnhancedFinancialData {
  totalInvestment: number;
  monthlyRevenue: number;
  operatingCosts: {
    energy: number;
    labor: number;
    materials: number; // seeds, nutrients, substrate
    water: number;
    maintenance: number;
    total: number;
  };
  revenueMetrics: {
    revenuePerM2: number; // €/m² key metric for growers
    costPerKg: number; // Cost per kg produced
    yieldPerM2: number; // kg/m²
    pricePerKg: number; // Market price €/kg
  };
  roi: number;
  profitMargin: number;
  paybackPeriod: number; // months
  netProfit: number;
}

const mockEnhancedFinancialData: EnhancedFinancialData = {
  totalInvestment: 180000, // Higher investment for professional greenhouse
  monthlyRevenue: 28500,
  operatingCosts: {
    energy: 8500, // 30% of costs (LED lighting, heating, ventilation)
    labor: 7200, // 25% of costs
    materials: 6800, // 24% of costs (seeds, nutrients, Cocopeat substrate)
    water: 1200, // 4% of costs
    maintenance: 4800, // 17% of costs (equipment, sensors, ML systems)
    total: 28500
  },
  revenueMetrics: {
    revenuePerM2: 356.25, // €356.25 per m² (28500/80m²)
    costPerKg: 2.85, // Cost per kg produced
    yieldPerM2: 85.2, // kg/m² annual yield (from ML prediction)
    pricePerKg: 4.18 // Market price per kg
  },
  roi: 22.8, // Higher ROI for optimized greenhouse
  profitMargin: 35.1,
  paybackPeriod: 28.5, // months to break even
  netProfit: 18000
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

// Resource efficiency and sustainability metrics
const resourceEfficiencyMetrics = [
  { 
    resource: 'Water Usage', 
    current: 1.8, 
    optimal: 1.5, 
    unit: 'l/m²/day', 
    efficiency: 85,
    savings: 320 // euros/month potential savings
  },
  { 
    resource: 'Energy Consumption', 
    current: 125, 
    optimal: 108, 
    unit: 'kWh/m²/month', 
    efficiency: 87,
    savings: 890
  },
  { 
    resource: 'CO₂ Usage', 
    current: 0.85, 
    optimal: 0.78, 
    unit: 'kg/m²/month', 
    efficiency: 92,
    savings: 280
  },
  { 
    resource: 'Substrate Usage', 
    current: 95, 
    optimal: 95, 
    unit: '% utilization', 
    efficiency: 100,
    savings: 0
  }
];

// Crop performance data based on research specifications
const cropPerformanceData = [
  { 
    metric: 'Head Thickness', 
    current: 9.8, 
    optimal: 10.0, 
    unit: 'mm', 
    status: 'Good',
    impactOnYield: '+2%'
  },
  { 
    metric: 'Sap Flow Rate', 
    current: 48.5, 
    optimal: 50.0, 
    unit: 'g/h', 
    status: 'Optimal',
    impactOnYield: '+5%'
  },
  { 
    metric: 'LAI (Leaf Area)', 
    current: 3.23, 
    optimal: 3.2, 
    unit: 'm²/m²', 
    status: 'Optimal',
    impactOnYield: '+3%'
  },
  { 
    metric: 'Plant Health Score', 
    current: 92, 
    optimal: 95, 
    unit: '%', 
    status: 'Good',
    impactOnYield: '+1%'
  }
];

// Investment breakdown based on professional greenhouse setup
const investmentBreakdown = [
  { 
    category: 'Climate Control Systems', 
    amount: 65000, 
    percentage: 36.1,
    description: 'Hoogendoorn/Priva systems, HVAC',
    roi: 24.5,
    paybackMonths: 22
  },
  { 
    category: 'LED Lighting System', 
    amount: 45000, 
    percentage: 25.0,
    description: '18 mol/m²/day DLI system',
    roi: 28.2,
    paybackMonths: 18
  },
  { 
    category: 'IOT & ML Systems', 
    amount: 25000, 
    percentage: 13.9,
    description: 'Sensors, RGBD cameras, ML platform',
    roi: 35.8,
    paybackMonths: 15
  },
  { 
    category: 'Irrigation & Fertigation', 
    amount: 20000, 
    percentage: 11.1,
    description: 'Precision water/nutrient delivery',
    roi: 22.1,
    paybackMonths: 24
  },
  { 
    category: 'Growing System', 
    amount: 15000, 
    percentage: 8.3,
    description: 'Cocopeat substrate, gutters, support',
    roi: 18.5,
    paybackMonths: 30
  },
  { 
    category: 'Seeds & Initial Supplies', 
    amount: 10000, 
    percentage: 5.6,
    description: 'Xandor XR tomato seeds, nutrients',
    roi: 45.2,
    paybackMonths: 12
  }
];

// Market analysis and projections
const marketProjections = {
  currentPrice: 4.18, // €/kg
  projectedPriceIncrease: 8.2, // % annually
  demandGrowth: 12.5, // % annually for sustainable produce
  competitiveAdvantage: {
    yieldIncrease: 15.2, // % above traditional methods
    qualityPremium: 12.0, // % price premium for high quality
    resourceSavings: 22.8 // % savings on resources
  }
};

const GrowerDashboard: React.FC = () => {
  const [financialData, setFinancialData] = useState<EnhancedFinancialData>(mockEnhancedFinancialData);
  const [revenueData] = useState<RevenueData[]>(mockRevenueData);

  useEffect(() => {
    // Simulate real-time financial updates
    const interval = setInterval(() => {
      setFinancialData(prev => ({
        ...prev,
        monthlyRevenue: prev.monthlyRevenue + (Math.random() - 0.5) * 1200,
        netProfit: prev.netProfit + (Math.random() - 0.5) * 800,
        revenueMetrics: {
          ...prev.revenueMetrics,
          revenuePerM2: prev.revenueMetrics.revenuePerM2 + (Math.random() - 0.5) * 15,
          yieldPerM2: prev.revenueMetrics.yieldPerM2 + (Math.random() - 0.5) * 2
        }
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

        {/* Key Business Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Revenue/m²</p>
              <p className="text-2xl font-bold text-green-600">
                €{financialData.revenueMetrics.revenuePerM2.toFixed(0)}
              </p>
              <p className="text-xs text-green-600 mt-1">per m² monthly</p>
              <div className="mt-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  +15% vs industry avg
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Yield Performance</p>
              <p className="text-2xl font-bold text-blue-600">
                {financialData.revenueMetrics.yieldPerM2.toFixed(1)} kg/m²
              </p>
              <p className="text-xs text-blue-600 mt-1">annual yield</p>
              <div className="mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  ML optimized
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className="text-2xl font-bold text-purple-600">
                {financialData.roi.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 mt-1">annual return</p>
              <div className="mt-2">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Target: 18%
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-indigo-600">
                {financialData.profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-indigo-600 mt-1">net margin</p>
              <div className="mt-2">
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  Excellent
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Break-even</p>
              <p className="text-2xl font-bold text-orange-600">
                {financialData.paybackPeriod.toFixed(1)}
              </p>
              <p className="text-xs text-orange-600 mt-1">months</p>
              <div className="mt-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  2 mo. early
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Operating Costs Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Costs Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Energy (LED, Climate)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(financialData.operatingCosts.energy)}</span>
                  <p className="text-xs text-gray-500">30%</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Labor Costs</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(financialData.operatingCosts.labor)}</span>
                  <p className="text-xs text-gray-500">25%</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Materials & Nutrients</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(financialData.operatingCosts.materials)}</span>
                  <p className="text-xs text-gray-500">24%</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Maintenance & Tech</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(financialData.operatingCosts.maintenance)}</span>
                  <p className="text-xs text-gray-500">17%</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Water & Irrigation</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(financialData.operatingCosts.water)}</span>
                  <p className="text-xs text-gray-500">4%</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Efficiency Metrics</h3>
            <div className="space-y-4">
              {resourceEfficiencyMetrics.map((resource, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{resource.resource}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {resource.current} {resource.unit}
                      </span>
                      <p className="text-xs text-gray-500">Target: {resource.optimal}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        resource.efficiency >= 90 ? 'bg-green-500' : 
                        resource.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${resource.efficiency}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{resource.efficiency}% efficiency</span>
                    {resource.savings > 0 && (
                      <span className="text-green-600">Save €{resource.savings}/mo</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Production Efficiency Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Yield Performance</h3>
            <div className="h-64">
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="revenue" fill="#22c55e" name="Revenue (€)" />
                    <Bar dataKey="costs" fill="#ef4444" name="Costs (€)" />
                  </BarChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="p-2 bg-green-50 rounded">
                <p className="text-xs text-gray-600">Avg Revenue Growth</p>
                <p className="text-lg font-bold text-green-600">+8.2%</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Cost Optimization</p>
                <p className="text-lg font-bold text-blue-600">-3.1%</p>
              </div>
            </div>
          </Card>

          {/* Market Price & Yield Correlation */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yield vs Market Price Trends</h3>
            <div className="h-64">
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="yieldKgM2" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Yield (kg/m²)"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="marketPrice" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Market Price (€/kg)"
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">💡 <strong>AI Insight:</strong> Yield optimization through ML predictions has increased profitability by 15.2%</p>
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crop Performance Metrics */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plant Performance Indicators</h3>
            <div className="space-y-4">
              {cropPerformanceData.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                      <p className="text-xs text-gray-500">{metric.impactOnYield} yield impact</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {metric.current} {metric.unit}
                      </span>
                      <p className={`text-xs ${
                        metric.status === 'Optimal' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {metric.status}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.status === 'Optimal' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${(metric.current / metric.optimal) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                🎯 <strong>Overall Performance:</strong> 92% of optimal conditions achieved
              </p>
            </div>
          </Card>

          {/* Investment ROI Analysis */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment ROI Analysis</h3>
            <div className="space-y-4">
              {investmentBreakdown.map((investment, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{investment.category}</span>
                      <p className="text-xs text-gray-500">{investment.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(investment.amount)}
                      </span>
                      <p className="text-xs text-gray-500">{investment.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-600">ROI: {investment.roi}%</span>
                    <span className="text-blue-600">Payback: {investment.paybackMonths} mo.</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(investment.roi * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Business Intelligence & Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Intelligence</h3>
            
            {/* Market Projections */}
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Current Market Price</span>
                  <span className="text-lg font-bold text-green-600">€{marketProjections.currentPrice}/kg</span>
                </div>
                <p className="text-xs text-green-600 mt-1">+{marketProjections.projectedPriceIncrease}% projected increase</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Demand Growth</span>
                  <span className="text-lg font-bold text-blue-600">+{marketProjections.demandGrowth}%</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Sustainable produce demand</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Quality Premium</span>
                  <span className="text-lg font-bold text-purple-600">+{marketProjections.competitiveAdvantage.qualityPremium}%</span>
                </div>
                <p className="text-xs text-purple-600 mt-1">Above market price</p>
              </div>
            </div>
            
           

            {/* AI-Driven Business Insights */}
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">🤖 AI Business Insights</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• ML optimization increased yield by +{marketProjections.competitiveAdvantage.yieldIncrease}%</li>
                <li>• Resource efficiency saved {marketProjections.competitiveAdvantage.resourceSavings}% on operating costs</li>
                <li>• Optimal harvest timing improved profit margins</li>
                <li>• Quality premium justifies premium pricing strategy</li>
                <li>• IoT sensors reduced crop loss by 8.5%</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Business Projections & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">12-Month Business Projections</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(24500)}
                    </div>
                    <div className="text-sm text-gray-600">Projected Monthly Profit</div>
                    <div className="text-xs text-green-600 mt-1">+36% growth from current</div>
                  </div>
                  <div className="text-green-600">
                    <span className="text-3xl">💰</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{financialData.paybackPeriod.toFixed(1)} months</div>
                    <div className="text-sm text-gray-600">Break-even Point</div>
                    <div className="text-xs text-blue-600 mt-1">3.2 months ahead of plan</div>
                  </div>
                  <div className="text-blue-600">
                    <span className="text-3xl">🎯</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(420000)}
                    </div>
                    <div className="text-sm text-gray-600">Annual Revenue Target</div>
                    <div className="text-xs text-purple-600 mt-1">96% probability of achievement</div>
                  </div>
                  <div className="text-purple-600">
                    <span className="text-3xl">📈</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Recommendations</h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border-l-3 border-green-400">
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 mt-1">✅</span>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">Expand IoT Monitoring</h4>
                    <p className="text-xs text-gray-600 mt-1">Additional sensors could increase yield by 8-12% (ROI: 240%)</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border-l-3 border-blue-400">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 mt-1">📊</span>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">Optimize Energy Usage</h4>
                    <p className="text-xs text-gray-600 mt-1">LED scheduling optimization could save €1,200/month</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg border-l-3 border-yellow-400">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 mt-1">⚠️</span>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">Market Price Volatility</h4>
                    <p className="text-xs text-gray-600 mt-1">Consider futures contracts to hedge price risk</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg border-l-3 border-purple-400">
                <div className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">🎯</span>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">Quality Certification</h4>
                    <p className="text-xs text-gray-600 mt-1">Organic certification could increase prices by 18-25%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm font-medium text-gray-800">💯 Overall Business Health Score</p>
              <div className="flex items-center mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full" style={{ width: '87%' }}></div>
                </div>
                <span className="ml-3 text-lg font-bold text-green-600">87%</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Excellent performance with growth opportunities</p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default GrowerDashboard;