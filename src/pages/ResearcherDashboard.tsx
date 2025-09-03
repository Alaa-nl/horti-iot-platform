import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { ClimateData } from '../types';

// Mock data for demonstration
const mockClimateData: ClimateData[] = [
  { id: '1', timestamp: '2024-01-01T00:00:00Z', temperature: 22.5, humidity: 65, co2: 400, light: 350 },
  { id: '2', timestamp: '2024-01-01T01:00:00Z', temperature: 23.1, humidity: 63, co2: 420, light: 380 },
  { id: '3', timestamp: '2024-01-01T02:00:00Z', temperature: 24.2, humidity: 61, co2: 390, light: 420 },
  { id: '4', timestamp: '2024-01-01T03:00:00Z', temperature: 25.1, humidity: 59, co2: 410, light: 450 },
  { id: '5', timestamp: '2024-01-01T04:00:00Z', temperature: 24.8, humidity: 62, co2: 430, light: 480 },
  { id: '6', timestamp: '2024-01-01T05:00:00Z', temperature: 23.9, humidity: 64, co2: 415, light: 520 },
];

const mockSensorData = [
  { name: 'Active', value: 12, color: '#10B981' },
  { name: 'Inactive', value: 3, color: '#EF4444' },
  { name: 'Maintenance', value: 2, color: '#F59E0B' },
];

const ResearcherDashboard: React.FC = () => {
  const [currentClimate, setCurrentClimate] = useState<ClimateData | null>(null);
  const [realtimeData, setRealtimeData] = useState<ClimateData[]>(mockClimateData);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      const newData: ClimateData = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        temperature: 20 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        co2: 350 + Math.random() * 150,
        light: 300 + Math.random() * 300,
      };
      
      setCurrentClimate(newData);
      setRealtimeData(prev => [...prev.slice(-11), newData]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const chartData = realtimeData.filter(item => item && item.timestamp).map(item => ({
    time: formatTime(item.timestamp),
    temperature: Number(item.temperature || 0).toFixed(1),
    humidity: Number(item.humidity || 0).toFixed(1),
    co2: Math.round(Number(item.co2 || 0)),
    light: Math.round(Number(item.light || 0)),
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className="text-3xl font-bold text-orange-600">
                  {currentClimate ? `${currentClimate.temperature.toFixed(1)}°C` : '--'}
                </p>
                <p className="text-xs text-green-600 mt-1">↗ +0.5°C from avg</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-orange-600 text-xl">🌡️</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Humidity</p>
                <p className="text-3xl font-bold text-blue-600">
                  {currentClimate ? `${currentClimate.humidity.toFixed(1)}%` : '--'}
                </p>
                <p className="text-xs text-green-600 mt-1">↗ Optimal range</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 text-xl">💧</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO₂ Level</p>
                <p className="text-3xl font-bold text-green-600">
                  {currentClimate ? `${currentClimate.co2.toFixed(0)} ppm` : '--'}
                </p>
                <p className="text-xs text-yellow-600 mt-1">⚠ Slightly high</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-xl">🌱</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Light Level</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {currentClimate ? `${currentClimate.light.toFixed(0)} lux` : '--'}
                </p>
                <p className="text-xs text-green-600 mt-1">☀️ Excellent</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-yellow-600 text-xl">☀️</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature & Humidity Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Climate Monitoring</h3>
            <div className="h-64">
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      name="Temperature (°C)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Humidity (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </Card>

          {/* CO2 & Light Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Factors</h3>
            <div className="h-64">
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="co2" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="CO₂ (ppm)"
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="light" 
                      stroke="#eab308" 
                      strokeWidth={2}
                      name="Light (lux)"
                      dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sensor Status */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensor Status</h3>
            <div className="h-48">
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockSensorData.filter(item => item && typeof item.value === 'number')}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mockSensorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
            <div className="flex justify-center space-x-4 mt-2">
              {mockSensorData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ML Predictions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ML Predictions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plant Health Score</span>
                <span className="text-lg font-semibold text-green-600">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Disease Risk</span>
                <span className="text-lg font-semibold text-yellow-600">Low</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Growth Rate</span>
                <span className="text-lg font-semibold text-blue-600">+12%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-horti-green-50 border border-horti-green-200 rounded-lg text-horti-green-700 hover:bg-horti-green-100 transition-colors duration-200"
              >
                📷 Capture Plant Images
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors duration-200"
              >
                🤖 Run ML Analysis
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors duration-200"
              >
                📊 Generate Report
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors duration-200"
              >
                ⚙️ Sensor Settings
              </motion.button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ResearcherDashboard;