// Psychrometric Verification Test
// Comparing our calculations with the Excel spreadsheet values

/**
 * Calculate saturation vapor pressure (kPa)
 * Using Magnus-Tetens formula
 */
function calculateSaturationPressure(temp: number): number {
  return 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
}

/**
 * Calculate actual vapor pressure (kPa)
 */
function calculateActualVaporPressure(temp: number, rh: number): number {
  const satPressure = calculateSaturationPressure(temp);
  return (rh / 100) * satPressure;
}

/**
 * Calculate VPD (Vapor Pressure Deficit) in kPa
 */
function calculateVPD(temp: number, rh: number): number {
  const satPressure = calculateSaturationPressure(temp);
  const actualPressure = calculateActualVaporPressure(temp, rh);
  return satPressure - actualPressure;
}

/**
 * Calculate dew point temperature (°C)
 */
function calculateDewPoint(temp: number, rh: number): number {
  const actualPressure = calculateActualVaporPressure(temp, rh);
  const a = 17.27;
  const b = 237.3;

  const gamma = Math.log(actualPressure / 0.6108);
  return (b * gamma) / (a - gamma);
}

/**
 * Calculate enthalpy (kJ/kg)
 * h = 1.006*T + W*(2501 + 1.86*T)
 * where W is humidity ratio (kg water/kg dry air)
 */
function calculateEnthalpy(temp: number, rh: number): number {
  const actualPressure = calculateActualVaporPressure(temp, rh);
  const atmosphericPressure = 101.325; // kPa

  // Humidity ratio (kg water/kg dry air)
  const W = 0.622 * actualPressure / (atmosphericPressure - actualPressure);

  // Enthalpy formula
  const h = 1.006 * temp + W * (2501 + 1.86 * temp);

  return h;
}

/**
 * Test calculations against Excel spreadsheet values
 */
export function verifyPsychrometricCalculations() {
  console.log('====================================');
  console.log('Psychrometric Calculations Verification');
  console.log('====================================\n');

  // Test Case 1: Plant conditions from spreadsheet
  console.log('PLANT CONDITIONS (Excel: 18°C, 100% RH)');
  console.log('----------------------------------------');
  const plantTemp = 18;
  const plantRH = 100;

  const plantSatPressure = calculateSaturationPressure(plantTemp);
  const plantActualPressure = calculateActualVaporPressure(plantTemp, plantRH);
  const plantVPD = calculateVPD(plantTemp, plantRH);
  const plantDewPoint = calculateDewPoint(plantTemp, plantRH);
  const plantEnthalpy = calculateEnthalpy(plantTemp, plantRH);

  console.log(`Temperature: ${plantTemp}°C`);
  console.log(`Relative Humidity: ${plantRH}%`);
  console.log(`Saturation Pressure: ${plantSatPressure.toFixed(2)} kPa (Excel: 2.06 kPa)`);
  console.log(`Actual Vapor Pressure: ${plantActualPressure.toFixed(2)} kPa`);
  console.log(`VPD: ${plantVPD.toFixed(2)} kPa (Excel: 0.00 kPa for 100% RH)`);
  console.log(`Dew Point: ${plantDewPoint.toFixed(1)}°C (Excel: 18.0°C)`);
  console.log(`Enthalpy: ${plantEnthalpy.toFixed(2)} kJ/kg (Excel: 50.28 kJ/kg)`);

  console.log('\nGREENHOUSE CONDITIONS (Excel: 18°C, 70% RH)');
  console.log('--------------------------------------------');
  const greenhouseTemp = 18;
  const greenhouseRH = 70;

  const greenhouseSatPressure = calculateSaturationPressure(greenhouseTemp);
  const greenhouseActualPressure = calculateActualVaporPressure(greenhouseTemp, greenhouseRH);
  const greenhouseVPD = calculateVPD(greenhouseTemp, greenhouseRH);
  const greenhouseDewPoint = calculateDewPoint(greenhouseTemp, greenhouseRH);
  const greenhouseEnthalpy = calculateEnthalpy(greenhouseTemp, greenhouseRH);

  console.log(`Temperature: ${greenhouseTemp}°C`);
  console.log(`Relative Humidity: ${greenhouseRH}%`);
  console.log(`Saturation Pressure: ${greenhouseSatPressure.toFixed(2)} kPa`);
  console.log(`Actual Vapor Pressure: ${greenhouseActualPressure.toFixed(2)} kPa (Excel: 1.44 kPa)`);
  console.log(`VPD: ${greenhouseVPD.toFixed(2)} kPa (Excel: 0.62 kPa)`);
  console.log(`Dew Point: ${greenhouseDewPoint.toFixed(1)}°C (Excel: 12.4°C)`);
  console.log(`Enthalpy: ${greenhouseEnthalpy.toFixed(2)} kJ/kg (Excel: 40.59 kJ/kg)`);

  console.log('\nDIFFERENCES (Plant - Greenhouse)');
  console.log('---------------------------------');
  const vpdDifference = plantActualPressure - greenhouseActualPressure;
  const enthalpyDifference = plantEnthalpy - greenhouseEnthalpy;

  console.log(`VP/DD Difference: ${vpdDifference.toFixed(2)} kPa (Excel: 0.62 kPa)`);
  console.log(`Enthalpy Difference: ${enthalpyDifference.toFixed(2)} kJ/kg (Excel: 9.68 kJ/kg)`);

  console.log('\nVPD TRANSPIRATION STATUS');
  console.log('-------------------------');
  console.log(`VPD: ${greenhouseVPD.toFixed(2)} kPa`);

  if (greenhouseVPD >= 0 && greenhouseVPD <= 0.4) {
    console.log('Status: Under transpiration (0-0.4 kPa)');
  } else if (greenhouseVPD > 0.4 && greenhouseVPD <= 0.6) {
    console.log('Status: Low transpiration (0.41-0.6 kPa)');
  } else if (greenhouseVPD > 0.6 && greenhouseVPD <= 1.2) {
    console.log('Status: Healthy transpiration (0.61-1.2 kPa) ✓');
  } else if (greenhouseVPD > 1.2 && greenhouseVPD <= 1.8) {
    console.log('Status: High transpiration (1.21-1.8 kPa)');
  } else if (greenhouseVPD > 1.8) {
    console.log('Status: Over transpiration (>1.8 kPa)');
  }

  console.log('\n====================================');

  return {
    plant: {
      satPressure: plantSatPressure,
      actualPressure: plantActualPressure,
      vpd: plantVPD,
      dewPoint: plantDewPoint,
      enthalpy: plantEnthalpy
    },
    greenhouse: {
      satPressure: greenhouseSatPressure,
      actualPressure: greenhouseActualPressure,
      vpd: greenhouseVPD,
      dewPoint: greenhouseDewPoint,
      enthalpy: greenhouseEnthalpy
    },
    differences: {
      vpdDifference,
      enthalpyDifference
    }
  };
}

// Export individual calculation functions for use in the main algorithm calculations
export {
  calculateSaturationPressure,
  calculateActualVaporPressure,
  calculateVPD,
  calculateDewPoint,
  calculateEnthalpy
};