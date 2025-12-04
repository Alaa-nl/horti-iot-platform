import {
  PhotosynthesisParams,
  PhotosynthesisOutputs,
  TranspirationParams,
  TranspirationOutputs,
  EnergyBalanceParams,
  EnergyBalanceOutputs
} from '../types/plantBalance';

// ============== ASSIMILATE BALANCE CALCULATIONS ==============

export function calculatePhotosynthesis(params: PhotosynthesisParams): PhotosynthesisOutputs {
  const {
    quantumYield, lightSaturationPoint, darkRespirationRate,
    co2CompensationPoint, co2SaturationPoint, carboxylationEfficiency,
    optimalTempPhoto, minTempPhoto, maxTempPhoto, q10Respiration,
    leafAreaIndex, specificLeafArea, carbonUseEfficiency,
    lightIntensity, co2Concentration, temperature
  } = params;

  // Temperature response function (0-1)
  const tempResponse = calculateTemperatureResponse(temperature, minTempPhoto, optimalTempPhoto, maxTempPhoto);

  // Light-limited photosynthesis (Michaelis-Menten)
  const lightLimitedRate = (quantumYield * lightIntensity * lightSaturationPoint) /
                           (lightSaturationPoint + lightIntensity) * tempResponse;

  // CO2-limited photosynthesis (Michaelis-Menten)
  const co2LimitedRate = (carboxylationEfficiency * (co2Concentration - co2CompensationPoint) * co2SaturationPoint) /
                         (co2SaturationPoint + (co2Concentration - co2CompensationPoint)) * tempResponse;

  // Take minimum (Liebig's law)
  const grossPhotosynthesis = Math.min(lightLimitedRate, co2LimitedRate) * leafAreaIndex;

  // Dark respiration increases with temperature (Q10 response)
  const tempDiff = (temperature - 20) / 10;
  const darkRespiration = darkRespirationRate * Math.pow(q10Respiration, tempDiff) * leafAreaIndex;

  // Net photosynthesis
  const netPhotosynthesis = Math.max(0, grossPhotosynthesis - darkRespiration);

  // Daily calculations (assuming photoperiod from sunrise to sunset)
  const photoperiodHours = calculatePhotoperiod();
  const dailyAssimilates = netPhotosynthesis * 3600 * photoperiodHours * 30 / 1000000; // Convert to g CH2O/m²/day

  // Carbon gain (44% of CH2O is carbon)
  const carbonGain = dailyAssimilates * 0.44 * carbonUseEfficiency;

  // Efficiency relative to maximum theoretical
  const maxTheoretical = quantumYield * lightSaturationPoint * leafAreaIndex;
  const efficiency = (grossPhotosynthesis / maxTheoretical) * 100;

  return {
    grossPhotosynthesis: parseFloat(grossPhotosynthesis.toFixed(2)),
    darkRespiration: parseFloat(darkRespiration.toFixed(2)),
    netPhotosynthesis: parseFloat(netPhotosynthesis.toFixed(2)),
    lightLimitedRate: parseFloat(lightLimitedRate.toFixed(2)),
    co2LimitedRate: parseFloat(co2LimitedRate.toFixed(2)),
    dailyAssimilates: parseFloat(dailyAssimilates.toFixed(2)),
    carbonGain: parseFloat(carbonGain.toFixed(2)),
    efficiency: parseFloat(efficiency.toFixed(1))
  };
}

// ============== WATER BALANCE CALCULATIONS ==============

export function calculateTranspiration(params: TranspirationParams): TranspirationOutputs {
  const {
    maxStomatalConductance, vpdThresholdLow, vpdThresholdHigh, stomatalSensitivity,
    leafCharacteristicLength, windSpeedEffect, rootHydraulicConductivity,
    rootZoneDepth, criticalWaterPotential, plantCapacitance, xylemConductance,
    vpdAir, windSpeed, soilWaterPotential
  } = params;

  // VPD effect on stomatal conductance
  let stomatalConductance: number;
  if (vpdAir < vpdThresholdLow) {
    stomatalConductance = maxStomatalConductance;
  } else if (vpdAir > vpdThresholdHigh) {
    stomatalConductance = maxStomatalConductance * 0.2; // Severe reduction
  } else {
    // Linear reduction between thresholds
    const vpdEffect = 1 - stomatalSensitivity * (vpdAir - vpdThresholdLow) / (vpdThresholdHigh - vpdThresholdLow);
    stomatalConductance = maxStomatalConductance * vpdEffect;
  }

  // Boundary layer resistance (m²s/mol)
  const boundaryLayerResistance = calculateBoundaryLayerResistance(leafCharacteristicLength, windSpeed * windSpeedEffect);

  // Water potential gradient
  const waterPotentialGradient = soilWaterPotential - criticalWaterPotential;
  const waterStressFactor = Math.max(0, Math.min(1, waterPotentialGradient / 2));

  // Transpiration rate (mmol H2O/m²/s) - simplified Penman-Monteith
  const transpirationRate = (vpdAir * 1000 * stomatalConductance * waterStressFactor) /
                           (1 + stomatalConductance * boundaryLayerResistance);

  // Daily water use (L/m²/day)
  const dailyWaterUse = transpirationRate * 0.018 * 86400 / 1000; // Convert mmol to L

  // Leaf water potential
  const leafWaterPotential = soilWaterPotential - (transpirationRate / (rootHydraulicConductivity * 1000));

  // Water use efficiency (assuming net photosynthesis of 20 μmol CO2/m²/s at optimal conditions)
  const assumedPhotosynthesis = 20 * stomatalConductance / maxStomatalConductance;
  const waterUseEfficiency = assumedPhotosynthesis / (transpirationRate / 1000); // μmol CO2/mmol H2O

  // VPD category
  let vpdCategory: string;
  if (vpdAir < 0.4) vpdCategory = 'Under transpiration';
  else if (vpdAir < 0.6) vpdCategory = 'Low transpiration';
  else if (vpdAir < 1.2) vpdCategory = 'Healthy transpiration';
  else if (vpdAir < 1.8) vpdCategory = 'High transpiration';
  else vpdCategory = 'Over transpiration';

  // Water stress level
  let waterStressLevel: string;
  if (leafWaterPotential > -0.5) waterStressLevel = 'None';
  else if (leafWaterPotential > -1.0) waterStressLevel = 'Mild';
  else if (leafWaterPotential > -1.5) waterStressLevel = 'Moderate';
  else waterStressLevel = 'Severe';

  return {
    transpirationRate: parseFloat(transpirationRate.toFixed(2)),
    dailyWaterUse: parseFloat(dailyWaterUse.toFixed(2)),
    stomatalConductance: parseFloat(stomatalConductance.toFixed(3)),
    boundaryLayerResistance: parseFloat(boundaryLayerResistance.toFixed(2)),
    leafWaterPotential: parseFloat(leafWaterPotential.toFixed(2)),
    waterUseEfficiency: parseFloat(waterUseEfficiency.toFixed(2)),
    vpdCategory,
    waterStressLevel
  };
}

// ============== ENERGY BALANCE CALCULATIONS ==============

export function calculateEnergyBalance(params: EnergyBalanceParams): EnergyBalanceOutputs {
  const {
    leafAbsorptance, leafTransmittance, leafReflectance,
    canopyExtinctionCoeff, convectiveCoefficient, leafEmissivity,
    leafSpecificHeat, latentHeatRatio, sensibleHeatRatio,
    soilHeatFluxRatio, thermalTimeConstant, leafThermalMass,
    solarRadiation, airTemperature, leafTemperature
  } = params;

  // Absorbed radiation (W/m²)
  const interceptedRadiation = solarRadiation * (1 - Math.exp(-canopyExtinctionCoeff));
  const absorbedRadiation = interceptedRadiation * leafAbsorptance;

  // Net radiation (absorbed - emitted)
  const stefanBoltzmann = 5.67e-8;
  const emittedRadiation = leafEmissivity * stefanBoltzmann * Math.pow(leafTemperature + 273.15, 4);
  const netRadiation = absorbedRadiation - (emittedRadiation - leafEmissivity * stefanBoltzmann * Math.pow(airTemperature + 273.15, 4));

  // Temperature difference
  const leafAirTempDiff = leafTemperature - airTemperature;

  // Sensible heat flux (convective heat transfer)
  const sensibleHeatFlux = convectiveCoefficient * leafAirTempDiff;

  // Latent heat flux (evapotranspiration)
  const latentHeatFlux = netRadiation * latentHeatRatio;

  // Soil heat flux
  const soilHeatFlux = netRadiation * soilHeatFluxRatio;

  // Energy for photosynthesis (about 5% of absorbed PAR)
  const photosynthesisEnergy = absorbedRadiation * 0.45 * 0.05; // 45% is PAR, 5% used in photosynthesis

  // Energy balance check (should be close to 0)
  const energyBalance = netRadiation - sensibleHeatFlux - latentHeatFlux - soilHeatFlux - photosynthesisEnergy;

  // Bowen ratio
  const bowenRatio = sensibleHeatFlux / latentHeatFlux;

  return {
    netRadiation: parseFloat(netRadiation.toFixed(2)),
    absorbedRadiation: parseFloat(absorbedRadiation.toFixed(2)),
    sensibleHeatFlux: parseFloat(sensibleHeatFlux.toFixed(2)),
    latentHeatFlux: parseFloat(latentHeatFlux.toFixed(2)),
    soilHeatFlux: parseFloat(soilHeatFlux.toFixed(2)),
    photosynthesisEnergy: parseFloat(photosynthesisEnergy.toFixed(2)),
    leafAirTempDiff: parseFloat(leafAirTempDiff.toFixed(2)),
    energyBalance: parseFloat(energyBalance.toFixed(2)),
    bowenRatio: parseFloat(bowenRatio.toFixed(3))
  };
}

// ============== HELPER FUNCTIONS ==============

function calculateTemperatureResponse(temp: number, min: number, opt: number, max: number): number {
  if (temp < min || temp > max) return 0;

  const alpha = Math.log(2) / Math.log((max - min) / (opt - min));
  const relativeTemp = (temp - min) / (opt - min);
  const response = Math.pow(relativeTemp, alpha) * Math.exp(alpha * (1 - relativeTemp));

  return Math.max(0, Math.min(1, response));
}

function calculateBoundaryLayerResistance(leafLength: number, windSpeed: number): number {
  // Simplified boundary layer resistance calculation
  const diffusivity = 2.4e-5; // Diffusivity of water vapor in air (m²/s)
  const kinematicViscosity = 1.5e-5; // Kinematic viscosity of air (m²/s)

  const reynolds = (windSpeed * leafLength) / kinematicViscosity;
  const schmidt = kinematicViscosity / diffusivity;

  // Forced convection
  const nusselt = 0.664 * Math.pow(reynolds, 0.5) * Math.pow(schmidt, 0.33);
  const resistance = leafLength / (nusselt * diffusivity);

  return resistance;
}

function calculatePhotoperiod(): number {
  // Simplified photoperiod calculation (would normally depend on latitude and day of year)
  // For now, return a typical value
  return 12; // 12 hours of daylight
}

// ============== TIME-SCALE AGGREGATION ==============

export function aggregateToTimeScale(
  instantValues: any,
  timeScale: 'realtime' | 'daily' | 'seasonal'
): any {
  // This function would aggregate instantaneous values to different time scales
  // For now, return multiplied values as a simple example

  const multipliers = {
    realtime: 1,
    daily: 24,
    seasonal: 24 * 90 // 90 days
  };

  const multiplier = multipliers[timeScale];

  return {
    ...instantValues,
    // Scale appropriate values by time
    dailyAssimilates: instantValues.dailyAssimilates * (timeScale === 'realtime' ? 1/24 : timeScale === 'seasonal' ? 90 : 1),
    dailyWaterUse: instantValues.dailyWaterUse * (timeScale === 'realtime' ? 1/24 : timeScale === 'seasonal' ? 90 : 1),
    carbonGain: instantValues.carbonGain * (timeScale === 'realtime' ? 1/24 : timeScale === 'seasonal' ? 90 : 1)
  };
}