import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import {
  TimeScale,
  AssimilateBalanceParams, AssimilateBalanceOutputs,
  WaterBalanceParams, WaterBalanceOutputs,
  EnergyBalanceParams, EnergyBalanceOutputs,
  GreenhouseEnergyParams, GreenhouseEnergyOutputs,
  HumidityBalanceParams, HumidityBalanceOutputs,
  CO2BalanceParams, CO2BalanceOutputs,
  CropJudgementParams, CropJudgementOutputs,
  IPMParams, IPMOutputs,
  defaultAssimilateParams,
  defaultWaterParams,
  defaultEnergyParams,
  defaultGreenhouseEnergyParams,
  defaultHumidityParams,
  defaultCO2Params,
  defaultCropParams,
  defaultIPMParams
} from '../types/algorithms';
import {
  calculateAssimilateBalance,
  calculateWaterBalance,
  calculatePlantEnergyBalance,
  calculateGreenhouseEnergyBalance,
  calculateHumidityBalance,
  calculateCO2Balance,
  calculateCropJudgement,
  calculateIPM
} from '../utils/algorithmCalculations';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Parameter Slider Component
interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
  description?: string;
}

const ParamSlider: React.FC<ParamSliderProps> = ({
  label, value, min, max, step = 1, unit, onChange, description
}) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <span className="text-sm font-bold text-primary">{value} {unit}</span>
    </div>
    {description && (
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
    )}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
    />
    <div className="flex justify-between text-xs text-muted-foreground mt-1">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

// Output Display Card
interface OutputCardProps {
  label: string;
  value: number | string;
  unit?: string;
  status?: 'good' | 'warning' | 'danger' | 'neutral';
  icon?: string;
}

const OutputCard: React.FC<OutputCardProps> = ({ label, value, unit, status = 'neutral', icon }) => {
  const statusColors = {
    good: 'bg-green-500/10 border-green-500/30 text-green-600',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
    danger: 'bg-red-500/10 border-red-500/30 text-red-600',
    neutral: 'bg-primary/10 border-primary/30 text-primary'
  };

  return (
    <div className={`p-4 rounded-xl border ${statusColors[status]} transition-all hover:scale-105`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-xl">{icon}</span>}
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
      <p className="text-2xl font-bold">
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit && <span className="text-sm ml-1 opacity-70">{unit}</span>}
      </p>
    </div>
  );
};

// Section Header Component
const SectionHeader: React.FC<{ title: string; icon: string; description: string }> = ({ title, icon, description }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
      <span className="text-2xl">{icon}</span>
      {title}
    </h3>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </div>
);

const StudentAlgorithmDashboard: React.FC = () => {
  // Time scale state
  const [timeScale, setTimeScale] = useState<TimeScale>('momentaneous');

  // Active section state
  const [activeSection, setActiveSection] = useState<'plant-greenhouse' | 'greenhouse-outside' | 'crop-ipm'>('plant-greenhouse');

  // Plant-Greenhouse Parameters
  const [assimilateParams, setAssimilateParams] = useState<AssimilateBalanceParams>(defaultAssimilateParams);
  const [waterParams, setWaterParams] = useState<WaterBalanceParams>(defaultWaterParams);
  const [energyParams, setEnergyParams] = useState<EnergyBalanceParams>(defaultEnergyParams);

  // Greenhouse-Outside Parameters
  const [greenhouseEnergyParams, setGreenhouseEnergyParams] = useState<GreenhouseEnergyParams>(defaultGreenhouseEnergyParams);
  const [humidityParams, setHumidityParams] = useState<HumidityBalanceParams>(defaultHumidityParams);
  const [co2Params, setCO2Params] = useState<CO2BalanceParams>(defaultCO2Params);

  // Crop Management Parameters
  const [cropParams, setCropParams] = useState<CropJudgementParams>(defaultCropParams);
  const [ipmParams, setIPMParams] = useState<IPMParams>(defaultIPMParams);

  // Outputs
  const [assimilateOutputs, setAssimilateOutputs] = useState<AssimilateBalanceOutputs>(() =>
    calculateAssimilateBalance(defaultAssimilateParams));
  const [waterOutputs, setWaterOutputs] = useState<WaterBalanceOutputs>(() =>
    calculateWaterBalance(defaultWaterParams));
  const [energyOutputs, setEnergyOutputs] = useState<EnergyBalanceOutputs>(() =>
    calculatePlantEnergyBalance(defaultEnergyParams));
  const [greenhouseEnergyOutputs, setGreenhouseEnergyOutputs] = useState<GreenhouseEnergyOutputs>(() =>
    calculateGreenhouseEnergyBalance(defaultGreenhouseEnergyParams));
  const [humidityOutputs, setHumidityOutputs] = useState<HumidityBalanceOutputs>(() =>
    calculateHumidityBalance(defaultHumidityParams));
  const [co2Outputs, setCO2Outputs] = useState<CO2BalanceOutputs>(() =>
    calculateCO2Balance(defaultCO2Params));
  const [cropOutputs, setCropOutputs] = useState<CropJudgementOutputs>(() =>
    calculateCropJudgement(defaultCropParams));
  const [ipmOutputs, setIPMOutputs] = useState<IPMOutputs>(() =>
    calculateIPM(defaultIPMParams));

  // Historical data for charts (simulated)
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Recalculate outputs when parameters change
  useEffect(() => {
    setAssimilateOutputs(calculateAssimilateBalance(assimilateParams));
  }, [assimilateParams]);

  useEffect(() => {
    setWaterOutputs(calculateWaterBalance(waterParams));
  }, [waterParams]);

  useEffect(() => {
    setEnergyOutputs(calculatePlantEnergyBalance(energyParams));
  }, [energyParams]);

  useEffect(() => {
    setGreenhouseEnergyOutputs(calculateGreenhouseEnergyBalance(greenhouseEnergyParams));
  }, [greenhouseEnergyParams]);

  useEffect(() => {
    setHumidityOutputs(calculateHumidityBalance(humidityParams));
  }, [humidityParams]);

  useEffect(() => {
    setCO2Outputs(calculateCO2Balance(co2Params));
  }, [co2Params]);

  useEffect(() => {
    setCropOutputs(calculateCropJudgement(cropParams));
  }, [cropParams]);

  useEffect(() => {
    setIPMOutputs(calculateIPM(ipmParams));
  }, [ipmParams]);

  // Generate historical data based on time scale
  useEffect(() => {
    const generateHistoricalData = () => {
      const dataPoints = timeScale === 'momentaneous' ? 24 : timeScale === 'short_term' ? 7 : 30;
      const data = [];

      for (let i = 0; i < dataPoints; i++) {
        const timeLabel = timeScale === 'momentaneous'
          ? `${i}:00`
          : timeScale === 'short_term'
            ? `Day ${i + 1}`
            : `Week ${Math.floor(i / 7) + 1}`;

        data.push({
          time: timeLabel,
          photosynthesis: assimilateOutputs.netPhotosynthesis * (0.8 + Math.random() * 0.4),
          transpiration: waterOutputs.dailyTranspiration * (0.7 + Math.random() * 0.6),
          co2: co2Params.insideCO2 * (0.9 + Math.random() * 0.2),
          temperature: greenhouseEnergyParams.insideTemperature + (Math.random() - 0.5) * 4,
          humidity: humidityParams.insideHumidity * (0.95 + Math.random() * 0.1)
        });
      }
      setHistoricalData(data);
    };

    generateHistoricalData();
  }, [timeScale, assimilateOutputs, waterOutputs, co2Params, greenhouseEnergyParams, humidityParams]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setAssimilateParams(defaultAssimilateParams);
    setWaterParams(defaultWaterParams);
    setEnergyParams(defaultEnergyParams);
    setGreenhouseEnergyParams(defaultGreenhouseEnergyParams);
    setHumidityParams(defaultHumidityParams);
    setCO2Params(defaultCO2Params);
    setCropParams(defaultCropParams);
    setIPMParams(defaultIPMParams);
  }, []);

  const sidebarContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Time Scale
        </h3>
        <div className="space-y-2">
          {[
            { value: 'momentaneous', label: 'Momentaneous', desc: 'Real-time (hourly)' },
            { value: 'short_term', label: 'Short Term', desc: 'Daily/Weekly' },
            { value: 'long_term', label: 'Long Term', desc: 'Monthly/Seasonal' }
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
              <p className="font-medium text-sm">{scale.label}</p>
              <p className="text-xs text-muted-foreground">{scale.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <button
          onClick={resetToDefaults}
          className="w-full p-3 rounded-lg border border-border bg-card hover:bg-secondary transition-all text-sm font-medium"
        >
          Reset All to Defaults
        </button>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Current Status
        </h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-card border">
            <p className="text-xs text-muted-foreground">Net Photosynthesis</p>
            <p className="text-lg font-bold text-primary">{assimilateOutputs.netPhotosynthesis} umol/m2/s</p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <p className="text-xs text-muted-foreground">Daily Transpiration</p>
            <p className="text-lg font-bold text-blue-500">{waterOutputs.dailyTranspiration} L/m2</p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <p className="text-xs text-muted-foreground">Crop Health</p>
            <p className="text-lg font-bold text-green-500">{cropOutputs.overallHealth}%</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout sidebarContent={sidebarContent}>
      <div className="min-h-screen bg-background p-6">
        {/* Header */}
        <div className="max-w-full mx-auto mb-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <span className="text-4xl">🌱</span>
                Autonomous Greenhouse Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Explore and adjust greenhouse balance algorithms interactively
              </p>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 bg-card rounded-xl p-1 border">
              {[
                { value: 'plant-greenhouse', label: 'Plant-Greenhouse', icon: '🌱' },
                { value: 'greenhouse-outside', label: 'Greenhouse-Outside', icon: '🏠' },
                { value: 'crop-ipm', label: 'Crop & IPM', icon: '🍅' }
              ].map((section) => (
                <button
                  key={section.value}
                  onClick={() => setActiveSection(section.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeSection === section.value
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Time Scale Indicator */}
        <div className="max-w-full mx-auto mb-6 px-4">
          <div className="bg-card rounded-xl p-4 border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {timeScale === 'momentaneous' ? '⚡' : timeScale === 'short_term' ? '📅' : '📈'}
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  {timeScale === 'momentaneous' ? 'Momentaneous View' :
                   timeScale === 'short_term' ? 'Short-Term View' : 'Long-Term View'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {timeScale === 'momentaneous' ? 'Real-time hourly analysis' :
                   timeScale === 'short_term' ? 'Daily to weekly trends' : 'Monthly and seasonal patterns'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Data Resolution</p>
              <p className="font-bold text-foreground">
                {timeScale === 'momentaneous' ? '1 hour' : timeScale === 'short_term' ? '1 day' : '1 week'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-full mx-auto px-4">
          {/* PLANT-GREENHOUSE BALANCE SECTION */}
          {activeSection === 'plant-greenhouse' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Overview Chart */}
              <div className="bg-card rounded-xl shadow-lg border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>📊</span> Plant-Greenhouse Balance Overview
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="photosynthesis" stroke="hsl(var(--primary))" name="Photosynthesis" strokeWidth={2} />
                    <Line type="monotone" dataKey="transpiration" stroke="#3b82f6" name="Transpiration" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assimilate Balance */}
                <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 p-6 border-b">
                    <SectionHeader
                      title="Assimilate Balance"
                      icon="🌿"
                      description="Photosynthesis & carbon allocation"
                    />
                  </div>
                  <div className="p-6">
                    {/* Parameters */}
                    <div className="space-y-4 mb-6">
                      <ParamSlider
                        label="Light Intensity (PAR)"
                        value={assimilateParams.lightIntensity}
                        min={0}
                        max={1500}
                        step={10}
                        unit="umol/m2/s"
                        onChange={(v) => setAssimilateParams(p => ({ ...p, lightIntensity: v }))}
                        description="Photosynthetically active radiation"
                      />
                      <ParamSlider
                        label="CO2 Concentration"
                        value={assimilateParams.co2Concentration}
                        min={200}
                        max={1500}
                        step={10}
                        unit="ppm"
                        onChange={(v) => setAssimilateParams(p => ({ ...p, co2Concentration: v }))}
                      />
                      <ParamSlider
                        label="Leaf Area Index"
                        value={assimilateParams.leafAreaIndex}
                        min={0.5}
                        max={6}
                        step={0.1}
                        unit="m2/m2"
                        onChange={(v) => setAssimilateParams(p => ({ ...p, leafAreaIndex: v }))}
                      />
                      <ParamSlider
                        label="Photoperiod"
                        value={assimilateParams.photoperiod}
                        min={8}
                        max={24}
                        step={0.5}
                        unit="hours"
                        onChange={(v) => setAssimilateParams(p => ({ ...p, photoperiod: v }))}
                      />
                    </div>

                    {/* Outputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <OutputCard
                        label="Gross Photosynthesis"
                        value={assimilateOutputs.grossPhotosynthesis}
                        unit="umol/m2/s"
                        icon="☀️"
                        status="good"
                      />
                      <OutputCard
                        label="Net Photosynthesis"
                        value={assimilateOutputs.netPhotosynthesis}
                        unit="umol/m2/s"
                        icon="🌱"
                        status={assimilateOutputs.netPhotosynthesis > 15 ? 'good' : 'warning'}
                      />
                      <OutputCard
                        label="Daily Assimilates"
                        value={assimilateOutputs.dailyAssimilates}
                        unit="g CH2O/m2"
                        icon="🍬"
                        status="neutral"
                      />
                      <OutputCard
                        label="Carbon Use Efficiency"
                        value={(assimilateOutputs.carbonUseEfficiency * 100).toFixed(1)}
                        unit="%"
                        icon="♻️"
                        status={assimilateOutputs.carbonUseEfficiency > 0.7 ? 'good' : 'warning'}
                      />
                    </div>
                  </div>
                </div>

                {/* Water Balance */}
                <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 p-6 border-b">
                    <SectionHeader
                      title="Water Balance"
                      icon="💧"
                      description="Transpiration & water use"
                    />
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      <ParamSlider
                        label="VPD (Leaf-Air)"
                        value={waterParams.vpdLeafAir}
                        min={0.2}
                        max={3}
                        step={0.1}
                        unit="kPa"
                        onChange={(v) => setWaterParams(p => ({ ...p, vpdLeafAir: v }))}
                        description="Vapor pressure deficit driving transpiration"
                      />
                      <ParamSlider
                        label="Stomatal Conductance"
                        value={waterParams.stomatalConductance}
                        min={0.05}
                        max={0.8}
                        step={0.01}
                        unit="mol/m2/s"
                        onChange={(v) => setWaterParams(p => ({ ...p, stomatalConductance: v }))}
                      />
                      <ParamSlider
                        label="Irrigation Rate"
                        value={waterParams.irrigationRate}
                        min={1}
                        max={10}
                        step={0.5}
                        unit="L/m2/day"
                        onChange={(v) => setWaterParams(p => ({ ...p, irrigationRate: v }))}
                      />
                      <ParamSlider
                        label="Substrate Water Content"
                        value={waterParams.substrateWaterContent}
                        min={20}
                        max={90}
                        step={1}
                        unit="%"
                        onChange={(v) => setWaterParams(p => ({ ...p, substrateWaterContent: v }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <OutputCard
                        label="Transpiration Rate"
                        value={waterOutputs.transpirationRate}
                        unit="L/m2/h"
                        icon="💨"
                        status="neutral"
                      />
                      <OutputCard
                        label="Daily Transpiration"
                        value={waterOutputs.dailyTranspiration}
                        unit="L/m2"
                        icon="🌊"
                        status={waterOutputs.dailyTranspiration > 3 ? 'good' : 'warning'}
                      />
                      <OutputCard
                        label="Water Use Efficiency"
                        value={waterOutputs.waterUseEfficiency}
                        unit="g/L"
                        icon="⚖️"
                        status={waterOutputs.waterUseEfficiency > 3 ? 'good' : 'warning'}
                      />
                      <OutputCard
                        label="Plant Water Status"
                        value={waterOutputs.plantWaterStatus.replace('_', ' ')}
                        icon="🌿"
                        status={waterOutputs.plantWaterStatus === 'optimal' ? 'good' :
                               waterOutputs.plantWaterStatus === 'mild_stress' ? 'warning' : 'danger'}
                      />
                    </div>
                  </div>
                </div>

                {/* Energy Balance */}
                <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 p-6 border-b">
                    <SectionHeader
                      title="Plant Energy Balance"
                      icon="⚡"
                      description="Radiation & heat exchange"
                    />
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      <ParamSlider
                        label="Solar Radiation"
                        value={energyParams.solarRadiation}
                        min={0}
                        max={1000}
                        step={10}
                        unit="W/m2"
                        onChange={(v) => setEnergyParams(p => ({ ...p, solarRadiation: v }))}
                      />
                      <ParamSlider
                        label="Leaf Temperature"
                        value={energyParams.leafTemperature}
                        min={15}
                        max={40}
                        step={0.5}
                        unit="C"
                        onChange={(v) => setEnergyParams(p => ({ ...p, leafTemperature: v }))}
                      />
                      <ParamSlider
                        label="Air Temperature"
                        value={energyParams.airTemperature}
                        min={15}
                        max={40}
                        step={0.5}
                        unit="C"
                        onChange={(v) => setEnergyParams(p => ({ ...p, airTemperature: v }))}
                      />
                      <ParamSlider
                        label="PAR Absorption"
                        value={energyParams.parAbsorption}
                        min={0.5}
                        max={1}
                        step={0.01}
                        unit=""
                        onChange={(v) => setEnergyParams(p => ({ ...p, parAbsorption: v }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <OutputCard
                        label="Net Radiation"
                        value={energyOutputs.netRadiation}
                        unit="W/m2"
                        icon="☀️"
                        status="neutral"
                      />
                      <OutputCard
                        label="Sensible Heat"
                        value={energyOutputs.sensibleHeatFlux}
                        unit="W/m2"
                        icon="🌡️"
                        status="neutral"
                      />
                      <OutputCard
                        label="Latent Heat"
                        value={energyOutputs.latentHeatFlux}
                        unit="W/m2"
                        icon="💨"
                        status="neutral"
                      />
                      <OutputCard
                        label="Leaf-Air Temp Diff"
                        value={energyOutputs.leafToAirTemperatureDiff}
                        unit="C"
                        icon="🌡️"
                        status={Math.abs(energyOutputs.leafToAirTemperatureDiff) < 2 ? 'good' : 'warning'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* GREENHOUSE-OUTSIDE BALANCE SECTION */}
          {activeSection === 'greenhouse-outside' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Overview Chart */}
              <div className="bg-card rounded-xl shadow-lg border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>📊</span> Greenhouse-Outside Balance Overview
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="temperature" stroke="#ef4444" fill="#ef444433" name="Temperature (C)" />
                    <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="#3b82f633" name="Humidity (%)" />
                    <Area type="monotone" dataKey="co2" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="CO2 (ppm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Greenhouse Energy Balance */}
                <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500/10 to-red-600/5 p-6 border-b">
                    <SectionHeader
                      title="Energy Balance"
                      icon="🔥"
                      description="Heating, cooling & losses"
                    />
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      <ParamSlider
                        label="Outside Temperature"
                        value={greenhouseEnergyParams.outsideTemperature}
                        min={-10}
                        max={40}
                        step={1}
                        unit="C"
                        onChange={(v) => setGreenhouseEnergyParams(p => ({ ...p, outsideTemperature: v }))}
                      />
                      <ParamSlider
                        label="Inside Temperature"
                        value={greenhouseEnergyParams.insideTemperature}
                        min={10}
                        max={35}
                        step={0.5}
                        unit="C"
                        onChange={(v) => setGreenhouseEnergyParams(p => ({ ...p, insideTemperature: v }))}
                      />
                      <ParamSlider
                        label="Outside Solar Radiation"
                        value={greenhouseEnergyParams.outsideSolarRadiation}
                        min={0}
                        max={1000}
                        step={10}
                        unit="W/m2"
                        onChange={(v) => setGreenhouseEnergyParams(p => ({ ...p, outsideSolarRadiation: v }))}
                      />
                      <ParamSlider
                        label="Screen Position"
                        value={greenhouseEnergyParams.screenPosition}
                        min={0}
                        max={100}
                        step={5}
                        unit="%"
                        onChange={(v) => setGreenhouseEnergyParams(p => ({ ...p, screenPosition: v }))}
                      />
                      <ParamSlider
                        label="Ventilation Rate"
                        value={greenhouseEnergyParams.ventilationRate}
                        min={0}
                        max={100}
                        step={5}
                        unit="m3/m2/h"
                        onChange={(v) => setGreenhouseEnergyParams(p => ({ ...p, ventilationRate: v }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <OutputCard
                        label="Solar Heat Gain"
                        value={greenhouseEnergyOutputs.solarHeatGain}
                        unit="W/m2"
                        icon="☀️"
                        status="good"
                      />
                      <OutputCard
                        label="Transmitted PAR"
                        value={greenhouseEnergyOutputs.transmittedPAR}
                        unit="umol/m2/s"
                        icon="💡"
                        status={greenhouseEnergyOutputs.transmittedPAR > 300 ? 'good' : 'warning'}
                      />
                      <OutputCard
                        label="Conduction Loss"
                        value={greenhouseEnergyOutputs.conductionLoss}
                        unit="W/m2"
                        icon="🧊"
                        status="neutral"
                      />
                      <OutputCard
                        label="Heating Required"
                        value={greenhouseEnergyOutputs.heatingRequired}
                        unit="W/m2"
                        icon="🔥"
                        status={greenhouseEnergyOutputs.heatingRequired > 100 ? 'warning' : 'good'}
                      />
                    </div>
                  </div>
                </div>

                {/* Humidity Balance */}
                <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-600/5 p-6 border-b">
                    <SectionHeader
                      title="Humidity Balance"
                      icon="💨"
                      description="Moisture control & VPD"
                    />
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      <ParamSlider
                        label="Inside Humidity"
                        value={humidityParams.insideHumidity}
                        min={40}
                        max={95}
                        step={1}
                        unit="%"
                        onChange={(v) => setHumidityParams(p => ({ ...p, insideHumidity: v }))}
                      />
                      <ParamSlider
                        label="Transpiration Rate"
                        value={humidityParams.transpirationRate}
                        min={50}
                        max={500}
                        step={10}
                        unit="g/m2/h"
                        onChange={(v) => setHumidityParams(p => ({ ...p, transpirationRate: v }))}
                      />
                      <ParamSlider
                        label="Outside Humidity"
                        value={humidityParams.outsideHumidity}
                        min={20}
                        max={100}
                        step={1}
                        unit="%"
                        onChange={(v) => setHumidityParams(p => ({ ...p, outsideHumidity: v }))}
                      />
                      <ParamSlider
                        label="Cover Temperature"
                        value={humidityParams.coverTemperature}
                        min={5}
                        max={30}
                        step={1}
                        unit="C"
                        onChange={(v) => setHumidityParams(p => ({ ...p, coverTemperature: v }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <OutputCard
                        label="VPD Inside"
                        value={humidityOutputs.vpdInside}
                        unit="kPa"
                        icon="💧"
                        status={humidityOutputs.vpdInside > 0.5 && humidityOutputs.vpdInside < 1.5 ? 'good' : 'warning'}
                      />
                      <OutputCard
                        label="Dew Point"
                        value={humidityOutputs.dewPointInside}
                        unit="C"
                        icon="🌫️"
                        status="neutral"
                      />
                      <OutputCard
                        label="Condensation"
                        value={humidityOutputs.condensationRate}
                        unit="g/m2/h"
                        icon="💦"
                        status={humidityOutputs.condensationRate < 10 ? 'good' : 'danger'}
                      />
                      <OutputCard
                        label="Humidity Balance"
                        value={humidityOutputs.humidityBalance}
                        unit="g/m2/h"
                        icon="⚖️"
                        status={Math.abs(humidityOutputs.humidityBalance) < 50 ? 'good' : 'warning'}
                      />
                    </div>
                  </div>
                </div>

                {/* CO2 Balance */}
                <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/5 p-6 border-b">
                    <SectionHeader
                      title="CO2 Balance"
                      icon="🫧"
                      description="Enrichment & ventilation"
                    />
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      <ParamSlider
                        label="Inside CO2"
                        value={co2Params.insideCO2}
                        min={300}
                        max={1500}
                        step={10}
                        unit="ppm"
                        onChange={(v) => setCO2Params(p => ({ ...p, insideCO2: v }))}
                      />
                      <ParamSlider
                        label="CO2 Setpoint"
                        value={co2Params.co2Setpoint}
                        min={400}
                        max={1200}
                        step={50}
                        unit="ppm"
                        onChange={(v) => setCO2Params(p => ({ ...p, co2Setpoint: v }))}
                      />
                      <ParamSlider
                        label="CO2 Injection Rate"
                        value={co2Params.co2InjectionRate}
                        min={0}
                        max={150}
                        step={5}
                        unit="g/m2/h"
                        onChange={(v) => setCO2Params(p => ({ ...p, co2InjectionRate: v }))}
                      />
                      <ParamSlider
                        label="Crop CO2 Uptake"
                        value={co2Params.cropCO2Uptake}
                        min={5}
                        max={80}
                        step={5}
                        unit="g/m2/h"
                        onChange={(v) => setCO2Params(p => ({ ...p, cropCO2Uptake: v }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <OutputCard
                        label="CO2 Supply Rate"
                        value={co2Outputs.co2SupplyRate}
                        unit="g/m2/h"
                        icon="⬆️"
                        status="neutral"
                      />
                      <OutputCard
                        label="CO2 Loss (Vent)"
                        value={co2Outputs.co2LossVentilation}
                        unit="g/m2/h"
                        icon="💨"
                        status={co2Outputs.co2LossVentilation > 30 ? 'warning' : 'good'}
                      />
                      <OutputCard
                        label="Time to Setpoint"
                        value={co2Outputs.timeToSetpoint}
                        unit="min"
                        icon="⏱️"
                        status={co2Outputs.timeToSetpoint < 30 ? 'good' : 'warning'}
                      />
                      <OutputCard
                        label="CO2 Use Efficiency"
                        value={(co2Outputs.co2UseEfficiency * 100).toFixed(0)}
                        unit="%"
                        icon="♻️"
                        status={co2Outputs.co2UseEfficiency > 0.5 ? 'good' : 'warning'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CROP & IPM SECTION */}
          {activeSection === 'crop-ipm' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Crop Judgement */}
                <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 p-6 border-b">
                    <SectionHeader
                      title="Crop Judgement"
                      icon="🍅"
                      description="Growth assessment & recommendations"
                    />
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <ParamSlider
                        label="Head Thickness"
                        value={cropParams.headThickness}
                        min={5}
                        max={20}
                        step={0.5}
                        unit="cm"
                        onChange={(v) => setCropParams(p => ({ ...p, headThickness: v }))}
                      />
                      <ParamSlider
                        label="Internode Length"
                        value={cropParams.internodesLength}
                        min={3}
                        max={18}
                        step={0.5}
                        unit="cm"
                        onChange={(v) => setCropParams(p => ({ ...p, internodesLength: v }))}
                      />
                      <ParamSlider
                        label="Stem Diameter"
                        value={cropParams.stemDiameter}
                        min={6}
                        max={18}
                        step={0.5}
                        unit="mm"
                        onChange={(v) => setCropParams(p => ({ ...p, stemDiameter: v }))}
                      />
                      <ParamSlider
                        label="Fruit Set"
                        value={cropParams.fruitSet}
                        min={50}
                        max={100}
                        step={1}
                        unit="%"
                        onChange={(v) => setCropParams(p => ({ ...p, fruitSet: v }))}
                      />
                      <ParamSlider
                        label="Truss Development"
                        value={cropParams.trussDevelopmentRate}
                        min={0.5}
                        max={2}
                        step={0.1}
                        unit="truss/wk"
                        onChange={(v) => setCropParams(p => ({ ...p, trussDevelopmentRate: v }))}
                      />
                      <ParamSlider
                        label="G/V Balance"
                        value={cropParams.gvBalance}
                        min={-10}
                        max={10}
                        step={1}
                        unit=""
                        onChange={(v) => setCropParams(p => ({ ...p, gvBalance: v }))}
                        description="Negative = vegetative, Positive = generative"
                      />
                    </div>

                    {/* Crop Health Score */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Crop Health</span>
                        <span className={`text-2xl font-bold ${
                          cropOutputs.overallHealth > 80 ? 'text-green-500' :
                          cropOutputs.overallHealth > 60 ? 'text-yellow-500' : 'text-red-500'
                        }`}>{cropOutputs.overallHealth}%</span>
                      </div>
                      <div className="h-4 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            cropOutputs.overallHealth > 80 ? 'bg-green-500' :
                            cropOutputs.overallHealth > 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${cropOutputs.overallHealth}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <OutputCard
                        label="Growth Rate"
                        value={cropOutputs.growthRate}
                        icon="📈"
                        status={cropOutputs.growthRate === 'normal' ? 'good' : 'warning'}
                      />
                      <OutputCard
                        label="Generative Status"
                        value={cropOutputs.generativeStatus.replace(/_/g, ' ')}
                        icon="⚖️"
                        status={cropOutputs.generativeStatus === 'balanced' ? 'good' : 'warning'}
                      />
                    </div>

                    {/* Recommendations */}
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <span>💡</span> Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {cropOutputs.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">-</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Integrated Pest Management */}
                <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500/10 to-red-600/5 p-6 border-b">
                    <SectionHeader
                      title="Integrated Pest Management"
                      icon="🐛"
                      description="Pest & disease monitoring"
                    />
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <ParamSlider
                        label="Whiteflies/Leaf"
                        value={ipmParams.whitefliesPerLeaf}
                        min={0}
                        max={10}
                        step={0.5}
                        unit=""
                        onChange={(v) => setIPMParams(p => ({ ...p, whitefliesPerLeaf: v }))}
                      />
                      <ParamSlider
                        label="Aphids/Leaf"
                        value={ipmParams.aphidsPerLeaf}
                        min={0}
                        max={10}
                        step={0.5}
                        unit=""
                        onChange={(v) => setIPMParams(p => ({ ...p, aphidsPerLeaf: v }))}
                      />
                      <ParamSlider
                        label="Spider Mites/Leaf"
                        value={ipmParams.spiderMitesPerLeaf}
                        min={0}
                        max={5}
                        step={0.1}
                        unit=""
                        onChange={(v) => setIPMParams(p => ({ ...p, spiderMitesPerLeaf: v }))}
                      />
                      <ParamSlider
                        label="Thrips Damage"
                        value={ipmParams.thripsDamageScore}
                        min={0}
                        max={5}
                        step={1}
                        unit="/5"
                        onChange={(v) => setIPMParams(p => ({ ...p, thripsDamageScore: v }))}
                      />
                      <ParamSlider
                        label="Predator Mites"
                        value={ipmParams.predatorMitesReleased}
                        min={0}
                        max={200}
                        step={10}
                        unit="/m2/wk"
                        onChange={(v) => setIPMParams(p => ({ ...p, predatorMitesReleased: v }))}
                      />
                      <ParamSlider
                        label="Parasitoid Wasps"
                        value={ipmParams.parasitoidWaspsReleased}
                        min={0}
                        max={10}
                        step={0.5}
                        unit="/m2/wk"
                        onChange={(v) => setIPMParams(p => ({ ...p, parasitoidWaspsReleased: v }))}
                      />
                    </div>

                    {/* Pest Pressure Gauge */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-secondary/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Pest Pressure</span>
                          <span className={`text-xl font-bold ${
                            ipmOutputs.overallPestPressure < 30 ? 'text-green-500' :
                            ipmOutputs.overallPestPressure < 60 ? 'text-yellow-500' : 'text-red-500'
                          }`}>{ipmOutputs.overallPestPressure}%</span>
                        </div>
                        <div className="h-3 bg-background rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              ipmOutputs.overallPestPressure < 30 ? 'bg-green-500' :
                              ipmOutputs.overallPestPressure < 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${ipmOutputs.overallPestPressure}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Disease Risk</span>
                          <span className={`text-xl font-bold ${
                            ipmOutputs.diseaseRisk < 30 ? 'text-green-500' :
                            ipmOutputs.diseaseRisk < 60 ? 'text-yellow-500' : 'text-red-500'
                          }`}>{ipmOutputs.diseaseRisk}%</span>
                        </div>
                        <div className="h-3 bg-background rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              ipmOutputs.diseaseRisk < 30 ? 'bg-green-500' :
                              ipmOutputs.diseaseRisk < 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${ipmOutputs.diseaseRisk}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <OutputCard
                        label="Action Required"
                        value={ipmOutputs.actionThresholdReached ? 'Yes' : 'No'}
                        icon="⚠️"
                        status={ipmOutputs.actionThresholdReached ? 'danger' : 'good'}
                      />
                      <OutputCard
                        label="Bio Control Effect"
                        value={ipmOutputs.biologicalControlEffectiveness}
                        unit="%"
                        icon="🐞"
                        status={ipmOutputs.biologicalControlEffectiveness > 50 ? 'good' : 'warning'}
                      />
                    </div>

                    {/* IPM Recommendations */}
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <span>🎯</span> Recommended Actions
                      </h4>
                      <ul className="space-y-2">
                        {ipmOutputs.recommendedActions.map((action, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">-</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Chart */}
              <div className="bg-card rounded-xl shadow-lg border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>📊</span> Pest Population Trends
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Whiteflies', current: ipmParams.whitefliesPerLeaf, threshold: 2 },
                    { name: 'Aphids', current: ipmParams.aphidsPerLeaf, threshold: 1 },
                    { name: 'Spider Mites', current: ipmParams.spiderMitesPerLeaf, threshold: 0.5 },
                    { name: 'Thrips', current: ipmParams.thripsDamageScore, threshold: 2 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="current" fill="hsl(var(--primary))" name="Current Level" />
                    <Bar dataKey="threshold" fill="#ef4444" name="Action Threshold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentAlgorithmDashboard;
