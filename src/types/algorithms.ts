// Autonomous Greenhouse Types for Student Learning

// Time scales for dashboard views
export type TimeScale = 'momentaneous' | 'short_term' | 'long_term';

// ==========================================
// PLANT-GREENHOUSE BALANCE ALGORITHMS
// ==========================================

// Assimilate Balance (Photosynthesis/Carbon Balance)
export interface AssimilateBalanceParams {
  // Light parameters
  lightIntensity: number;           // umol/m2/s (PAR)
  lightUseEfficiency: number;       // mol CO2/mol photons (0.01-0.08)
  photoperiod: number;              // hours of light per day

  // CO2 parameters
  co2Concentration: number;         // ppm
  co2CompensationPoint: number;     // ppm
  maxPhotosynthesisRate: number;    // umol CO2/m2/s

  // Plant parameters
  leafAreaIndex: number;            // m2 leaf / m2 ground
  chlorophyllContent: number;       // mg/g

  // Respiration
  maintenanceRespiration: number;   // umol CO2/m2/s
  growthRespiration: number;        // g CO2/g dry matter
}

export interface AssimilateBalanceOutputs {
  grossPhotosynthesis: number;      // umol CO2/m2/s
  netPhotosynthesis: number;        // umol CO2/m2/s
  dailyAssimilates: number;         // g CH2O/m2/day
  carbonUseEfficiency: number;      // ratio (0-1)
}

// Water Balance
export interface WaterBalanceParams {
  // Transpiration drivers
  vpdLeafAir: number;               // kPa
  stomatalConductance: number;      // mol H2O/m2/s
  boundaryLayerConductance: number; // mol H2O/m2/s
  leafAreaIndex: number;            // m2/m2

  // Water supply
  irrigationRate: number;           // L/m2/day
  substrateWaterContent: number;    // % volumetric
  rootWaterUptake: number;          // L/m2/day

  // Environmental
  airTemperature: number;           // C
  relativeHumidity: number;         // %
  radiation: number;                // W/m2
}

export interface WaterBalanceOutputs {
  transpirationRate: number;        // L/m2/hour
  dailyTranspiration: number;       // L/m2/day
  waterUseEfficiency: number;       // g dry matter/L water
  substrateDrainFraction: number;   // ratio
  plantWaterStatus: 'optimal' | 'mild_stress' | 'severe_stress';
}

// Energy Balance
export interface EnergyBalanceParams {
  // Radiation
  solarRadiation: number;           // W/m2
  nirAbsorption: number;            // fraction (0-1)
  parAbsorption: number;            // fraction (0-1)
  longwaveEmission: number;         // W/m2

  // Convection
  leafTemperature: number;          // C
  airTemperature: number;           // C
  windSpeed: number;                // m/s
  convectiveCoefficient: number;    // W/m2/K

  // Latent heat
  transpirationRate: number;        // kg/m2/s
  latentHeatVaporization: number;   // J/kg (default ~2.45e6)
}

export interface EnergyBalanceOutputs {
  netRadiation: number;             // W/m2
  sensibleHeatFlux: number;         // W/m2
  latentHeatFlux: number;           // W/m2
  leafToAirTemperatureDiff: number; // C
  energyBalance: number;            // W/m2 (should be ~0)
}

// ==========================================
// GREENHOUSE-OUTSIDE BALANCE ALGORITHMS
// ==========================================

// Greenhouse Energy Balance
export interface GreenhouseEnergyParams {
  // Solar radiation
  outsideSolarRadiation: number;    // W/m2
  coverTransmissivity: number;      // fraction (0-1)

  // Heat loss
  outsideTemperature: number;       // C
  insideTemperature: number;        // C
  uValue: number;                   // W/m2/K (heat transfer coef)
  infiltrationRate: number;         // air changes per hour

  // Heating/cooling
  heatingCapacity: number;          // W/m2
  heatingSetpoint: number;          // C
  ventilationRate: number;          // m3/m2/hour
  screenPosition: number;           // % closed (0-100)
  screenEffect: number;             // energy saving factor (0-0.7)
}

export interface GreenhouseEnergyOutputs {
  solarHeatGain: number;            // W/m2
  transmittedPAR: number;           // umol/m2/s
  conductionLoss: number;           // W/m2
  ventilationLoss: number;          // W/m2
  heatingRequired: number;          // W/m2
  energyBalance: number;            // W/m2
}

// Humidity Balance
export interface HumidityBalanceParams {
  // Inside conditions
  insideTemperature: number;        // C
  insideHumidity: number;           // %
  transpirationRate: number;        // g H2O/m2/hour
  fogSystemRate: number;            // g H2O/m2/hour

  // Outside conditions
  outsideTemperature: number;       // C
  outsideHumidity: number;          // %

  // Ventilation
  ventilationRate: number;          // m3/m2/hour
  airLeakage: number;               // m3/m2/hour

  // Condensation
  coverTemperature: number;         // C
  pipeTemperature: number;          // C
}

export interface HumidityBalanceOutputs {
  absoluteHumidityInside: number;   // g/m3
  absoluteHumidityOutside: number;  // g/m3
  dewPointInside: number;           // C
  vpdInside: number;                // kPa
  condensationRate: number;         // g/m2/hour
  moistureRemovalRate: number;      // g/m2/hour
  humidityBalance: number;          // g/m2/hour
}

// CO2 Balance
export interface CO2BalanceParams {
  // Inside conditions
  insideCO2: number;                // ppm
  cropCO2Uptake: number;            // g CO2/m2/hour (from photosynthesis)
  soilRespiration: number;          // g CO2/m2/hour

  // Outside conditions
  outsideCO2: number;               // ppm (usually ~420)

  // Enrichment
  co2InjectionRate: number;         // g CO2/m2/hour
  co2Setpoint: number;              // ppm target

  // Ventilation
  ventilationRate: number;          // m3/m2/hour
  airLeakage: number;               // m3/m2/hour
}

export interface CO2BalanceOutputs {
  co2SupplyRate: number;            // g/m2/hour
  co2LossVentilation: number;       // g/m2/hour
  co2NetBalance: number;            // g/m2/hour
  timeToSetpoint: number;           // minutes
  co2UseEfficiency: number;         // g dry matter/g CO2 injected
}

// ==========================================
// CROP JUDGEMENT
// ==========================================

export interface CropJudgementParams {
  // Growth measurements
  plantHeight: number;              // cm
  internodesLength: number;         // cm
  leafLength: number;               // cm
  leafWidth: number;                // cm
  stemDiameter: number;             // mm
  headThickness: number;            // cm

  // Development
  flowersPerTruss: number;          // count
  fruitSet: number;                 // %
  trussDevelopmentRate: number;     // trusses/week

  // Health indicators
  leafColor: 'dark_green' | 'green' | 'light_green' | 'yellow';
  leafRolling: 'none' | 'slight' | 'moderate' | 'severe';

  // Generative/Vegetative balance
  gvBalance: number;                // -10 (vegetative) to +10 (generative)
}

export interface CropJudgementOutputs {
  overallHealth: number;            // 0-100
  growthRate: 'slow' | 'normal' | 'fast';
  generativeStatus: 'too_vegetative' | 'balanced' | 'too_generative';
  recommendations: string[];
}

// ==========================================
// INTEGRATED PEST MANAGEMENT
// ==========================================

export interface IPMParams {
  // Environmental risk factors
  temperature: number;              // C
  humidity: number;                 // %
  leafWetness: boolean;             // wet/dry

  // Pest scouting data
  whitefliesPerLeaf: number;        // count
  aphidsPerLeaf: number;            // count
  spiderMitesPerLeaf: number;       // count
  thripsDamageScore: number;        // 0-5

  // Disease indicators
  botrytisRisk: number;             // 0-100
  powderyMildewRisk: number;        // 0-100

  // Biological control
  predatorMitesReleased: number;    // per m2/week
  parasitoidWaspsReleased: number;  // per m2/week

  // Treatment history
  lastChemicalTreatment: number;    // days ago
  treatmentType: 'none' | 'biological' | 'chemical';
}

export interface IPMOutputs {
  overallPestPressure: number;      // 0-100
  diseaseRisk: number;              // 0-100
  actionThresholdReached: boolean;
  recommendedActions: string[];
  biologicalControlEffectiveness: number; // 0-100
}

// ==========================================
// DASHBOARD STATE
// ==========================================

export interface AlgorithmDashboardState {
  timeScale: TimeScale;

  // Plant-Greenhouse balance
  assimilateParams: AssimilateBalanceParams;
  assimilateOutputs: AssimilateBalanceOutputs;

  waterParams: WaterBalanceParams;
  waterOutputs: WaterBalanceOutputs;

  plantEnergyParams: EnergyBalanceParams;
  plantEnergyOutputs: EnergyBalanceOutputs;

  // Greenhouse-Outside balance
  greenhouseEnergyParams: GreenhouseEnergyParams;
  greenhouseEnergyOutputs: GreenhouseEnergyOutputs;

  humidityParams: HumidityBalanceParams;
  humidityOutputs: HumidityBalanceOutputs;

  co2Params: CO2BalanceParams;
  co2Outputs: CO2BalanceOutputs;

  // Crop management
  cropParams: CropJudgementParams;
  cropOutputs: CropJudgementOutputs;

  ipmParams: IPMParams;
  ipmOutputs: IPMOutputs;
}

// Default parameter values
export const defaultAssimilateParams: AssimilateBalanceParams = {
  lightIntensity: 500,
  lightUseEfficiency: 0.05,
  photoperiod: 16,
  co2Concentration: 800,
  co2CompensationPoint: 50,
  maxPhotosynthesisRate: 25,
  leafAreaIndex: 3.0,
  chlorophyllContent: 2.5,
  maintenanceRespiration: 1.5,
  growthRespiration: 0.25
};

export const defaultWaterParams: WaterBalanceParams = {
  vpdLeafAir: 0.8,
  stomatalConductance: 0.3,
  boundaryLayerConductance: 1.0,
  leafAreaIndex: 3.0,
  irrigationRate: 5.0,
  substrateWaterContent: 60,
  rootWaterUptake: 4.0,
  airTemperature: 22,
  relativeHumidity: 75,
  radiation: 400
};

export const defaultEnergyParams: EnergyBalanceParams = {
  solarRadiation: 400,
  nirAbsorption: 0.2,
  parAbsorption: 0.85,
  longwaveEmission: 50,
  leafTemperature: 23,
  airTemperature: 22,
  windSpeed: 0.3,
  convectiveCoefficient: 10,
  transpirationRate: 0.00005,
  latentHeatVaporization: 2450000
};

export const defaultGreenhouseEnergyParams: GreenhouseEnergyParams = {
  outsideSolarRadiation: 500,
  coverTransmissivity: 0.7,
  outsideTemperature: 10,
  insideTemperature: 22,
  uValue: 6.5,
  infiltrationRate: 0.5,
  heatingCapacity: 200,
  heatingSetpoint: 18,
  ventilationRate: 20,
  screenPosition: 0,
  screenEffect: 0.4
};

export const defaultHumidityParams: HumidityBalanceParams = {
  insideTemperature: 22,
  insideHumidity: 75,
  transpirationRate: 200,
  fogSystemRate: 0,
  outsideTemperature: 10,
  outsideHumidity: 60,
  ventilationRate: 20,
  airLeakage: 0.5,
  coverTemperature: 15,
  pipeTemperature: 45
};

export const defaultCO2Params: CO2BalanceParams = {
  insideCO2: 600,
  cropCO2Uptake: 30,
  soilRespiration: 5,
  outsideCO2: 420,
  co2InjectionRate: 50,
  co2Setpoint: 800,
  ventilationRate: 20,
  airLeakage: 0.5
};

export const defaultCropParams: CropJudgementParams = {
  plantHeight: 250,
  internodesLength: 8,
  leafLength: 40,
  leafWidth: 30,
  stemDiameter: 12,
  headThickness: 12,
  flowersPerTruss: 8,
  fruitSet: 85,
  trussDevelopmentRate: 1.2,
  leafColor: 'green',
  leafRolling: 'none',
  gvBalance: 0
};

export const defaultIPMParams: IPMParams = {
  temperature: 22,
  humidity: 75,
  leafWetness: false,
  whitefliesPerLeaf: 0.5,
  aphidsPerLeaf: 0.2,
  spiderMitesPerLeaf: 0.1,
  thripsDamageScore: 1,
  botrytisRisk: 20,
  powderyMildewRisk: 15,
  predatorMitesReleased: 50,
  parasitoidWaspsReleased: 2,
  lastChemicalTreatment: 30,
  treatmentType: 'biological'
};
