import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, ShieldAlert, Cpu, Clock, Eye, EyeOff } from 'lucide-react';
import { cyberSound } from '../utils/soundEffects';

export default function HeroForecastWidget({
  historical = [],
  forecast = [],
  infiltrationProb = 0,
  riskTier = 'Low',
  scenarioName = '',
  leadTimeMinutes = '+4.8 mins',
  baselineRisk = 8,
  isMitigated = false
}) {
  const [showBaselineComparison, setShowBaselineComparison] = useState(true);

  // Combine historical + forecast data into a single continuous timeline series for Recharts
  const chartData = [
    ...historical.map(h => ({
      time: h.time,
      historicalRisk: h.risk,
      baselineRisk: showBaselineComparison ? h.baselineRisk : null,
      predictedRisk: null,
      ciUpper: h.confidenceUpper,
      ciLower: h.confidenceLower,
      type: 'historical'
    })),
    // Bridge point at T-0 / current step
    {
      time: 'Now (T)',
      historicalRisk: historical[historical.length - 1]?.risk ?? infiltrationProb,
      baselineRisk: showBaselineComparison ? baselineRisk : null,
      predictedRisk: historical[historical.length - 1]?.risk ?? infiltrationProb,
      ciUpper: historical[historical.length - 1]?.confidenceUpper ?? infiltrationProb,
      ciLower: historical[historical.length - 1]?.confidenceLower ?? infiltrationProb,
      type: 'bridge'
    },
    ...forecast.map(f => ({
      time: f.time,
      historicalRisk: null,
      baselineRisk: null, // Baseline cannot project into future!
      predictedRisk: f.predictedRisk,
      ciUpper: f.ciUpper,
      ciLower: f.ciLower,
      type: 'forecast'
    }))
  ];

  // Radial Gauge Math calculations
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (infiltrationProb / 100) * circumference;

  // Determine Radial Gauge Colors based on Risk Tier
  let strokeColor = "#10B981"; // Emerald
  let glowClass = "glow-box-emerald";
  let statusBadgeBg = "bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border-emerald-500/40";

  if (riskTier === 'Critical') {
    strokeColor = "#EF4444"; // Crimson Red
    glowClass = "glow-box-red";
    statusBadgeBg = "bg-red-500/20 light:bg-red-100 text-red-300 light:text-red-800 border-red-500/50 animate-pulse-red";
  } else if (riskTier === 'Warning') {
    strokeColor = "#F59E0B"; // Amber
    glowClass = "glow-box-cyan";
    statusBadgeBg = "bg-amber-500/20 light:bg-amber-100 text-amber-300 light:text-amber-800 border-amber-500/40";
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* Timeline Forecasting Chart (2 Spans) */}
      <div className="lg:col-span-2 glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 relative overflow-hidden flex flex-col justify-between">
        
        {/* Background Scanline & Grid */}
        <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 z-10">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400 light:text-cyan-600" />
              <h2 className="text-base font-bold text-slate-100 light:text-slate-900 font-orbitron tracking-wide">
                K-STEP INFILTRATION TRAJECTORY FORECAST
              </h2>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600 font-mono mt-0.5">
              World Model State-Space Prediction Curve <span className="text-cyan-400 light:text-cyan-600 font-semibold">[t-9 → t → t+5 windows]</span> {scenarioName && <span className="text-amber-400 font-bold">• {scenarioName}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Toggle Mandatory Baseline Overlay */}
            <button
              onClick={() => {
                cyberSound.playClick();
                setShowBaselineComparison(!showBaselineComparison);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition-all ${
                showBaselineComparison
                  ? 'bg-rose-950/70 light:bg-rose-100 text-rose-300 light:text-rose-800 border-rose-500/50'
                  : 'bg-slate-900 light:bg-slate-100 text-slate-400 border-slate-700'
              }`}
              title="Toggle Logistic Regression Baseline overlay"
            >
              {showBaselineComparison ? <Eye className="w-3 h-3 text-rose-400" /> : <EyeOff className="w-3 h-3" />}
              <span>Baseline Overlay</span>
            </button>

            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900 light:bg-slate-100 border border-slate-700 text-slate-300 light:text-slate-700 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Historical S_t
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900 light:bg-slate-100 border border-slate-700 text-slate-300 light:text-slate-700 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Forecast (CI 95%)
            </span>
          </div>
        </div>

        {/* Recharts Forecasting Canvas */}
        <div className="w-full h-64 z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                {/* Gradient for Historical Risk */}
                <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                </linearGradient>

                {/* Gradient for Predicted Risk */}
                <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isMitigated ? "#10B981" : "#EF4444"} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={isMitigated ? "#10B981" : "#EF4444"} stopOpacity={0.0} />
                </linearGradient>

                {/* Confidence Interval Band Gradient */}
                <linearGradient id="ciBandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                unit="%"
              />

              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#070f26', 
                  borderColor: '#00f0ff', 
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                  fontSize: '11px' 
                }} 
              />

              {/* Reference line demarcating NOW (T-0) */}
              <ReferenceLine 
                x="Now (T)" 
                stroke="#00F0FF" 
                strokeDasharray="4 4" 
                label={{ value: 'PRESENT t', fill: '#00F0FF', fontSize: 10, fontFamily: 'monospace', position: 'top' }} 
              />

              {/* Confidence Interval Upper Band Area */}
              <Area 
                type="monotone" 
                dataKey="ciUpper" 
                name="95% CI Upper (+2σ)"
                stroke="#F59E0B" 
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="url(#ciBandGrad)" 
              />

              {/* Confidence Interval Lower Band Boundary */}
              <Area 
                type="monotone" 
                dataKey="ciLower" 
                name="95% CI Lower (-2σ)"
                stroke="#F59E0B" 
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="none" 
              />

              {/* Historical Risk Area */}
              <Area 
                type="monotone" 
                dataKey="historicalRisk" 
                name="CyberOracle Observed"
                stroke="#00F0FF" 
                strokeWidth={3} 
                fill="url(#historicalGrad)" 
                activeDot={{ r: 6, fill: '#00F0FF', stroke: '#070B14', strokeWidth: 2 }} 
              />

              {/* Mandatory Logistic Regression Baseline Comparison Line */}
              {showBaselineComparison && (
                <Area
                  type="monotone"
                  dataKey="baselineRisk"
                  name="Logistic Regression Baseline"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                />
              )}

              {/* Predicted Risk Area */}
              <Area 
                type="monotone" 
                dataKey="predictedRisk" 
                name="World Model K-Rollout"
                stroke={isMitigated ? "#10B981" : "#EF4444"} 
                strokeWidth={3} 
                strokeDasharray={isMitigated ? "" : "6 4"}
                fill="url(#predictedGrad)" 
                activeDot={{ r: 6, fill: isMitigated ? "#10B981" : "#EF4444", stroke: '#070B14', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Metrics & State Math */}
        <div className="z-10 mt-3 pt-3 border-t border-slate-800/80 light:border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 light:text-slate-600">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
            <span>Dynamics: <strong className="text-slate-200 light:text-slate-800">S_&#123;t+1&#125; = f_θ(S_t, a_t)</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 light:text-amber-800 border border-amber-500/30 text-[10px]">
              95% Bayesian CI (MC Dropout, N=30)
            </span>
            <span>Horizon: <strong className="text-cyan-300 light:text-cyan-700 font-bold">K=5 (~5 min)</strong></span>
            <span>Lead Time: <strong className="text-emerald-400 light:text-emerald-600 font-bold">{leadTimeMinutes}</strong></span>
          </div>
        </div>

      </div>

      {/* Radial Circular Progress Gauge (1 Span) */}
      <div className={`glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 relative flex flex-col items-center justify-between text-center ${glowClass}`}>
        
        {/* Card Header */}
        <div className="w-full flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 light:text-slate-600 uppercase tracking-wider font-bold">
            Infiltration Likelihood
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${statusBadgeBg}`}>
            {riskTier.toUpperCase()}
          </span>
        </div>

        {/* Circular Gauge */}
        <div className="relative w-44 h-44 my-2 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              className="stroke-slate-800 light:stroke-slate-200"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke={strokeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s' }}
            />
          </svg>

          {/* Center Value */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black font-orbitron tracking-tight glow-text-cyan" style={{ color: strokeColor }}>
              {infiltrationProb}%
            </span>
            <span className="text-[10px] font-mono text-slate-400 light:text-slate-600 uppercase mt-0.5 tracking-wider">
              {isMitigated ? "Contained Risk" : "P(Infiltration)"}
            </span>
          </div>
        </div>

        {/* Time-To-Impact Warning */}
        <div className="w-full bg-slate-900/90 light:bg-slate-50 rounded-xl p-3 border border-slate-800 light:border-slate-200 mt-2 text-left font-mono">
          <div className="flex items-center gap-2">
            {riskTier === 'Critical' ? (
              <ShieldAlert className="w-4 h-4 text-red-400 light:text-red-600 animate-bounce" />
            ) : (
              <Clock className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
            )}
            <span className="text-xs font-bold text-slate-200 light:text-slate-800">
              Lead Time Acquired: <span className="text-emerald-400 font-bold">{leadTimeMinutes}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-500 mt-1">
            {isMitigated 
              ? "Zero-trust isolation active: Infiltration path disconnected at Edge Gateway."
              : riskTier === 'Critical'
                ? "World model predicts critical compromise within 1.5 minutes without intervention."
                : "Active reconnaissance detected. Lateral movement predicted in T+2 windows."}
          </p>
        </div>

      </div>

    </div>
  );
}
