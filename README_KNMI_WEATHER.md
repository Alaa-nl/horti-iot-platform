# KNMI Weather Integration Guide

## Overview
The application now integrates with KNMI (Royal Netherlands Meteorological Institute) data for accurate, Netherlands-specific weather information. This is particularly relevant for agricultural applications in the Netherlands.

## Features
- **Real-time Dutch weather data** from KNMI weather stations
- **KNMI weather model** with Netherlands-specific forecasts
- **No API key required** for basic functionality (uses Open-Meteo KNMI model)
- **Automatic station selection** based on location
- **Additional meteorological data**: wind direction, cloud coverage, precipitation
- **4-day forecast** with min/max temperatures

## Data Sources

### 1. Open-Meteo KNMI Model (Default - No Key Required)
The app uses the Open-Meteo KNMI weather model by default, which provides:
- Free access without API key
- KNMI HARMONIE-AROME model data
- High-resolution weather forecasts for Netherlands
- Updates every hour

### 2. Official KNMI API (Optional - Requires Key)
For direct KNMI station observations:
1. Register at [KNMI Developer Portal](https://developer.dataplatform.knmi.nl/)
2. Request API access
3. Add key to `.env` file

## Available Weather Stations
The service includes data from major KNMI weather stations:
- **De Bilt** (Utrecht area)
- **Schiphol** (Amsterdam area)
- **Rotterdam**
- **Voorschoten** (Den Haag/Naaldwijk area) - Default for World Horti Center
- **Eindhoven**

## Configuration

### Basic Setup (No API Key Required)
The app works out of the box with KNMI data:
```bash
npm start
```

### Optional: Configure Location
Edit `.env` to change the default location:
```
REACT_APP_DEFAULT_WEATHER_LOCATION=Rotterdam
```

### Optional: Use Official KNMI API
If you have a KNMI API key:
```
REACT_APP_KNMI_API_KEY=your_knmi_api_key_here
```

## Weather Data Provided

### Current Conditions
- Temperature (°C)
- Feels like temperature
- Weather condition (Clear, Cloudy, Rainy, etc.)
- Humidity (%)
- Wind speed (m/s) and direction
- Atmospheric pressure (hPa)
- Cloud coverage (%)
- Precipitation (mm)
- Sunrise/sunset times

### Forecast Data
- 4-day forecast
- Daily min/max temperatures
- Weather conditions
- Expected precipitation
- Wind speeds

## Benefits for Agriculture
KNMI data is particularly valuable for Dutch agriculture:
- **Localized data** from nearby weather stations
- **Accurate precipitation forecasts** for irrigation planning
- **Wind data** for greenhouse ventilation management
- **Cloud coverage** for light management in greenhouses
- **Dutch meteorological standards** and measurements

## Technical Details

### Data Update Frequency
- Current weather: Every 10 minutes
- Forecast: Updated hourly
- Station observations: Real-time when available

### Fallback Behavior
1. Attempts to fetch KNMI model data via Open-Meteo
2. Falls back to mock data if network fails
3. Shows "Using fallback data" indicator

### Station Selection
The service automatically selects the nearest KNMI station based on:
- Configured location name
- Geographic coordinates
- Proximity to major weather stations

## Troubleshooting

### No Weather Data
1. Check internet connection
2. Verify location name is a Dutch city
3. Check browser console for errors

### Wrong Station
Update location in `.env` to a closer Dutch city:
```
REACT_APP_DEFAULT_WEATHER_LOCATION=Amsterdam
```

### API Limits
Open-Meteo KNMI model:
- Free tier: 10,000 requests/day
- No registration required

Official KNMI API:
- Requires registration
- Rate limits depend on subscription

## References
- [KNMI Data Platform](https://dataplatform.knmi.nl/)
- [KNMI Developer Portal](https://developer.dataplatform.knmi.nl/)
- [Open-Meteo KNMI Documentation](https://open-meteo.com/en/docs/knmi-api)
- [KNMI Weather Stations](https://www.knmi.nl/nederland-nu/weer/waarnemingen)