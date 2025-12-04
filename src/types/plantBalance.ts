// Plant Balance Types for Educational Dashboard

export type TimeScale = 'realtime' | 'daily' | 'seasonal';

// ============== ASSIMILATE BALANCE ==============
export interface PhotosynthesisParams {
  // Light Response Parameters
  quantumYield: number;           // Range: 0.04-0.08 mol CO2/mol photons
  lightSaturationPoint: number;   // Range: 800-2000 μmol/m²/s
  darkRespirationRate: number;    // Range: 0.5-3.0 μmol CO2/m²/s

  // CO2 Response Parameters
  co2CompensationPoint: number;     // Range: 30-80 ppm
  co2SaturationPoint: number;       // Range: 800-1500 ppm
  carboxylationEfficiency: number;  // Range: 0.05-0.12

  // Temperature Response
  optimalTempPhoto: number;         // Range: 20-30°C
  minTempPhoto: number;             // Range: 5-15°C
  maxTempPhoto: number;             // Range: 35-45°C
  q10Respiration: number;           // Range: 1.8-2.5

  // Plant Parameters
  leafAreaIndex: number;           // Range: 0.5-6.0 m²/m²
  specificLeafArea: number;        // Range: 100-400 cm²/g
  carbonUseEfficiency: number;     // Range: 0.3-0.7

  // Environmental inputs (for calculations)
  lightIntensity: number;          // Current PAR (μmol/m²/s)
  co2Concentration: number;        // Current CO2 (ppm)
  temperature: number;             // Current temperature (°C)
}

export interface PhotosynthesisOutputs {
  grossPhotosynthesis: number;     // μmol CO2/m²/s
  darkRespiration: number;         // μmol CO2/m²/s
  netPhotosynthesis: number;       // μmol CO2/m²/s
  lightLimitedRate: number;        // μmol CO2/m²/s
  co2LimitedRate: number;          // μmol CO2/m²/s
  dailyAssimilates: number;        // g CH2O/m²/day
  carbonGain: number;              // g C/m²/day
  efficiency: number;              // % of max theoretical
}

// ============== WATER BALANCE ==============
export interface TranspirationParams {
  // Stomatal Control
  maxStomatalConductance: number;   // Range: 0.1-1.0 mol/m²/s
  vpdThresholdLow: number;           // Range: 0.3-0.8 kPa
  vpdThresholdHigh: number;          // Range: 1.5-3.0 kPa
  stomatalSensitivity: number;       // Range: 0.3-0.9

  // Boundary Layer
  leafCharacteristicLength: number;  // Range: 0.01-0.2 m
  windSpeedEffect: number;           // Range: 0.5-1.0

  // Root Water Uptake
  rootHydraulicConductivity: number; // Range: 0.0001-0.01 m/s/MPa
  rootZoneDepth: number;             // Range: 0.1-0.5 m
  criticalWaterPotential: number;    // Range: -0.5 to -2.5 MPa

  // Hydraulic Properties
  plantCapacitance: number;          // Range: 0.05-0.3 kg/MPa
  xylemConductance: number;          // Range: 0.001-0.1 m²/s/MPa

  // Environmental inputs
  vpdAir: number;                   // Current VPD (kPa)
  windSpeed: number;                 // m/s
  soilWaterPotential: number;       // MPa
}

export interface TranspirationOutputs {
  transpirationRate: number;        // mmol H2O/m²/s
  dailyWaterUse: number;            // L/m²/day
  stomatalConductance: number;      // mol/m²/s
  boundaryLayerResistance: number;  // s/m
  leafWaterPotential: number;       // MPa
  waterUseEfficiency: number;       // μmol CO2/mmol H2O
  vpdCategory: string;              // Under/Low/Healthy/High/Over
  waterStressLevel: string;         // None/Mild/Moderate/Severe
}

// ============== ENERGY BALANCE ==============
export interface EnergyBalanceParams {
  // Radiation Parameters
  leafAbsorptance: number;          // Range: 0.7-0.95
  leafTransmittance: number;        // Range: 0.02-0.15
  leafReflectance: number;          // Range: 0.05-0.20
  canopyExtinctionCoeff: number;    // Range: 0.5-1.0

  // Heat Transfer
  convectiveCoefficient: number;    // Range: 10-50 W/m²/K
  leafEmissivity: number;           // Range: 0.90-0.99
  leafSpecificHeat: number;         // Range: 3000-4500 J/kg/K

  // Energy Partitioning
  latentHeatRatio: number;          // Range: 0.5-0.9
  sensibleHeatRatio: number;        // Range: 0.1-0.4
  soilHeatFluxRatio: number;        // Range: 0.01-0.15

  // Temperature Regulation
  thermalTimeConstant: number;      // Range: 300-1200 seconds
  leafThermalMass: number;          // Range: 0.1-0.5 kg/m²

  // Environmental inputs
  solarRadiation: number;           // W/m²
  airTemperature: number;           // °C
  leafTemperature: number;          // °C
}

export interface EnergyBalanceOutputs {
  netRadiation: number;             // W/m²
  absorbedRadiation: number;        // W/m²
  sensibleHeatFlux: number;         // W/m²
  latentHeatFlux: number;           // W/m²
  soilHeatFlux: number;             // W/m²
  photosynthesisEnergy: number;     // W/m²
  leafAirTempDiff: number;          // °C
  energyBalance: number;            // W/m² (should be ~0)
  bowenRatio: number;               // Sensible/Latent heat ratio
}

// ============== DEFAULT PARAMETERS ==============
export const defaultPhotosynthesisParams: PhotosynthesisParams = {
  // Light Response
  quantumYield: 0.06,
  lightSaturationPoint: 1500,
  darkRespirationRate: 2.0,

  // CO2 Response
  co2CompensationPoint: 50,
  co2SaturationPoint: 1200,
  carboxylationEfficiency: 0.08,

  // Temperature Response
  optimalTempPhoto: 25,
  minTempPhoto: 10,
  maxTempPhoto: 40,
  q10Respiration: 2.0,

  // Plant Parameters
  leafAreaIndex: 3.0,
  specificLeafArea: 200,
  carbonUseEfficiency: 0.5,

  // Environmental
  lightIntensity: 800,
  co2Concentration: 800,
  temperature: 22
};

export const defaultTranspirationParams: TranspirationParams = {
  // Stomatal Control
  maxStomatalConductance: 0.5,
  vpdThresholdLow: 0.5,
  vpdThresholdHigh: 2.0,
  stomatalSensitivity: 0.6,

  // Boundary Layer
  leafCharacteristicLength: 0.05,
  windSpeedEffect: 0.7,

  // Root Water Uptake
  rootHydraulicConductivity: 0.001,
  rootZoneDepth: 0.3,
  criticalWaterPotential: -1.5,

  // Hydraulic Properties
  plantCapacitance: 0.1,
  xylemConductance: 0.01,

  // Environmental
  vpdAir: 1.0,
  windSpeed: 0.5,
  soilWaterPotential: -0.3
};

export const defaultEnergyParams: EnergyBalanceParams = {
  // Radiation
  leafAbsorptance: 0.85,
  leafTransmittance: 0.05,
  leafReflectance: 0.10,
  canopyExtinctionCoeff: 0.7,

  // Heat Transfer
  convectiveCoefficient: 25,
  leafEmissivity: 0.95,
  leafSpecificHeat: 3800,

  // Energy Partitioning
  latentHeatRatio: 0.7,
  sensibleHeatRatio: 0.25,
  soilHeatFluxRatio: 0.05,

  // Temperature Regulation
  thermalTimeConstant: 600,
  leafThermalMass: 0.2,

  // Environmental
  solarRadiation: 500,
  airTemperature: 22,
  leafTemperature: 23
};