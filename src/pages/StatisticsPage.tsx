import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ComposedChart, Legend } from 'recharts';
import Layout from '../components/layout/Layout';
import { motion } from 'framer-motion';

const StatisticsPage: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('temperature');

  // Generate sample data for different time ranges
  const generateHistoricalData = (hours: number) => {
    return Array.from({ length: hours }, (_, i) => ({
      time: `${i}:00`,
      temperature: 18.5 + Math.random() * 4.5 + Math.sin(i / 4) * 2,
      co2: 900 + Math.random() * 200,
      humidity: 70 + Math.random() * 15,
      vpd: 0.6 + Math.random() * 0.4,
      sapFlow: 40 + Math.random() * 20,
      radiation: Math.max(0, 400 * Math.sin((i - 6) * Math.PI / 12)),
      soilMoisture: 40 + Math.random() * 15,
      yieldPrediction: 70 + i * 0.5 + Math.random() * 10
    }));
  };

  const [historicalData, setHistoricalData] = useState(generateHistoricalData(24));

  // Crop performance radar data
  const cropPerformanceData = [
    { metric: 'Growth Rate', current: 85, target: 92, optimal: 100 },
    { metric: 'Water Uptake', current: 78, target: 82, optimal: 100 },
    { metric: 'Nutrient Absorption', current: 88, target: 85, optimal: 100 },
    { metric: 'Light Utilization', current: 92, target: 90, optimal: 100 },
    { metric: 'Disease Resistance', current: 95, target: 88, optimal: 100 },
    { metric: 'Stress Tolerance', current: 82, target: 86, optimal: 100 }
  ];

  // Resource efficiency data
  const resourceData = [
    { resource: 'Water', current: 45, target: 50, efficiency: 90, cost: 120 },
    { resource: 'Energy', current: 320, target: 350, efficiency: 85, cost: 280 },
    { resource: 'CO₂', current: 980, target: 1000, efficiency: 95, cost: 95 },
    { resource: 'Nutrients', current: 78, target: 85, efficiency: 88, cost: 150 }
  ];

  // Device status over time
  const deviceStatusData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    active: 15 + Math.random() * 3,
    maintenance: 2 + Math.random() * 2,
    offline: Math.random() * 2
  }));

  // Yield prediction data
  const yieldPredictionData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    predicted: 70 + i * 0.5 + Math.random() * 5,
    actual: i < 20 ? 68 + i * 0.6 + Math.random() * 4 : null
  }));

  // Environmental correlation data
  const correlationData = Array.from({ length: 50 }, (_, i) => ({
    temperature: 18.5 + Math.random() * 4.5,
    yield: 65 + Math.random() * 25,
    co2: 900 + Math.random() * 200,
    humidity: 70 + Math.random() * 15
  }));

  // Update data when time range changes
  useEffect(() => {
    const hours = selectedTimeRange === '1h' ? 60 :
                  selectedTimeRange === '24h' ? 24 :
                  selectedTimeRange === '7d' ? 168 : 720;
    setHistoricalData(generateHistoricalData(hours));
  }, [selectedTimeRange]);

  return (
    <Layout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Statistics & Analytics
                </h1>
                <p className="text-muted-foreground mt-2">Advanced data visualization and insights</p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center space-x-4">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-4 py-2 rounded-xl border border bg-background text-foreground shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Statistics Grid */}
          <div className="space-y-8">

            {/* Environmental Trends Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-3xl shadow-xl border border p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Environmental Trends Analysis</h2>
                <div className="flex space-x-2">
                  {['temperature', 'co2', 'humidity', 'radiation'].map((metric) => (
                    <button
                      key={metric}
                      onClick={() => setSelectedMetric(metric)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        selectedMetric === metric
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                  />
                  <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="temperature" stroke="#F97316" fill="#F97316" fillOpacity={0.3} name="Temperature (°C)" />
                  <Line yAxisId="right" type="monotone" dataKey="co2" stroke="#10B981" strokeWidth={3} dot={false} name="CO₂ (ppm)" />
                  <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} dot={false} name="Humidity (%)" />
                  <Bar yAxisId="right" dataKey="radiation" fill="#F59E0B" opacity={0.6} name="Radiation (W/m²)" />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.section>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Crop Performance Radar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-3xl shadow-xl border border p-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4">Crop Performance Analysis</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={cropPerformanceData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar name="Current" dataKey="current" stroke="#10B981" fill="#10B981" fillOpacity={0.4} strokeWidth={2} />
                    <Radar name="Target" dataKey="target" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2} />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Resource Optimization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-3xl shadow-xl border border p-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4">Resource Optimization</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={resourceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="resource" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="current" fill="#10B981" name="Current Usage" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#3B82F6" name="Target" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

            </div>

            {/* Prediction Models Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Yield Prediction Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-3xl shadow-xl border border p-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4">Yield Prediction Model</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={yieldPredictionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="#10B981" strokeWidth={3} strokeDasharray="5 5" name="Predicted Yield (kg/m²)" />
                    <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} name="Actual Yield (kg/m²)" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-muted-foreground">Model Accuracy</p>
                      <p className="text-xl font-bold text-green-600">94.7%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prediction Confidence</p>
                      <p className="text-xl font-bold text-blue-600">89.2%</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Environmental Correlation Scatter */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-3xl shadow-xl border border p-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4">Temperature vs Yield Correlation</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="temperature" name="Temperature (°C)" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="number" dataKey="yield" name="Yield" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Data Points" dataKey="yield" fill="#8B5CF6" />
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-muted-foreground">Correlation Coefficient</p>
                      <p className="text-xl font-bold text-purple-600">0.73</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Optimal Temperature</p>
                      <p className="text-xl font-bold text-indigo-600">21.5°C</p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Device Performance Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-3xl shadow-xl border border p-6"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">Device Network Performance</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Device Status Over Time */}
                <div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-4">Weekly Device Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={deviceStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="active" stackId="1" stroke="#10B981" fill="#10B981" name="Active" />
                      <Area type="monotone" dataKey="maintenance" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="Maintenance" />
                      <Area type="monotone" dataKey="offline" stackId="1" stroke="#EF4444" fill="#EF4444" name="Offline" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Network Health Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-4">Network Health Metrics</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Overall Uptime</span>
                        <span className="font-semibold text-green-600">99.2%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: '99.2%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Data Transmission Rate</span>
                        <span className="font-semibold text-blue-600">847 packets/min</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: '84.7%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Response Time</span>
                        <span className="font-semibold text-purple-600">12ms avg</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Active Devices</p>
                        <p className="text-lg font-bold text-green-600">18</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Maintenance</p>
                        <p className="text-lg font-bold text-yellow-600">2</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Offline</p>
                        <p className="text-lg font-bold text-red-600">0</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>


            {/* Cost Analysis Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-card rounded-3xl shadow-xl border border p-6"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">Cost-Benefit Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">💰</span>
                    <span className="text-xs px-2 py-1 bg-green-200 text-green-700 rounded-full">+12%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Monthly Savings</p>
                  <p className="text-3xl font-bold text-green-600">€2,450</p>
                  <p className="text-xs text-muted-foreground mt-2">vs previous month</p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">⚡</span>
                    <span className="text-xs px-2 py-1 bg-blue-200 text-blue-700 rounded-full">+5%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Energy Efficiency</p>
                  <p className="text-3xl font-bold text-blue-600">87%</p>
                  <p className="text-xs text-muted-foreground mt-2">above target</p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">📈</span>
                    <span className="text-xs px-2 py-1 bg-purple-200 text-purple-700 rounded-full">ROI</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Return on Investment</p>
                  <p className="text-3xl font-bold text-purple-600">142%</p>
                  <p className="text-xs text-muted-foreground mt-2">18 month payback</p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-100 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">🌾</span>
                    <span className="text-xs px-2 py-1 bg-orange-200 text-orange-700 rounded-full">+18%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Yield Increase</p>
                  <p className="text-3xl font-bold text-orange-600">+18%</p>
                  <p className="text-xs text-muted-foreground mt-2">vs baseline</p>
                </div>
              </div>
            </motion.section>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StatisticsPage;