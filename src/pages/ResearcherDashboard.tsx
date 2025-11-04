import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import RealMap from '../components/common/RealMap';
// Use KNMI weather service for Netherlands-specific data
import { fetchKNMIWeatherByCoordinates } from '../services/knmiWeatherService';
import { greenhouseService } from '../services/greenhouseService';
import { Greenhouse } from '../types/greenhouse';
import GreenhouseSelector from '../components/greenhouse/GreenhouseSelector';
import { useAuth } from '../contexts/AuthContext';
import PhytoSenseOptimized from '../components/phytosense/PhytoSenseOptimized';
import SapFlowCard from '../components/phytosense/SapFlowCard';
import DiameterCard from '../components/phytosense/DiameterCard';

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

// Removed SapFlowData interface - now handled by separate card components


const ResearcherDashboard: React.FC = () => {

  // Authentication state - get from AuthContext
  const { logout } = useAuth();

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
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Removed detector and yield data states - not currently used

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

  // Removed sap flow state - now handled by separate SapFlowCard and DiameterCard components


  // Removed fetchSapFlowData - now handled by separate SapFlowCard and DiameterCard components

  // Update head thickness daily (simulated with faster interval for demo)
  useEffect(() => {
    const headThicknessInterval = setInterval(() => {
      setHeadThickness(prev => ({
        ...prev,
        current: Math.round((prev.current + (Math.random() - 0.3) * 0.5) * 10) / 10,
        lastUpdated: new Date().toLocaleTimeString()
      }));
    }, 30000);

    return () => clearInterval(headThicknessInterval);
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
        farmId: selectedGreenhouse.farmCode || selectedGreenhouse.id, // Use simple farm code if available
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



  // Logout is handled directly via AuthContext when needed



  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();

    // Clear conditions
    if (conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('mainly clear')) return '🌤️';

    // Cloudy conditions
    if (conditionLower.includes('partly cloudy')) return '⛅';
    if (conditionLower.includes('overcast')) return '☁️';

    // Fog
    if (conditionLower.includes('fog')) return '🌫️';

    // Rain conditions
    if (conditionLower.includes('drizzle')) return '🌦️';
    if (conditionLower.includes('rain showers')) return '🌧️';
    if (conditionLower.includes('rain')) return '🌧️';

    // Snow conditions
    if (conditionLower.includes('snow')) return '❄️';

    // Thunderstorm
    if (conditionLower.includes('thunderstorm')) return '⛈️';
    if (conditionLower.includes('hail')) return '⛈️';

    // Error states
    if (conditionLower.includes('unavailable')) return '❌';
    if (conditionLower.includes('unknown')) return '❓';

    return '☀️';
  };



  const greenhouseContent = (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Greenhouse Information</h3>
      <div className="space-y-3">
        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Selected Greenhouse:</p>
          <p className="text-sm font-bold text-foreground">
            {selectedGreenhouse ? selectedGreenhouse.name : 'No greenhouse selected'}
          </p>
        </div>
        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Location:</p>
          <p className="text-sm font-bold text-foreground">
            {selectedGreenhouse ? `${selectedGreenhouse.location.city}, ${selectedGreenhouse.location.region}` : 'No greenhouse selected'}
          </p>
        </div>
        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Farm ID:</p>
          <p className="text-sm font-bold text-foreground">
            {selectedGreenhouse ? (selectedGreenhouse.farmCode || 'N/A') : 'N/A'}
          </p>
        </div>
        {selectedGreenhouse && (
          <div className="bg-card rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground font-medium mb-1">Land Area:</p>
            <p className="text-sm font-bold text-foreground">{farmDetails.landArea} m²</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout sidebarContent={greenhouseContent}>
      <div className="min-h-screen bg-background p-6">

        {/* Top Section - Greenhouse Selector with Farm Details and Weather */}
        <div className="max-w-full mx-auto mb-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Greenhouse Selector merged with Farm Details */}
            <div className="card-elevated p-8 lg:col-span-2">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <span className="w-3 h-3 bg-primary rounded-full mr-3 animate-pulse-soft shadow-glow-green"></span>
                <span className="text-2xl mr-2">🏡</span>
                Greenhouse Control Panel
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">🆔 Farm ID</p>
                    <p className="text-sm font-bold text-foreground truncate">{selectedGreenhouse?.farmCode || farmDetails.farmId}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">📍 Location</p>
                    <p className="text-sm font-bold text-foreground truncate">{selectedGreenhouse.location.city}, {selectedGreenhouse.location.region}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">📏 Area (m²)</p>
                    <p className="text-sm font-bold text-foreground">{selectedGreenhouse.details.landArea}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">🌱 Crop Type</p>
                    <p className="text-sm font-bold text-foreground capitalize">{selectedGreenhouse.cropType || 'N/A'}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">🍅 Variety</p>
                    <p className="text-sm font-bold text-foreground truncate">{selectedGreenhouse.variety || 'N/A'}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">📦 Supplier</p>
                    <p className="text-sm font-bold text-foreground truncate">{selectedGreenhouse.supplier || 'N/A'}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">🌡️ Climate System</p>
                    <p className="text-sm font-bold text-foreground truncate">{selectedGreenhouse.climateSystem || 'N/A'}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">💡 Lighting System</p>
                    <p className="text-sm font-bold text-foreground truncate">{selectedGreenhouse.lightingSystem || 'N/A'}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">💨 CO2 Target (ppm)</p>
                    <p className="text-sm font-bold text-foreground">{selectedGreenhouse.co2TargetPpm || 'N/A'}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border hover:shadow-soft transition-all duration-200">
                    <p className="text-xs text-muted-foreground font-medium mb-1">🌡️ Temperature Range (°C)</p>
                    <p className="text-sm font-bold text-foreground">{selectedGreenhouse.temperatureRangeC || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Weather Card */}
            <div className="bg-gradient-to-br from-horti-blue-600 via-horti-blue-700 to-horti-blue-800 rounded-3xl shadow-strong p-4 text-white relative overflow-hidden hover:shadow-[0_20px_60px_0_rgba(37,99,235,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col border border-horti-blue-500/20 h-fit">
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
                    <h3 className="text-lg font-bold mb-1">Today's Weather</h3>
                    <p className="text-white/80 text-base">{weatherData.today.condition}</p>
                    <p className="text-white/70 text-base mt-1">
                      {selectedGreenhouse?.location.city || 'Loading...'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-light">{weatherData.today.temp}°C</div>
                    {weatherData.today.feelsLike && (
                      <p className="text-base text-white/70 mt-1">Feels like {weatherData.today.feelsLike}°C</p>
                    )}
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-4xl">{getWeatherIcon(weatherData.today.condition)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 flex-shrink-0">
                <div className="bg-primary/20 backdrop-blur-md rounded-lg p-4 text-center hover:bg-primary/30 hover:scale-105 transition-all duration-200 border border-primary/30 shadow-soft">
                  <p className="text-base text-white/80 mb-1">💧 Humidity</p>
                  <p className="text-xl font-bold">{weatherData.today.humidity}%</p>
                </div>
                <div className="bg-primary/20 backdrop-blur-md rounded-lg p-4 text-center hover:bg-primary/30 hover:scale-105 transition-all duration-200 border border-primary/30 shadow-soft">
                  <p className="text-base text-white/80 mb-1">💨 Wind</p>
                  <p className="text-xl font-bold">{weatherData.today.windSpeed} m/s</p>
                </div>
                <div className="bg-primary/20 backdrop-blur-md rounded-lg p-4 text-center hover:bg-primary/30 hover:scale-105 transition-all duration-200 border border-primary/30 shadow-soft">
                  <p className="text-base text-white/80 mb-1">{weatherData.today.pressure ? '🌡️ Pressure' : '🌧️ Rain'}</p>
                  <p className="text-xl font-bold">
                    {weatherData.today.pressure ? `${weatherData.today.pressure} hPa` : `${weatherData.today.rainProbability}%`}
                  </p>
                </div>
              </div>

              {/* Forecast */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {weatherData.forecast.length > 0 ? (
                  weatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center p-3 bg-primary/20 backdrop-blur-md rounded-lg border border-primary/30 hover:bg-primary/30 hover:scale-105 transition-all duration-200 flex flex-col justify-center shadow-soft">
                      <p className="text-base text-white/80 mb-1 font-medium">{day.day}</p>
                      <div className="text-3xl mb-1">{getWeatherIcon(day.condition)}</div>
                      <p className="font-bold text-base">{day.temp}°C</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center text-white/70 text-base flex items-center justify-center">
                    {weatherLoading ? 'Loading forecast...' : 'No forecast available'}
                  </div>
                )}
              </div>

              {weatherData.today.sunrise && weatherData.today.sunset && (
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-center gap-4 text-base text-white/80 flex-shrink-0">
                  <span className="bg-primary/20 px-3 py-1.5 rounded-full">☀️ {weatherData.today.sunrise}</span>
                  <span className="bg-primary/20 px-3 py-1.5 rounded-full">🌙 {weatherData.today.sunset}</span>
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
            {/* ML Predictions and Plant Monitoring Section - Full width */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Head Thickness Prediction Panel */}
              <div className="card-elevated p-6 hover:-translate-y-2">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-foreground">Head Thickness</h3>
                    <div className="badge-success">
                      🤖 AI Prediction
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">89% accuracy</p>
                </div>

                {/* Current Value Display */}
                <div className="bg-primary/10 rounded-xl p-4 mb-4 border border-primary/30">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Current Measurement</p>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-primary">{headThickness.current}</span>
                        <span className="text-base text-primary ml-2 font-semibold">{headThickness.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-medium">Last Updated</p>
                      <p className="text-xs font-semibold text-foreground">{headThickness.lastUpdated}</p>
                    </div>
                  </div>
                </div>

                {/* 3-Day Forecast Chart */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">3-Day Forecast</h4>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={headThickness.forecast}>
                      <defs>
                        <linearGradient id="headThicknessGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#headThicknessGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Daily Predictions */}
                <div className="space-y-2">
                  {headThickness.forecast.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-secondary hover:shadow-soft transition-all duration-200 border">
                      <div className="flex items-center">
                        <div className={`w-2 h-10 rounded-full mr-3 ${
                          day.trend === 'up' ? 'bg-primary shadow-glow-green' :
                          day.trend === 'down' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{day.day}</p>
                          <p className="text-xs text-muted-foreground">{day.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{day.predicted} {headThickness.unit}</p>
                        <p className="text-xs text-muted-foreground font-medium">Confidence: {day.confidence}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sap Flow Card */}
              <SapFlowCard />

              {/* Diameter Card */}
              <DiameterCard />

              {/* Greenhouse Location Map Panel */}
              <div className="card-elevated p-6 hover:-translate-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Greenhouse Location</h3>
                  <div className="badge-info">
                    🗺️ Live Map
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
                      className="h-full rounded-xl overflow-hidden border shadow-soft"
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
                    <div className="h-full bg-secondary rounded-xl flex items-center justify-center border">
                      <p className="text-muted-foreground text-sm font-medium">Select a greenhouse to view map</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground font-medium">📍 {selectedGreenhouse?.location.city || 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* PhytoSense 2grow Data Panel - Full Width */}
            <div className="col-span-12 mt-6">
              <PhytoSenseOptimized />
            </div>

          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ResearcherDashboard;