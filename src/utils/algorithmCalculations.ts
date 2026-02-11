// Algorithm Calculations for Greenhouse Balance Models
import {
  AssimilateBalanceParams, AssimilateBalanceOutputs,
  WaterBalanceParams, WaterBalanceOutputs,
  EnergyBalanceParams, EnergyBalanceOutputs,
  GreenhouseEnergyParams, GreenhouseEnergyOutputs,
  HumidityBalanceParams, HumidityBalanceOutputs,
  CO2BalanceParams, CO2BalanceOutputs,
  CropJudgementParams, CropJudgementOutputs,
  IPMParams, IPMOutputs
} from '../types/algorithms';

// ==========================================
// PLANT-GREENHOUSE BALANCE CALCULATIONS
// ==========================================

/**
 * Calculate assimilate (photosynthesis) balance
 * Based on Farquhar model simplified
 */
export function calculateAssimilateBalance(params: AssimilateBalanceParams): AssimilateBalanceOutputs {
  const {
    lightIntensity,
    lightUseEfficiency,
    photoperiod,
    co2Concentration,
    co2CompensationPoint,
    maxPhotosynthesisRate,
    leafAreaIndex,
    maintenanceRespiration,
    growthRespiration
  } = params;

  // CO2 response curve (simplified Michaelis-Menten)
  const km = 300; // Half-saturation constant for CO2
  const co2Factor = (co2Concentration - co2CompensationPoint) / (km + co2Concentration - co2CompensationPoint);

  // Light response curve
  const alpha = lightUseEfficiency;
  const lightLimitedRate = alpha * lightIntensity;

  // Combined rate (minimum of light and CO2 limited)
  const grossPhotosynthesis = Math.min(
    lightLimitedRate * co2Factor,
    maxPhotosynthesisRate * co2Factor
  ) * leafAreaIndex;

  // Net photosynthesis after respiration
  const totalRespiration = maintenanceRespiration + (grossPhotosynthesis * growthRespiration);
  const netPhotosynthesis = Math.max(0, grossPhotosynthesis - totalRespiration);

  // Daily assimilates (convert from umol CO2 to g CH2O)
  // 1 umol CO2 = 30 ug CH2O, photoperiod in hours
  const dailyAssimilates = netPhotosynthesis * 30 * photoperiod * 3600 / 1e6;

  // Carbon use efficiency
  const carbonUseEfficiency = grossPhotosynthesis > 0
    ? netPhotosynthesis / grossPhotosynthesis
    : 0;

  return {
    grossPhotosynthesis: Math.round(grossPhotosynthesis * 100) / 100,
    netPhotosynthesis: Math.round(netPhotosynthesis * 100) / 100,
    dailyAssimilates: Math.round(dailyAssimilates * 100) / 100,
    carbonUseEfficiency: Math.round(carbonUseEfficiency * 1000) / 1000
  };
}

/**
 * Calculate water balance (transpiration model)
 * Based on Penman-Monteith simplified
 */
export function calculateWaterBalance(params: WaterBalanceParams): WaterBalanceOutputs {
  const {
    vpdLeafAir,
    stomatalConductance,
    boundaryLayerConductance,
    leafAreaIndex,
    irrigationRate,
    substrateWaterContent,
    // rootWaterUptake, // Reserved for future calculations
    airTemperature,
    relativeHumidity,
    // radiation // Reserved for future calculations
  } = params;

  // Calculate VPD if not directly provided
  const saturationPressure = 0.6108 * Math.exp(17.27 * airTemperature / (airTemperature + 237.3));
  const calculatedVPD = vpdLeafAir || saturationPressure * (1 - relativeHumidity / 100);

  // Total conductance (series)
  const totalConductance = (stomatalConductance * boundaryLayerConductance) /
    (stomatalConductance + boundaryLayerConductance);

  // Transpiration rate (mol H2O / m2 / s)
  const transpirationMol = totalConductance * calculatedVPD / 101.3; // Divide by atmospheric pressure

  // Convert to L/m2/hour (18 g/mol water, 1L = 1000g)
  const transpirationRate = transpirationMol * 18 * 3600 / 1000 * leafAreaIndex;

  // Daily transpiration
  const dailyTranspiration = transpirationRate * 16; // Assuming 16h of active transpiration

  // Water use efficiency (simplified)
  const waterUseEfficiency = dailyTranspiration > 0
    ? (3.5 / dailyTranspiration) // Typical tomato ~3.5 g DM/L
    : 0;

  // Drain fraction
  const substrateDrainFraction = Math.max(0,
    (irrigationRate - dailyTranspiration) / irrigationRate
  );

  // Plant water status
  let plantWaterStatus: 'optimal' | 'mild_stress' | 'severe_stress' = 'optimal';
  if (substrateWaterContent < 40 || calculatedVPD > 1.5) {
    plantWaterStatus = 'mild_stress';
  }
  if (substrateWaterContent < 25 || calculatedVPD > 2.5) {
    plantWaterStatus = 'severe_stress';
  }

  return {
    transpirationRate: Math.round(transpirationRate * 1000) / 1000,
    dailyTranspiration: Math.round(dailyTranspiration * 100) / 100,
    waterUseEfficiency: Math.round(waterUseEfficiency * 100) / 100,
    substrateDrainFraction: Math.round(substrateDrainFraction * 100) / 100,
    plantWaterStatus
  };
}

/**
 * Calculate plant energy balance
 */
export function calculatePlantEnergyBalance(params: EnergyBalanceParams): EnergyBalanceOutputs {
  const {
    solarRadiation,
    nirAbsorption,
    parAbsorption,
    longwaveEmission,
    leafTemperature,
    airTemperature,
    // windSpeed, // Reserved for future calculations
    convectiveCoefficient,
    transpirationRate,
    latentHeatVaporization
  } = params;

  // Net radiation absorbed
  const netRadiation = solarRadiation * (parAbsorption * 0.5 + nirAbsorption * 0.5) - longwaveEmission;

  // Sensible heat flux (convection)
  const sensibleHeatFlux = convectiveCoefficient * (leafTemperature - airTemperature);

  // Latent heat flux (transpiration)
  const latentHeatFlux = transpirationRate * latentHeatVaporization;

  // Leaf to air temperature difference
  const leafToAirTemperatureDiff = leafTemperature - airTemperature;

  // Energy balance (should be close to 0 when in equilibrium)
  const energyBalance = netRadiation - sensibleHeatFlux - latentHeatFlux;

  return {
    netRadiation: Math.round(netRadiation * 10) / 10,
    sensibleHeatFlux: Math.round(sensibleHeatFlux * 10) / 10,
    latentHeatFlux: Math.round(latentHeatFlux * 10) / 10,
    leafToAirTemperatureDiff: Math.round(leafToAirTemperatureDiff * 100) / 100,
    energyBalance: Math.round(energyBalance * 10) / 10
  };
}

// ==========================================
// GREENHOUSE-OUTSIDE BALANCE CALCULATIONS
// ==========================================

/**
 * Calculate greenhouse energy balance
 */
export function calculateGreenhouseEnergyBalance(params: GreenhouseEnergyParams): GreenhouseEnergyOutputs {
  const {
    outsideSolarRadiation,
    coverTransmissivity,
    outsideTemperature,
    insideTemperature,
    uValue,
    // infiltrationRate, // Reserved for future calculations
    // heatingCapacity, // Reserved for future calculations
    heatingSetpoint,
    ventilationRate,
    screenPosition,
    screenEffect
  } = params;

  // Solar heat gain through cover
  const effectiveTransmissivity = coverTransmissivity * (1 - screenPosition / 100 * 0.5);
  const solarHeatGain = outsideSolarRadiation * effectiveTransmissivity;

  // PAR transmitted (45% of solar is PAR, convert to umol)
  const transmittedPAR = solarHeatGain * 0.45 * 4.57; // W/m2 to umol/m2/s

  // Conduction/convection losses through cover
  const screenFactor = 1 - (screenPosition / 100) * screenEffect;
  const temperatureDiff = insideTemperature - outsideTemperature;
  const conductionLoss = uValue * temperatureDiff * screenFactor;

  // Ventilation heat loss
  const airDensity = 1.2; // kg/m3
  const specificHeat = 1000; // J/kg/K
  const ventilationLoss = ventilationRate * airDensity * specificHeat * temperatureDiff / 3600;

  // Total heat loss
  const totalHeatLoss = conductionLoss + ventilationLoss;

  // Heating required
  const heatingRequired = Math.max(0,
    insideTemperature < heatingSetpoint
      ? totalHeatLoss - solarHeatGain
      : 0
  );

  // Energy balance
  const energyBalance = solarHeatGain - conductionLoss - ventilationLoss;

  return {
    solarHeatGain: Math.round(solarHeatGain * 10) / 10,
    transmittedPAR: Math.round(transmittedPAR * 10) / 10,
    conductionLoss: Math.round(conductionLoss * 10) / 10,
    ventilationLoss: Math.round(ventilationLoss * 10) / 10,
    heatingRequired: Math.round(heatingRequired * 10) / 10,
    energyBalance: Math.round(energyBalance * 10) / 10
  };
}

/**
 * Calculate humidity balance
 */
export function calculateHumidityBalance(params: HumidityBalanceParams): HumidityBalanceOutputs {
  const {
    insideTemperature,
    insideHumidity,
    transpirationRate,
    fogSystemRate,
    outsideTemperature,
    outsideHumidity,
    ventilationRate,
    airLeakage,
    coverTemperature,
    // pipeTemperature // Reserved for future calculations
  } = params;

  // Absolute humidity calculations (g/m3)
  const satPressureInside = 6.108 * Math.exp(17.27 * insideTemperature / (insideTemperature + 237.3));
  const satPressureOutside = 6.108 * Math.exp(17.27 * outsideTemperature / (outsideTemperature + 237.3));

  const absoluteHumidityInside = (insideHumidity / 100) * satPressureInside * 217 / (insideTemperature + 273.15);
  const absoluteHumidityOutside = (outsideHumidity / 100) * satPressureOutside * 217 / (outsideTemperature + 273.15);

  // Dew point inside
  const actualVaporPressure = (insideHumidity / 100) * satPressureInside;
  const dewPointInside = 237.3 * Math.log(actualVaporPressure / 6.108) /
    (17.27 - Math.log(actualVaporPressure / 6.108));

  // VPD inside
  const vpdInside = (satPressureInside - actualVaporPressure) / 10; // Convert to kPa

  // Condensation rate (if cover temp below dew point)
  let condensationRate = 0;
  if (coverTemperature < dewPointInside) {
    condensationRate = 50 * (dewPointInside - coverTemperature); // Simplified model
  }

  // Moisture removal by ventilation
  const totalVentilation = ventilationRate + airLeakage;
  const moistureRemovalRate = totalVentilation * (absoluteHumidityInside - absoluteHumidityOutside) / 60;

  // Humidity balance
  const moistureInput = transpirationRate + fogSystemRate;
  const moistureOutput = moistureRemovalRate + condensationRate;
  const humidityBalance = moistureInput - moistureOutput;

  return {
    absoluteHumidityInside: Math.round(absoluteHumidityInside * 100) / 100,
    absoluteHumidityOutside: Math.round(absoluteHumidityOutside * 100) / 100,
    dewPointInside: Math.round(dewPointInside * 10) / 10,
    vpdInside: Math.round(vpdInside * 100) / 100,
    condensationRate: Math.round(condensationRate * 10) / 10,
    moistureRemovalRate: Math.round(moistureRemovalRate * 10) / 10,
    humidityBalance: Math.round(humidityBalance * 10) / 10
  };
}

/**
 * Calculate CO2 balance
 */
export function calculateCO2Balance(params: CO2BalanceParams): CO2BalanceOutputs {
  const {
    insideCO2,
    cropCO2Uptake,
    soilRespiration,
    outsideCO2,
    co2InjectionRate,
    co2Setpoint,
    ventilationRate,
    airLeakage
  } = params;

  // CO2 supply (injection + soil respiration)
  const co2SupplyRate = co2InjectionRate + soilRespiration;

  // CO2 loss through ventilation
  const totalVentilation = ventilationRate + airLeakage;
  const co2Differential = insideCO2 - outsideCO2;
  // Convert ppm difference to g/m2/hour (greenhouse height ~4m, CO2 density ~1.8 g/L at ~1000 ppm)
  const co2LossVentilation = totalVentilation * 4 * co2Differential * 0.0018 / 1000;

  // Net CO2 balance
  const co2NetBalance = co2SupplyRate - cropCO2Uptake - co2LossVentilation;

  // Time to reach setpoint (simplified)
  const co2Deficit = co2Setpoint - insideCO2;
  const netSupplyRate = co2InjectionRate - cropCO2Uptake - co2LossVentilation;
  const timeToSetpoint = netSupplyRate > 0
    ? Math.abs(co2Deficit * 4 * 0.0018) / netSupplyRate * 60 // minutes
    : Infinity;

  // CO2 use efficiency (simplified)
  const co2UseEfficiency = co2InjectionRate > 0
    ? cropCO2Uptake / co2InjectionRate
    : 0;

  return {
    co2SupplyRate: Math.round(co2SupplyRate * 100) / 100,
    co2LossVentilation: Math.round(co2LossVentilation * 100) / 100,
    co2NetBalance: Math.round(co2NetBalance * 100) / 100,
    timeToSetpoint: Math.round(Math.min(timeToSetpoint, 999) * 10) / 10,
    co2UseEfficiency: Math.round(co2UseEfficiency * 100) / 100
  };
}

// ==========================================
// CROP MANAGEMENT CALCULATIONS
// ==========================================

/**
 * Calculate crop judgement outputs
 */
export function calculateCropJudgement(params: CropJudgementParams): CropJudgementOutputs {
  const {
    // plantHeight, // Reserved for future calculations
    internodesLength,
    // leafLength, // Reserved for future calculations
    // leafWidth, // Reserved for future calculations
    stemDiameter,
    headThickness,
    flowersPerTruss,
    fruitSet,
    trussDevelopmentRate,
    leafColor,
    leafRolling,
    gvBalance
  } = params;

  // Health score calculation
  let healthScore = 100;

  // Penalize suboptimal values
  if (internodesLength > 12) healthScore -= 10;
  if (internodesLength < 5) healthScore -= 5;
  if (stemDiameter < 10) healthScore -= 10;
  if (stemDiameter > 15) healthScore -= 5;
  if (headThickness < 8) healthScore -= 15;
  if (fruitSet < 70) healthScore -= 15;
  if (flowersPerTruss < 5) healthScore -= 10;

  // Leaf condition penalties
  if (leafColor === 'light_green') healthScore -= 10;
  if (leafColor === 'yellow') healthScore -= 25;
  if (leafRolling === 'slight') healthScore -= 5;
  if (leafRolling === 'moderate') healthScore -= 15;
  if (leafRolling === 'severe') healthScore -= 30;

  // Growth rate assessment
  let growthRate: 'slow' | 'normal' | 'fast' = 'normal';
  if (trussDevelopmentRate < 0.9) growthRate = 'slow';
  if (trussDevelopmentRate > 1.5) growthRate = 'fast';

  // Generative status
  let generativeStatus: 'too_vegetative' | 'balanced' | 'too_generative' = 'balanced';
  if (gvBalance < -3) generativeStatus = 'too_vegetative';
  if (gvBalance > 3) generativeStatus = 'too_generative';

  // Recommendations
  const recommendations: string[] = [];

  if (internodesLength > 12) {
    recommendations.push('Reduce temperature difference day/night to control stem elongation');
  }
  if (headThickness < 8) {
    recommendations.push('Increase plant load or reduce irrigation to strengthen head');
  }
  if (fruitSet < 70) {
    recommendations.push('Check pollination, consider bee activity or vibration');
  }
  if (leafColor === 'yellow') {
    recommendations.push('Check for nutrient deficiency (N, Fe, Mg)');
  }
  if (leafRolling !== 'none') {
    recommendations.push('Check water stress and VPD levels');
  }
  if (gvBalance < -3) {
    recommendations.push('Steer more generative: increase EC, reduce night temp');
  }
  if (gvBalance > 3) {
    recommendations.push('Steer more vegetative: reduce EC, increase plant activity');
  }
  if (recommendations.length === 0) {
    recommendations.push('Crop is developing normally - maintain current strategy');
  }

  return {
    overallHealth: Math.max(0, Math.min(100, healthScore)),
    growthRate,
    generativeStatus,
    recommendations
  };
}

/**
 * Calculate IPM outputs
 */
export function calculateIPM(params: IPMParams): IPMOutputs {
  const {
    temperature,
    humidity,
    leafWetness,
    whitefliesPerLeaf,
    aphidsPerLeaf,
    spiderMitesPerLeaf,
    thripsDamageScore,
    botrytisRisk,
    powderyMildewRisk,
    predatorMitesReleased,
    parasitoidWaspsReleased,
    lastChemicalTreatment,
    treatmentType
  } = params;

  // Calculate pest pressure (0-100)
  const whiteflyPressure = Math.min(100, whitefliesPerLeaf * 20);
  const aphidPressure = Math.min(100, aphidsPerLeaf * 25);
  const mitePressure = Math.min(100, spiderMitesPerLeaf * 30);
  const thripsPressure = Math.min(100, thripsDamageScore * 20);

  const overallPestPressure = Math.round(
    (whiteflyPressure + aphidPressure + mitePressure + thripsPressure) / 4
  );

  // Disease risk adjusted for conditions
  let adjustedBotrytisRisk = botrytisRisk;
  let adjustedPowderyMildewRisk = powderyMildewRisk;

  if (humidity > 85) adjustedBotrytisRisk *= 1.5;
  if (leafWetness) adjustedBotrytisRisk *= 2;
  if (temperature > 25 && humidity < 50) adjustedPowderyMildewRisk *= 1.3;

  const diseaseRisk = Math.round(Math.min(100,
    (adjustedBotrytisRisk + adjustedPowderyMildewRisk) / 2
  ));

  // Action threshold
  const actionThresholdReached = overallPestPressure > 30 || diseaseRisk > 40;

  // Biological control effectiveness
  const bioControlPotential = predatorMitesReleased / 100 + parasitoidWaspsReleased / 5;
  const chemicalInterference = lastChemicalTreatment < 14 ? 0.5 : 1;
  const biologicalControlEffectiveness = Math.round(
    Math.min(100, bioControlPotential * 50 * chemicalInterference)
  );

  // Recommendations
  const recommendedActions: string[] = [];

  if (whitefliesPerLeaf > 2) {
    recommendedActions.push('Increase Encarsia formosa releases for whitefly control');
  }
  if (aphidsPerLeaf > 1) {
    recommendedActions.push('Release Aphidius colemani for aphid control');
  }
  if (spiderMitesPerLeaf > 0.5) {
    recommendedActions.push('Release Phytoseiulus persimilis for mite control');
  }
  if (thripsDamageScore > 2) {
    recommendedActions.push('Apply Orius laevigatus for thrips control');
  }
  if (adjustedBotrytisRisk > 50) {
    recommendedActions.push('Improve ventilation and reduce humidity to prevent Botrytis');
  }
  if (adjustedPowderyMildewRisk > 40) {
    recommendedActions.push('Consider sulfur application or biological control for powdery mildew');
  }
  if (lastChemicalTreatment < 7 && treatmentType === 'chemical') {
    recommendedActions.push('Allow recovery period for beneficial insects');
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push('Pest and disease levels are acceptable - maintain monitoring');
  }

  return {
    overallPestPressure,
    diseaseRisk,
    actionThresholdReached,
    recommendedActions,
    biologicalControlEffectiveness
  };
}
