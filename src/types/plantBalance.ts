// Plant Assimilate Balance Dashboard Types

export type TimePeriod = 'long-term' | 'short-term' | 'real-time';

// Assimilate Balance Parameters
export interface AssimilateBalance {
  // Production factors
  parLight: number;        // μmol/m²/s - Photosynthetically Active Radiation
  co2Level: number;        // ppm - CO2 concentration
  humidity: number;        // % - Relative Humidity

  // Consumption factors
  temperature: number;     // °C - Air temperature
  leafTemperature: number; // °C - Leaf temperature

  // Calculated values
  photosynthesis: number;  // μmol/m²/s - Photosynthesis rate
  respiration: number;     // μmol/m²/s - Respiration rate
  netAssimilation: number; // μmol/m²/s - Net assimilation
}

// Time Period Settings
export interface TimePeriodSettings {
  longTerm: {
    weeks: number;
    targetProduction: number; // kg/m²
  };
  shortTerm: {
    hours: number; // 24-hour period
    rtr: number;   // Ratio Temperature to Radiation
  };
  realTime: {
    updateInterval: number; // seconds
    smoothing: boolean;
  };
}

// Water Balance Parameters
export interface WaterBalance {
  // Input factors
  rootUptake: number;         // L/m²/h - Water uptake from roots
  irrigationSupply: number;   // L/m²/h - Irrigation water supply

  // Output factors
  transpiration: number;      // L/m²/h - Transpiration rate
  growthWater: number;        // L/m²/h - Water incorporated into growth
  drainage: number;           // L/m²/h - Drainage/runoff

  // Environmental factors
  vpd: number;                // kPa - Vapor Pressure Deficit
  rootTemperature: number;    // °C - Root zone temperature
  stomatalConductance: number;// mmol/m²/s - Stomatal conductance

  // Calculated values
  netWaterBalance: number;    // L/m²/h - Net water balance
  waterStatus: 'deficit' | 'balanced' | 'surplus';
}

// Energy Balance Parameters
export interface EnergyBalance {
  // Input energy
  netRadiation: number;       // W/m² - Net radiation (solar + artificial)
  parAbsorption: number;      // W/m² - PAR energy absorbed
  heating: number;            // W/m² - Heating system input

  // Output energy
  sensibleHeat: number;       // W/m² - Convective heat transfer
  latentHeat: number;         // W/m² - Evaporation energy
  photochemical: number;      // W/m² - Energy used in photosynthesis

  // Environmental factors
  leafAirTempDiff: number;    // °C - Leaf-air temperature difference
  boundaryLayerConductance: number; // mmol/m²/s

  // Calculated values
  netEnergyBalance: number;   // W/m² - Net energy balance
  bowenRatio: number;         // Sensible/Latent heat ratio
  energyStatus: 'cooling' | 'balanced' | 'heating';
}

// Combined Plant Balance State
export interface PlantBalanceState {
  assimilate: AssimilateBalance;
  water: WaterBalance;
  energy: EnergyBalance;
  period: TimePeriod;
}