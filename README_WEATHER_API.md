# Weather API Setup Guide

## Overview
The application now integrates with OpenWeatherMap API to provide accurate, real-time weather data for your farm location.

## Features
- Real-time weather data including temperature, humidity, wind speed
- 4-day weather forecast
- Automatic updates every 10 minutes
- Fallback to mock data if API is unavailable
- Support for multiple locations

## Setup Instructions

### 1. Get Your Free API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to "API Keys" in your profile
4. Generate a new API key

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API key to `.env`:
   ```
   REACT_APP_OPENWEATHER_API_KEY=your_actual_api_key_here
   REACT_APP_DEFAULT_WEATHER_LOCATION=Naaldwijk,NL
   ```

3. Optional: Change the default location to your farm's location (format: City,CountryCode)

### 3. Start the Application
```bash
npm start
```

## API Limits (Free Tier)
- 1,000 API calls per day
- 60 calls per minute
- Data updates every 10 minutes

## Customization

### Change Location Dynamically
The weather service supports fetching weather by coordinates:
```typescript
import { fetchWeatherByCoordinates } from './services/weatherService';

// Fetch weather for specific coordinates
const weather = await fetchWeatherByCoordinates(52.0116, 4.3571);
```

### Available Weather Data
- Current temperature and "feels like" temperature
- Weather condition (sunny, cloudy, rainy, etc.)
- Humidity percentage
- Wind speed
- Rain probability
- Atmospheric pressure
- Sunrise and sunset times
- 4-day forecast

## Troubleshooting

### No Weather Data Showing
1. Check if your API key is correctly set in `.env`
2. Verify the API key is active on OpenWeatherMap dashboard
3. Check browser console for error messages
4. The app will use mock data if the API fails

### Wrong Location
Update `REACT_APP_DEFAULT_WEATHER_LOCATION` in your `.env` file with the correct city and country code.

### API Rate Limits
If you exceed the free tier limits, consider:
- Upgrading to a paid plan
- Increasing the refresh interval (currently 10 minutes)
- Implementing caching strategies