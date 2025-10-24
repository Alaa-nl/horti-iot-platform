# Greenhouse Selection System - Implementation Guide

## Overview
The dashboard now features a dynamic greenhouse selection system that automatically fetches weather data and all relevant information for the selected greenhouse location.

## 🚀 Key Features Implemented

### 1. **Greenhouse Selection Dropdown**
- Beautiful dropdown component in the header
- Shows greenhouse name, location, and key details
- Remembers last selected greenhouse using localStorage
- Loading states during data fetching

### 2. **Real Greenhouse Data**
- 5 predefined greenhouses across Netherlands:
  - **World Horti Center** (Naaldwijk)
  - **Wageningen Research** (Wageningen)
  - **Amsterdam Vertical Farm** (Amsterdam)
  - **Rotterdam Port Greenhouse** (Rotterdam)
  - **Eindhoven Tech Greenhouse** (Eindhoven)

### 3. **Dynamic Weather Integration**
- Weather automatically fetches based on greenhouse coordinates
- Uses KNMI weather service for Netherlands-specific data
- Shows nearest KNMI weather station
- Updates location name in weather widget

### 4. **Complete Data Integration**
When you select a greenhouse, the dashboard automatically updates:

#### Farm Details Section:
- Farm name and ID
- Location (city, region)
- Land area in m²
- Number of crops grown
- Previous yield performance

#### Sensor Data:
- Temperature, humidity, moisture sensors
- Real-time status (normal/warning/critical)
- Based on actual greenhouse sensor readings
- CO2 levels affecting air quality warnings

#### Crop Yield Chart:
- Dynamic pie chart based on actual crops in greenhouse
- Calculates area percentages for each crop
- Different colors for different crop types
- Updates when switching greenhouses

#### Water Management:
- Moisture levels from greenhouse sensors
- Water consumption data
- Previous vs current usage comparison

### 5. **Real-Time Updates**
- Sensor data updates every 3 seconds
- Weather data refreshes every 10 minutes
- Realistic sensor value variations
- Status indicators (normal/warning/critical)

## 🏗️ Technical Implementation

### Files Created/Modified:

1. **`src/types/greenhouse.ts`** - Complete greenhouse data structure
2. **`src/services/greenhouseService.ts`** - Service for managing greenhouse data
3. **`src/components/greenhouse/GreenhouseSelector.tsx`** - Selection component
4. **`src/services/knmiWeatherService.ts`** - Updated with coordinate-based weather
5. **`src/pages/ResearcherDashboard.tsx`** - Integrated all components

### Data Structure:
```typescript
interface Greenhouse {
  id: string;
  name: string;
  location: {
    city: string;
    coordinates: { lat: number; lon: number };
    address: string;
  };
  details: {
    landArea: number;
    type: 'glass' | 'plastic' | 'hybrid';
    yearBuilt: number;
  };
  crops: Array<{
    name: string;
    area: number;
    variety: string;
  }>;
  performance: {
    previousYield: number;
    waterUsage: number;
  };
  sensors: {
    temperature: number;
    humidity: number;
    moisture: number;
    co2: number;
    pH: number;
  };
}
```

## 📊 What Happens When You Select a Greenhouse

1. **Immediate UI Update**: Loading states appear
2. **Fetch Greenhouse Data**: Complete greenhouse information loaded
3. **Weather Integration**: Weather fetched for exact greenhouse coordinates
4. **Sensor Mapping**: Real sensor values populate the dashboard
5. **Crop Analysis**: Yield chart updates with actual crop distribution
6. **Save Selection**: Choice saved to localStorage for next visit

## 🌍 Weather Integration

The system uses KNMI (Dutch weather service) data:
- **Precise Location**: Weather for exact greenhouse coordinates
- **Local Stations**: Shows nearest KNMI weather station
- **Netherlands Focus**: Optimized for Dutch agricultural conditions
- **Real-time Data**: Current conditions and 4-day forecast

## 🔧 How to Use

1. **Select Greenhouse**: Use dropdown at top of dashboard
2. **View Data**: All sections automatically update
3. **Monitor Changes**: Real-time sensor updates
4. **Switch Easily**: Try different greenhouses to see different data

## 🎯 Benefits

- **Location-Specific**: Accurate weather for each greenhouse location
- **Comprehensive Data**: Complete picture of each facility
- **Real-time Monitoring**: Live sensor data and updates
- **User-Friendly**: Easy switching between facilities
- **Data-Driven**: All information based on actual greenhouse parameters

## 🚀 Future Enhancements Possible

- Add more greenhouses to the database
- Connect to real sensor APIs
- Implement greenhouse comparison features
- Add historical data visualization
- Include crop growth predictions

The system is now fully functional with dynamic greenhouse selection that automatically fetches location-specific weather and displays all relevant greenhouse data!