import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { TimePeriod, AssimilateBalance, WaterBalance, EnergyBalance } from '../types/plantBalance';
import Layout from '../components/layout/Layout';
import {
  calculateNetAssimilation,
  formatValue,
  calculateRTR,
  calculateVPD,
  calculateDLI,
  estimateWeeklyProduction,
  calculateTranspiration,
  calculateWUE,
  calculateEnthalpy,
  calculateWaterBalance,
  calculateEnergyBalance
} from '../utils/plantBalanceCalculations';

const PlantBalanceDashboard: React.FC = () => {
  // Initial state - Manual adjustment only
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('real-time');
  const [selectedBalance, setSelectedBalance] = useState<'assimilate' | 'water' | 'energy'>('assimilate');

  const [assimilate, setAssimilate] = useState<AssimilateBalance>({
    parLight: 400,
    co2Level: 800,
    humidity: 70,
    temperature: 24,
    leafTemperature: 25,
    photosynthesis: 0,
    respiration: 0,
    netAssimilation: 0,
  });

  const [waterBalance, setWaterBalance] = useState<WaterBalance | null>(null);
  const [energyBalance, setEnergyBalance] = useState<EnergyBalance | null>(null);

  // Additional parameters for water and energy calculations
  const [rootTemperature, setRootTemperature] = useState(20); // °C
  const [irrigationRate, setIrrigationRate] = useState(2.5); // L/m²/h

  // Calculate balance when parameters change
  useEffect(() => {
    const calculated = calculateNetAssimilation(assimilate);
    setAssimilate(calculated);

    // Calculate water balance
    const water = calculateWaterBalance(
      assimilate.temperature,
      assimilate.humidity,
      assimilate.parLight,
      rootTemperature,
      assimilate.co2Level,
      irrigationRate
    );
    setWaterBalance(water);

    // Calculate energy balance
    const energy = calculateEnergyBalance(
      assimilate.temperature,
      assimilate.leafTemperature,
      assimilate.humidity,
      assimilate.parLight,
      calculated.photosynthesis
    );
    setEnergyBalance(energy);
  }, [assimilate.parLight, assimilate.co2Level, assimilate.humidity, assimilate.temperature, rootTemperature, irrigationRate]);

  // Calculate additional values
  const vpd = calculateVPD(assimilate.temperature, assimilate.humidity) / 1000; // kPa
  const transpiration = calculateTranspiration(
    assimilate.temperature,
    assimilate.parLight * 0.5, // Convert PAR to radiation estimate
    assimilate.humidity
  );
  const wue = calculateWUE(assimilate.netAssimilation, transpiration);
  const enthalpy = calculateEnthalpy(assimilate.temperature, assimilate.humidity);
  const dli = calculateDLI(assimilate.parLight);
  const weeklyProduction = estimateWeeklyProduction(assimilate.netAssimilation);

  // Slider component for parameter input
  const Slider: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit: string;
    icon: string;
  }> = ({ label, value, onChange, min, max, step = 1, unit, icon }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <span>{icon}</span>
          {label}
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {formatValue(value)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #10b981 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );

  // Balance indicator
  const BalanceIndicator: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const percentage = Math.max(-100, Math.min(100, value));
    const isPositive = percentage >= 0;

    return (
      <div className="mt-4">
        <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-2">{label}</div>
        <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 ${
              isPositive ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.abs(percentage)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-900 dark:text-white drop-shadow-sm">
              {isPositive ? 'Production > Consumption' : 'Consumption > Production'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Time period information and calculations
  const renderTimePeriodInfo = () => {
    const periodInfo = {
      'long-term': {
        title: 'Long-term Planning (Weeks/Months)',
        description: 'Align sink size with available light integral throughout the growing season.',
        icon: '📈',
        calculations: [
          { label: 'Weekly Light Sum', value: `${(dli * 7).toFixed(1)} mol/m²/week`, color: 'blue' },
          { label: 'Expected Production', value: `${weeklyProduction.toFixed(2)} kg/m²/week`, color: 'green' },
          { label: 'Water Use Efficiency', value: `${wue.toFixed(0)} g/L (standard)`, color: 'cyan' }
        ],
      },
      'short-term': {
        title: 'Short-term Monitoring (24 Hours)',
        description: 'Daily balance management using RTR (Ratio Temperature to Radiation).',
        icon: '📅',
        calculations: [
          { label: 'Daily Light Integral', value: `${dli.toFixed(1)} mol/m²/day`, color: 'blue' },
          { label: 'RTR Value', value: `${calculateRTR(assimilate.temperature, assimilate.parLight * 0.5).toFixed(2)} °C/(100 W/m²)`, color: 'purple' },
          { label: 'VPD', value: `${vpd.toFixed(2)} kPa`, color: 'orange' }
        ],
      },
      'real-time': {
        title: 'Real-time Monitoring (Momentaneous)',
        description: 'Current climate factors for maximum photosynthesis using psychrometric principles.',
        icon: '⚡',
        calculations: [
          { label: 'Photosynthesis', value: `${formatValue(assimilate.photosynthesis)} μmol/m²/s`, color: 'green' },
          { label: 'Transpiration', value: `${formatValue(transpiration)} L/m²/h`, color: 'blue' },
          { label: 'Enthalpy', value: `${formatValue(enthalpy)} kJ/kg`, color: 'yellow' }
        ],
      },
    };

    const info = periodInfo[selectedPeriod];

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{info.icon}</span>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{info.title}</h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{info.description}</p>

        {/* Period-specific calculations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {info.calculations.map((calc, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{calc.label}</div>
              <div className={`text-sm font-bold ${
                calc.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                calc.color === 'green' ? 'text-green-600 dark:text-green-400' :
                calc.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                calc.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                calc.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' :
                calc.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {calc.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Sidebar content for Plant Balance Dashboard
  const sidebarContent = (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Balance Information
      </h3>
      <div className="space-y-3">
        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Current Mode:</p>
          <p className="text-sm font-bold text-foreground">
            {selectedPeriod === 'long-term' && '📈 Long-term Planning'}
            {selectedPeriod === 'short-term' && '📅 24-Hour Monitoring'}
            {selectedPeriod === 'real-time' && '⚡ Real-time Analysis'}
          </p>
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Net Assimilation:</p>
          <p className="text-sm font-bold text-foreground">
            {formatValue(assimilate.netAssimilation)} μmol/m²/s
          </p>
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">VPD Status:</p>
          <p className="text-sm font-bold text-foreground">
            {vpd.toFixed(2)} kPa
            <span className="text-xs text-muted-foreground block mt-1">
              {vpd > 2.5 ? '⚠️ Too high' : vpd < 0.5 ? '⚠️ Too low' : '✅ Optimal'}
            </span>
          </p>
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Production Rate:</p>
          <p className="text-sm font-bold text-foreground">
            {weeklyProduction.toFixed(2)} kg/m²/week
          </p>
        </div>

        <Separator className="my-3" />

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
            💡 Quick Tips
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Optimal VPD: 0.8-1.2 kPa</li>
            <li>• Optimal CO₂: 800-1000 ppm</li>
            <li>• Optimal temperature: 24-26°C</li>
            <li>• Target DLI: 15-30 mol/m²/day</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <Layout sidebarContent={sidebarContent}>
      <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Plant Assimilate Balance Calculator
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Based on Plant Empowerment principles and greenhouse cultivation methods
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <span className="text-blue-500">ℹ️</span>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Calculations based on scientific methodology: WUE = 34 g/L, VPD effects on stomatal conductance,
            enthalpy calculations, and 2,500 kJ to evaporate 1 liter water. Adjust parameters to see
            the effects across different time periods.
          </p>
        </div>
      </div>

      {/* Balance Type Selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <Button
          variant={selectedBalance === 'assimilate' ? 'default' : 'outline'}
          onClick={() => setSelectedBalance('assimilate')}
          className="flex items-center gap-2"
        >
          🌿 Assimilate Balance
        </Button>
        <Button
          variant={selectedBalance === 'water' ? 'default' : 'outline'}
          onClick={() => setSelectedBalance('water')}
          className="flex items-center gap-2"
        >
          💧 Water Balance
        </Button>
        <Button
          variant={selectedBalance === 'energy' ? 'default' : 'outline'}
          onClick={() => setSelectedBalance('energy')}
          className="flex items-center gap-2"
        >
          ☀️ Energy Balance
        </Button>
      </div>

      {/* Time Period Selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {(['long-term', 'short-term', 'real-time'] as TimePeriod[]).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod(period)}
            size="sm"
            className="flex items-center gap-2"
          >
            {period === 'long-term' && '📈 Long-term'}
            {period === 'short-term' && '📅 Short-term (24h)'}
            {period === 'real-time' && '⚡ Real-time'}
          </Button>
        ))}
      </div>

      {/* Main Content - Manual Parameter Adjustment */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-slate-900 border-slate-200 dark:border-gray-700 shadow-xl">
        <CardContent className="p-6">
          {renderTimePeriodInfo()}

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            🌱 Input Parameters
          </h3>

          {/* Parameter Controls - Manual adjustment only */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Slider
              label="PAR Light"
              value={assimilate.parLight}
              onChange={(v) => setAssimilate({
                ...assimilate,
                parLight: v
              })}
              min={0}
              max={1500}
              unit="μmol/m²/s"
              icon="☀️"
            />

            <Slider
              label="CO₂ Level (Ca)"
              value={assimilate.co2Level}
              onChange={(v) => setAssimilate({
                ...assimilate,
                co2Level: v
              })}
              min={200}
              max={1500}
              unit="ppm"
              icon="💨"
            />

            <Slider
              label="Temperature"
              value={assimilate.temperature}
              onChange={(v) => setAssimilate({
                ...assimilate,
                temperature: v,
                leafTemperature: v + 1 // Leaf temperature slightly higher
              })}
              min={10}
              max={40}
              unit="°C"
              icon="🌡️"
            />

            <Slider
              label="Relative Humidity"
              value={assimilate.humidity}
              onChange={(v) => setAssimilate({
                ...assimilate,
                humidity: v
              })}
              min={30}
              max={95}
              unit="%"
              icon="💧"
            />
          </div>

          {/* Add extra input controls for water balance */}
          {selectedBalance === 'water' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Slider
                label="Root Zone Temperature"
                value={rootTemperature}
                onChange={(v) => setRootTemperature(v)}
                min={15}
                max={30}
                unit="°C"
                icon="🌱"
              />
              <Slider
                label="Irrigation Rate"
                value={irrigationRate}
                onChange={(v) => setIrrigationRate(v)}
                min={0}
                max={10}
                step={0.5}
                unit="L/m²/h"
                icon="💦"
              />
            </div>
          )}

          <Separator className="bg-gray-300 dark:bg-gray-600 my-6" />

          {/* Show different content based on selected balance */}
          {selectedBalance === 'assimilate' && (
            <>
              {/* Psychrometric Values */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                📊 Psychrometric Calculations
              </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 p-3 rounded-lg">
              <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold">VPD</div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
                {vpd.toFixed(2)} kPa
              </div>
            </div>

            <div className="bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-700 p-3 rounded-lg">
              <div className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold">Enthalpy</div>
              <div className="text-lg font-bold text-cyan-900 dark:text-cyan-200">
                {enthalpy.toFixed(1)} kJ/kg
              </div>
            </div>

            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 p-3 rounded-lg">
              <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold">Transpiration</div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-200">
                {transpiration.toFixed(2)} L/m²/h
              </div>
            </div>

            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 p-3 rounded-lg">
              <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">WUE</div>
              <div className="text-lg font-bold text-amber-900 dark:text-amber-200">
                {wue.toFixed(0)} g/L
              </div>
            </div>
          </div>

          {/* Main Results */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🌿 Assimilate Balance Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-300 dark:border-green-700">
              <div className="text-sm text-green-700 dark:text-green-300 font-semibold">Photosynthesis Rate</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                {formatValue(assimilate.photosynthesis)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                μmol/m²/s (Ca-Ci gradient)
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-300 dark:border-red-700">
              <div className="text-sm text-red-700 dark:text-red-300 font-semibold">Respiration Rate</div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-200">
                {formatValue(assimilate.respiration)}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                μmol/m²/s (Q10 model)
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-300 dark:border-blue-700">
              <div className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Net Assimilation</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {formatValue(assimilate.netAssimilation)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                μmol/m²/s (Available)
              </div>
            </div>
          </div>

          <BalanceIndicator
            value={(assimilate.netAssimilation / 20) * 100}
            label="Assimilate Balance Status"
          />

          {/* Time Period Specific Insights */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-gray-900 dark:text-white font-semibold mb-3">
              {selectedPeriod === 'long-term' && '📈 Long-term Planning (production model):'}
              {selectedPeriod === 'short-term' && '📅 24-Hour RTR Strategy:'}
              {selectedPeriod === 'real-time' && '⚡ Momentaneous Optimization (VPD control):'}
            </h4>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              {selectedPeriod === 'long-term' && (
                <>
                  <li className="flex items-start"><span className="text-green-600 dark:text-green-400 mr-2">•</span> Weekly production: <span className="font-semibold ml-1">{weeklyProduction.toFixed(2)} kg/m²</span> (based on light integral)</li>
                  <li className="flex items-start"><span className="text-green-600 dark:text-green-400 mr-2">•</span> Annual yield estimate: <span className="font-semibold ml-1">{(weeklyProduction * 40).toFixed(1)} kg/m²/year</span> (40 productive weeks)</li>
                  <li className="flex items-start"><span className="text-green-600 dark:text-green-400 mr-2">•</span> Water Use Efficiency: <span className="font-semibold ml-1">{wue} g biomass/L water</span> (standard greenhouse value)</li>
                  <li className="flex items-start"><span className="text-green-600 dark:text-green-400 mr-2">•</span> Light use efficiency: <span className="font-semibold ml-1">{((assimilate.netAssimilation / assimilate.parLight) * 100).toFixed(1)}%</span></li>
                </>
              )}
              {selectedPeriod === 'short-term' && (
                <>
                  <li className="flex items-start"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span> RTR of <span className="font-semibold ml-1">{calculateRTR(assimilate.temperature, assimilate.parLight * 0.5).toFixed(2)}</span> (optimal: 4-5)</li>
                  <li className="flex items-start"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span> Daily Light Integral: <span className="font-semibold ml-1">{dli.toFixed(1)} mol/m²/day</span> (target: 15-30 for tomatoes)</li>
                  <li className="flex items-start"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span> VPD: <span className="font-semibold ml-1">{vpd.toFixed(2)} kPa</span> (optimal: 0.8-1.2 kPa)</li>
                  <li className="flex items-start">
                    <span className={`mr-2 ${vpd > 2.5 || vpd < 0.5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>•</span>
                    {vpd > 2.5 ? '⚠️ VPD too high - stomata closing!' : vpd < 0.5 ? '⚠️ VPD too low - disease risk!' : '✅ VPD in good range'}
                  </li>
                </>
              )}
              {selectedPeriod === 'real-time' && (
                <>
                  <li className="flex items-start"><span className="text-purple-600 dark:text-purple-400 mr-2">•</span> CO₂ gradient (Ca-Ci): <span className="font-semibold ml-1">{(assimilate.co2Level * 0.34).toFixed(0)} ppm</span> (34% of ambient)</li>
                  <li className="flex items-start"><span className="text-purple-600 dark:text-purple-400 mr-2">•</span> Stomatal limitation: <span className="font-semibold ml-1">{vpd > 2.5 ? 'High VPD limiting' : vpd > 1.5 ? 'Partial limitation' : 'No limitation'}</span></li>
                  <li className="flex items-start"><span className="text-purple-600 dark:text-purple-400 mr-2">•</span> Energy for evaporation: <span className="font-semibold ml-1">{(transpiration * ENERGY_PER_LITER).toFixed(0)} kJ/m²/h</span></li>
                  <li className="flex items-start"><span className="text-purple-600 dark:text-purple-400 mr-2">•</span> Leaf-air temperature diff: <span className="font-semibold ml-1">{(assimilate.leafTemperature - assimilate.temperature).toFixed(1)}°C</span></li>
                </>
              )}
            </ul>
          </div>
            </>
          )}

          {/* Water Balance Content */}
          {selectedBalance === 'water' && waterBalance && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                💧 Water Balance Results
              </h3>

              {/* Water Input/Output Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Water Input */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-300 dark:border-blue-700">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">WATER INPUT</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Root Uptake:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-100">{formatValue(waterBalance.rootUptake, 2)} L/m²/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Irrigation:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-100">{formatValue(waterBalance.irrigationSupply, 2)} L/m²/h</span>
                    </div>
                    <Separator className="bg-blue-300 dark:bg-blue-700" />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-blue-900 dark:text-blue-200">Total Input:</span>
                      <span className="font-bold text-blue-900 dark:text-blue-100">
                        {formatValue(waterBalance.rootUptake + waterBalance.irrigationSupply, 2)} L/m²/h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Water Output */}
                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg border border-cyan-300 dark:border-cyan-700">
                  <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-200 mb-3">WATER OUTPUT</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-cyan-700 dark:text-cyan-300">Transpiration:</span>
                      <span className="font-semibold text-cyan-900 dark:text-cyan-100">{formatValue(waterBalance.transpiration, 2)} L/m²/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-cyan-700 dark:text-cyan-300">Growth Water:</span>
                      <span className="font-semibold text-cyan-900 dark:text-cyan-100">{formatValue(waterBalance.growthWater, 2)} L/m²/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-cyan-700 dark:text-cyan-300">Drainage:</span>
                      <span className="font-semibold text-cyan-900 dark:text-cyan-100">{formatValue(waterBalance.drainage, 2)} L/m²/h</span>
                    </div>
                    <Separator className="bg-cyan-300 dark:bg-cyan-700" />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-cyan-900 dark:text-cyan-200">Total Output:</span>
                      <span className="font-bold text-cyan-900 dark:text-cyan-100">
                        {formatValue(waterBalance.transpiration + waterBalance.growthWater + waterBalance.drainage, 2)} L/m²/h
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Water Balance Status */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Net Water Balance:</span>
                  <span className={`text-2xl font-bold ${
                    waterBalance.waterStatus === 'surplus' ? 'text-blue-600 dark:text-blue-400' :
                    waterBalance.waterStatus === 'deficit' ? 'text-red-600 dark:text-red-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {formatValue(waterBalance.netWaterBalance, 2)} L/m²/h
                  </span>
                </div>
                <div className={`text-sm font-semibold ${
                  waterBalance.waterStatus === 'surplus' ? 'text-blue-600 dark:text-blue-400' :
                  waterBalance.waterStatus === 'deficit' ? 'text-red-600 dark:text-red-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  Status: {waterBalance.waterStatus === 'surplus' ? '💧 Water Surplus' :
                          waterBalance.waterStatus === 'deficit' ? '⚠️ Water Deficit' :
                          '✅ Balanced'}
                </div>
              </div>

              {/* Environmental Indicators */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 p-3 rounded-lg">
                  <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold">VPD</div>
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
                    {formatValue(waterBalance.vpd, 2)} kPa
                  </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-3 rounded-lg">
                  <div className="text-xs text-green-700 dark:text-green-300 font-semibold">Stomatal Conductance</div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-200">
                    {formatValue(waterBalance.stomatalConductance, 0)} mmol/m²/s
                  </div>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 p-3 rounded-lg">
                  <div className="text-xs text-orange-700 dark:text-orange-300 font-semibold">Root Temp</div>
                  <div className="text-lg font-bold text-orange-900 dark:text-orange-200">
                    {formatValue(waterBalance.rootTemperature, 1)}°C
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Energy Balance Content */}
          {selectedBalance === 'energy' && energyBalance && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                ☀️ Energy Balance Results
              </h3>

              {/* Energy Input/Output Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Energy Input */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700">
                  <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-3">ENERGY INPUT</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">Net Radiation:</span>
                      <span className="font-semibold text-yellow-900 dark:text-yellow-100">{formatValue(energyBalance.netRadiation, 0)} W/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">PAR Absorption:</span>
                      <span className="font-semibold text-yellow-900 dark:text-yellow-100">{formatValue(energyBalance.parAbsorption, 0)} W/m²</span>
                    </div>
                    <Separator className="bg-yellow-300 dark:bg-yellow-700" />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-yellow-900 dark:text-yellow-200">Total Input:</span>
                      <span className="font-bold text-yellow-900 dark:text-yellow-100">
                        {formatValue(energyBalance.netRadiation + energyBalance.parAbsorption, 0)} W/m²
                      </span>
                    </div>
                  </div>
                </div>

                {/* Energy Output */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-300 dark:border-orange-700">
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-3">ENERGY OUTPUT</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700 dark:text-orange-300">Sensible Heat:</span>
                      <span className="font-semibold text-orange-900 dark:text-orange-100">{formatValue(energyBalance.sensibleHeat, 0)} W/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700 dark:text-orange-300">Latent Heat:</span>
                      <span className="font-semibold text-orange-900 dark:text-orange-100">{formatValue(energyBalance.latentHeat, 0)} W/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700 dark:text-orange-300">Photochemical:</span>
                      <span className="font-semibold text-orange-900 dark:text-orange-100">{formatValue(energyBalance.photochemical, 1)} W/m²</span>
                    </div>
                    <Separator className="bg-orange-300 dark:bg-orange-700" />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-orange-900 dark:text-orange-200">Total Output:</span>
                      <span className="font-bold text-orange-900 dark:text-orange-100">
                        {formatValue(energyBalance.sensibleHeat + energyBalance.latentHeat + energyBalance.photochemical, 0)} W/m²
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Energy Balance Status */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Net Energy Balance:</span>
                  <span className={`text-2xl font-bold ${
                    energyBalance.energyStatus === 'heating' ? 'text-red-600 dark:text-red-400' :
                    energyBalance.energyStatus === 'cooling' ? 'text-blue-600 dark:text-blue-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {formatValue(energyBalance.netEnergyBalance, 0)} W/m²
                  </span>
                </div>
                <div className={`text-sm font-semibold ${
                  energyBalance.energyStatus === 'heating' ? 'text-red-600 dark:text-red-400' :
                  energyBalance.energyStatus === 'cooling' ? 'text-blue-600 dark:text-blue-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  Status: {energyBalance.energyStatus === 'heating' ? '🔥 Net Heating' :
                          energyBalance.energyStatus === 'cooling' ? '❄️ Net Cooling' :
                          '✅ Balanced'}
                </div>
              </div>

              {/* Energy Indicators */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-3 rounded-lg">
                  <div className="text-xs text-red-700 dark:text-red-300 font-semibold">Leaf-Air ΔT</div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-200">
                    {formatValue(energyBalance.leafAirTempDiff, 1)}°C
                  </div>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 p-3 rounded-lg">
                  <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Bowen Ratio</div>
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
                    {formatValue(energyBalance.bowenRatio, 2)}
                  </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-3 rounded-lg">
                  <div className="text-xs text-green-700 dark:text-green-300 font-semibold">Boundary Layer</div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-200">
                    {formatValue(energyBalance.boundaryLayerConductance, 0)} mmol/m²/s
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Educational Notes */}
      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-xl font-bold">Calculation Methods</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Assimilate Balance */}
            <div>
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                🌿 Assimilate Balance Calculations:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 ml-4 space-y-1">
                <li>• <strong>Photosynthesis:</strong> Max rate 25 μmol/m²/s, f(PAR, CO₂, VPD, T)</li>
                <li>• <strong>Respiration:</strong> Q10 model, doubles every 10°C</li>
                <li>• <strong>CO₂ gradient:</strong> Ci = 0.66 × Ca (internal = 66% of ambient)</li>
                <li>• <strong>Net Assimilation:</strong> Photosynthesis - Respiration</li>
              </ul>
            </div>

            {/* Water Balance */}
            <div>
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                💧 Water Balance Calculations:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 ml-4 space-y-1">
                <li>• <strong>Root Uptake:</strong> f(root temp, VPD), optimal at 20-22°C</li>
                <li>• <strong>Transpiration:</strong> VPD-driven, energy limited (2,500 kJ/L)</li>
                <li>• <strong>Stomatal Conductance:</strong> Ball-Berry model, max 800 mmol/m²/s</li>
                <li>• <strong>Water Use Efficiency:</strong> Fixed at 34 g/L (greenhouse standard)</li>
                <li>• <strong>Growth Water:</strong> ~5% of transpiration</li>
              </ul>
            </div>

            {/* Energy Balance */}
            <div>
              <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                ☀️ Energy Balance Calculations:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 ml-4 space-y-1">
                <li>• <strong>Net Radiation:</strong> PAR × 0.5 × 4.6 W/m²</li>
                <li>• <strong>Sensible Heat:</strong> ΔT × Cp × boundary layer conductance</li>
                <li>• <strong>Latent Heat:</strong> Transpiration × 2,450 kJ/kg</li>
                <li>• <strong>Photochemical:</strong> 469 kJ/mol glucose formed</li>
                <li>• <strong>Bowen Ratio:</strong> Sensible/Latent heat</li>
              </ul>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
              <h4 className="font-semibold mb-2">Key Formulas:</h4>
              <div className="font-mono text-xs space-y-1">
                <div className="text-green-700 dark:text-green-400">
                  Photosynthesis = 25 × f(light) × f(CO₂) × f(T) × f(VPD)
                </div>
                <div className="text-blue-700 dark:text-blue-400">
                  Water Balance = (Uptake + Irrigation) - (Transpiration + Growth + Drainage)
                </div>
                <div className="text-orange-700 dark:text-orange-400">
                  Energy Balance = (Radiation + PAR) - (Sensible + Latent + Photochemical)
                </div>
                <div className="text-purple-700 dark:text-purple-400">
                  VPD = 0.611 × exp(17.27T/(T+237.3)) × (1 - RH/100)
                </div>
                <div className="text-cyan-700 dark:text-cyan-400">
                  RTR = (T - 18°C) / (Radiation/100)
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                💡 Test Scenarios:
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                1. Optimal: PAR=800, CO₂=1000, T=25°C, RH=70%
                <br />2. Low VPD risk: PAR=400, CO₂=800, T=20°C, RH=85%
                <br />3. High VPD stress: PAR=1200, CO₂=800, T=30°C, RH=40%
                <br />Compare how VPD affects stomatal conductance!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add custom styles for the range slider */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
        @media (prefers-color-scheme: dark) {
          .slider::-webkit-slider-thumb {
            border-color: #1f2937;
          }
          .slider::-moz-range-thumb {
            border-color: #1f2937;
          }
        }
      `}</style>
    </div>
    </Layout>
  );
};

// Export the ENERGY_PER_LITER constant for display in insights
const ENERGY_PER_LITER = 2500;

export default PlantBalanceDashboard;