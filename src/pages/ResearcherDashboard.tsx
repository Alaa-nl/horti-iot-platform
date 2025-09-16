import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import Layout from '../components/layout/Layout';
import FarmMap from '../components/common/FarmMap';
import { motion } from 'framer-motion';

// Data interfaces
interface FarmDetails {
  farmName: string;
  farmId: string;
  location: string;
  landArea: number;
  cropsGrown: number;
  previousYield: number;
}

interface WeatherData {
  today: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    rainProbability: number;
  };
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
  }>;
}

interface SensorData {
  temperature: { value: number; status: 'normal' | 'warning' | 'critical'; sensors: number };
  workflow: { value: number; status: 'normal' | 'warning' | 'critical'; sensors: number };
  moisture: { value: number; status: 'normal' | 'warning' | 'critical'; sensors: number };
  windSpeed: { value: number; status: 'normal' | 'warning' | 'critical'; sensors: number };
  humidity: { value: number; status: 'normal' | 'warning' | 'critical'; sensors: number };
  smoke: { value: number; status: 'normal' | 'warning' | 'critical'; sensors: number };
}

interface DetectorData {
  moisture: number;
  waterConsumption: {
    current: number;
    previous: number;
  };
}

interface AIRecommendation {
  id: string;
  type: 'irrigation' | 'fertilization' | 'pest_control' | 'harvest' | 'climate';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  icon: string;
  color: string;
}

const ResearcherDashboard: React.FC = () => {
  // Farm details data
  const farmDetails: FarmDetails = {
    farmName: 'World Horti Center',
    farmId: 'WHC-GH-A1',
    location: 'Naaldwijk',
    landArea: 80, // m²
    cropsGrown: 3,
    previousYield: 85 // tonnes
  };

  // Weather data
  const [weatherData] = useState<WeatherData>({
    today: {
      temp: 29,
      condition: 'Partly Cloudy',
      humidity: 57,
      windSpeed: 4.68,
      rainProbability: 20
    },
    forecast: [
      { day: 'FRI', temp: 29, condition: 'sunny' },
      { day: 'SAT', temp: 33, condition: 'sunny' },
      { day: 'SUN', temp: 39, condition: 'sunny' },
      { day: 'MON', temp: 39, condition: 'sunny' }
    ]
  });

  // Sensor data with real-time updates
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: { value: 22, status: 'normal', sensors: 5 },
    workflow: { value: 5, status: 'warning', sensors: 3 },
    moisture: { value: 36, status: 'critical', sensors: 8 },
    windSpeed: { value: 1, status: 'normal', sensors: 2 },
    humidity: { value: 1, status: 'normal', sensors: 4 },
    smoke: { value: 38, status: 'critical', sensors: 6 }
  });

  // Detector data
  const [detectorData] = useState<DetectorData>({
    moisture: 56,
    waterConsumption: {
      current: 2340,
      previous: 2810
    }
  });

  // AI Recommendations
  const [aiRecommendations] = useState<AIRecommendation[]>([
    {
      id: '1',
      type: 'irrigation',
      title: 'Optimize Irrigation',
      description: 'Reduce water usage by 15% while maintaining optimal moisture levels',
      priority: 'high',
      confidence: 94,
      icon: '💧',
      color: '#3B82F6'
    },
    {
      id: '2',
      type: 'fertilization',
      title: 'Nutrient Adjustment',
      description: 'Increase nitrogen levels in Zone B for enhanced growth',
      priority: 'medium',
      confidence: 87,
      icon: '🌱',
      color: '#10B981'
    },
    {
      id: '3',
      type: 'pest_control',
      title: 'Pest Prevention',
      description: 'Apply preventive measures in Row 3-5 based on humidity patterns',
      priority: 'medium',
      confidence: 79,
      icon: '🛡️',
      color: '#F59E0B'
    },
    {
      id: '4',
      type: 'climate',
      title: 'Temperature Control',
      description: 'Adjust ventilation system during peak hours to optimize VPD',
      priority: 'high',
      confidence: 91,
      icon: '🌡️',
      color: '#EF4444'
    },
    {
      id: '5',
      type: 'harvest',
      title: 'Harvest Timing',
      description: 'Optimal harvest window predicted for next week',
      priority: 'low',
      confidence: 83,
      icon: '🍅',
      color: '#8B5CF6'
    }
  ]);

  // Crop yield data for pie chart
  const yieldData = [
    { name: 'Tomatoes', value: 44.3, fill: '#EF4444' },
    { name: 'Lettuce', value: 28.4, fill: '#10B981' },
    { name: 'Peppers', value: 27.3, fill: '#F59E0B' }
  ];

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => ({
        temperature: {
          ...prev.temperature,
          value: Math.max(18, Math.min(28, prev.temperature.value + (Math.random() - 0.5) * 2)),
          status: Math.random() > 0.8 ? 'warning' : 'normal'
        },
        workflow: {
          ...prev.workflow,
          value: Math.max(1, Math.min(10, prev.workflow.value + (Math.random() - 0.5))),
          status: Math.random() > 0.7 ? 'warning' : 'normal'
        },
        moisture: {
          ...prev.moisture,
          value: Math.max(20, Math.min(80, prev.moisture.value + (Math.random() - 0.5) * 5)),
          status: prev.moisture.value < 40 ? 'critical' : prev.moisture.value < 60 ? 'warning' : 'normal'
        },
        windSpeed: {
          ...prev.windSpeed,
          value: Math.max(0, Math.min(5, prev.windSpeed.value + (Math.random() - 0.5))),
          status: 'normal'
        },
        humidity: {
          ...prev.humidity,
          value: Math.max(0, Math.min(5, prev.humidity.value + (Math.random() - 0.5))),
          status: 'normal'
        },
        smoke: {
          ...prev.smoke,
          value: Math.max(10, Math.min(80, prev.smoke.value + (Math.random() - 0.5) * 3)),
          status: prev.smoke.value < 30 ? 'normal' : prev.smoke.value < 50 ? 'warning' : 'critical'
        }
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'from-green-500 to-emerald-600';
      case 'warning': return 'from-yellow-500 to-orange-600';
      case 'critical': return 'from-red-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getSensorStatusBg = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'partly cloudy': return '⛅';
      case 'rainy': return '🌧️';
      default: return '☀️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">

          {/* Left Column - Farm Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1 space-y-6"
          >
            {/* Farm Details Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Farm Details
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-xs text-gray-500 font-medium">Farm Name</p>
                  <p className="text-sm font-bold text-gray-800">{farmDetails.farmName}</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-xs text-gray-500 font-medium">Farm ID</p>
                  <p className="text-sm font-bold text-gray-800">{farmDetails.farmId}</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="text-sm font-bold text-gray-800">{farmDetails.location}</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <p className="text-xs text-gray-500 font-medium">Land Area</p>
                  <p className="text-sm font-bold text-gray-800">{farmDetails.landArea} m²</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-xs text-gray-500 font-medium">Number of crops grown</p>
                  <p className="text-sm font-bold text-gray-800">{farmDetails.cropsGrown}</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <p className="text-xs text-gray-500 font-medium">Previous Crop yield</p>
                  <p className="text-sm font-bold text-gray-800">{farmDetails.previousYield} kg/m²</p>
                </div>
              </div>
            </div>

            {/* Moisture Detector Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Moisture Detector</h3>
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Moisture Level Circle */}
              <div className="relative mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { value: detectorData.moisture, fill: '#3B82F6' },
                        { value: 100 - detectorData.moisture, fill: '#E5E7EB' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={450}
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{detectorData.moisture}%</div>
                    <div className="text-sm text-gray-600">Moisture</div>
                  </div>
                </div>
              </div>

              {/* Water Consumption */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Water Consumed (Previous vs Current)</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Previous</span>
                  <span className="font-bold text-gray-800">{detectorData.waterConsumption.previous} liters</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current</span>
                  <span className="font-bold text-green-600">{detectorData.waterConsumption.current} liters</span>
                </div>
                <div className="mt-2 p-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700 text-center">
                    Saved: {detectorData.waterConsumption.previous - detectorData.waterConsumption.current} liters
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Middle Column - Weather and Sensors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-2 space-y-6"
          >
            {/* Weather Card */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl p-6 text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Today's Weather</h3>
                  <p className="text-blue-100 text-sm">{weatherData.today.condition}</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-light">{weatherData.today.temp}°</div>
                  <div className="flex items-center mt-2 text-blue-100">
                    <span className="text-2xl mr-2">{getWeatherIcon(weatherData.today.condition)}</span>
                  </div>
                </div>
              </div>

              {/* Weather Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-100 mb-1">Humidity</p>
                  <p className="text-lg font-bold">{weatherData.today.humidity}%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-100 mb-1">Wind Speed</p>
                  <p className="text-lg font-bold">{weatherData.today.windSpeed} m/s</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-100 mb-1">Rain Probability</p>
                  <p className="text-lg font-bold">{weatherData.today.rainProbability}%</p>
                </div>
              </div>

              {/* Forecast */}
              <div className="grid grid-cols-4 gap-2">
                {weatherData.forecast.map((day, index) => (
                  <div key={index} className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
                    <p className="text-xs text-blue-100 mb-1">{day.day}</p>
                    <div className="text-lg mb-1">{getWeatherIcon(day.condition)}</div>
                    <p className="font-bold text-sm">{day.temp}°</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sensor Grid */}
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(sensorData).map(([key, sensor]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  className={`relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300 ${getSensorStatusBg(sensor.status)}`}
                >
                  <div className="p-4">
                    {/* Status Indicator */}
                    <div className="absolute top-2 right-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getSensorStatusColor(sensor.status)} shadow-lg`}></div>
                    </div>

                    {/* Sensor Count Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-white/80 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        {sensor.sensors}
                      </span>
                    </div>

                    {/* Value */}
                    <div className="text-center mt-4">
                      <div className={`text-4xl font-bold bg-gradient-to-r ${getSensorStatusColor(sensor.status)} bg-clip-text text-transparent`}>
                        {sensor.value}
                      </div>
                      <p className="text-sm font-medium text-gray-700 capitalize mt-2">
                        {key.replace(/([A-Z])/g, ' $1')} sensor
                      </p>
                    </div>

                    {/* Animated Background Element */}
                    <div className={`absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-r ${getSensorStatusColor(sensor.status)} opacity-10 rounded-full`}></div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Farm Map */}
            <div className="h-96">
              <FarmMap className="h-full" />
            </div>

            {/* Crop Yield Pie Chart */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Crop Yield Distribution</h3>
              <div className="flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={yieldData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {yieldData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-3">
                  {yieldData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3 shadow-sm"
                        style={{ backgroundColor: item.fill }}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{item.name}</p>
                        <p className="text-lg font-bold text-gray-800">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">AI Recommendations</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Smart Analytics
                </div>
              </div>

              <div className="space-y-4">
                {aiRecommendations.map((recommendation) => (
                  <motion.div
                    key={recommendation.id}
                    whileHover={{ scale: 1.02 }}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${getPriorityColor(recommendation.priority)}`}
                  >
                    {/* Priority Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        recommendation.priority === 'high' ? 'bg-red-500 text-white' :
                        recommendation.priority === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {recommendation.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="pr-16">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">{recommendation.icon}</span>
                        <h4 className="font-bold text-gray-800 text-sm">{recommendation.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">
                        {recommendation.description}
                      </p>

                      {/* Confidence Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Confidence</span>
                          <span>{recommendation.confidence}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${recommendation.confidence}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        className="w-full mt-3 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        Apply Recommendation
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Insights Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">🤖</span>
                  <h4 className="font-bold text-gray-800 text-sm">AI System Status</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="text-center">
                    <p className="text-gray-600">Models Active</p>
                    <p className="font-bold text-blue-600">7/8</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Accuracy</p>
                    <p className="font-bold text-green-600">94.2%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Data Points</p>
                    <p className="font-bold text-purple-600">2.1M</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Predictions</p>
                    <p className="font-bold text-orange-600">Real-time</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ResearcherDashboard;