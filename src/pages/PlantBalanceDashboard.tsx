import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { TimePeriod, AssimilateBalance, WaterBalance, EnergyBalance } from '../types/plantBalance';
import Layout from '../components/layout/Layout';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Leaf,
  Sun,
  Wind,
  Cloud,
  Thermometer,
  Droplet,
  Droplets,
  BarChart3,
  TrendingUp,
  Calendar,
  CheckCircle,
  Flame,
  Snowflake,
  AlertTriangle,
  Lightbulb,
  Activity,
  Trees
} from 'lucide-react';
import {
  EducationalTooltip,
  EducationalIndicator,
  tooltipContent
} from '../components/educational/EducationalTooltips';
import {
  LimitingFactorsChart,
  calculateLimitingFactors
} from '../components/educational/LimitingFactorsChart';
import { WaterLimitingFactors } from '../components/educational/WaterLimitingFactors';
import { EnergyLimitingFactors } from '../components/educational/EnergyLimitingFactors';
import {
  calculateNetAssimilation,
  formatValue,
  calculateRTR,
  calculateVPD,
  calculateVPDi,
  calculateDLI,
  estimateWeeklyProduction,
  calculateTranspiration,
  calculateWUE,
  calculateEnthalpy,
  calculateWaterBalance,
  calculateEnergyBalance
} from '../utils/plantBalanceCalculations';

const PlantBalanceDashboard: React.FC = () => {
  const { t } = useTranslation();

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
  const [airSpeed, setAirSpeed] = useState(1.0); // m/s - Air speed near stomata

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
  const vpdi = calculateVPDi(assimilate.leafTemperature, assimilate.temperature, assimilate.humidity) / 1000; // kPa
  const transpiration = calculateTranspiration(
    assimilate.temperature,
    assimilate.parLight * 0.5, // Convert PAR to radiation estimate
    assimilate.humidity
  );
  const wue = calculateWUE(assimilate.netAssimilation, transpiration);
  const enthalpy = calculateEnthalpy(assimilate.temperature, assimilate.humidity);
  const dli = calculateDLI(assimilate.parLight);
  const weeklyProduction = estimateWeeklyProduction(assimilate.netAssimilation);

  // Slider component for parameter input with tooltips
  const Slider: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit: string;
    icon: React.ReactNode;
    tooltipKey?: keyof typeof tooltipContent;
  }> = ({ label, value, onChange, min, max, step = 1, unit, icon, tooltipKey }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
          {icon}
          {label}
          {tooltipKey && <EducationalTooltip {...tooltipContent[tooltipKey]} />}
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
              {isPositive ? t('plantBalance.productionGreaterThanConsumption') : t('plantBalance.consumptionGreaterThanProduction')}
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
        title: t('plantBalance.longTermInfo.title'),
        description: t('plantBalance.longTermInfo.description'),
        icon: <TrendingUp className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
        calculations: [
          { label: t('plantBalance.longTermInfo.weeklyLightSum'), value: `${(dli * 7).toFixed(1)} ${t('plantBalance.units.weeklyProduction').split('/')[1]}`, color: 'blue' },
          { label: t('plantBalance.longTermInfo.expectedProduction'), value: `${weeklyProduction.toFixed(2)} ${t('plantBalance.units.weeklyProduction')}`, color: 'green' },
          { label: t('plantBalance.waterUseEfficiency'), value: `${wue.toFixed(0)} ${t('plantBalance.units.wue')} (standard)`, color: 'cyan' }
        ],
      },
      'short-term': {
        title: t('plantBalance.shortTermInfo.title'),
        description: t('plantBalance.shortTermInfo.description'),
        icon: <Calendar className="w-7 h-7 text-purple-600 dark:text-purple-400" />,
        calculations: [
          { label: t('plantBalance.shortTermInfo.dailyLightIntegral'), value: `${dli.toFixed(1)} ${t('plantBalance.units.dli')}`, color: 'blue' },
          { label: 'RTR (Expected Temp Rise)', value: `${calculateRTR(assimilate.temperature, assimilate.parLight).toFixed(1)} °C`, color: 'purple' },
          { label: t('plantBalance.vpd'), value: `${vpd.toFixed(2)} ${t('plantBalance.units.vpd')}`, color: 'orange' }
        ],
      },
      'real-time': {
        title: t('plantBalance.realTimeInfo.title'),
        description: t('plantBalance.realTimeInfo.description'),
        icon: <Zap className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
        calculations: [
          { label: t('plantBalance.photosynthesis'), value: `${formatValue(assimilate.photosynthesis)} ${t('plantBalance.units.photosynthesis')}`, color: 'green' },
          { label: t('plantBalance.transpiration'), value: `${formatValue(transpiration)} ${t('plantBalance.units.transpiration')}`, color: 'blue' },
          { label: t('plantBalance.enthalpy'), value: `${formatValue(enthalpy)} ${t('plantBalance.units.enthalpy')}`, color: 'yellow' }
        ],
      },
    };

    const info = periodInfo[selectedPeriod];

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          {info.icon}
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
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            {selectedPeriod === 'long-term' && (
              <>
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Long-term Planning
              </>
            )}
            {selectedPeriod === 'short-term' && (
              <>
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                24-Hour Monitoring
              </>
            )}
            {selectedPeriod === 'real-time' && (
              <>
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Real-time Analysis
              </>
            )}
          </p>
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Net Assimilation:</p>
          <p className="text-sm font-bold text-foreground">
            {formatValue(assimilate.netAssimilation)} μmol/m²/s
          </p>
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">VPD / VPDi:</p>
          <p className="text-sm font-bold text-foreground">
            {vpd.toFixed(2)} / {vpdi.toFixed(2)} kPa
            <span className="text-xs text-muted-foreground block mt-1 flex items-center gap-1">
              {vpdi > 2.5 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Too high
                </>
              ) : vpdi < 0.5 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Too low
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Optimal
                </>
              )}
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
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
            <Lightbulb className="w-4 h-4" />
            Quick Tips
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('plantBalance.title')}
        </h1>
      </div>

      {/* Balance Type Selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <Button
          variant={selectedBalance === 'assimilate' ? 'default' : 'outline'}
          onClick={() => setSelectedBalance('assimilate')}
          className="flex items-center gap-2"
        >
          <Leaf className="w-5 h-5" />
          {t('plantBalance.assimilateBalance')}
        </Button>
        <Button
          variant={selectedBalance === 'water' ? 'default' : 'outline'}
          onClick={() => setSelectedBalance('water')}
          className="flex items-center gap-2"
        >
          <Droplet className="w-5 h-5" />
          {t('plantBalance.waterBalance')}
        </Button>
        <Button
          variant={selectedBalance === 'energy' ? 'default' : 'outline'}
          onClick={() => setSelectedBalance('energy')}
          className="flex items-center gap-2"
        >
          <Sun className="w-5 h-5" />
          {t('plantBalance.energyBalance')}
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
            {period === 'long-term' && (
              <>
                <TrendingUp className="w-4 h-4" />
                {t('plantBalance.timePeriods.longTerm')}
              </>
            )}
            {period === 'short-term' && (
              <>
                <Calendar className="w-4 h-4" />
                {t('plantBalance.timePeriods.shortTerm')}
              </>
            )}
            {period === 'real-time' && (
              <>
                <Zap className="w-4 h-4" />
                {t('plantBalance.timePeriods.realTime')}
              </>
            )}
          </Button>
        ))}
      </div>

      {/* Main Content - Manual Parameter Adjustment */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-slate-900 border-slate-200 dark:border-gray-700 shadow-xl">
        <CardContent className="p-6">
          {renderTimePeriodInfo()}

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
            {t('plantBalance.inputParameters')}
          </h3>

          {/* Parameter Controls - Manual adjustment only */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Slider
              label={t('plantBalance.parLight')}
              value={assimilate.parLight}
              onChange={(v) => setAssimilate({
                ...assimilate,
                parLight: v
              })}
              min={0}
              max={1500}
              unit={t('plantBalance.units.parLight')}
              icon={<Sun className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
              tooltipKey="parLight"
            />

            <Slider
              label={t('plantBalance.co2Level')}
              value={assimilate.co2Level}
              onChange={(v) => setAssimilate({
                ...assimilate,
                co2Level: v
              })}
              min={200}
              max={1500}
              unit={t('plantBalance.units.co2')}
              icon={<Cloud className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
              tooltipKey="co2Level"
            />

            <Slider
              label={t('plantBalance.temperature')}
              value={assimilate.temperature}
              onChange={(v) => setAssimilate({
                ...assimilate,
                temperature: v
              })}
              min={10}
              max={40}
              unit={t('plantBalance.units.temperature')}
              icon={<Thermometer className="w-5 h-5 text-red-500 dark:text-red-400" />}
              tooltipKey="temperature"
            />

            <Slider
              label={t('plantBalance.humidity')}
              value={assimilate.humidity}
              onChange={(v) => setAssimilate({
                ...assimilate,
                humidity: v
              })}
              min={30}
              max={95}
              unit={t('plantBalance.units.humidity')}
              icon={<Droplet className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
              tooltipKey="vpd"
            />

            <Slider
              label="Plant/Leaf Temperature"
              value={assimilate.leafTemperature}
              onChange={(v) => setAssimilate({
                ...assimilate,
                leafTemperature: v
              })}
              min={10}
              max={45}
              unit="°C"
              icon={<Leaf className="w-5 h-5 text-green-600 dark:text-green-500" />}
              tooltipKey="temperature"
            />

            <Slider
              label="Air Speed (near stomata)"
              value={airSpeed}
              onChange={(v) => setAirSpeed(v)}
              min={0.1}
              max={3}
              step={0.1}
              unit="m/s"
              icon={<Wind className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
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
                icon={<Trees className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}
              />
              <Slider
                label="Irrigation Rate"
                value={irrigationRate}
                onChange={(v) => setIrrigationRate(v)}
                min={0}
                max={10}
                step={0.5}
                unit="L/m²/h"
                icon={<Droplets className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
              />
            </div>
          )}

          <Separator className="bg-gray-300 dark:bg-gray-600 my-6" />

          {/* Show different content based on selected balance */}
          {selectedBalance === 'assimilate' && (
            <>
              {/* Psychrometric Values */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                {t('plantBalance.psychrometricCalculations')}
              </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 p-3 rounded-lg">
              <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold">VPD (Air)</div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
                {vpd.toFixed(2)} kPa
              </div>
            </div>

            <div className="bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 p-3 rounded-lg">
              <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">VPDi (Plant)</div>
              <div className="text-lg font-bold text-indigo-900 dark:text-indigo-200">
                {vpdi.toFixed(2)} kPa
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400">
                ΔT: {(assimilate.leafTemperature - assimilate.temperature).toFixed(1)}°C
              </div>
            </div>

            <div className="bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-700 p-3 rounded-lg">
              <div className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold">{t('plantBalance.enthalpy')}</div>
              <div className="text-lg font-bold text-cyan-900 dark:text-cyan-200">
                {enthalpy.toFixed(1)} {t('plantBalance.units.enthalpy')}
              </div>
            </div>

            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 p-3 rounded-lg">
              <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold">{t('plantBalance.transpiration')}</div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-200">
                {transpiration.toFixed(2)} {t('plantBalance.units.transpiration')}
              </div>
            </div>

            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 p-3 rounded-lg">
              <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">{t('plantBalance.waterUseEfficiency')}</div>
              <div className="text-lg font-bold text-amber-900 dark:text-amber-200">
                {wue.toFixed(0)} {t('plantBalance.units.wue')}
              </div>
            </div>
          </div>

          {/* Main Results */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
            {t('plantBalance.assimilateBalanceResults')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-300 dark:border-green-700">
              <div className="text-sm text-green-700 dark:text-green-300 font-semibold">{t('plantBalance.photosynthesisRate')}</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                {formatValue(assimilate.photosynthesis)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {t('plantBalance.units.photosynthesis')}
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-300 dark:border-red-700">
              <div className="text-sm text-red-700 dark:text-red-300 font-semibold">{t('plantBalance.respirationRate')}</div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-200">
                {formatValue(assimilate.respiration)}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t('plantBalance.units.respiration')}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-300 dark:border-blue-700">
              <div className="text-sm text-blue-700 dark:text-blue-300 font-semibold">{t('plantBalance.netAssimilationRate')}</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {formatValue(assimilate.netAssimilation)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {t('plantBalance.units.assimilation')} ({t('plantBalance.available')})
              </div>
            </div>
          </div>

          <BalanceIndicator
            value={(assimilate.netAssimilation / 20) * 100}
            label={t('plantBalance.assimilateBalanceStatus')}
          />

          {/* Limiting Factors Visualization */}
          <div className="mt-6">
            <LimitingFactorsChart
              factors={calculateLimitingFactors(
                assimilate.parLight,
                assimilate.co2Level,
                assimilate.temperature,
                assimilate.humidity,
                vpdi
              )}
              title="Growth Limiting Factors"
            />
          </div>

          {/* Time Period Specific Insights */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
              {selectedPeriod === 'long-term' && (
                <>
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {t('plantBalance.longTermInfo.title')}:
                </>
              )}
              {selectedPeriod === 'short-term' && (
                <>
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  {t('plantBalance.shortTermInfo.title')}:
                </>
              )}
              {selectedPeriod === 'real-time' && (
                <>
                  <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  {t('plantBalance.momentaneousOptimization')}:
                </>
              )}
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
                  <li className="flex items-start"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span> RTR (expected temp increase): <span className="font-semibold ml-1">{calculateRTR(assimilate.temperature, assimilate.parLight).toFixed(1)}°C</span> (based on 0.2°C/mol PAR)</li>
                  <li className="flex items-start"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span> Daily Light Integral: <span className="font-semibold ml-1">{dli.toFixed(1)} mol/m²/day</span> (target: 15-30 for tomatoes)</li>
                  <li className="flex items-start"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span> VPD: <span className="font-semibold ml-1">{vpd.toFixed(2)} kPa</span> (optimal: 0.8-1.2 kPa)</li>
                  <li className="flex items-start">
                    <span className={`mr-2 ${vpd > 2.5 || vpd < 0.5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>•</span>
                    {vpd > 2.5 ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-orange-500 inline" />
                        VPD too high - stomata closing!
                      </span>
                    ) : vpd < 0.5 ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-orange-500 inline" />
                        VPD too low - disease risk!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500 inline" />
                        VPD in good range
                      </span>
                    )}
                  </li>
                </>
              )}
              {selectedPeriod === 'real-time' && (
                <>
                  <li className="flex items-start"><span className="text-purple-600 dark:text-purple-400 mr-2">•</span> {t('plantBalance.co2Gradient')}: <span className="font-semibold ml-1">{(assimilate.co2Level * 0.34).toFixed(0)} {t('plantBalance.units.co2')}</span> (34% {t('plantBalance.ofAmbient')})</li>
                  <li className="flex items-start"><span className="text-purple-600 dark:text-purple-400 mr-2">•</span> {t('plantBalance.stomatalLimitation')}: <span className="font-semibold ml-1">{vpd > 2.5 ? 'High VPD limiting' : vpd > 1.5 ? 'Partial limitation' : t('plantBalance.noLimitation')}</span></li>
                  <li className="flex items-start"><span className="text-purple-600 dark:text-purple-400 mr-2">•</span> {t('plantBalance.energyForEvaporation')}: <span className="font-semibold ml-1">{(transpiration * ENERGY_PER_LITER).toFixed(0)} kJ/m²/h</span></li>
                  <li className="flex items-start"><span className="text-purple-600 dark:text-purple-400 mr-2">•</span> {t('plantBalance.leafAirTempDiff')}: <span className="font-semibold ml-1">{(assimilate.leafTemperature - assimilate.temperature).toFixed(1)}°C</span></li>
                </>
              )}
            </ul>
          </div>
            </>
          )}

          {/* Water Balance Content */}
          {selectedBalance === 'water' && waterBalance && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Droplet className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                Water Balance Results
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
                  Status: {waterBalance.waterStatus === 'surplus' ? (
                    <span className="inline-flex items-center gap-1">
                      <Droplet className="w-4 h-4" />
                      Water Surplus
                    </span>
                  ) : waterBalance.waterStatus === 'deficit' ? (
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Water Deficit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Balanced
                    </span>
                  )}
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

              {/* Water Limiting Factors */}
              <div className="mt-6">
                <WaterLimitingFactors
                  rootZoneTemp={waterBalance.rootTemperature}
                  vpdi={vpdi}
                  irrigationRate={waterBalance.irrigationSupply}
                  stomatalConductance={waterBalance.stomatalConductance}
                  waterDemand={waterBalance.transpiration + waterBalance.growthWater}
                />
              </div>
            </>
          )}

          {/* Energy Balance Content */}
          {selectedBalance === 'energy' && energyBalance && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sun className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                Energy Balance Results
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
                  Status: {energyBalance.energyStatus === 'heating' ? (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      Net Heating
                    </span>
                  ) : energyBalance.energyStatus === 'cooling' ? (
                    <span className="inline-flex items-center gap-1">
                      <Snowflake className="w-4 h-4" />
                      Net Cooling
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Balanced
                    </span>
                  )}
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

              {/* Energy Limiting Factors */}
              <div className="mt-6">
                <EnergyLimitingFactors
                  netRadiation={energyBalance.netRadiation}
                  parInput={energyBalance.parAbsorption}
                  leafAirDeltaT={energyBalance.leafAirTempDiff}
                  latentHeat={energyBalance.latentHeat}
                  sensibleHeat={energyBalance.sensibleHeat}
                  bowenRatio={energyBalance.bowenRatio}
                  totalOutput={Math.abs(energyBalance.sensibleHeat) + Math.abs(energyBalance.latentHeat) + Math.abs(energyBalance.photochemical)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Educational Notes */}
      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-xl font-bold">{t('plantBalance.calculationMethods')}</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Assimilate Balance */}
            <div>
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                {t('plantBalance.assimilateBalanceCalculations')}:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 ml-4 space-y-1">
                <li>• {t('plantBalance.methodDescriptions.photosynthesis')}</li>
                <li>• {t('plantBalance.methodDescriptions.respiration')}</li>
                <li>• {t('plantBalance.methodDescriptions.co2Gradient')}</li>
                <li>• {t('plantBalance.methodDescriptions.netAssimilation')}</li>
              </ul>
            </div>

            {/* Water Balance */}
            <div>
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                <Droplet className="w-5 h-5" />
                {t('plantBalance.waterBalanceCalculations')}:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 ml-4 space-y-1">
                <li>• {t('plantBalance.methodDescriptions.rootUptake')}</li>
                <li>• {t('plantBalance.methodDescriptions.transpiration')}</li>
                <li>• {t('plantBalance.methodDescriptions.stomatalConductance')}</li>
                <li>• {t('plantBalance.methodDescriptions.wue')}</li>
                <li>• {t('plantBalance.methodDescriptions.growthWater')}</li>
              </ul>
            </div>

            {/* Energy Balance */}
            <div>
              <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Energy Balance Calculations:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 ml-4 space-y-1">
                <li>• <strong>Net Radiation:</strong> PAR × 0.5 × 4.6 W/m²</li>
                <li>• <strong>Sensible Heat:</strong> ΔT × Cp × boundary layer conductance</li>
                <li>• <strong>Latent Heat:</strong> Transpiration × 2,500 kJ/kg</li>
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
                  VPD = 0.611 × exp(17.27T_air/(T_air+237.3)) × (1 - RH/100)
                </div>
                <div className="text-pink-700 dark:text-pink-400">
                  VPDi = VP_sat(T_plant) - VP_actual(T_air, RH)
                </div>
                <div className="text-cyan-700 dark:text-cyan-400">
                  RTR = DLI × 0.2°C/mol PAR
                </div>
                <div className="text-indigo-700 dark:text-indigo-400">
                  Enthalpy = 1.006×T + RH×(2500 + 1.86×T) [kJ/kg]
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-2">
                <Wind className="w-5 h-5" />
                Environmental Requirements:
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Air Speed:</strong> Must be ≥ 1 m/s for accurate boundary layer calculations
                <br /><strong>Example Enthalpy:</strong> At 20°C, 75% RH → 47.5 kJ/kg
                <br />• Sensible: 1.006 × 20 = 20.1 kJ/kg
                <br />• Latent: 0.75 × 0.0147 × 2500 = 27.4 kJ/kg
                <br />• Total: 20.1 + 27.4 = 47.5 kJ/kg
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Test Scenarios:
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                1. Optimal: PAR=800, CO₂=1000, T=25°C, RH=70%, Air=1.2 m/s
                <br />2. Low VPD risk: PAR=400, CO₂=800, T=20°C, RH=85%, Air=1.0 m/s
                <br />3. High VPD stress: PAR=1200, CO₂=800, T=30°C, RH=40%, Air=1.5 m/s
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