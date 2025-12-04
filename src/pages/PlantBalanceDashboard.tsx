import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Surface
} from 'recharts';
import {
  TimeScale,
  PhotosynthesisParams,
  PhotosynthesisOutputs,
  TranspirationParams,
  TranspirationOutputs,
  EnergyBalanceParams,
  EnergyBalanceOutputs,
  defaultPhotosynthesisParams,
  defaultTranspirationParams,
  defaultEnergyParams
} from '../types/plantBalance';
import {
  calculatePhotosynthesis,
  calculateTranspiration,
  calculateEnergyBalance
} from '../utils/plantBalanceCalculations';

// Parameter Slider Component with enhanced visuals
interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
  description?: string;
  colorClass?: string;
}

const ParamSlider: React.FC<ParamSliderProps> = ({
  label, value, min, max, step = 1, unit, onChange, description, colorClass = 'primary'
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-bold text-${colorClass}`}>{value}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-${colorClass}`}
          style={{
            background: `linear-gradient(to right, hsl(var(--${colorClass})) 0%, hsl(var(--${colorClass})) ${percentage}%, hsl(var(--secondary)) ${percentage}%, hsl(var(--secondary)) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{min}</span>
          <span className="text-center">{((min + max) / 2).toFixed(1)}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Output Card
interface OutputCardProps {
  label: string;
  value: number | string;
  unit?: string;
  status?: 'optimal' | 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
}

const OutputCard: React.FC<OutputCardProps> = ({
  label, value, unit, status = 'good', trend, icon
}) => {
  const statusColors = {
    optimal: 'bg-green-500/10 border-green-500/30 text-green-600',
    good: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
    critical: 'bg-red-500/10 border-red-500/30 text-red-600'
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl border-2 ${statusColors[status]} transition-all`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <p className="text-xs font-medium opacity-80">{label}</p>
        </div>
        {trend && <span className="text-lg">{trendIcons[trend]}</span>}
      </div>
      <p className="text-2xl font-bold">
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit && <span className="text-sm ml-1 opacity-70">{unit}</span>}
      </p>
    </motion.div>
  );
};

// 3D Surface Plot Component (simplified visualization)
const SurfacePlot: React.FC<{ data: any, title: string }> = ({ data, title }) => {
  return (
    <div className="bg-card rounded-xl p-4 border">
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke="hsl(var(--primary))"
            fill="url(#colorGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const PlantBalanceDashboard: React.FC = () => {
  // Time scale state
  const [timeScale, setTimeScale] = useState<TimeScale>('realtime');

  // Simulation running state
  const [isRunning, setIsRunning] = useState(true);
  const [simulationTime, setSimulationTime] = useState(0);

  // Parameter states
  const [photosynthesisParams, setPhotosynthesisParams] = useState<PhotosynthesisParams>(defaultPhotosynthesisParams);
  const [transpirationParams, setTranspirationParams] = useState<TranspirationParams>(defaultTranspirationParams);
  const [energyParams, setEnergyParams] = useState<EnergyBalanceParams>(defaultEnergyParams);

  // Output states
  const [photosynthesisOutputs, setPhotosynthesisOutputs] = useState<PhotosynthesisOutputs>(
    calculatePhotosynthesis(defaultPhotosynthesisParams)
  );
  const [transpirationOutputs, setTranspirationOutputs] = useState<TranspirationOutputs>(
    calculateTranspiration(defaultTranspirationParams)
  );
  const [energyOutputs, setEnergyOutputs] = useState<EnergyBalanceOutputs>(
    calculateEnergyBalance(defaultEnergyParams)
  );

  // Historical data for visualizations
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Recalculate outputs when parameters change
  useEffect(() => {
    const outputs = calculatePhotosynthesis(photosynthesisParams);
    setPhotosynthesisOutputs(outputs);
  }, [photosynthesisParams]);

  useEffect(() => {
    const outputs = calculateTranspiration(transpirationParams);
    setTranspirationOutputs(outputs);
  }, [transpirationParams]);

  useEffect(() => {
    const outputs = calculateEnergyBalance(energyParams);
    setEnergyOutputs(outputs);
  }, [energyParams]);

  // Simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSimulationTime(prev => prev + 1);

      // Update historical data
      setHistoricalData(prev => {
        const newPoint = {
          time: simulationTime,
          timeLabel: timeScale === 'realtime' ? `${simulationTime % 24}:00` :
                    timeScale === 'daily' ? `Day ${Math.floor(simulationTime / 24)}` :
                    `Month ${Math.floor(simulationTime / (24 * 30))}`,
          photosynthesis: photosynthesisOutputs.netPhotosynthesis,
          transpiration: transpirationOutputs.transpirationRate,
          netRadiation: energyOutputs.netRadiation,
          waterUse: transpirationOutputs.dailyWaterUse,
          carbonGain: photosynthesisOutputs.carbonGain
        };

        const maxPoints = timeScale === 'realtime' ? 24 : timeScale === 'daily' ? 30 : 12;
        const updated = [...prev, newPoint].slice(-maxPoints);
        return updated;
      });
    }, timeScale === 'realtime' ? 1000 : timeScale === 'daily' ? 2000 : 5000);

    return () => clearInterval(interval);
  }, [isRunning, simulationTime, timeScale, photosynthesisOutputs, transpirationOutputs, energyOutputs]);

  // Generate data for 3D surface plots
  const generateSurfaceData = useCallback((param1: string, param2: string) => {
    const data = [];
    for (let i = 0; i <= 10; i++) {
      data.push({
        x: i * 10,
        y: Math.sin(i * 0.5) * 20 + 30 + Math.random() * 10
      });
    }
    return data;
  }, []);

  // Generate energy partition data for pie chart
  const energyPartitionData = useMemo(() => [
    { name: 'Sensible Heat', value: Math.abs(energyOutputs.sensibleHeatFlux), color: '#ef4444' },
    { name: 'Latent Heat', value: Math.abs(energyOutputs.latentHeatFlux), color: '#3b82f6' },
    { name: 'Soil Heat', value: Math.abs(energyOutputs.soilHeatFlux), color: '#f59e0b' },
    { name: 'Photosynthesis', value: Math.abs(energyOutputs.photosynthesisEnergy), color: '#10b981' }
  ], [energyOutputs]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setPhotosynthesisParams(defaultPhotosynthesisParams);
    setTranspirationParams(defaultTranspirationParams);
    setEnergyParams(defaultEnergyParams);
  }, []);

  // Sidebar content
  const sidebarContent = (
    <div className="space-y-6">
      {/* Time Scale Selector */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Time Scale
        </h3>
        <div className="space-y-2">
          {[
            { value: 'realtime', label: 'Real-time', icon: '⚡', desc: 'Instantaneous (1-5 min)' },
            { value: 'daily', label: 'Daily', icon: '📅', desc: '24-hour patterns' },
            { value: 'seasonal', label: 'Seasonal', icon: '📈', desc: 'Long-term trends' }
          ].map((scale) => (
            <button
              key={scale.value}
              onClick={() => setTimeScale(scale.value as TimeScale)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                timeScale === scale.value
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border hover:bg-secondary'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{scale.icon}</span>
                <div>
                  <p className="font-medium text-sm">{scale.label}</p>
                  <p className="text-xs text-muted-foreground">{scale.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Controls */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Simulation
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-full p-3 rounded-lg font-medium text-sm transition-all ${
              isRunning
                ? 'bg-red-500/10 border border-red-500/30 text-red-600 hover:bg-red-500/20'
                : 'bg-green-500/10 border border-green-500/30 text-green-600 hover:bg-green-500/20'
            }`}
          >
            {isRunning ? '⏸ Pause Simulation' : '▶ Start Simulation'}
          </button>
          <button
            onClick={resetToDefaults}
            className="w-full p-3 rounded-lg border border-border bg-card hover:bg-secondary transition-all text-sm font-medium"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      {/* Learning Mode */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Learning Mode
        </h3>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-2">
            Adjust parameters to see how they affect plant balances in real-time.
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Optimal</span>
            <span className="w-2 h-2 bg-yellow-500 rounded-full ml-2"></span>
            <span>Warning</span>
            <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Key Metrics
        </h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-card border">
            <p className="text-xs text-muted-foreground">Net Photosynthesis</p>
            <p className="text-lg font-bold text-primary">
              {photosynthesisOutputs.netPhotosynthesis} <span className="text-xs">μmol/m²/s</span>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <p className="text-xs text-muted-foreground">Water Use Efficiency</p>
            <p className="text-lg font-bold text-blue-500">
              {transpirationOutputs.waterUseEfficiency} <span className="text-xs">μmol/mmol</span>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <p className="text-xs text-muted-foreground">Energy Balance</p>
            <p className="text-lg font-bold text-orange-500">
              {energyOutputs.energyBalance} <span className="text-xs">W/m²</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout sidebarContent={sidebarContent}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-bold text-foreground mb-2">
                🌱 Educational Plant Balance Dashboard
              </h1>
              <p className="text-lg text-muted-foreground">
                Interactive learning platform for greenhouse climate control - Adjust algorithms to understand plant-environment interactions
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Simulation {isRunning ? 'Running' : 'Paused'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Time Scale: <span className="font-semibold text-foreground">{timeScale}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Simulation Time: <span className="font-semibold text-foreground">{simulationTime}h</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Overview Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-card rounded-xl shadow-lg border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📊</span> Real-time Plant Balance Overview
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="photosynthesis"
                    stroke="#10b981"
                    name="Photosynthesis (μmol/m²/s)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="transpiration"
                    stroke="#3b82f6"
                    name="Transpiration (mmol/m²/s)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="netRadiation"
                    stroke="#f59e0b"
                    name="Net Radiation (W/m²)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Balance Modules */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {/* ASSIMILATE BALANCE */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl shadow-lg border overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-500/20 to-green-600/10 p-6 border-b">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span>🌿</span> Assimilate Balance
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Carbon/Photosynthesis dynamics
                </p>
              </div>

              <div className="p-6">
                {/* Light Response Parameters */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">LIGHT RESPONSE</h4>
                  <ParamSlider
                    label="Quantum Yield"
                    value={photosynthesisParams.quantumYield}
                    min={0.04}
                    max={0.08}
                    step={0.001}
                    unit="mol CO₂/mol photons"
                    onChange={(v) => setPhotosynthesisParams(p => ({ ...p, quantumYield: v }))}
                    description="Photosynthetic efficiency at low light"
                    colorClass="green-500"
                  />
                  <ParamSlider
                    label="Light Saturation"
                    value={photosynthesisParams.lightSaturationPoint}
                    min={800}
                    max={2000}
                    step={50}
                    unit="μmol/m²/s"
                    onChange={(v) => setPhotosynthesisParams(p => ({ ...p, lightSaturationPoint: v }))}
                    colorClass="green-500"
                  />
                  <ParamSlider
                    label="Light Intensity (PAR)"
                    value={photosynthesisParams.lightIntensity}
                    min={0}
                    max={2000}
                    step={50}
                    unit="μmol/m²/s"
                    onChange={(v) => setPhotosynthesisParams(p => ({ ...p, lightIntensity: v }))}
                    description="Current light level"
                    colorClass="yellow-500"
                  />
                </div>

                {/* CO2 Response Parameters */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">CO₂ RESPONSE</h4>
                  <ParamSlider
                    label="CO₂ Concentration"
                    value={photosynthesisParams.co2Concentration}
                    min={200}
                    max={1500}
                    step={50}
                    unit="ppm"
                    onChange={(v) => setPhotosynthesisParams(p => ({ ...p, co2Concentration: v }))}
                    colorClass="green-500"
                  />
                  <ParamSlider
                    label="Carboxylation Efficiency"
                    value={photosynthesisParams.carboxylationEfficiency}
                    min={0.05}
                    max={0.12}
                    step={0.005}
                    unit=""
                    onChange={(v) => setPhotosynthesisParams(p => ({ ...p, carboxylationEfficiency: v }))}
                    colorClass="green-500"
                  />
                </div>

                {/* Temperature Response */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">TEMPERATURE</h4>
                  <ParamSlider
                    label="Current Temperature"
                    value={photosynthesisParams.temperature}
                    min={5}
                    max={40}
                    step={0.5}
                    unit="°C"
                    onChange={(v) => setPhotosynthesisParams(p => ({ ...p, temperature: v }))}
                    colorClass="orange-500"
                  />
                </div>

                {/* Outputs */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">OUTPUTS</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <OutputCard
                      label="Gross Photosynthesis"
                      value={photosynthesisOutputs.grossPhotosynthesis}
                      unit="μmol/m²/s"
                      icon="☀️"
                      status="good"
                    />
                    <OutputCard
                      label="Net Photosynthesis"
                      value={photosynthesisOutputs.netPhotosynthesis}
                      unit="μmol/m²/s"
                      icon="🌱"
                      status={photosynthesisOutputs.netPhotosynthesis > 15 ? 'optimal' : 'warning'}
                    />
                    <OutputCard
                      label="Daily Assimilates"
                      value={photosynthesisOutputs.dailyAssimilates}
                      unit="g CH₂O/m²"
                      icon="🍬"
                      status="good"
                    />
                    <OutputCard
                      label="Efficiency"
                      value={photosynthesisOutputs.efficiency}
                      unit="%"
                      icon="📈"
                      status={photosynthesisOutputs.efficiency > 70 ? 'optimal' : 'warning'}
                    />
                  </div>
                </div>

                {/* Interactive 3D Surface */}
                <SurfacePlot
                  data={generateSurfaceData('light', 'co2')}
                  title="Photosynthesis Response Surface (Light × CO₂)"
                />
              </div>
            </motion.div>

            {/* WATER BALANCE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl shadow-lg border overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/10 p-6 border-b">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span>💧</span> Water Balance
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Transpiration & water dynamics
                </p>
              </div>

              <div className="p-6">
                {/* Stomatal Control */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">STOMATAL CONTROL</h4>
                  <ParamSlider
                    label="Max Stomatal Conductance"
                    value={transpirationParams.maxStomatalConductance}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    unit="mol/m²/s"
                    onChange={(v) => setTranspirationParams(p => ({ ...p, maxStomatalConductance: v }))}
                    colorClass="blue-500"
                  />
                  <ParamSlider
                    label="VPD Air"
                    value={transpirationParams.vpdAir}
                    min={0.2}
                    max={3.0}
                    step={0.1}
                    unit="kPa"
                    onChange={(v) => setTranspirationParams(p => ({ ...p, vpdAir: v }))}
                    description="Vapor pressure deficit"
                    colorClass="blue-500"
                  />
                  <ParamSlider
                    label="VPD Threshold Low"
                    value={transpirationParams.vpdThresholdLow}
                    min={0.3}
                    max={0.8}
                    step={0.05}
                    unit="kPa"
                    onChange={(v) => setTranspirationParams(p => ({ ...p, vpdThresholdLow: v }))}
                    colorClass="blue-500"
                  />
                  <ParamSlider
                    label="VPD Threshold High"
                    value={transpirationParams.vpdThresholdHigh}
                    min={1.5}
                    max={3.0}
                    step={0.1}
                    unit="kPa"
                    onChange={(v) => setTranspirationParams(p => ({ ...p, vpdThresholdHigh: v }))}
                    colorClass="blue-500"
                  />
                </div>

                {/* Boundary Layer */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">BOUNDARY LAYER</h4>
                  <ParamSlider
                    label="Wind Speed"
                    value={transpirationParams.windSpeed}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    unit="m/s"
                    onChange={(v) => setTranspirationParams(p => ({ ...p, windSpeed: v }))}
                    colorClass="cyan-500"
                  />
                  <ParamSlider
                    label="Leaf Size"
                    value={transpirationParams.leafCharacteristicLength}
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    unit="m"
                    onChange={(v) => setTranspirationParams(p => ({ ...p, leafCharacteristicLength: v }))}
                    colorClass="cyan-500"
                  />
                </div>

                {/* Outputs */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">OUTPUTS</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <OutputCard
                      label="Transpiration Rate"
                      value={transpirationOutputs.transpirationRate}
                      unit="mmol/m²/s"
                      icon="💨"
                      status="good"
                    />
                    <OutputCard
                      label="Daily Water Use"
                      value={transpirationOutputs.dailyWaterUse}
                      unit="L/m²"
                      icon="🌊"
                      status={transpirationOutputs.dailyWaterUse > 2 && transpirationOutputs.dailyWaterUse < 6 ? 'optimal' : 'warning'}
                    />
                    <OutputCard
                      label="WUE"
                      value={transpirationOutputs.waterUseEfficiency}
                      unit="μmol/mmol"
                      icon="⚖️"
                      status={transpirationOutputs.waterUseEfficiency > 3 ? 'optimal' : 'warning'}
                    />
                    <OutputCard
                      label="VPD Status"
                      value={transpirationOutputs.vpdCategory}
                      icon="🌡️"
                      status={transpirationOutputs.vpdCategory.includes('Healthy') ? 'optimal' : 'warning'}
                    />
                  </div>
                </div>

                {/* VPD Gauge */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">VPD Status Indicator</h4>
                  <div className="relative h-8 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-gray-800"
                      style={{ left: `${Math.min(100, Math.max(0, (transpirationParams.vpdAir / 3) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span>Under</span>
                    <span>Healthy</span>
                    <span>Over</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ENERGY BALANCE */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl shadow-lg border overflow-hidden"
            >
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 p-6 border-b">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span>⚡</span> Energy Balance
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Radiation & heat exchange
                </p>
              </div>

              <div className="p-6">
                {/* Radiation Parameters */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">RADIATION</h4>
                  <ParamSlider
                    label="Solar Radiation"
                    value={energyParams.solarRadiation}
                    min={0}
                    max={1000}
                    step={50}
                    unit="W/m²"
                    onChange={(v) => setEnergyParams(p => ({ ...p, solarRadiation: v }))}
                    colorClass="orange-500"
                  />
                  <ParamSlider
                    label="Leaf Absorptance"
                    value={energyParams.leafAbsorptance}
                    min={0.7}
                    max={0.95}
                    step={0.01}
                    unit=""
                    onChange={(v) => setEnergyParams(p => ({ ...p, leafAbsorptance: v }))}
                    colorClass="orange-500"
                  />
                  <ParamSlider
                    label="Canopy Extinction"
                    value={energyParams.canopyExtinctionCoeff}
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    unit=""
                    onChange={(v) => setEnergyParams(p => ({ ...p, canopyExtinctionCoeff: v }))}
                    colorClass="orange-500"
                  />
                </div>

                {/* Temperature */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">TEMPERATURE</h4>
                  <ParamSlider
                    label="Leaf Temperature"
                    value={energyParams.leafTemperature}
                    min={15}
                    max={40}
                    step={0.5}
                    unit="°C"
                    onChange={(v) => setEnergyParams(p => ({ ...p, leafTemperature: v }))}
                    colorClass="red-500"
                  />
                  <ParamSlider
                    label="Air Temperature"
                    value={energyParams.airTemperature}
                    min={15}
                    max={40}
                    step={0.5}
                    unit="°C"
                    onChange={(v) => setEnergyParams(p => ({ ...p, airTemperature: v }))}
                    colorClass="red-500"
                  />
                </div>

                {/* Energy Partitioning */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">PARTITIONING</h4>
                  <ParamSlider
                    label="Latent Heat Ratio"
                    value={energyParams.latentHeatRatio}
                    min={0.5}
                    max={0.9}
                    step={0.05}
                    unit=""
                    onChange={(v) => setEnergyParams(p => ({ ...p, latentHeatRatio: v }))}
                    colorClass="blue-500"
                  />
                  <ParamSlider
                    label="Sensible Heat Ratio"
                    value={energyParams.sensibleHeatRatio}
                    min={0.1}
                    max={0.4}
                    step={0.05}
                    unit=""
                    onChange={(v) => setEnergyParams(p => ({ ...p, sensibleHeatRatio: v }))}
                    colorClass="red-500"
                  />
                </div>

                {/* Outputs */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">OUTPUTS</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <OutputCard
                      label="Net Radiation"
                      value={energyOutputs.netRadiation}
                      unit="W/m²"
                      icon="☀️"
                      status="good"
                    />
                    <OutputCard
                      label="Sensible Heat"
                      value={energyOutputs.sensibleHeatFlux}
                      unit="W/m²"
                      icon="🌡️"
                      status="good"
                    />
                    <OutputCard
                      label="Latent Heat"
                      value={energyOutputs.latentHeatFlux}
                      unit="W/m²"
                      icon="💨"
                      status="good"
                    />
                    <OutputCard
                      label="Leaf-Air ΔT"
                      value={energyOutputs.leafAirTempDiff}
                      unit="°C"
                      icon="🌡️"
                      status={Math.abs(energyOutputs.leafAirTempDiff) < 3 ? 'optimal' : 'warning'}
                    />
                  </div>
                </div>

                {/* Energy Partition Pie Chart */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">Energy Partition</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={energyPartitionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {energyPartitionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Learning Outcomes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl shadow-lg border p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🎓</span> Learning Outcomes & Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-green-600 mb-2">Photosynthesis Insights</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Light saturation at {photosynthesisParams.lightSaturationPoint} μmol/m²/s</li>
                  <li>• CO₂ fertilization effect: {((photosynthesisParams.co2Concentration / 400 - 1) * 100).toFixed(0)}% boost</li>
                  <li>• Temperature optimum: {photosynthesisParams.optimalTempPhoto}°C</li>
                  <li>• Current efficiency: {photosynthesisOutputs.efficiency}% of maximum</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-600 mb-2">Water Balance Insights</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• VPD Status: {transpirationOutputs.vpdCategory}</li>
                  <li>• Water stress: {transpirationOutputs.waterStressLevel}</li>
                  <li>• Stomatal opening: {((transpirationOutputs.stomatalConductance / transpirationParams.maxStomatalConductance) * 100).toFixed(0)}%</li>
                  <li>• Daily water need: {transpirationOutputs.dailyWaterUse} L/m²</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-orange-600 mb-2">Energy Balance Insights</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Energy captured: {energyOutputs.absorbedRadiation} W/m²</li>
                  <li>• Bowen ratio: {energyOutputs.bowenRatio}</li>
                  <li>• Leaf cooling: {energyOutputs.leafAirTempDiff}°C</li>
                  <li>• Balance check: {Math.abs(energyOutputs.energyBalance) < 10 ? '✓ Balanced' : '⚠ Imbalanced'}</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PlantBalanceDashboard;