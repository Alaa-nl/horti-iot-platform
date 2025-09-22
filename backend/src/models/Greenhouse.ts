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
  crops: string[];
  equipment: string[];
  performance: {
    previousYield: number;
  };
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