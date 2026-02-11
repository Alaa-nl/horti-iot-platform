# Assimilate Balance Testing Guide

## Overview
This guide helps you manually verify that all parameters in the Plant Balance Dashboard are functioning correctly and scaling with input changes.

## Test Results Summary ✅
All automated tests have **PASSED**. The calculations are working correctly:
- ✅ **Photosynthesis** scales with PAR Light, CO2, Temperature, and Humidity
- ✅ **Transpiration** scales with Temperature, Light, and Humidity
- ✅ **Respiration** scales with Temperature
- ✅ **VPDi** scales with Leaf-Air temperature difference and Humidity
- ✅ **Enthalpy Difference** changes with Temperature difference
- ✅ **Net Assimilation** = Photosynthesis - Respiration
- ✅ **DLI** scales linearly with PAR Light

## Manual Testing Instructions

### 1. Test Photosynthesis Scaling

#### Test 1A: PAR Light Effect
1. Set baseline: CO2=800, Temp=24°C, Humidity=70%, Leaf Temp=25°C
2. Adjust **PAR Light** slider from 0 to 1500
3. **Expected behavior:**
   - PAR 0 → Photosynthesis = 0.0 μmol/m²/s
   - PAR 200 → Photosynthesis ≈ 10.0 μmol/m²/s
   - PAR 400 → Photosynthesis ≈ 20.0 μmol/m²/s
   - PAR 600+ → Photosynthesis ≈ 30.0 μmol/m²/s (saturates)

#### Test 1B: CO2 Effect
1. Set PAR=400, other parameters as above
2. Adjust **CO2 Level** slider from 200 to 1500
3. **Expected behavior:**
   - CO2 400 → Photosynthesis ≈ 10.0 μmol/m²/s
   - CO2 800 → Photosynthesis ≈ 20.0 μmol/m²/s (doubles!)
   - CO2 1000+ → Photosynthesis plateaus at ≈ 20.0

#### Test 1C: Temperature Effect
1. Set PAR=400, CO2=800, other parameters baseline
2. Adjust **Greenhouse Temperature** from 10°C to 40°C
3. **Expected behavior:**
   - Temp < 15°C → Photosynthesis drops (≈ 10.0)
   - Temp 20-25°C → Photosynthesis optimal (≈ 20.0)
   - Temp > 30°C → Photosynthesis decreases (≈ 12.0)

### 2. Test Transpiration Scaling

1. Set baseline parameters
2. Adjust sliders and observe **Transpiration** value
3. **Expected behavior:**
   - Higher Temperature → Higher transpiration
   - Higher PAR Light → Higher transpiration
   - Lower Humidity → Higher transpiration
   - Example: Temp=35°C, PAR=600, RH=30% → ≈ 3.0 L/m²/h

### 3. Test VPDi (Plant-Greenhouse Air)

1. Set Greenhouse Temp=24°C, Humidity=70%
2. Adjust **Plant/Leaf Temperature** slider
3. **Expected behavior:**
   - Leaf = Air temp → VPDi ≈ 0.90 kPa
   - Leaf 2°C warmer → VPDi ≈ 1.27 kPa
   - Leaf 2°C cooler → VPDi ≈ 0.56 kPa

### 4. Test Enthalpy Difference

1. Monitor **Enthalpy Difference (plant/greenhouse)** display
2. Adjust Leaf Temperature relative to Greenhouse Temperature
3. **Expected behavior:**
   - Leaf warmer than air → Positive difference
   - Leaf cooler than air → Negative difference
   - Each 1°C difference → ±1.0 kJ/kg change

### 5. Test Net Assimilation

1. Observe **Net Assimilation** = Photosynthesis - Respiration
2. Test extreme scenarios:
   - **Night scenario**: PAR=0 → Net Assimilation negative (≈ -1.5)
   - **Optimal scenario**: PAR=600, CO2=800, Temp=24°C → Net ≈ 28.5
   - **Stress scenario**: PAR=400, CO2=400, Temp=35°C → Net ≈ 9.0

### 6. Test Psychrometric Calculations Section

The section now shows only calculated values that scale:
- **VPDi (plant vs greenhouse air)** - changes with temp/humidity
- **Enthalpy Difference** - changes with leaf/air temp difference

### 7. Test Short-term Monitoring (24 Hours View)

Verify these changes are visible:
- ✅ "Temperature" renamed to **"Greenhouse Temperature"**
- ✅ "Humidity" renamed to **"Relative Humidity"**
- ✅ VPD removed (no longer shown)
- ✅ Shows **"VPDi leaf/greenhouse"**
- ✅ Shows **DLI in J/cm²/day** and **mol/m²/day**
- ✅ Bottom 4 graphs removed (Photosynthesis, Respiration, Net Assimilation, RTR)

### 8. Test Long-term Planning (52 Weeks View)

Verify these changes:
- ✅ Top 3 topic cards removed
- ✅ "Avg VPD" removed from graphs
- ✅ "Total Photosynthesis" removed
- ✅ "Net Assimilation" removed
- ✅ Shows **"Weekly Enthalpy Diff (plant/GH)"** instead of "Weekly Enthalpy"
- ✅ **Weekly PAR Total** scales with PAR slider value

## Quick Validation Checklist

Run through these quick tests to confirm everything works:

| Test | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Set PAR=0 | Photosynthesis = 0 | ☐ |
| 2 | Set PAR=600 | Photosynthesis ≈ 30 | ☐ |
| 3 | Double CO2 from 400→800 | Photosynthesis doubles | ☐ |
| 4 | Set Temp=35°C | Respiration increases to ≈ 3.0 | ☐ |
| 5 | Set RH=30% | VPD > 2.0 kPa | ☐ |
| 6 | Leaf Temp +2°C from Air | VPDi increases, Enthalpy Diff = +2 | ☐ |
| 7 | Set all optimal | Net Assimilation > 20 | ☐ |

## Troubleshooting

If values don't match expected:
1. Refresh the page (F5)
2. Check browser console for errors (F12)
3. Verify you're on the "Assimilate Balance" tab
4. Ensure "Real-time" period is selected for manual control

## Conclusion

All calculations have been verified to work correctly through automated testing. The parameters scale appropriately with input changes, and the client-requested modifications have been implemented successfully.