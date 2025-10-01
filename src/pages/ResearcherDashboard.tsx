import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import RealMap from '../components/common/RealMap';
// Use KNMI weather service for Netherlands-specific data
import { fetchKNMIWeatherByCoordinates } from '../services/knmiWeatherService';
import { greenhouseService } from '../services/greenhouseService';
import { Greenhouse } from '../types/greenhouse';
import GreenhouseSelector from '../components/greenhouse/GreenhouseSelector';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

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
    feelsLike?: number;
    pressure?: number;
    sunrise?: string;
    sunset?: string;
  };
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
  }>;
}



interface HeadThicknessPrediction {
  current: number;
  unit: string;
  forecast: Array<{
    date: string;
    day: string;
    predicted: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  lastUpdated: string;
}

interface SapFlowPrediction {
  current: number;
  unit: string;
  predictions: Array<{
    time: string;
    predicted: number;
    actual?: number;
  }>;
  nextUpdate: number; // seconds until next update
  accuracy: number;
  lastUpdated: string;
}


const ResearcherDashboard: React.FC = () => {

  // Authentication state - get from AuthContext
  const { user, logout } = useAuth();

  // Greenhouse state
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse | null>(null);
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [greenhouseLoading, setGreenhouseLoading] = useState(true);

  // Dynamic farm details based on selected greenhouse
  const [farmDetails, setFarmDetails] = useState<FarmDetails>({
    farmName: 'Loading...',
    farmId: '',
    location: '',
    landArea: 0,
    cropsGrown: 0,
    previousYield: 0
  });

  // Weather data
  const [weatherData, setWeatherData] = useState<WeatherData>({
    today: {
      temp: 22,
      condition: 'Loading...',
      humidity: 0,
      windSpeed: 0,
      rainProbability: 0
    },
    forecast: []
  });
  const [knmiStation, setKnmiStation] = useState<string>('');
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Detector data state
  const [detectorData, setDetectorData] = useState<any>({
    moisture: 0,
    waterConsumption: {
      current: 0,
      previous: 0
    }
  });

  // Yield data state
  const [yieldData, setYieldData] = useState<any[]>([]);

  // ML Predictions State
  const [headThickness, setHeadThickness] = useState<HeadThicknessPrediction>({
    current: 12.5,
    unit: 'cm',
    forecast: [
      { date: '2025-09-23', day: 'Tomorrow', predicted: 13.2, confidence: 92, trend: 'up' },
      { date: '2025-09-24', day: 'Thu', predicted: 14.1, confidence: 87, trend: 'up' },
      { date: '2025-09-25', day: 'Fri', predicted: 14.8, confidence: 82, trend: 'stable' }
    ],
    lastUpdated: new Date().toLocaleTimeString()
  });

  const [sapFlow, setSapFlow] = useState<SapFlowPrediction>({
    current: 45.2,
    unit: 'g/h',
    predictions: [],
    nextUpdate: 300,
    accuracy: 94.5,
    lastUpdated: new Date().toLocaleTimeString()
  });


  // Initialize sap flow predictions
  useEffect(() => {
    // Generate initial 30-minute predictions
    const now = new Date();
    const predictions: Array<{time: string; predicted: number; actual?: number}> = [];
    for (let i = 0; i < 30; i++) {
      const time = new Date(now.getTime() + i * 60000);
      const base = 45 + Math.sin(i / 5) * 10;
      predictions.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        predicted: Math.round((base + Math.random() * 5) * 10) / 10,
        actual: i < 10 ? Math.round((base + Math.random() * 3) * 10) / 10 : undefined
      });
    }
    setSapFlow(prev => ({ ...prev, predictions }));

    // Update sap flow every 5 seconds for demo (would be 5 minutes in production)
    const sapFlowInterval = setInterval(() => {
      setSapFlow(prev => {
        const now = new Date();
        const newPredictions = [...prev.predictions.slice(1)];
        const lastValue = newPredictions[newPredictions.length - 1]?.predicted || 45;
        newPredictions.push({
          time: new Date(now.getTime() + 29 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          predicted: Math.round((lastValue + (Math.random() - 0.5) * 3) * 10) / 10
        });

        // Update actuals
        const updatedPredictions = newPredictions.map((pred, idx) => {
          if (idx < 10 && !pred.actual) {
            return {
              ...pred,
              actual: Math.round((pred.predicted + (Math.random() - 0.5) * 2) * 10) / 10
            };
          }
          return pred;
        });

        return {
          ...prev,
          current: updatedPredictions[0]?.actual || updatedPredictions[0]?.predicted || 45,
          predictions: updatedPredictions,
          lastUpdated: new Date().toLocaleTimeString(),
          nextUpdate: 300
        };
      });
    }, 5000);

    // Update head thickness daily (simulated with faster interval for demo)
    const headThicknessInterval = setInterval(() => {
      setHeadThickness(prev => ({
        ...prev,
        current: Math.round((prev.current + (Math.random() - 0.3) * 0.5) * 10) / 10,
        lastUpdated: new Date().toLocaleTimeString()
      }));
    }, 30000);

    return () => {
      clearInterval(sapFlowInterval);
      clearInterval(headThicknessInterval);
    };
  }, []);

  // Initialize greenhouses on mount
  useEffect(() => {
    const initializeGreenhouses = async () => {
      setGreenhouseLoading(true);
      try {
        const allGreenhouses = await greenhouseService.getAllGreenhouses();
        setGreenhouses(allGreenhouses);

        // Load saved greenhouse or default to first
        const savedGreenhouse = await greenhouseService.loadSavedGreenhouse();
        if (savedGreenhouse) {
          setSelectedGreenhouse(savedGreenhouse);
        }
      } catch (error) {
        console.error('Error loading greenhouses:', error);
        // Log error if database operation fails
        console.error('Database connection required for greenhouse operations');
      } finally {
        setGreenhouseLoading(false);
      }
    };

    initializeGreenhouses();
  }, []);

  // Handle greenhouse selection
  const handleGreenhouseSelect = async (greenhouse: Greenhouse) => {
    setGreenhouseLoading(true);
    setSelectedGreenhouse(greenhouse);
    greenhouseService.saveGreenhouseSelection(greenhouse.id);

    // Fetch fresh data for selected greenhouse
    try {
      const freshData = await greenhouseService.getGreenhouseById(greenhouse.id);
      if (freshData) {
        setSelectedGreenhouse(freshData);
      }
    } catch (error) {
      console.error('Error fetching greenhouse data:', error);
    } finally {
      setGreenhouseLoading(false);
    }
  };

  // Update farm details when greenhouse changes
  useEffect(() => {
    if (selectedGreenhouse) {
      setFarmDetails({
        farmName: selectedGreenhouse.name,
        farmId: selectedGreenhouse.id,
        location: `${selectedGreenhouse.location.city}, ${selectedGreenhouse.location.region}`,
        landArea: selectedGreenhouse.details.landArea,
        cropsGrown: selectedGreenhouse.crops.length,
        previousYield: selectedGreenhouse.performance.previousYield
      });


    }
  }, [selectedGreenhouse]);

  // Fetch weather data based on selected greenhouse
  useEffect(() => {
    if (!selectedGreenhouse) return;

    const loadWeatherData = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        // Use greenhouse coordinates for weather
        const knmiData = await fetchKNMIWeatherByCoordinates(
          selectedGreenhouse.location.coordinates.lat,
          selectedGreenhouse.location.coordinates.lon,
          selectedGreenhouse.location.city
        );

        // Convert KNMI data to component format
        setWeatherData({
          today: {
            temp: knmiData.today.temp,
            condition: knmiData.today.condition,
            humidity: knmiData.today.humidity,
            windSpeed: knmiData.today.windSpeed,
            rainProbability: knmiData.today.rainProbability,
            feelsLike: knmiData.today.feelsLike,
            pressure: knmiData.today.pressure,
            sunrise: knmiData.today.sunrise,
            sunset: knmiData.today.sunset
          },
          forecast: knmiData.forecast.map(day => ({
            day: day.day,
            temp: day.temp,
            condition: day.condition.toLowerCase()
          }))
        });

        if (knmiData.station) {
          setKnmiStation(`${knmiData.station.name}`);
        }
      } catch (error) {
        setWeatherError('Failed to fetch weather data');
        console.error('Weather fetch error:', error);
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeatherData();
    // Refresh weather data every 10 minutes
    const weatherInterval = setInterval(loadWeatherData, 10 * 60 * 1000);

    return () => clearInterval(weatherInterval);
  }, [selectedGreenhouse]);



  // Handle logout using AuthContext
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };



  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'partly cloudy': return '⛅';
      case 'rainy': return '🌧️';
      case 'weather data unavailable': return '❌';
      case 'unavailable': return '❓';
      default: return '☀️';
    }
  };



  const greenhouseContent = (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Greenhouse Information</h3>
      <div className="space-y-3">
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <p className="text-xs text-gray-500 font-medium mb-1">Selected Greenhouse:</p>
          <p className="text-sm font-bold text-gray-800">
            {selectedGreenhouse ? selectedGreenhouse.name : 'No greenhouse selected'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1">Location:</p>
          <p className="text-sm font-bold text-gray-800">
            {selectedGreenhouse ? `${selectedGreenhouse.location.city}, ${selectedGreenhouse.location.region}` : 'No greenhouse selected'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1">Farm ID:</p>
          <p className="text-sm font-bold text-gray-800">
            {selectedGreenhouse ? selectedGreenhouse.id : 'N/A'}
          </p>
        </div>
        {selectedGreenhouse && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-gray-500 font-medium mb-1">Land Area:</p>
            <p className="text-sm font-bold text-gray-800">{farmDetails.landArea} m²</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout sidebarContent={greenhouseContent}>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">

        {/* Top Section - Greenhouse Selector with Farm Details and Weather */}
        <div className="max-w-full mx-auto mb-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Greenhouse Selector merged with Farm Details */}
            <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 hover:shadow-2xl transition-all duration-300 hover:border-emerald-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-3 h-3 bg-emerald-500 rounded-full mr-3 animate-pulse"></span>
                🏡 Greenhouse Control Panel
              </h2>

              {/* Greenhouse Selector */}
              <div className="mb-6">
                <GreenhouseSelector
                  greenhouses={greenhouses}
                  selectedGreenhouse={selectedGreenhouse}
                  onSelect={handleGreenhouseSelect}
                  loading={greenhouseLoading}
                />
              </div>

              {/* Farm Details Grid */}
              {selectedGreenhouse && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 hover:bg-emerald-100 transition-colors duration-200">
                    <p className="text-xs text-gray-500 font-medium">Farm ID</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{farmDetails.farmId}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Location</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{farmDetails.location}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Land Area</p>
                    <p className="text-sm font-bold text-gray-800">{farmDetails.landArea} m²</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Crops</p>
                    <p className="text-sm font-bold text-gray-800">{farmDetails.cropsGrown} types</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Previous Yield</p>
                    <p className="text-sm font-bold text-gray-800">{farmDetails.previousYield} kg/m²</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Weather Card */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl shadow-xl p-4 text-white relative overflow-hidden hover:shadow-2xl transition-all duration-300 backdrop-blur-sm h-[500px] flex flex-col">
              {weatherLoading && (
                <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Loading weather...</p>
                  </div>
                </div>
              )}
              {weatherError && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  ⚠️ Using fallback data
                </div>
              )}

              <div className="flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Today's Weather</h3>
                    <p className="text-white/80 text-base">{weatherData.today.condition}</p>
                    <p className="text-white/70 text-sm mt-1">
                      {selectedGreenhouse?.location.city || 'Loading...'}
                    </p>
                    {knmiStation && (
                      <p className="text-white/70 text-xs mt-1">Station: {knmiStation}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-light">{weatherData.today.temp}°C</div>
                    {weatherData.today.feelsLike && (
                      <p className="text-sm text-white/70 mt-1">Feels like {weatherData.today.feelsLike}°C</p>
                    )}
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-5xl">{getWeatherIcon(weatherData.today.condition)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/30 transition-colors duration-200 border border-white/10">
                  <p className="text-sm text-white/70 mb-1">💧 Humidity</p>
                  <p className="text-xl font-bold">{weatherData.today.humidity}%</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/30 transition-colors duration-200 border border-white/10">
                  <p className="text-sm text-white/70 mb-1">💨 Wind</p>
                  <p className="text-xl font-bold">{weatherData.today.windSpeed} m/s</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/30 transition-colors duration-200 border border-white/10">
                  <p className="text-sm text-white/70 mb-1">{weatherData.today.pressure ? '🌡️ Pressure' : '🌧️ Rain'}</p>
                  <p className="text-xl font-bold">
                    {weatherData.today.pressure ? `${weatherData.today.pressure} hPa` : `${weatherData.today.rainProbability}%`}
                  </p>
                </div>
              </div>

              {/* Forecast */}
              <div className="grid grid-cols-4 gap-3 flex-grow">
                {weatherData.forecast.length > 0 ? (
                  weatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/20 transition-colors flex flex-col justify-center">
                      <p className="text-sm text-white/70 mb-2">{day.day}</p>
                      <div className="text-3xl mb-2">{getWeatherIcon(day.condition)}</div>
                      <p className="font-bold text-base">{day.temp}°C</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center text-white/70 text-sm flex items-center justify-center">
                    {weatherLoading ? 'Loading forecast...' : 'No forecast available'}
                  </div>
                )}
              </div>

              {weatherData.today.sunrise && weatherData.today.sunset && (
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-center gap-6 text-sm text-white/80 flex-shrink-0">
                  <span className="bg-white/10 px-3 py-1.5 rounded-full">☀️ {weatherData.today.sunrise}</span>
                  <span className="bg-white/10 px-3 py-1.5 rounded-full">🌙 {weatherData.today.sunset}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Horizontal Layout - 12 Column Grid System */}
        <div className="max-w-full mx-auto px-4">
          {/* Main Content Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* ML Predictions and Map Section - Full width */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Head Thickness Prediction Panel */}
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Head Thickness</h3>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                      AI Prediction
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">89% accuracy</p>
                </div>

                {/* Current Value Display */}
                <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Measurement</p>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-emerald-700">{headThickness.current}</span>
                        <span className="text-sm text-emerald-600 ml-1">{headThickness.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-xs font-medium text-gray-700">{headThickness.lastUpdated}</p>
                    </div>
                  </div>
                </div>

                {/* 3-Day Forecast Chart */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">3-Day Forecast</h4>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={headThickness.forecast}>
                      <defs>
                        <linearGradient id="headThicknessGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#headThicknessGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Daily Predictions */}
                <div className="space-y-2">
                  {headThickness.forecast.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-2 h-8 rounded-full mr-3 ${
                          day.trend === 'up' ? 'bg-green-500' :
                          day.trend === 'down' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{day.day}</p>
                          <p className="text-xs text-gray-500">{day.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">{day.predicted} {headThickness.unit}</p>
                        <p className="text-xs text-gray-500">Confidence: {day.confidence}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sap Flow Prediction Panel */}
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Sap Flow</h3>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Real-Time
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Updates every 5 minutes</p>
                </div>

                {/* Current Value and Stats */}
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Flow Rate</p>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-green-700">{sapFlow.current}</span>
                        <span className="text-lg text-green-600 ml-2">{sapFlow.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Model Accuracy</p>
                      <div className="flex items-center justify-end">
                        <span className="text-2xl font-bold text-green-700">{sapFlow.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Last Updated: {sapFlow.lastUpdated}</span>
                      <span className="text-gray-600">Next Update: {Math.floor(sapFlow.nextUpdate / 60)}m {sapFlow.nextUpdate % 60}s</span>
                    </div>
                  </div>
                </div>

                {/* 30-Minute Forecast Timeline */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">30-Minute Forecast</h4>
                  <div className="overflow-x-auto">
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={sapFlow.predictions.slice(0, 30)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 10 }}
                          stroke="#6B7280"
                          interval={4}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="#6B7280"
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                          labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={false}
                          name="Predicted"
                        />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Actual"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Legend and Stats */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <div className="w-3 h-0.5 bg-green-500 mr-2"></div>
                      <span className="text-xs text-gray-600">Predicted</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-0.5 bg-blue-500 mr-2" style={{ borderTop: '2px dashed' }}></div>
                      <span className="text-xs text-gray-600">Actual</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Scroll for more →
                  </div>
                </div>
              </div>

              {/* Greenhouse Location Map Panel */}
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Greenhouse Location</h3>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    Live Map
                  </div>
                </div>
                <div className="h-96">
                  {selectedGreenhouse ? (
                    <RealMap
                      center={{
                        lat: selectedGreenhouse.location.coordinates.lat,
                        lng: selectedGreenhouse.location.coordinates.lon
                      }}
                      zoom={16}
                      className="h-full rounded-lg"
                      markers={[
                        {
                          id: selectedGreenhouse.id,
                          lat: selectedGreenhouse.location.coordinates.lat,
                          lng: selectedGreenhouse.location.coordinates.lon,
                          title: selectedGreenhouse.name,
                          type: 'greenhouse',
                          status: 'active',
                          description: `${selectedGreenhouse.details.landArea}m² ${selectedGreenhouse.details.type} greenhouse with ${selectedGreenhouse.crops.length} crop types.`
                        }
                      ]}
                    />
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Select a greenhouse to view map</p>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">📍 {selectedGreenhouse?.location.city || 'N/A'}</span>
                    <span className="text-gray-600">🌱 {selectedGreenhouse?.crops.length || 0} crops</span>
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