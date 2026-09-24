import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  PieChart as PieIcon, 
  Award, 
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';

export default function AnalyticsHistoryView({ _currentData, _scenarioId }) {
  const trendData = [
    { step: 't=0', probability: 0.12, baseline: 0.05 },
    { step: 't=2', probability: 0.18, baseline: 0.05 },
    { step: 't=4', probability: 0.35, baseline: 0.06 },
    { step: 't=6', probability: 0.58, baseline: 0.05 },
    { step: 't=8', probability: 0.84, baseline: 0.07 },
    { step: 't=10', probability: 0.96, baseline: 0.06 },
    { step: 't=12', probability: 0.22, baseline: 0.05 },
  ];

  const featureImpactData = [
    { feature: 'SYN Pkt Freq', value: 0.42 },
    { feature: 'IP Entropy', value: 0.28 },
    { feature: 'Dst Port Scan', value: 0.19 },
    { feature: 'Flow Duration', value: 0.11 },
    { feature: 'Payload Size', value: 0.08 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400 light:text-indigo-600 animate-pulse" />
            <h2 className="text-2xl font-bold font-mono tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-200 to-cyan-300 light:from-indigo-700 light:to-cyan-800">
              PREDICTIVE ANALYTICS & ATTACK HISTORY
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
            Historical threat timeline trajectory, model evaluation benchmarks, and exportable SOC audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exporting Forensic Report (PDF)...')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/80 light:bg-indigo-100 text-indigo-300 light:text-indigo-800 border border-indigo-500/40 text-xs font-mono font-medium hover:bg-indigo-900/80 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export SOC Report</span>
          </button>
        </div>
      </div>

      {/* Benchmark Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 light:border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 light:text-slate-600">Model Accuracy (ROC-AUC)</span>
            <Award className="w-4 h-4 text-emerald-400 light:text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100 light:text-slate-800 mt-2">0.984</div>
          <span className="text-[10px] text-emerald-400 light:text-emerald-600 font-mono">+1.2% vs baseline XGBoost</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 light:border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 light:text-slate-600">Mean Lead Time Horizon</span>
            <TrendingUp className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100 light:text-slate-800 mt-2">4.2 Steps ahead</div>
          <span className="text-[10px] text-cyan-400 light:text-cyan-600 font-mono">Early warning window</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 light:border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 light:text-slate-600">False Positive Rate</span>
            <Sparkles className="w-4 h-4 text-indigo-400 light:text-indigo-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100 light:text-slate-800 mt-2">0.012%</div>
          <span className="text-[10px] text-slate-400 light:text-slate-600 font-mono">CIC-IDS2018 benchmarked</span>
        </div>
      </div>

      {/* Recharts Trajectory & Feature Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Attack Progression Chart */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 light:border-slate-200">
          <h3 className="text-sm font-bold font-mono text-slate-200 light:text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
            Threat Probability Trajectory (p(S_t))
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="probColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="step" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#00f0ff' }} />
                <Area type="monotone" dataKey="probability" stroke="#00f0ff" fillOpacity={1} fill="url(#probColor)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Feature Importance Bar Chart */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 light:border-slate-200">
          <h3 className="text-sm font-bold font-mono text-slate-200 light:text-slate-800 mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-400 light:text-indigo-600" />
            Top Feature Importance (SHAP Drivers)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImpactData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="feature" stroke="#64748b" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#6366f1' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
