export interface Greenhouse {
  id: string;
  name: string;
  location: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  area_m2: number;
  climate_zones: string[];
  crops: string[];
  equipment: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface GreenhouseResponse {
  id: string;
  farmCode?: string;
  name: string;
  location: {
    address: string;
    city: string;
    region: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  details: {
    landArea: number;
    type: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  crops: {
    type: string;
    variety: string;
    plantingDate: Date | null;
    supplier: string;
  };
  equipment: {
    climate: {
      name: string;
      type: string;
      status: string;
    };
    lighting: {
      name: string;
      type: string;
      status: string;
    };
  };
  performance: {
    previousYield: number;
  };
  // Additional fields for researcher dashboard
  cropType?: string;
  variety?: string;
  supplier?: string;
  climateSystem?: string;
  lightingSystem?: string;
  co2TargetPpm?: number;
  temperatureRangeC?: string;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  timestamp: Date;
  value: number;
  unit: string;
  quality_score: number;
}

export interface Sensor {
  id: string;
  greenhouse_id: string;
  zone_id: string;
  sensor_type: string;
  manufacturer: string;
  model: string;
  location: any;
  calibration_data: any;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: Date;
}