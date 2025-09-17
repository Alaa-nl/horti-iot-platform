import axios from 'axios';

// KNMI API configuration
const KNMI_API_KEY = process.env.REACT_APP_KNMI_API_KEY || '';
const KNMI_BASE_URL = 'https://api.dataplatform.knmi.nl/open-data/v1';

// Use Open-Meteo API (no API key required) - works with ECMWF/GFS models for Netherlands
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// KNMI station codes for major cities in Netherlands
const KNMI_STATIONS: { [key: string]: { code: string; name: string; lat: number; lon: number } } = {
  'De Bilt': { code: '260', name: 'De Bilt', lat: 52.10, lon: 5.18 },
  'Amsterdam': { code: '240', name: 'Schiphol', lat: 52.30, lon: 4.77 },
  'Rotterdam': { code: '344', name: 'Rotterdam', lat: 51.96, lon: 4.45 },
  'Den Haag': { code: '215', name: 'Voorschoten', lat: 52.12, lon: 4.43 },
  'Naaldwijk': { code: '215', name: 'Voorschoten', lat: 52.12, lon: 4.43 }, // Closest station
  'Eindhoven': { code: '370', name: 'Eindhoven', lat: 51.45, lon: 5.42 },
  'Utrecht': { code: '260', name: 'De Bilt', lat: 52.10, lon: 5.18 }
};

export interface KNMIWeatherData {
  today: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    rainProbability: number;
    feelsLike?: number;
    pressure?: number;
    visibility?: number;
    cloudCoverage?: number;
    precipitation?: number;
    sunrise?: string;
    sunset?: string;
  };
  forecast: Array<{
    day: string;
    temp: number;
    tempMin: number;
    tempMax: number;
    condition: string;
    precipitation?: number;
    windSpeed?: number;
  }>;
  station?: {
    name: string;
    code: string;
    location: string;
  };
}

// Weather code mapping for Open-Meteo/KNMI
const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
};

const getDayName = (date: Date): string => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[date.getDay()];
};

// Weather data cache to ensure consistency
const weatherCache = new Map<string, { data: KNMIWeatherData; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Fetch weather by coordinates using Open-Meteo KNMI model
export const fetchKNMIWeatherByCoordinates = async (lat: number, lon: number, locationName?: string): Promise<KNMIWeatherData> => {
  // Create cache key from coordinates
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;

  // Check cache first
  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`🎯 Using cached weather data for ${locationName || 'location'}`);
    return cached.data;
  }

  try {
    // Find nearest KNMI station for reference
    const nearestStation = getNearestKNMIStation(lat, lon);

    console.log(`🌤️ Fetching fresh weather data for ${locationName || 'location'} (${lat}, ${lon})`);

    // Use Open-Meteo KNMI model API (free, no key required)
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,cloud_cover',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max',
      timezone: 'Europe/Amsterdam',
      forecast_days: '5'
    });

    const response = await axios.get(`${OPEN_METEO_URL}?${params}`);

    if (!response.data || !response.data.current) {
      throw new Error('Invalid API response structure');
    }

    const data = response.data;

    // Process current weather
    const current = data.current;

    // Calculate rain probability based on precipitation and weather code
    let rainProbability = 0;
    if (current.weather_code >= 51 && current.weather_code <= 99) {
      rainProbability = 70 + (current.weather_code - 50) * 0.6;
    } else if (current.cloud_cover > 70) {
      rainProbability = 30;
    } else if (current.cloud_cover > 50) {
      rainProbability = 20;
    } else {
      rainProbability = 5;
    }

    // Process forecast data
    const forecastData = data.daily.time.slice(1, 5).map((date: string, index: number) => {
      const dayIndex = index + 1;
      return {
        day: getDayName(new Date(date)),
        temp: Math.round((data.daily.temperature_2m_max[dayIndex] + data.daily.temperature_2m_min[dayIndex]) / 2),
        tempMin: Math.round(data.daily.temperature_2m_min[dayIndex]),
        tempMax: Math.round(data.daily.temperature_2m_max[dayIndex]),
        condition: getWeatherCondition(data.daily.weather_code[dayIndex]),
        precipitation: Math.round(data.daily.precipitation_sum[dayIndex] * 10) / 10,
        windSpeed: Math.round(data.daily.wind_speed_10m_max[dayIndex])
      };
    });

    const weatherData: KNMIWeatherData = {
      today: {
        temp: Math.round(current.temperature_2m),
        condition: getWeatherCondition(current.weather_code),
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
        windDirection: Math.round(current.wind_direction_10m),
        rainProbability: Math.round(rainProbability),
        feelsLike: Math.round(current.apparent_temperature),
        pressure: Math.round(current.pressure_msl),
        cloudCoverage: Math.round(current.cloud_cover),
        precipitation: Math.round(current.precipitation * 10) / 10,
        sunrise: new Date(data.daily.sunrise[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(data.daily.sunset[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      },
      forecast: forecastData,
      station: {
        name: nearestStation.name,
        code: nearestStation.code,
        location: locationName || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`
      }
    };

    // Cache the successful result
    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    console.log(`✅ Successfully fetched and cached weather for ${locationName || 'location'}: ${weatherData.today.temp}°C`);

    return weatherData;
  } catch (error) {
    console.error(`❌ Failed to fetch weather data for ${locationName || 'location'}:`, error);
    console.log(`🔄 Returning error state for ${locationName || 'location'}`);
    return getErrorWeatherData(locationName);
  }
};

// Fetch weather using Open-Meteo KNMI model (no API key required)
export const fetchKNMIWeatherData = async (location: string = 'Naaldwijk'): Promise<KNMIWeatherData> => {
  try {
    // Get station info
    const stationInfo = KNMI_STATIONS[location] || KNMI_STATIONS['Naaldwijk'];

    // Use Open-Meteo KNMI model API (free, no key required)
    const params = new URLSearchParams({
      latitude: stationInfo.lat.toString(),
      longitude: stationInfo.lon.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,cloud_cover',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max',
      timezone: 'Europe/Amsterdam',
      forecast_days: '5'
    });

    const response = await axios.get(`${OPEN_METEO_URL}?${params}`);
    const data = response.data;

    // Process current weather
    const current = data.current;
    const currentTime = new Date(current.time);

    // Calculate rain probability based on precipitation and weather code
    let rainProbability = 0;
    if (current.weather_code >= 51 && current.weather_code <= 99) {
      rainProbability = 70 + (current.weather_code - 50) * 0.6;
    } else if (current.cloud_cover > 70) {
      rainProbability = 30;
    } else if (current.cloud_cover > 50) {
      rainProbability = 20;
    } else {
      rainProbability = 5;
    }

    // Process forecast data
    const forecastData = data.daily.time.slice(1, 5).map((date: string, index: number) => {
      const dayIndex = index + 1;
      return {
        day: getDayName(new Date(date)),
        temp: Math.round((data.daily.temperature_2m_max[dayIndex] + data.daily.temperature_2m_min[dayIndex]) / 2),
        tempMin: Math.round(data.daily.temperature_2m_min[dayIndex]),
        tempMax: Math.round(data.daily.temperature_2m_max[dayIndex]),
        condition: getWeatherCondition(data.daily.weather_code[dayIndex]),
        precipitation: Math.round(data.daily.precipitation_sum[dayIndex] * 10) / 10,
        windSpeed: Math.round(data.daily.wind_speed_10m_max[dayIndex])
      };
    });

    return {
      today: {
        temp: Math.round(current.temperature_2m),
        condition: getWeatherCondition(current.weather_code),
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
        windDirection: Math.round(current.wind_direction_10m),
        rainProbability: Math.round(rainProbability),
        feelsLike: Math.round(current.apparent_temperature),
        pressure: Math.round(current.pressure_msl),
        cloudCoverage: Math.round(current.cloud_cover),
        precipitation: Math.round(current.precipitation * 10) / 10,
        sunrise: new Date(data.daily.sunrise[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(data.daily.sunset[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      },
      forecast: forecastData,
      station: {
        name: stationInfo.name,
        code: stationInfo.code,
        location: location
      }
    };
  } catch (error) {
    console.error('Error fetching KNMI weather data:', error);
    return getErrorWeatherData(location);
  }
};

// Fetch actual KNMI observations (requires API key)
export const fetchKNMIObservations = async (stationCode: string = '260'): Promise<any> => {
  if (!KNMI_API_KEY) {
    console.warn('KNMI API key not configured');
    return null;
  }

  try {
    const endpoint = `${KNMI_BASE_URL}/datasets/actuele10mindataknmistations/versions/2/files`;

    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': KNMI_API_KEY
      }
    });

    // Get the latest file
    const files = response.data.files;
    if (files && files.length > 0) {
      const latestFile = files[files.length - 1];

      // Download the actual data
      const dataResponse = await axios.get(latestFile.temporaryDownloadUrl);
      return dataResponse.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching KNMI observations:', error);
    return null;
  }
};

// Error weather data when API fails
const getErrorWeatherData = (locationName?: string): KNMIWeatherData => {
  return {
    today: {
      temp: 0,
      condition: 'Weather data unavailable',
      humidity: 0,
      windSpeed: 0,
      windDirection: 0,
      rainProbability: 0,
      feelsLike: 0,
      pressure: 0,
      cloudCoverage: 0,
      precipitation: 0,
      sunrise: '--:--',
      sunset: '--:--'
    },
    forecast: [
      { day: 'MON', temp: 0, tempMin: 0, tempMax: 0, condition: 'unavailable' },
      { day: 'TUE', temp: 0, tempMin: 0, tempMax: 0, condition: 'unavailable' },
      { day: 'WED', temp: 0, tempMin: 0, tempMax: 0, condition: 'unavailable' },
      { day: 'THU', temp: 0, tempMin: 0, tempMax: 0, condition: 'unavailable' }
    ],
    station: {
      name: 'Connection Failed',
      code: 'ERR',
      location: locationName || 'Unknown'
    }
  };
};

// Get nearest KNMI station by coordinates
export const getNearestKNMIStation = (lat: number, lon: number): typeof KNMI_STATIONS[string] => {
  let nearestStation = KNMI_STATIONS['De Bilt'];
  let minDistance = Infinity;

  Object.values(KNMI_STATIONS).forEach(station => {
    const distance = Math.sqrt(
      Math.pow(station.lat - lat, 2) +
      Math.pow(station.lon - lon, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  });

  return nearestStation;
};