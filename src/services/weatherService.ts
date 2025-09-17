import axios from 'axios';

// Weather API configuration
const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
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
    tempMin?: number;
    tempMax?: number;
  }>;
}

interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
}

interface ForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
  }>;
}

const mapCondition = (weatherMain: string): string => {
  const conditions: { [key: string]: string } = {
    'Clear': 'Sunny',
    'Clouds': 'Cloudy',
    'Rain': 'Rainy',
    'Drizzle': 'Rainy',
    'Thunderstorm': 'Stormy',
    'Snow': 'Snowy',
    'Mist': 'Misty',
    'Fog': 'Foggy',
    'Haze': 'Hazy'
  };
  return conditions[weatherMain] || weatherMain;
};

const getDayName = (timestamp: number): string => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const date = new Date(timestamp * 1000);
  return days[date.getDay()];
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const fetchWeatherData = async (location: string = 'Naaldwijk,NL'): Promise<WeatherData> => {
  try {
    // If no API key is configured, return mock data
    if (!API_KEY) {
      console.warn('Weather API key not configured. Using mock data.');
      return getMockWeatherData();
    }

    // Fetch current weather
    const currentWeatherUrl = `${BASE_URL}/weather?q=${location}&appid=${API_KEY}&units=metric`;
    const currentResponse = await axios.get<OpenWeatherResponse>(currentWeatherUrl);
    const current = currentResponse.data;

    // Fetch 5-day forecast
    const forecastUrl = `${BASE_URL}/forecast?q=${location}&appid=${API_KEY}&units=metric`;
    const forecastResponse = await axios.get<ForecastResponse>(forecastUrl);
    const forecast = forecastResponse.data;

    // Calculate rain probability based on cloud coverage and rain data
    const rainProbability = current.rain ? 80 : current.clouds.all > 60 ? 40 : 10;

    // Process forecast data (get daily averages)
    const dailyForecasts: { [key: string]: { temps: number[], condition: string } } = {};

    forecast.list.slice(0, 32).forEach(item => { // 32 items = 4 days (8 items per day)
      const day = getDayName(item.dt);
      if (!dailyForecasts[day]) {
        dailyForecasts[day] = { temps: [], condition: item.weather[0].main };
      }
      dailyForecasts[day].temps.push(item.main.temp);
    });

    const forecastArray = Object.entries(dailyForecasts).slice(0, 4).map(([day, data]) => ({
      day,
      temp: Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length),
      condition: mapCondition(data.condition).toLowerCase()
    }));

    return {
      today: {
        temp: Math.round(current.main.temp),
        condition: mapCondition(current.weather[0].main),
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed * 10) / 10,
        rainProbability,
        feelsLike: Math.round(current.main.feels_like),
        pressure: current.main.pressure,
        sunrise: formatTime(current.sys.sunrise),
        sunset: formatTime(current.sys.sunset)
      },
      forecast: forecastArray
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Fallback to mock data if API fails
    return getMockWeatherData();
  }
};

// Mock data for development/fallback
const getMockWeatherData = (): WeatherData => {
  const baseTemp = 20 + Math.floor(Math.random() * 10);
  return {
    today: {
      temp: baseTemp,
      condition: 'Partly Cloudy',
      humidity: 55 + Math.floor(Math.random() * 20),
      windSpeed: Math.round((2 + Math.random() * 5) * 10) / 10,
      rainProbability: Math.floor(Math.random() * 30)
    },
    forecast: [
      { day: 'MON', temp: baseTemp + 1, condition: 'sunny' },
      { day: 'TUE', temp: baseTemp + 3, condition: 'cloudy' },
      { day: 'WED', temp: baseTemp + 2, condition: 'sunny' },
      { day: 'THU', temp: baseTemp - 1, condition: 'rainy' }
    ]
  };
};

// Function to fetch weather by coordinates (useful for farm locations)
export const fetchWeatherByCoordinates = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    if (!API_KEY) {
      return getMockWeatherData();
    }

    const currentWeatherUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const currentResponse = await axios.get<OpenWeatherResponse>(currentWeatherUrl);
    const current = currentResponse.data;

    const forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const forecastResponse = await axios.get<ForecastResponse>(forecastUrl);
    const forecast = forecastResponse.data;

    // Process similar to fetchWeatherData
    const rainProbability = current.rain ? 80 : current.clouds.all > 60 ? 40 : 10;

    const dailyForecasts: { [key: string]: { temps: number[], condition: string } } = {};
    forecast.list.slice(0, 32).forEach(item => {
      const day = getDayName(item.dt);
      if (!dailyForecasts[day]) {
        dailyForecasts[day] = { temps: [], condition: item.weather[0].main };
      }
      dailyForecasts[day].temps.push(item.main.temp);
    });

    const forecastArray = Object.entries(dailyForecasts).slice(0, 4).map(([day, data]) => ({
      day,
      temp: Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length),
      condition: mapCondition(data.condition).toLowerCase()
    }));

    return {
      today: {
        temp: Math.round(current.main.temp),
        condition: mapCondition(current.weather[0].main),
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed * 10) / 10,
        rainProbability,
        feelsLike: Math.round(current.main.feels_like),
        pressure: current.main.pressure,
        sunrise: formatTime(current.sys.sunrise),
        sunset: formatTime(current.sys.sunset)
      },
      forecast: forecastArray
    };
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error);
    return getMockWeatherData();
  }
};