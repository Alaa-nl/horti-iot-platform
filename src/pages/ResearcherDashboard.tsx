import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import Layout from '../components/layout/Layout';
import RealMap from '../components/common/RealMap';
import { motion } from 'framer-motion';
// Use KNMI weather service for Netherlands-specific data
import { fetchKNMIWeatherByCoordinates, KNMIWeatherData } from '../services/knmiWeatherService';
import { greenhouseService } from '../services/greenhouseService';
import { Greenhouse, GREENHOUSES } from '../types/greenhouse';
import GreenhouseSelector from '../components/greenhouse/GreenhouseSelector';

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


const ResearcherDashboard: React.FC = () => {
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
  const [detectorData, setDetectorData] = useState<DetectorData>({
    moisture: 56,
    waterConsumption: {
      current: 2340,
      previous: 2810
    }
  });


  // Crop yield data for pie chart (dynamically calculated)
  const [yieldData, setYieldData] = useState<Array<{name: string, value: number, fill: string}>>([]);

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

      // Update sensor data from greenhouse
      const sensorStatus = (value: number, optimal: {min: number, max: number}) => {
        if (value < optimal.min || value > optimal.max) return 'critical' as const;
        if (value < optimal.min + 5 || value > optimal.max - 5) return 'warning' as const;
        return 'normal' as const;
      };

      setSensorData({
        temperature: {
          value: selectedGreenhouse.sensors.temperature,
          status: sensorStatus(selectedGreenhouse.sensors.temperature, {min: 20, max: 26}),
          sensors: 5
        },
        workflow: {
          value: 5,
          status: 'normal',
          sensors: 3
        },
        moisture: {
          value: selectedGreenhouse.sensors.moisture,
          status: sensorStatus(selectedGreenhouse.sensors.moisture, {min: 35, max: 55}),
          sensors: 8
        },
        windSpeed: {
          value: 2,
          status: 'normal',
          sensors: 2
        },
        humidity: {
          value: selectedGreenhouse.sensors.humidity,
          status: sensorStatus(selectedGreenhouse.sensors.humidity, {min: 50, max: 70}),
          sensors: 4
        },
        smoke: {
          value: selectedGreenhouse.sensors.co2 > 1000 ? 60 : 30,
          status: selectedGreenhouse.sensors.co2 > 1000 ? 'warning' : 'normal',
          sensors: 6
        }
      });

      // Update detector data
      setDetectorData({
        moisture: selectedGreenhouse.sensors.moisture,
        waterConsumption: {
          current: selectedGreenhouse.performance.waterUsage,
          previous: Math.round(selectedGreenhouse.performance.waterUsage * 1.2)
        }
      });

      // Calculate crop yield distribution
      const totalArea = selectedGreenhouse.crops.reduce((sum, crop) => sum + crop.area, 0);
      const cropColors: {[key: string]: string} = {
        'Tomatoes': '#EF4444',
        'Lettuce': '#10B981',
        'Peppers': '#F59E0B',
        'Cucumbers': '#3B82F6',
        'Strawberries': '#EC4899',
        'Herbs': '#8B5CF6',
        'Eggplant': '#6366F1',
        'Zucchini': '#14B8A6',
        'Microgreens': '#84CC16',
        'Cherry Tomatoes': '#F97316',
        'Leafy Greens': '#22C55E'
      };

      const yields = selectedGreenhouse.crops.map(crop => ({
        name: crop.name,
        value: Math.round((crop.area / totalArea) * 100 * 10) / 10,
        fill: cropColors[crop.name] || '#6B7280'
      }));

      setYieldData(yields);
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
      case 'weather data unavailable': return '❌';
      case 'unavailable': return '❓';
      default: return '☀️';
    }
  };


  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">

        {/* Greenhouse Selector at the top */}
        <div className="max-w-7xl mx-auto mb-6">
          <GreenhouseSelector
            greenhouses={greenhouses}
            selectedGreenhouse={selectedGreenhouse}
            onSelect={handleGreenhouseSelect}
            loading={greenhouseLoading}
          />
        </div>

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
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl p-6 text-white relative">
              {weatherLoading && (
                <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
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
              <div className="absolute top-2 right-2 flex items-center bg-blue-400/20 backdrop-blur-sm px-2 py-1 rounded-full">
                <img src="https://cdn.knmi.nl/assets/logo-82cc91c2a3.svg" alt="KNMI" className="h-3 mr-1" />
                <span className="text-xs text-white font-medium">KNMI Data</span>
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Today's Weather</h3>
                  <p className="text-blue-100 text-sm">{weatherData.today.condition}</p>
                  <p className="text-blue-200 text-xs mt-1">
                    {selectedGreenhouse?.location.city || 'Loading...'}
                  </p>
                  {knmiStation && (
                    <p className="text-blue-200 text-xs">Station: {knmiStation}</p>
                  )}
                  {weatherData.today.sunrise && weatherData.today.sunset && (
                    <div className="mt-2 text-xs text-blue-200">
                      <span className="mr-3">☀️ {weatherData.today.sunrise}</span>
                      <span>🌙 {weatherData.today.sunset}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-5xl font-light">{weatherData.today.temp}°C</div>
                  {weatherData.today.feelsLike && (
                    <p className="text-xs text-blue-200 mt-1">Feels like {weatherData.today.feelsLike}°C</p>
                  )}
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
                  <p className="text-xs text-blue-100 mb-1">{weatherData.today.pressure ? 'Pressure' : 'Rain Chance'}</p>
                  <p className="text-lg font-bold">
                    {weatherData.today.pressure ? `${weatherData.today.pressure} hPa` : `${weatherData.today.rainProbability}%`}
                  </p>
                </div>
              </div>

              {/* Forecast */}
              <div className="grid grid-cols-4 gap-2">
                {weatherData.forecast.length > 0 ? (
                  weatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
                      <p className="text-xs text-blue-100 mb-1">{day.day}</p>
                      <div className="text-lg mb-1">{getWeatherIcon(day.condition)}</div>
                      <p className="font-bold text-sm">{day.temp}°C</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center text-blue-200 text-sm">
                    {weatherLoading ? 'Loading forecast...' : 'No forecast available'}
                  </div>
                )}
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

            {/* Real Map */}
            <div className="h-96">
              {selectedGreenhouse ? (
                <RealMap
                  center={{
                    lat: selectedGreenhouse.location.coordinates.lat,
                    lng: selectedGreenhouse.location.coordinates.lon
                  }}
                  zoom={16}
                  className="h-full"
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
                <div className="h-full bg-gray-100 rounded-3xl flex items-center justify-center">
                  <p className="text-gray-500">Select a greenhouse to view map</p>
                </div>
              )}
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

        </div>
      </div>
    </Layout>
  );
};

export default ResearcherDashboard;