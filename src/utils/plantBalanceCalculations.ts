// Plant Assimilate Balance Calculation Utilities
// Based on Plant Empowerment book methodology
import { AssimilateBalance, WaterBalance, EnergyBalance } from '../types/plantBalance';

// Constants from scientific calculations
const ENERGY_PER_LITER = 2500; // KJ to evaporate 1 liter water
const MOLECULAR_WEIGHT_H2O = 18; // g/mol
const MOLECULAR_WEIGHT_CO2 = 44; // g/mol
const DIFFUSION_RATIO = 1.6; // CO2 to H2O diffusion ratio

// Psychrometric calculations
export const calculateVPD = (temperature: number, humidity: number): number => {
  // Calculate Saturated Vapor Pressure (Magnus formula)
  // From psychrometric principles
  const saturatedVP = 0.611 * Math.exp((17.27 * temperature) / (temperature + 237.3));
  const actualVP = saturatedVP * (humidity / 100);
  return (saturatedVP - actualVP) * 1000; // Convert to Pa
};

// Calculate enthalpy
export const calculateEnthalpy = (temperature: number, humidity: number): number => {
  // Enthalpy = (1 kJ × 1°C × T) + (g_water × 2500)
  const waterContent = humidity * 0.01 * 12.91; // g/kg at saturation
  return temperature + (waterContent * ENERGY_PER_LITER / 1000);
};

// Water Use Efficiency calculation
// WUE = 34 gram/liter (standard greenhouse value)
export const calculateWUE = (co2Uptake: number, transpiration: number): number => {
  if (transpiration === 0) return 0;

  // Based on: (Ca - Ci) × gCO2 / (Hi - Ha) × gH2O
  // Using the standard ratio: 0.2176 / 6.4 = 0.034 kg/L = 34 g/L
  return 34; // Fixed value from greenhouse studies
};

// Photosynthesis calculation based on Plant Empowerment methodology
export const calculatePhotosynthesis = (
  parLight: number,
  co2Level: number,
  temperature: number,
  humidity: number
): number => {
  // Calculate VPD effect on stomatal conductance
  const vpd = calculateVPD(temperature, humidity) / 1000; // kPa

  // Stomatal conductance factor (VPD affects stomata)
  // Stomata close when VPD > 2.5 kPa
  const vpdFactor = vpd > 2.5 ? 0.5 : vpd > 1.5 ? (2.5 - vpd) : 1;

  // CO2 gradient approach
  // Ca (ambient) - Ci (internal) = gradient for CO2 uptake
  const ca = co2Level; // ppm ambient
  const ci = ca * 0.66; // internal is typically 66% of ambient
  const co2Gradient = (ca - ci) / 1000; // Convert to relative factor

  // Light response (using more realistic curve)
  // Maximum rate around 25-30 μmol/m²/s for most crops
  const lightSaturation = 800; // μmol/m²/s typical saturation point
  const lightFactor = parLight / (parLight + lightSaturation / 2);

  // Temperature response (optimal around 25°C)
  const tempOptimal = 25;
  const tempFactor = Math.exp(-Math.pow((temperature - tempOptimal) / 10, 2));

  // Maximum photosynthesis rate (realistic for tomatoes)
  const maxPhotoRate = 25; // μmol/m²/s

  // Combined calculation
  return maxPhotoRate * lightFactor * co2Gradient * tempFactor * vpdFactor;
};

// Respiration calculation (Q10 model from Plant Empowerment)
export const calculateRespiration = (
  temperature: number,
  leafTemperature: number
): number => {
  // Maintenance respiration increases with temperature
  // Q10 = 2 means doubles every 10°C
  const Q10 = 2;
  const baseRespiration = 1.5; // μmol/m²/s at 20°C (higher base rate)
  const avgTemp = (temperature + leafTemperature) / 2;

  // Dark respiration is typically 5-10% of max photosynthesis
  return baseRespiration * Math.pow(Q10, (avgTemp - 20) / 10);
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

// Transpiration calculation
export const calculateTranspiration = (
  temperature: number,
  radiation: number,
  humidity: number,
  leafSize: number = 0.05 // m, typical leaf size
): number => {
  // VPD drives transpiration
  const vpd = calculateVPD(temperature, humidity) / 1000; // kPa

  // Energy available for evaporation
  // 2500 KJ to evaporate 1 liter water
  const radiationW = radiation * 0.5; // PAR to total radiation
  const energyAvailable = radiationW / ENERGY_PER_LITER;

  // Transpiration rate (L/m²/h)
  // Based on VPD and available energy
  return energyAvailable * vpd * 10; // Simplified formula
};

// RTR (Ratio Temperature to Radiation) for short-term monitoring
// From Plant Empowerment book
export const calculateRTR = (
  temperature: number,
  radiation: number // W/m²
): number => {
  if (radiation === 0) return 0;

  // RTR = Temperature difference / (Radiation/100)
  // Use temperature above base (typically 18°C for tomatoes)
  const baseTemp = 18;
  const tempDiff = temperature - baseTemp;
  return tempDiff / (radiation / 100);
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

// Calculate stomatal conductance (simplified model)
export const calculateStomatalConductance = (
  vpd: number, // kPa
  light: number, // μmol/m²/s
  co2: number // ppm
): number => {
  // Stomatal conductance in mmol/m²/s
  // Based on Ball-Berry model simplified
  const lightFactor = light / (light + 200);
  const co2Factor = co2 / 400; // normalized to 400 ppm
  const vpdFactor = Math.max(0.3, 1 - vpd / 3); // Reduces with high VPD

  const maxConductance = 800; // mmol/m²/s maximum
  return maxConductance * lightFactor * co2Factor * vpdFactor;
};

// Calculate root water uptake
export const calculateRootUptake = (
  rootTemp: number, // °C
  vpd: number, // kPa
  radiation: number // W/m²
): number => {
  // Root uptake in L/m²/h
  // Temperature effect (optimal around 20-22°C)
  const tempFactor = Math.exp(-Math.pow((rootTemp - 21) / 8, 2));

  // Demand driven by transpiration
  const transpirationDemand = calculateTranspiration(rootTemp + 4, radiation, 65); // Estimate air conditions

  // Root uptake capacity
  const maxUptake = 6; // L/m²/h maximum for mature plants
  return Math.min(maxUptake * tempFactor, transpirationDemand * 1.1); // 10% safety margin
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

// Complete water balance calculation
export const calculateWaterBalance = (
  temperature: number,
  humidity: number,
  parLight: number,
  rootTemperature: number,
  co2Level: number,
  irrigation: number = 2.5 // Default irrigation L/m²/h
): WaterBalance => {
  const vpd = calculateVPD(temperature, humidity) / 1000; // kPa
  const radiation = parLight * 0.5; // Estimate total radiation from PAR

  const stomatalConductance = calculateStomatalConductance(vpd, parLight, co2Level);
  const transpiration = calculateTranspiration(temperature, radiation, humidity);
  const rootUptake = calculateRootUptake(rootTemperature, vpd, radiation);
  const growthWater = calculateGrowthWater(15); // Assuming moderate assimilation

  // Calculate net balance
  const totalInput = rootUptake + irrigation;
  const totalOutput = transpiration + growthWater + 0.5; // 0.5 L/m²/h typical drainage
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
    drainage: 0.5,
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
  // 2.45 MJ/kg water evaporation energy
  const evaporationEnergy = 2450; // kJ/kg
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
  // Calculate radiation components
  const netRadiation = parLight * 0.5 * 4.6; // Convert PAR to total radiation W/m²
  const parAbsorption = parLight * 0.85 * 4.6; // 85% absorption, convert to W/m²

  // Calculate heat transfer components
  const boundaryLayerConductance = calculateBoundaryLayerConductance();
  const leafAirTempDiff = leafTemperature - temperature;

  const transpiration = calculateTranspiration(temperature, netRadiation, humidity);
  const sensibleHeat = calculateSensibleHeat(leafTemperature, temperature, boundaryLayerConductance);
  const latentHeat = calculateLatentHeat(transpiration);
  const photochemical = calculatePhotochemicalEnergy(photosynthesis);

  // Calculate net balance
  const totalInput = netRadiation + parAbsorption;
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