# Educational Plant Balance Dashboard
## Interactive Learning Platform for Greenhouse Climate Control

---

## OVERVIEW
An educational simulation dashboard where students can adjust algorithm parameters to understand the complex interactions between plants, greenhouse environment, and external conditions across different time scales.

---

## 1. PLANT BALANCES (Plant ↔ Greenhouse Environment)

### 1.1 ASSIMILATE BALANCE (Carbon/Photosynthesis)

#### Adjustable Algorithm Parameters:
```javascript
// Students can modify these values
const photosynthesisParams = {
  // Light Response Parameters
  quantumYield: 0.06,           // Range: 0.04-0.08 mol CO2/mol photons
  lightSaturationPoint: 1500,   // Range: 800-2000 μmol/m²/s
  darkRespirationRate: 2.0,     // Range: 0.5-3.0 μmol CO2/m²/s

  // CO2 Response Parameters
  co2CompensationPoint: 50,     // Range: 30-80 ppm
  co2SaturationPoint: 1200,     // Range: 800-1500 ppm
  carboxylationEfficiency: 0.08,// Range: 0.05-0.12

  // Temperature Response
  optimalTempPhoto: 25,         // Range: 20-30°C
  minTempPhoto: 10,             // Range: 5-15°C
  maxTempPhoto: 40,             // Range: 35-45°C
  q10Respiration: 2.0,          // Range: 1.8-2.5

  // Plant Parameters
  leafAreaIndex: 3.0,           // Range: 0.5-6.0 m²/m²
  specificLeafArea: 200,        // Range: 100-400 cm²/g
  carbonUseEfficiency: 0.5      // Range: 0.3-0.7
}
```

#### Visualization Components:
- **Real-time Graph**: Instantaneous photosynthesis rate vs. time
- **Daily Pattern**: 24-hour photosynthesis/respiration cycle
- **Seasonal Trend**: Cumulative carbon gain over weeks/months
- **Interactive 3D Surface**: Photosynthesis as function of Light × CO2
- **Carbon Flow Diagram**: Animated flow from CO2 → Sugar → Biomass

#### Learning Outcomes:
- Light saturation and compensation points
- CO2 fertilization effects
- Temperature optimization
- Photorespiration impacts
- Net vs. gross photosynthesis

### 1.2 WATER BALANCE

#### Adjustable Algorithm Parameters:
```javascript
const transpirationParams = {
  // Stomatal Control
  maxStomatalConductance: 0.5,  // Range: 0.1-1.0 mol/m²/s
  vpdThresholdLow: 0.5,          // Range: 0.3-0.8 kPa
  vpdThresholdHigh: 2.0,         // Range: 1.5-3.0 kPa
  stomatalSensitivity: 0.6,      // Range: 0.3-0.9

  // Boundary Layer
  leafCharacteristicLength: 0.05,// Range: 0.01-0.2 m
  windSpeedEffect: 0.7,          // Range: 0.5-1.0

  // Root Water Uptake
  rootHydraulicConductivity: 0.001, // Range: 0.0001-0.01 m/s/MPa
  rootZoneDepth: 0.3,            // Range: 0.1-0.5 m
  criticalWaterPotential: -1.5,  // Range: -0.5 to -2.5 MPa

  // Hydraulic Properties
  plantCapacitance: 0.1,         // Range: 0.05-0.3 kg/MPa
  xylemConductance: 0.01         // Range: 0.001-0.1 m²/s/MPa
}
```

#### Visualization Components:
- **VPD Gauge**: Color-coded transpiration zones
- **Water Flow Animation**: Root → Stem → Leaf → Atmosphere
- **Time Series Graphs**:
  - Real-time: Transpiration rate (g/m²/min)
  - Daily: Water use patterns (L/m²/day)
  - Seasonal: Cumulative water consumption (m³)
- **Stomatal Response Curves**: Interactive sliders showing gs vs. VPD
- **Water Use Efficiency Chart**: WUE variations with conditions

#### Learning Outcomes:
- VPD as driving force for transpiration
- Stomatal regulation mechanisms
- Boundary layer effects
- Root-shoot signaling
- Water stress impacts

### 1.3 ENERGY BALANCE

#### Adjustable Algorithm Parameters:
```javascript
const energyBalanceParams = {
  // Radiation Parameters
  leafAbsorptance: 0.85,         // Range: 0.7-0.95
  leafTransmittance: 0.05,       // Range: 0.02-0.15
  leafReflectance: 0.10,         // Range: 0.05-0.20
  canopyExtinctionCoeff: 0.7,    // Range: 0.5-1.0

  // Heat Transfer
  convectiveCoefficient: 25,     // Range: 10-50 W/m²/K
  leafEmissivity: 0.95,          // Range: 0.90-0.99
  leafSpecificHeat: 3800,        // Range: 3000-4500 J/kg/K

  // Energy Partitioning
  latentHeatRatio: 0.7,          // Range: 0.5-0.9
  sensibleHeatRatio: 0.25,       // Range: 0.1-0.4
  soilHeatFluxRatio: 0.05,       // Range: 0.01-0.15

  // Temperature Regulation
  thermalTimeConstant: 600,      // Range: 300-1200 seconds
  leafThermalMass: 0.2          // Range: 0.1-0.5 kg/m²
}
```

#### Visualization Components:
- **Energy Partition Pie Chart**: Real-time energy distribution
- **Heat Map**: Leaf temperature distribution
- **Sankey Diagram**: Energy flow from radiation to various sinks
- **Time Series**:
  - Real-time: Net radiation & temperature
  - Daily: Energy balance components
  - Seasonal: Integrated energy use
- **Interactive Surface Plot**: Leaf temp as f(radiation, air temp)

#### Learning Outcomes:
- Energy conservation principle
- Radiation interception by canopy
- Sensible vs. latent heat trade-offs
- Thermal regulation strategies
- Energy-water coupling

---

## 2. GREENHOUSE BALANCES (Greenhouse ↔ Outside Environment)

### 2.1 GREENHOUSE ENERGY BALANCE

#### Adjustable Algorithm Parameters:
```javascript
const greenhouseEnergyParams = {
  // Structure Properties
  coverTransmittance: 0.85,      // Range: 0.6-0.95
  coverEmissivity: 0.1,          // Range: 0.05-0.3
  thermalScreenPosition: 0,      // Range: 0-1 (0=open, 1=closed)
  screenEnergyReduction: 0.35,   // Range: 0.2-0.5

  // Heating System
  heatingPower: 200,             // Range: 50-400 W/m²
  heatingSetpoint: 18,           // Range: 15-25°C
  heatingEfficiency: 0.95,       // Range: 0.8-1.0

  // Ventilation
  ventilationRate: 0.01,         // Range: 0-0.1 m³/m²/s
  ventilationSetpoint: 25,       // Range: 20-30°C
  leakageRate: 0.0001,          // Range: 0.00005-0.001 m³/m²/s

  // Solar Gains
  floorAbsorptance: 0.7,         // Range: 0.5-0.9
  floorThermalMass: 100,         // Range: 50-200 kJ/m²/K
  structuralThermalMass: 50     // Range: 20-100 kJ/m²/K
}
```

#### Visualization Components:
- **3D Greenhouse Model**: Shows heat flows in/out
- **Temperature Gradients**: Vertical & horizontal profiles
- **Energy Balance Bar Chart**: Inputs vs. outputs
- **Control System Dashboard**: Heating/ventilation status
- **Cost Calculator**: Real-time energy costs

### 2.2 GREENHOUSE HUMIDITY BALANCE

#### Adjustable Algorithm Parameters:
```javascript
const greenhouseHumidityParams = {
  // Moisture Sources
  plantTranspirationBase: 3,     // Range: 1-6 L/m²/day
  soilEvaporation: 0.5,          // Range: 0.1-1.0 L/m²/day
  fogSystemRate: 0,              // Range: 0-2 L/m²/h

  // Moisture Sinks
  condensationThreshold: 0.95,   // Range: 0.85-1.0 RH
  condensationRate: 0.1,         // Range: 0.05-0.3 g/m²/s/ΔT
  dehumidificationPower: 0,      // Range: 0-100 W/m²

  // Air Exchange
  humidityExchangeEff: 0.8,      // Range: 0.5-1.0
  outsideHumidityEffect: 0.5,    // Range: 0.3-0.8

  // Control Parameters
  rhSetpointDay: 70,             // Range: 60-85%
  rhSetpointNight: 85,           // Range: 75-95%
  vpdControl: true               // Boolean
}
```

#### Visualization Components:
- **Psychrometric Chart**: Interactive, shows current state
- **Humidity Sources/Sinks**: Animated water balance
- **Condensation Risk Map**: Shows problem areas
- **VPD History Graph**: Optimal vs. actual zones
- **Dewpoint Calculator**: Real-time warnings

### 2.3 GREENHOUSE CO2 BALANCE

#### Adjustable Algorithm Parameters:
```javascript
const greenhouseCO2Params = {
  // CO2 Sources
  co2Enrichment: 100,            // Range: 0-500 ppm above ambient
  enrichmentEfficiency: 0.9,     // Range: 0.7-1.0
  respirationContribution: 50,   // Range: 20-100 ppm

  // CO2 Sinks
  photosynthesisRate: 20,        // Range: 5-40 μmol/m²/s
  leakageCoefficient: 0.1,       // Range: 0.05-0.3 h⁻¹

  // Control Strategy
  co2SetpointLight: 800,         // Range: 400-1200 ppm
  co2SetpointDark: 400,          // Range: 350-450 ppm
  dosingSunriseOffset: -0.5,     // Range: -2 to 0 hours
  maxDosingRate: 100            // Range: 50-200 kg/ha/h
}
```

#### Visualization Components:
- **CO2 Concentration Map**: 3D distribution in greenhouse
- **Supply/Demand Graph**: Real-time balance
- **Efficiency Calculator**: CO2 use vs. yield
- **Daily Pattern**: 24-hour CO2 dynamics
- **Cost-Benefit Analysis**: Enrichment economics

---

## 3. CROP JUDGMENT & IPM FEATURES

### 3.1 CROP PERFORMANCE INDICATORS

#### Adjustable Parameters:
```javascript
const cropJudgmentParams = {
  // Growth Indicators
  targetGrowthRate: 15,           // g/m²/day
  targetLAI: 3.5,                 // m²/m²
  harvestIndex: 0.6,             // Range: 0.4-0.8

  // Quality Indicators
  dryMatterContent: 0.05,        // Range: 0.03-0.10
  sugarContent: 4,               // °Brix
  firmness: 5,                   // kg/cm²

  // Stress Thresholds
  waterStressThreshold: -1.0,    // MPa
  temperatureStressLow: 12,      // °C
  temperatureStressHigh: 32,     // °C
  lightStressLow: 100,           // μmol/m²/s
  lightStressHigh: 1500          // μmol/m²/s
}
```

#### Visualization Components:
- **Crop Health Dashboard**: Traffic light system
- **Growth Trajectory**: Actual vs. optimal curves
- **Stress Index Spider Chart**: Multi-factor analysis
- **Yield Prediction Graph**: Real-time forecast
- **Quality Score Card**: Comprehensive metrics

### 3.2 INTEGRATED PEST MANAGEMENT (IPM)

#### Adjustable Parameters:
```javascript
const ipmParams = {
  // Environmental Triggers
  fungalRiskRH: 85,              // % threshold
  fungalRiskDuration: 6,         // hours
  pestDegreeDay: 100,            // Accumulated degree days

  // Biological Control
  beneficialReleaseRate: 10,     // individuals/m²
  parasitismRate: 0.7,           // Range: 0.3-0.9
  predationRate: 5,              // prey/predator/day

  // Disease Pressure
  infectionRate: 0.1,            // Range: 0.01-0.5
  sporulationRH: 90,             // %
  latentPeriod: 7,               // days

  // Action Thresholds
  pestThreshold: 5,              // individuals/plant
  diseaseThreshold: 0.05,        // proportion infected
  beneficialRatio: 1.5           // beneficial:pest ratio
}
```

#### Visualization Components:
- **Pest Population Dynamics**: Predator-prey graphs
- **Disease Risk Heat Map**: Temporal-spatial view
- **IPM Decision Tree**: Interactive flowchart
- **Alert System**: Risk notifications
- **Treatment Calendar**: Preventive actions timeline

---

## 4. TIME-SCALE IMPLEMENTATION

### REAL-TIME (1-5 minute updates)
```javascript
const realtimeDisplay = {
  updateInterval: 60,             // seconds
  smoothingWindow: 5,             // minutes
  displays: [
    'Current photosynthesis rate',
    'Instantaneous transpiration',
    'Leaf temperature',
    'VPD gauge',
    'CO2 concentration',
    'Energy partition pie'
  ]
}
```

### SHORT-TERM (Hourly/Daily)
```javascript
const shorttermDisplay = {
  updateInterval: 3600,           // seconds (1 hour)
  aggregationPeriod: 24,          // hours
  displays: [
    'Daily light integral',
    'Water consumption trend',
    'Average temperature profile',
    'CO2 depletion patterns',
    'Growth rate calculation'
  ]
}
```

### LONG-TERM (Weekly/Seasonal)
```javascript
const longtermDisplay = {
  updateInterval: 86400,          // seconds (1 day)
  aggregationPeriod: 7,           // days
  displays: [
    'Cumulative yield projection',
    'Resource use efficiency',
    'Cost analysis',
    'Climate optimization score',
    'Seasonal performance metrics'
  ]
}
```

---

## 5. EDUCATIONAL FEATURES

### Interactive Learning Modes:

#### 1. **Guided Tutorials**
- Step-by-step parameter adjustment
- Explanation of cause-effect relationships
- Quiz questions after each module

#### 2. **Scenario Challenges**
```javascript
const scenarios = [
  {
    name: "Summer Heat Wave",
    challenge: "Maintain optimal growth during 5 days of 35°C",
    parameters: ['ventilation', 'shading', 'irrigation'],
    successCriteria: 'Minimize stress while conserving water'
  },
  {
    name: "Winter Production",
    challenge: "Maximize yield with minimal heating cost",
    parameters: ['temperature', 'CO2', 'lighting'],
    successCriteria: 'Achieve target yield < €50/kg'
  },
  {
    name: "Pest Outbreak",
    challenge: "Control whitefly without chemicals",
    parameters: ['temperature', 'humidity', 'beneficials'],
    successCriteria: 'Reduce pest below threshold in 14 days'
  }
]
```

#### 3. **Sandbox Mode**
- Free exploration of all parameters
- Save/load custom configurations
- Compare multiple scenarios
- Export data for analysis

#### 4. **Competition Mode**
- Leaderboard for efficiency scores
- Weekly challenges
- Share strategies with peers
- Instructor feedback system

### Assessment Tools:
- **Knowledge Tests**: Understanding of principles
- **Practical Exercises**: Apply knowledge to solve problems
- **Performance Metrics**: Efficiency in resource use
- **Portfolio Creation**: Document learning journey

---

## 6. TECHNICAL IMPLEMENTATION

### Dashboard Architecture:
```javascript
const dashboardStructure = {
  // Main Layout
  layout: 'responsive-grid',
  panels: [
    { id: 'controls', position: 'left', width: '25%' },
    { id: 'main-display', position: 'center', width: '50%' },
    { id: 'metrics', position: 'right', width: '25%' }
  ],

  // Visualization Libraries
  charts: 'D3.js / Chart.js',
  3dGraphics: 'Three.js',
  animations: 'GSAP',

  // Data Flow
  dataUpdate: 'WebSocket',
  calculation: 'Web Workers',
  storage: 'IndexedDB'
}
```

### User Interface Elements:
- **Sliders**: For continuous parameters
- **Toggle Switches**: For boolean options
- **Number Inputs**: For precise values
- **Dropdown Menus**: For discrete choices
- **Color Coding**: Green (optimal), Yellow (caution), Red (critical)
- **Tooltips**: Explanations on hover
- **Help Icons**: Link to documentation

---

## 7. DATA REQUIREMENTS FROM YOUR EXCEL SHEETS

### From "Energy balans en transpiration.xlsx":
- Enthalpy calculations
- Psychrometric relationships
- VPD categories for transpiration zones

### From "Humidity and energy balance.xlsx":
- Greenhouse-outside energy exchange formulas
- Condensation calculations
- Heat transfer coefficients

### From "Transpiration.xlsx":
- Wind speed effects on boundary layer
- Leaf dimension impacts
- Transpiration rate calculations

### From "Water Use Efficiency.xlsx":
- WUE calculation methods
- CO2-water relationship
- Biomass production per water unit

---

## IMPLEMENTATION CHECKLIST

- [ ] Design responsive UI layout
- [ ] Implement core calculation engines
- [ ] Create interactive visualizations
- [ ] Develop scenario database
- [ ] Build assessment system
- [ ] Write educational content
- [ ] Test with student groups
- [ ] Create instructor dashboard
- [ ] Develop API for data export
- [ ] Write documentation