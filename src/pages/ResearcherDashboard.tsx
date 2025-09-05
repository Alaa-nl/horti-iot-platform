import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { ClimateData } from '../types';

// Enhanced mock data matching HORTI-IOT research specifications (5-min intervals)
interface EnhancedClimateData {
  id: string;
  timestamp: string;
  // Core climate measurements (°C, g/m³, ppm, W/m²)
  temperature: number;
  absoluteHumidity: number; // g/m³
  co2: number; // ppm
  radiation: number; // W/m²
  par: number; // µmol/m²/s - Photosynthetic Active Radiation
  vpd: number; // kPa - Vapor Pressure Deficit
  radiationOut: number; // W/m² - Outgoing radiation
  // Plant-specific measurements
  sapFlow: number; // g/h
  stemDiameter: number; // mm
  headThickness: number; // mm
  lai: number; // m²/m² - Leaf Area Index
  // Irrigation data
  waterGiven: number; // l/m²
  ec: number; // mS/cm - Electrical Conductivity
}

const mockEnhancedData: EnhancedClimateData[] = [
  { 
    id: '1', 
    timestamp: '2024-01-01T00:00:00Z', 
    temperature: 22.5, 
    absoluteHumidity: 15.2, 
    co2: 1000, 
    radiation: 350, 
    par: 280,
    vpd: 0.8,
    radiationOut: 120,
    sapFlow: 45.2,
    stemDiameter: 15.8,
    headThickness: 9.5,
    lai: 3.2,
    waterGiven: 2.1,
    ec: 2.8
  },
  { 
    id: '2', 
    timestamp: '2024-01-01T00:05:00Z', 
    temperature: 22.8, 
    absoluteHumidity: 15.5, 
    co2: 980, 
    radiation: 365, 
    par: 290,
    vpd: 0.75,
    radiationOut: 125,
    sapFlow: 46.1,
    stemDiameter: 15.9,
    headThickness: 9.6,
    lai: 3.21,
    waterGiven: 2.0,
    ec: 2.7
  },
  { 
    id: '3', 
    timestamp: '2024-01-01T00:10:00Z', 
    temperature: 23.1, 
    absoluteHumidity: 15.8, 
    co2: 950, 
    radiation: 380, 
    par: 305,
    vpd: 0.72,
    radiationOut: 130,
    sapFlow: 47.3,
    stemDiameter: 16.0,
    headThickness: 9.7,
    lai: 3.22,
    waterGiven: 1.9,
    ec: 2.6
  },
  { 
    id: '4', 
    timestamp: '2024-01-01T00:15:00Z', 
    temperature: 23.4, 
    absoluteHumidity: 16.1, 
    co2: 930, 
    radiation: 395, 
    par: 315,
    vpd: 0.70,
    radiationOut: 135,
    sapFlow: 48.5,
    stemDiameter: 16.1,
    headThickness: 9.8,
    lai: 3.23,
    waterGiven: 1.8,
    ec: 2.5
  },
  { 
    id: '5', 
    timestamp: '2024-01-01T00:20:00Z', 
    temperature: 23.6, 
    absoluteHumidity: 16.3, 
    co2: 920, 
    radiation: 410, 
    par: 325,
    vpd: 0.68,
    radiationOut: 140,
    sapFlow: 49.2,
    stemDiameter: 16.2,
    headThickness: 9.9,
    lai: 3.24,
    waterGiven: 1.7,
    ec: 2.4
  },
  { 
    id: '6', 
    timestamp: '2024-01-01T00:25:00Z', 
    temperature: 23.2, 
    absoluteHumidity: 16.0, 
    co2: 940, 
    radiation: 400, 
    par: 320,
    vpd: 0.71,
    radiationOut: 138,
    sapFlow: 48.8,
    stemDiameter: 16.1,
    headThickness: 9.8,
    lai: 3.23,
    waterGiven: 1.8,
    ec: 2.5
  }
];

const mockSensorData = [
  { name: 'Climate Sensors', value: 8, color: '#10B981', status: 'Active' },
  { name: 'Sap Flow Sensors', value: 4, color: '#10B981', status: 'Active' },
  { name: 'RGBD Cameras', value: 2, color: '#10B981', status: 'Active' },
  { name: 'Irrigation Sensors', value: 3, color: '#F59E0B', status: 'Maintenance' },
  { name: 'Light Sensors', value: 1, color: '#EF4444', status: 'Offline' },
];

// ML Predictions mock data
const mockMLPredictions = {
  yieldForecast: { value: 85.2, confidence: 92, unit: 'kg/m²' },
  diseaseRisk: { value: 15, confidence: 88, status: 'Low' },
  growthRate: { value: 12.5, confidence: 95, unit: '%' },
  waterStress: { value: 8, confidence: 90, status: 'Minimal' },
  optimalHarvestDate: { value: '2024-02-15', confidence: 85 }
};

// Greenhouse metadata
const greenhouseMetadata = {
  location: 'World Horti Center, Naaldwijk',
  size: { length: 12.5, width: 6.4, height: 6.0, unit: 'm' },
  crop: 'Xandor XR Tomato (Maxifort rootstock)',
  plantingDate: '2022-09-12',
  growingSystem: 'Cocopeat substrate',
  climateSystem: 'Hoogendoorn/Priva',
  lightingSystem: 'LED (18 mol/m²/day DLI)',
  co2Target: 1000,
  temperatureRange: { min: 18.5, max: 23.0, unit: '°C' }
};

const ResearcherDashboard: React.FC = () => {
  const [currentClimate, setCurrentClimate] = useState<EnhancedClimateData | null>(null);
  const [realtimeData, setRealtimeData] = useState<EnhancedClimateData[]>(mockEnhancedData);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      const newData: EnhancedClimateData = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        temperature: 18.5 + Math.random() * 4.5, // 18.5-23°C range
        absoluteHumidity: 14 + Math.random() * 4, // g/m³
        co2: 900 + Math.random() * 200, // 900-1100 ppm
        radiation: 300 + Math.random() * 200, // W/m²
        par: 250 + Math.random() * 100, // µmol/m²/s
        vpd: 0.6 + Math.random() * 0.4, // 0.6-1.0 kPa
        radiationOut: 100 + Math.random() * 50,
        sapFlow: 40 + Math.random() * 20, // g/h
        stemDiameter: 15 + Math.random() * 2, // mm
        headThickness: 9 + Math.random() * 2, // mm (target ~10mm)
        lai: 3.0 + Math.random() * 0.5, // m²/m²
        waterGiven: 1.5 + Math.random() * 1.0, // l/m²
        ec: 2.0 + Math.random() * 1.0 // mS/cm
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
    absoluteHumidity: Number(item.absoluteHumidity || 0).toFixed(1),
    co2: Math.round(Number(item.co2 || 0)),
    par: Math.round(Number(item.par || 0)),
    vpd: Number(item.vpd || 0).toFixed(2),
    sapFlow: Number(item.sapFlow || 0).toFixed(1),
    stemDiameter: Number(item.stemDiameter || 0).toFixed(1),
    headThickness: Number(item.headThickness || 0).toFixed(1),
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

        {/* Real-time Environmental Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className="text-2xl font-bold text-orange-600">
                  {currentClimate ? `${currentClimate.temperature.toFixed(1)}°C` : '--'}
                </p>
                <p className="text-xs text-green-600 mt-1">📊 Optimal</p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-lg">🌡️</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absolute Humidity</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentClimate ? `${currentClimate.absoluteHumidity.toFixed(1)} g/m³` : '--'}
                </p>
                <p className="text-xs text-green-600 mt-1">💧 Good</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">💧</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO₂</p>
                <p className="text-2xl font-bold text-green-600">
                  {currentClimate ? `${currentClimate.co2.toFixed(0)} ppm` : '--'}
                </p>
                <p className="text-xs text-green-600 mt-1">🎯 Target: 1000</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">🌱</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PAR Light</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {currentClimate ? `${currentClimate.par.toFixed(0)}` : '--'}
                </p>
                <p className="text-xs text-gray-500 mt-1">µmol/m²/s</p>
              </div>
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-lg">☀️</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">VPD</p>
                <p className="text-2xl font-bold text-purple-600">
                  {currentClimate ? `${currentClimate.vpd.toFixed(2)} kPa` : '--'}
                </p>
                <p className="text-xs text-green-600 mt-1">📈 Optimal</p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">📊</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sap Flow</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {currentClimate ? `${currentClimate.sapFlow.toFixed(1)} g/h` : '--'}
                </p>
                <p className="text-xs text-green-600 mt-1">🔄 Active</p>
              </div>
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 text-lg">💧</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Plant Growth Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Head Thickness</p>
              <p className="text-3xl font-bold text-red-600">
                {currentClimate ? `${currentClimate.headThickness.toFixed(1)} mm` : '--'}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {currentClimate && currentClimate.headThickness < 10 ? '⚠️ Below optimal (10mm)' : '✅ Optimal range'}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className={`h-2 rounded-full ${
                    currentClimate && currentClimate.headThickness >= 10 ? 'bg-green-500' : 'bg-yellow-500'
                  }`} 
                  style={{ width: `${Math.min((currentClimate?.headThickness || 0) / 12 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Stem Diameter</p>
              <p className="text-3xl font-bold text-green-600">
                {currentClimate ? `${currentClimate.stemDiameter.toFixed(1)} mm` : '--'}
              </p>
              <p className="text-xs text-green-600 mt-1">📏 Growing well</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">LAI</p>
              <p className="text-3xl font-bold text-blue-600">
                {currentClimate ? `${currentClimate.lai.toFixed(2)}` : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-1">m²leaf/m²surface</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Water Given</p>
              <p className="text-3xl font-bold text-cyan-600">
                {currentClimate ? `${currentClimate.waterGiven.toFixed(1)} l/m²` : '--'}
              </p>
              <p className="text-xs text-blue-600 mt-1">EC: {currentClimate ? `${currentClimate.ec.toFixed(1)} mS/cm` : '--'}</p>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature & VPD Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Climate & Plant Conditions</h3>
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
                      dataKey="vpd" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="VPD (kPa)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sapFlow" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      name="Sap Flow (g/h)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </Card>

          {/* Growth & Morphology Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plant Growth Monitoring</h3>
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
                      dataKey="headThickness" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="Head Thickness (mm)"
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stemDiameter" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Stem Diameter (mm)"
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sensor Network Status */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">HORTI-IOT Sensor Network</h3>
            <div className="space-y-3">
              {mockSensorData.map((sensor, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`w-3 h-3 rounded-full ${
                        sensor.status === 'Active' ? 'bg-green-500' : 
                        sensor.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{sensor.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{sensor.value} units</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sensor.status === 'Active' ? 'bg-green-100 text-green-700' : 
                      sensor.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sensor.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                📡 Total: {mockSensorData.reduce((sum, s) => sum + s.value, 0)} sensors
              </p>
              <p className="text-xs text-green-600 mt-1">
                ✅ {mockSensorData.filter(s => s.status === 'Active').length} systems operational
              </p>
            </div>
          </Card>

          {/* ML Predictions & Analytics */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Predictions & Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Yield Forecast</span>
                  <p className="text-xs text-gray-500">Confidence: {mockMLPredictions.yieldForecast.confidence}%</p>
                </div>
                <span className="text-lg font-semibold text-green-600">
                  {mockMLPredictions.yieldForecast.value} {mockMLPredictions.yieldForecast.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${mockMLPredictions.yieldForecast.confidence}%` }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Disease Risk</span>
                  <p className="text-xs text-gray-500">Confidence: {mockMLPredictions.diseaseRisk.confidence}%</p>
                </div>
                <span className="text-lg font-semibold text-green-600">{mockMLPredictions.diseaseRisk.status}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Growth Rate</span>
                  <p className="text-xs text-gray-500">Confidence: {mockMLPredictions.growthRate.confidence}%</p>
                </div>
                <span className="text-lg font-semibold text-blue-600">+{mockMLPredictions.growthRate.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Water Stress Level</span>
                  <p className="text-xs text-gray-500">Confidence: {mockMLPredictions.waterStress.confidence}%</p>
                </div>
                <span className="text-lg font-semibold text-green-600">{mockMLPredictions.waterStress.status}</span>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg mt-4">
                <p className="text-sm text-gray-700">🎯 Optimal Harvest Date:</p>
                <p className="font-semibold text-blue-600">{mockMLPredictions.optimalHarvestDate.value}</p>
                <p className="text-xs text-gray-500">Based on current growth patterns</p>
              </div>
            </div>
          </Card>

          {/* Greenhouse Metadata & Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Greenhouse Configuration</h3>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">📍 Location</p>
                <p className="text-xs text-gray-600">{greenhouseMetadata.location}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">📏 Dimensions</p>
                <p className="text-xs text-gray-600">
                  {greenhouseMetadata.size.length} × {greenhouseMetadata.size.width} × {greenhouseMetadata.size.height} {greenhouseMetadata.size.unit}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">🌱 Crop</p>
                <p className="text-xs text-gray-600">{greenhouseMetadata.crop}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">🎯 CO₂ Target</p>
                <p className="text-xs text-gray-600">{greenhouseMetadata.co2Target} ppm</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-2 bg-horti-green-50 border border-horti-green-200 rounded-lg text-horti-green-700 hover:bg-horti-green-100 transition-colors duration-200 text-sm"
              >
                📷 RGBD Camera Capture
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors duration-200 text-sm"
              >
                🤖 ML Growth Prediction
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors duration-200 text-sm"
              >
                📊 Export Data (CSV)
              </motion.button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ResearcherDashboard;