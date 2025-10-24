// Greenhouse type definitions
export interface Greenhouse {
  id: string;
  farmCode?: string; // Simple farm ID like FARM-001
  name: string;
  location: {
    city: string;
    region: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
    address: string;
  };
  details: {
    landArea: number; // in m²
    type: 'glass' | 'plastic' | 'polytunnel' | 'hybrid';
    yearBuilt: number;
    lastRenovation?: number;
  };
  crops: Array<{
    name: string;
    area: number; // in m²
    plantedDate: string;
    expectedHarvest: string;
    variety?: string;
  }>;
  performance: {
    previousYield: number; // kg/m²
    currentYield?: number;
    energyUsage: number; // kWh/m²/year
    waterUsage: number; // liters/m²/year
  };
  sensors: {
    temperature: number;
    humidity: number;
    moisture: number;
    co2: number;
    light: number;
    pH: number;
  };
  contact?: {
    manager: string;
    phone: string;
    email: string;
  };
}

// All greenhouse data now comes from the PostgreSQL database
// See backend API endpoints: /api/greenhouses