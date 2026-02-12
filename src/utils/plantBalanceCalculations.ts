// Plant Assimilate Balance Calculation Utilities
// Based on Plant Empowerment book methodology
import { AssimilateBalance, WaterBalance, EnergyBalance } from '../types/plantBalance';

// Constants from scientific calculations
const ENERGY_PER_LITER = 2500; // KJ to evaporate 1 liter water

// Psychrometric calculations
export const calculateVPD = (temperature: number, humidity: number): number => {
  // Calculate Saturated Vapor Pressure (Magnus formula)
  // From psychrometric principles
  const saturatedVP = 0.611 * Math.exp((17.27 * temperature) / (temperature + 237.3));
  const actualVP = saturatedVP * (humidity / 100);
  return (saturatedVP - actualVP) * 1000; // Convert to Pa
};

// Calculate VPDi (Internal VPD using plant/leaf temperature)
// As requested by supervisor: "To calculate VPDi you need to include plant temperature"
export const calculateVPDi = (
  leafTemperature: number, // Plant/leaf temperature
  airTemperature: number, // Air temperature
  humidity: number // Relative humidity
): number => {
  // Calculate saturated VP at leaf temperature
  const leafSaturatedVP = 0.611 * Math.exp((17.27 * leafTemperature) / (leafTemperature + 237.3));

  // Calculate actual VP in air (using air temperature and humidity)
  const airSaturatedVP = 0.611 * Math.exp((17.27 * airTemperature) / (airTemperature + 237.3));
  const actualVP = airSaturatedVP * (humidity / 100);

  // VPDi = VP at leaf temperature - actual VP in air
  return (leafSaturatedVP - actualVP) * 1000; // Convert to Pa
};

// Calculate absolute humidity (g/kg)
export const calculateAbsoluteHumidity = (temperature: number, relativeHumidity: number): number => {
  // Saturated vapor pressure at temperature (kPa)
  const saturatedVP = 0.611 * Math.exp((17.27 * temperature) / (temperature + 237.3));
  // Actual vapor pressure
  const actualVP = saturatedVP * (relativeHumidity / 100);
  // Convert to absolute humidity (g/kg)
  // Using psychrometric formula: AH = 622 * (e / (P - e)) where P = 101.325 kPa
  const atmosphericPressure = 101.325; // kPa
  return 622 * (actualVP / (atmosphericPressure - actualVP)); // g/kg
};

// Calculate enthalpy - Updated per client specification
export const calculateEnthalpy = (temperature: number, humidity: number): number => {
  // Per client: Per 1°C temperature increase above zero, enthalpy increases by 1 kJ/kg (sensible heat)
  const sensibleHeat = temperature * 1; // kJ/kg

  // Calculate absolute humidity
  const absoluteHumidity = calculateAbsoluteHumidity(temperature, humidity); // g/kg
  const absoluteHumidityKg = absoluteHumidity / 1000; // Convert to kg/kg

  // Per client: Per liter (kg) of water it takes 2500 kJ to transpire (latent heat)
  const latentHeat = absoluteHumidityKg * 2500; // kJ/kg

  // Total enthalpy = sensible + latent heat
  return sensibleHeat + latentHeat;
};

// Water Use Efficiency calculation
// WUE = 34 gram/liter (standard greenhouse value)
export const calculateWUE = (co2Uptake: number, transpiration: number): number => {
  if (transpiration === 0) return 0;

  // Based on: (Ca - Ci) × gCO2 / (Hi - Ha) × gH2O
  // Using the standard ratio: 0.2176 / 6.4 = 0.034 kg/L = 34 g/L
  return 34; // Fixed value from greenhouse studies
};

// Photosynthesis calculation (educational model)
export const calculatePhotosynthesis = (
  parLight: number,
  co2Level: number,
  temperature: number,
  humidity: number
): number => {
  // EDUCATIONAL MODEL: Simple factors affecting photosynthesis

  // 1. LIGHT: More light = more photosynthesis (up to a point)
  // Saturation around 600-800 μmol/m²/s for most greenhouse crops
  const maxLight = 600;
  const lightFactor = Math.min(1, parLight / maxLight);

  // 2. CO2: More CO2 = more photosynthesis
  // Normal air = 400 ppm, greenhouse enrichment = 800-1000 ppm
  const normalCO2 = 400;
  const co2Factor = Math.min(2, co2Level / normalCO2);

  // 3. TEMPERATURE: Best around 20-25°C
  let tempFactor;
  if (temperature < 15) tempFactor = 0.5;
  else if (temperature > 30) tempFactor = 0.6;
  else if (temperature >= 20 && temperature <= 25) tempFactor = 1;
  else tempFactor = 0.8;

  // 4. HUMIDITY: Too dry = stomata close = less photosynthesis
  const humidityFactor = humidity < 40 ? 0.7 : humidity > 80 ? 0.9 : 1;

  // Basic photosynthesis rate (μmol/m²/s)
  const baseRate = 15; // Typical for greenhouse vegetables

  // Combined effect
  return baseRate * lightFactor * co2Factor * tempFactor * humidityFactor;
};

// Respiration calculation (educational model)
export const calculateRespiration = (
  temperature: number,
  leafTemperature: number
): number => {
  // EDUCATIONAL MODEL: Plants "breathe" and use energy
  // Higher temperature = more respiration (energy use)

  const avgTemp = (temperature + leafTemperature) / 2;

  // Simple respiration based on temperature
  let respiration;
  if (avgTemp < 15) respiration = 0.8; // Low respiration when cold
  else if (avgTemp > 30) respiration = 3.0; // High respiration when hot
  else if (avgTemp >= 20 && avgTemp <= 25) respiration = 1.5; // Normal respiration
  else respiration = 1.2;

  return respiration; // μmol/m²/s
};

// Net assimilation calculation
export const calculateNetAssimilation = (assimilate: AssimilateBalance): AssimilateBalance => {
  const photosynthesis = calculatePhotosynthesis(
    assimilate.parLight,
    assimilate.co2Level,
    assimilate.temperature,
    assimilate.humidity
  );

  const respiration = calculateRespiration(
    assimilate.temperature,
    assimilate.leafTemperature
  );

  return {
    ...assimilate,
    photosynthesis,
    respiration,
    netAssimilation: photosynthesis - respiration
  };
};

// Transpiration calculation - Updated per client specification
export const calculateTranspiration = (
  temperature: number,
  radiation: number, // W/m²
  humidity: number,
  leafTemperature: number = -999, // Optional, if -999 use temperature + 1
  airSpeed: number = 1.0, // m/s
  irrigationRate: number = 2.5 // L/m²/h
): number => {
  // Per client specification: transpiration based on radiation and enthalpy difference

  // Use leaf temperature if provided, otherwise assume slightly warmer than air
  const actualLeafTemp = leafTemperature === -999 ? temperature + 1 : leafTemperature;

  // Calculate VPDi which affects transpiration
  const vpdi = calculateVPDi(actualLeafTemp, temperature, humidity) / 1000; // kPa

  // Convert radiation from W/m² to daily value kJ/m²/day
  // 1 W/m² = 86.4 kJ/m²/day (for 24 hours)
  // For greenhouse hours (12 hours typical), use half: 43.2
  const dailyRadiation = radiation * 43.2; // kJ/m²/day for 12 hour photoperiod

  // Per client: To transpire 1 liter of water you need 2500 kJ/m²
  const baseTranspiration = dailyRadiation / 2500; // L/m²/day

  // Convert to hourly rate
  let hourlyTranspiration = baseTranspiration / 24; // L/m²/h

  // Apply VPDi factor (optimal between 0.6 and 1.2 kPa)
  let vpdiEffect = 1.0;
  if (vpdi < 0.6) {
    vpdiEffect = 0.7; // Low VPDi reduces transpiration
  } else if (vpdi > 1.2) {
    vpdiEffect = Math.max(0.5, 1.2 / vpdi); // High VPDi reduces transpiration (stomata closing)
  }

  // Air speed effect (higher air speed increases transpiration)
  const airSpeedEffect = 0.8 + (airSpeed * 0.2); // 0.8 to 1.4 typically

  // Irrigation effect (more water availability allows more transpiration)
  const irrigationEffect = Math.min(1.2, irrigationRate / 2.5);

  // Temperature effect on stomatal conductance
  const tempEffect = temperature < 15 ? 0.6 : temperature > 30 ? 0.7 : 1.0;

  // Combined transpiration with all scaling factors
  hourlyTranspiration = hourlyTranspiration * vpdiEffect * airSpeedEffect * irrigationEffect * tempEffect;

  // Ensure minimum transpiration
  return Math.max(0.1, hourlyTranspiration);
};

// RTR (Expected Temperature Increase from Radiation)
// Based on greenhouse data regression analysis
export const calculateRTR = (
  temperature: number, // Not used in calculation, kept for compatibility
  parLight: number // μmol/m²/s PAR light
): number => {
  // EDUCATIONAL NOTE:
  // RTR tells us how much warmer the greenhouse should be based on light level
  // Based on actual greenhouse data regression: y = 0.0534x + 16.023
  // Where x is DLI in mol/m²/day and y is the expected temperature
  // The slope (0.0534) represents the temperature increase per mol of light

  // Convert PAR to Daily Light Integral (DLI)
  // DLI = PAR (μmol/m²/s) × hours × 3600 / 1,000,000 = mol/m²/day
  const hoursOfLight = 12; // Typical photoperiod
  const dli = (parLight * hoursOfLight * 3600) / 1000000; // mol/m²/day

  // RTR calculation based on regression analysis from actual greenhouse data
  // Using the more accurate coefficient from the regression: 0.0534°C/mol
  // Note: Some sources simplify this to 0.2°C/mol (6°C per 30 mol), but
  // the actual data shows 0.0534°C/mol is more accurate
  const rtr = dli * 0.0534;

  return rtr;
};

// Production estimation based on light integral
// From greenhouse production models
export const estimateWeeklyProduction = (
  netAssimilation: number,
  lightHours: number = 12
): number => {
  // Convert μmol/m²/s to mol/m²/day
  const dailyAssimilation = netAssimilation * lightHours * 3600 / 1000000;

  // Carbon to dry matter conversion
  // 1 mol CO2 = 44g CO2 = 12g C
  // Dry matter is about 45% carbon
  const carbonToDryMatter = 1 / 0.45;

  // Weekly dry matter production (g/m²/week)
  const weeklyDryMatter = dailyAssimilation * 12 * carbonToDryMatter * 7;

  // Fresh weight (assuming 95% water content for tomatoes)
  const freshWeight = weeklyDryMatter / 0.05;

  // Convert g to kg
  return freshWeight / 1000;
};

// Daily Light Integral calculation (mol/m²/day)
export const calculateDLI = (parLight: number, hours: number = 12): number => {
  // PAR μmol/m²/s × seconds × hours / 1,000,000 = mol/m²/day
  return parLight * 3600 * hours / 1000000;
};

// Helper function to get balance status
export const getBalanceStatus = (value: number, optimal: number, tolerance: number = 0.2): string => {
  const ratio = value / optimal;
  if (Math.abs(ratio - 1) < tolerance) return 'optimal';
  if (ratio < 1 - tolerance) return 'low';
  return 'high';
};

// Format values for display
export const formatValue = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals);
};

// ==================== WATER BALANCE CALCULATIONS ====================

// Calculate stomatal conductance (educational model)
export const calculateStomatalConductance = (
  vpd: number, // kPa
  light: number, // μmol/m²/s
  co2: number = 0 // ppm - optional, not used in water balance
): number => {
  // EDUCATIONAL SIMPLIFICATION:
  // For water balance, stomata response depends on VPD and light only
  // High light = stomata open more
  // Low humidity (high VPD) = stomata close to save water

  // Simple light response (0 to 1)
  const lightResponse = Math.min(1, light / 600);

  // Simple VPD response (optimal around 1 kPa)
  const vpdResponse = vpd < 0.5 ? 0.7 : vpd > 2 ? 0.3 : 1;

  // Basic conductance calculation
  const baseConductance = 400; // mmol/m²/s baseline
  return baseConductance * lightResponse * vpdResponse;
};

// Calculate root water uptake (educational model)
export const calculateRootUptake = (
  rootTemp: number, // °C
  vpd: number, // kPa
  radiation: number, // W/m² - kept for compatibility, not used in simplified model
  leafTemperature: number = 20 // Plant/leaf temperature for constraint
): number => {
  // EDUCATIONAL MODEL: How much water roots can take up
  // Best root temperature: 18-22°C
  // CONSTRAINT: Root temperature may not be higher or lower than 1°C related to plant temperature (per client)

  // Enforce ±1°C constraint
  const constrainedRootTemp = Math.max(
    leafTemperature - 1,
    Math.min(leafTemperature + 1, rootTemp)
  );

  let uptakeRate;
  if (constrainedRootTemp < 15) uptakeRate = 2; // Cold roots = slow uptake
  else if (constrainedRootTemp > 25) uptakeRate = 3; // Warm roots = reduced uptake
  else if (constrainedRootTemp >= 18 && constrainedRootTemp <= 22) uptakeRate = 4; // Optimal uptake
  else uptakeRate = 3.5;

  // Increase uptake when plant needs more water (high VPD)
  const demandFactor = vpd > 2 ? 1.2 : 1;

  return uptakeRate * demandFactor; // L/m²/h
};

// Calculate water for growth
export const calculateGrowthWater = (
  netAssimilation: number // μmol/m²/s
): number => {
  // Water incorporated into biomass
  // About 5% of transpiration typically
  const dryMatterProduction = netAssimilation * 0.03; // g/m²/h simplified
  const waterContent = 0.95; // 95% water in fresh weight

  return dryMatterProduction * (waterContent / (1 - waterContent)) / 1000; // L/m²/h
};

// Complete water balance calculation - Updated with all scaling parameters
export const calculateWaterBalance = (
  temperature: number,
  humidity: number,
  parLight: number,
  rootTemperature: number,
  co2Level: number, // Kept for interface compatibility
  irrigation: number = 2.5, // Default irrigation L/m²/h
  leafTemperature: number = -999, // Optional leaf temperature
  airSpeed: number = 1.0 // Air speed near stomata (m/s)
): WaterBalance => {
  // Use provided leaf temperature or default to slightly warmer than air
  const actualLeafTemp = leafTemperature === -999 ? temperature + 1 : leafTemperature;

  // Calculate VPD and VPDi
  const vpd = calculateVPD(temperature, humidity) / 1000; // kPa
  const vpdi = calculateVPDi(actualLeafTemp, temperature, humidity) / 1000; // kPa

  // Convert PAR to radiation estimate
  // PAR is ~45% of total solar radiation, convert μmol/m²/s to W/m²
  // 1 μmol/m²/s PAR ≈ 0.22 W/m² total radiation
  const radiation = parLight * 0.22;

  // Calculate transpiration with all parameters
  const transpiration = calculateTranspiration(
    temperature,
    radiation,
    humidity,
    actualLeafTemp,
    airSpeed,
    irrigation
  );

  // Calculate root uptake with proper temperature constraint (±1°C from leaf temp)
  let rootUptake = calculateRootUptake(rootTemperature, vpdi, radiation, actualLeafTemp);

  // Scale by irrigation availability (base uptake rate scaled by irrigation)
  rootUptake = rootUptake * (irrigation / 2.5); // Normalize to base irrigation rate of 2.5 L/m²/h

  // Adjust for VPDi (affects root water demand)
  if (vpdi > 1.5) {
    rootUptake *= 1.2; // Increase uptake for high demand
  } else if (vpdi < 0.5) {
    rootUptake *= 0.8; // Decrease uptake for low demand
  }

  // Stomatal conductance with air speed effect
  const baseStomatalConductance = calculateStomatalConductance(vpdi, parLight);
  const stomatalConductance = baseStomatalConductance * (0.9 + airSpeed * 0.1);

  // Growth water scales with net assimilation
  const netAssimilation = parLight * 0.0375 - 1.5; // Simplified
  const growthWater = calculateGrowthWater(Math.max(0, netAssimilation));

  // Drainage scales with irrigation rate
  const drainage = irrigation * 0.3; // 30% drainage typical

  // Calculate net balance
  const totalInput = rootUptake + irrigation;
  const totalOutput = transpiration + growthWater + drainage;
  const netWaterBalance = totalInput - totalOutput;

  let waterStatus: 'deficit' | 'balanced' | 'surplus';
  if (netWaterBalance < -0.5) waterStatus = 'deficit';
  else if (netWaterBalance > 0.5) waterStatus = 'surplus';
  else waterStatus = 'balanced';

  return {
    rootUptake,
    irrigationSupply: irrigation,
    transpiration,
    growthWater,
    drainage,
    vpd,
    rootTemperature,
    stomatalConductance,
    netWaterBalance,
    waterStatus
  };
};

// ==================== ENERGY BALANCE CALCULATIONS ====================

// Calculate sensible heat transfer
export const calculateSensibleHeat = (
  leafTemp: number,
  airTemp: number,
  boundaryLayerConductance: number
): number => {
  // Sensible heat in W/m²
  const tempDiff = leafTemp - airTemp;
  const cp = 29.3; // Heat capacity of air J/mol/K

  // Convert conductance from mmol/m²/s to mol/m²/s
  const conductanceMol = boundaryLayerConductance / 1000;

  return tempDiff * cp * conductanceMol;
};

// Calculate latent heat (evaporation energy)
export const calculateLatentHeat = (
  transpiration: number // L/m²/h
): number => {
  // Convert transpiration to W/m²
  // 2.5 MJ/kg water evaporation energy (supervisor requirement)
  const evaporationEnergy = 2500; // kJ/kg
  const transpirationKgPerS = transpiration / 3600; // Convert to kg/m²/s

  return transpirationKgPerS * evaporationEnergy * 1000 / 1000; // W/m²
};

// Calculate photochemical energy use
export const calculatePhotochemicalEnergy = (
  photosynthesis: number // μmol/m²/s
): number => {
  // Energy used in photosynthesis
  // About 469 kJ/mol glucose formed
  const energyPerMol = 469; // kJ/mol
  const photosynthesisMol = photosynthesis / 1000000; // Convert to mol/m²/s

  return photosynthesisMol * energyPerMol * 1000; // W/m²
};

// Calculate boundary layer conductance
export const calculateBoundaryLayerConductance = (
  windSpeed: number = 0.5 // m/s, typical greenhouse
): number => {
  // Simplified model for boundary layer conductance
  // Based on leaf size and wind speed
  const leafWidth = 0.1; // m, typical leaf width
  const d = 0.7 * leafWidth; // Characteristic dimension

  // Empirical formula
  return 360 * Math.sqrt(windSpeed / d); // mmol/m²/s
};

// Complete energy balance calculation
export const calculateEnergyBalance = (
  temperature: number,
  leafTemperature: number,
  humidity: number,
  parLight: number,
  photosynthesis: number
): EnergyBalance => {
  // Calculate radiation components - Fixed calculation
  // PAR is approximately 45% of total solar radiation
  // Total solar radiation from PAR: PAR / 0.45
  const totalSolarRadiation = (parLight * 4.6) / 0.45; // Convert PAR µmol/m²/s to W/m² and extrapolate total

  // Net radiation is incoming minus outgoing (longwave radiation losses)
  // Simplified: Net radiation is about 75% of total incoming radiation
  const netRadiation = totalSolarRadiation * 0.75;

  // PAR absorption by leaves (85% of PAR radiation)
  const parAbsorption = parLight * 4.6 * 0.85; // Convert PAR to W/m² with 85% absorption

  // Calculate heat transfer components
  const boundaryLayerConductance = calculateBoundaryLayerConductance();
  const leafAirTempDiff = leafTemperature - temperature;

  const transpiration = calculateTranspiration(temperature, netRadiation, humidity);
  const sensibleHeat = calculateSensibleHeat(leafTemperature, temperature, boundaryLayerConductance);
  const latentHeat = calculateLatentHeat(transpiration);
  const photochemical = calculatePhotochemicalEnergy(photosynthesis);

  // Calculate net balance
  // Total input is just net radiation (PAR absorption is part of it)
  const totalInput = netRadiation;
  const totalOutput = sensibleHeat + latentHeat + photochemical;
  const netEnergyBalance = totalInput - totalOutput;

  // Bowen ratio
  const bowenRatio = Math.abs(sensibleHeat / (latentHeat || 1));

  let energyStatus: 'cooling' | 'balanced' | 'heating';
  if (netEnergyBalance < -50) energyStatus = 'cooling';
  else if (netEnergyBalance > 50) energyStatus = 'heating';
  else energyStatus = 'balanced';

  return {
    netRadiation,
    parAbsorption,
    heating: 0, // Not actively calculated, user adjustable
    sensibleHeat,
    latentHeat,
    photochemical,
    leafAirTempDiff,
    boundaryLayerConductance,
    netEnergyBalance,
    bowenRatio,
    energyStatus
  };
};