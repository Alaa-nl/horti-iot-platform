import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Simplified climate data focusing on 4 core research metrics
interface SimplifiedClimateData {
  id: string;
  timestamp: string;
  // Core 4 metrics for researchers
  temperature: number; // °C
  co2: number; // ppm
  vpd: number; // kPa - Vapor Pressure Deficit
  par: number; // μmol/m²/s - Photosynthetic Active Radiation
  // Plant monitoring (2 key metrics)
  headThickness: number; // mm
  sapFlow: number; // g/h
}

const mockSimplifiedData: SimplifiedClimateData[] = [
  { 
    id: '1', 
    timestamp: '2024-01-01T00:00:00Z', 
    temperature: 22.5, 
    co2: 1000, 
    par: 280,
    vpd: 0.8,
    sapFlow: 45.2,
    headThickness: 9.5
  },
  { 
    id: '2', 
    timestamp: '2024-01-01T00:05:00Z', 
    temperature: 22.8, 
    co2: 980, 
    par: 290,
    vpd: 0.75,
    sapFlow: 46.1,
    headThickness: 9.6
  },
  { 
    id: '3', 
    timestamp: '2024-01-01T00:10:00Z', 
    temperature: 23.1, 
    co2: 950, 
    par: 305,
    vpd: 0.72,
    sapFlow: 47.3,
    headThickness: 9.7
  },
  { 
    id: '4', 
    timestamp: '2024-01-01T00:15:00Z', 
    temperature: 23.4, 
    co2: 930, 
    par: 315,
    vpd: 0.70,
    sapFlow: 48.5,
    headThickness: 9.8
  },
  { 
    id: '5', 
    timestamp: '2024-01-01T00:20:00Z', 
    temperature: 23.6, 
    co2: 920, 
    par: 325,
    vpd: 0.68,
    sapFlow: 49.2,
    headThickness: 9.9
  },
  { 
    id: '6', 
    timestamp: '2024-01-01T00:25:00Z', 
    temperature: 23.2, 
    co2: 940, 
    par: 320,
    vpd: 0.71,
    sapFlow: 48.8,
    headThickness: 9.8
  }
];

const mockSensorData = [
  { name: 'Climate Sensors', value: 8, color: '#10B981', status: 'Active' },
  { name: 'Sap Flow Sensors', value: 4, color: '#10B981', status: 'Active' },
  { name: 'RGBD Cameras', value: 2, color: '#10B981', status: 'Active' },
  { name: 'Irrigation Sensors', value: 3, color: '#F59E0B', status: 'Maintenance' },
  { name: 'Light Sensors', value: 1, color: '#EF4444', status: 'Offline' },
];

// Simplified ML Predictions for researchers
const mockMLPredictions = {
  yieldForecast: { value: 85.2, confidence: 92, unit: 'kg/m²' },
  diseaseRisk: { value: 15, confidence: 88, status: 'Low' },
  growthRate: { value: 12.5, confidence: 95, unit: '%' },
  optimalHarvestDate: { value: '2024-02-15', confidence: 85 }
};

// Essential greenhouse metadata for research
const greenhouseMetadata = {
  location: 'World Horti Center, Naaldwijk',
  size: { length: 12.5, width: 6.4, height: 6.0, unit: 'm' },
  crop: 'Xandor XR Tomato (Maxifort)',
  plantingDate: '2022-09-12',
  climateSystem: 'Hoogendoorn/Priva',
  co2Target: 1000
};

const ResearcherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('climate');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userPreferences, setUserPreferences] = useState({ chartView: 'combined', showDetails: false });
  const [currentClimate, setCurrentClimate] = useState<SimplifiedClimateData | null>(null);
  const [realtimeData, setRealtimeData] = useState<SimplifiedClimateData[]>(mockSimplifiedData);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      const newData: SimplifiedClimateData = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        temperature: 18.5 + Math.random() * 4.5, // 18.5-23°C range
        co2: 900 + Math.random() * 200, // 900-1100 ppm
        par: 250 + Math.random() * 100, // μmol/m²/s
        vpd: 0.6 + Math.random() * 0.4, // 0.6-1.0 kPa
        sapFlow: 40 + Math.random() * 20, // g/h
        headThickness: 9 + Math.random() * 2 // mm (target ~10mm)
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
    co2: Math.round(Number(item.co2 || 0)),
    par: Math.round(Number(item.par || 0)),
    vpd: Number(item.vpd || 0).toFixed(2),
    sapFlow: Number(item.sapFlow || 0).toFixed(1),
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

        {/* Core Research Metrics - Simplified to 4 key environmental metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Temperature</p>
              <p className="text-3xl font-bold text-orange-600">
                {currentClimate ? `${currentClimate.temperature.toFixed(1)}°C` : '--'}
              </p>
              <p className="text-xs text-green-600 mt-2">✓ Optimal Range</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 18.5-23°C</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">CO₂</p>
              <p className="text-3xl font-bold text-green-600">
                {currentClimate ? `${currentClimate.co2.toFixed(0)}` : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-2">ppm</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${currentClimate ? (currentClimate.co2 / 1100) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-green-600 mt-1">Target: 1000 ppm</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">VPD</p>
              <p className="text-3xl font-bold text-purple-600">
                {currentClimate ? `${currentClimate.vpd.toFixed(2)}` : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-2">kPa</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${currentClimate ? (currentClimate.vpd / 1.0) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-purple-600 mt-1">Optimal: 0.6-1.0</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">PAR Light</p>
              <p className="text-3xl font-bold text-yellow-600">
                {currentClimate ? `${currentClimate.par.toFixed(0)}` : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-2">μmol/m²/s</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${currentClimate ? (currentClimate.par / 400) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-yellow-600 mt-1">DLI: 18 mol/m²</p>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('climate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'climate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🌡️ Climate Data
            </button>
            <button
              onClick={() => setActiveTab('plants')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🌱 Plant Monitoring
            </button>
            <button
              onClick={() => setActiveTab('sensors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sensors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📴 Sensors & ML
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="py-2 px-1 border-b-2 border-transparent text-gray-400 hover:text-gray-600 font-medium text-sm"
            >
              {showAdvanced ? '🔽' : '🔼'} Advanced
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'climate' && (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Environmental Conditions</h3>
                
              </div>
              <div className="h-80">
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
                        strokeWidth={3}
                        name="Temperature (°C)"
                        dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="co2" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        name="CO₂ (ppm)"
                        dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="vpd" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="VPD (kPa)"
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="par" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="PAR (μmol/m²/s)"
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ErrorBoundary>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  📊 <strong>Research Insight:</strong> All 4 core environmental parameters are within optimal ranges for Xandor XR tomato growth.
                </p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'plants' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plant Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Head Thickness</p>
                  <p className="text-4xl font-bold text-red-600">
                    {currentClimate ? `${currentClimate.headThickness.toFixed(1)}` : '--'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">mm</p>
                  <p className={`text-xs mt-2 ${
                    currentClimate && currentClimate.headThickness < 10 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {currentClimate && currentClimate.headThickness < 10 ? '⚠️ Below optimal (10mm)' : '✅ Optimal range'}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                    <div 
                      className={`h-3 rounded-full ${
                        currentClimate && currentClimate.headThickness >= 10 ? 'bg-green-500' : 'bg-yellow-500'
                      }`} 
                      style={{ width: `${Math.min((currentClimate?.headThickness || 0) / 12 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Sap Flow</p>
                  <p className="text-4xl font-bold text-indigo-600">
                    {currentClimate ? `${currentClimate.sapFlow.toFixed(1)}` : '--'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">g/h</p>
                  <p className="text-xs text-indigo-600 mt-2">🔄 Active transpiration</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${currentClimate ? (currentClimate.sapFlow / 60) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Plant Growth Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plant Growth Trends</h3>
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
                        strokeWidth={4}
                        name="Head Thickness (mm)"
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sapFlow" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        name="Sap Flow (g/h)"
                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ErrorBoundary>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  🌱 <strong>Growth Analysis:</strong> Strong correlation between sap flow and head thickness development observed.
                </p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'sensors' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sensor Network Status */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">HORTI-IOT Sensor Network</h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {mockSensorData.filter(s => s.status === 'Active').length}/{mockSensorData.length}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Systems Operational</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(mockSensorData.filter(s => s.status === 'Active').length / mockSensorData.length) * 100}%` }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {mockSensorData.map((sensor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-4 h-4 rounded-full ${
                            sensor.status === 'Active' ? 'bg-green-500' : 
                            sensor.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{sensor.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{sensor.value}</span>
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
              </div>
            </Card>

            {/* ML Predictions & Analytics */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Predictions & Analysis</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Yield Forecast</span>
                    <span className="text-lg font-bold text-green-600">
                      {mockMLPredictions.yieldForecast.value} {mockMLPredictions.yieldForecast.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${mockMLPredictions.yieldForecast.confidence}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Confidence: {mockMLPredictions.yieldForecast.confidence}%</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Disease Risk</span>
                    <span className="text-lg font-bold text-green-600">{mockMLPredictions.diseaseRisk.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Risk Level: {mockMLPredictions.diseaseRisk.value}%</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Growth Rate</span>
                    <span className="text-lg font-bold text-blue-600">+{mockMLPredictions.growthRate.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Above baseline growth</p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 mb-2">🎯 <strong>Optimal Harvest:</strong></p>
                  <p className="text-lg font-bold text-blue-600">{mockMLPredictions.optimalHarvestDate.value}</p>
                  <p className="text-xs text-gray-500 mt-1">Based on current growth patterns ({mockMLPredictions.optimalHarvestDate.confidence}% confidence)</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Advanced Features - Progressive Disclosure */}
        {showAdvanced && (
          <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🔬 Advanced Research Tools</h3>
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
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Greenhouse Metadata</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span>{greenhouseMetadata.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span>{greenhouseMetadata.size.length}×{greenhouseMetadata.size.width}×{greenhouseMetadata.size.height}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crop:</span>
                      <span>{greenhouseMetadata.crop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Planting Date:</span>
                      <span>{new Date(greenhouseMetadata.plantingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CO₂ Target:</span>
                      <span>{greenhouseMetadata.co2Target} ppm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Climate System:</span>
                      <span>{greenhouseMetadata.climateSystem}</span>
                    </div>
                  </div>
                </Card>
                
                <Card>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Research Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full p-2 text-left bg-blue-50 hover:bg-blue-100 rounded text-xs">
                      📄 Export Data (CSV)
                    </button>
                    
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

export default ResearcherDashboard;