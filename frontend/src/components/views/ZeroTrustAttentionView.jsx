import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Brain, 
  Layers, 
  Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Eye, 
  ArrowRight, 
  HelpCircle,
  Sparkles,
  Zap,
  Server
} from 'lucide-react';
import { cyberSound } from '../../utils/soundEffects';

export default function ZeroTrustAttentionView({ currentData, isMitigated, onToggleMitigation, scenarioConfig }) {
  const [activeTab, setActiveTab] = useState('temporal');
  const [selectedEnclave, setSelectedEnclave] = useState('zone_1');

  const attentionWeights = currentData?.attentionWeights || [
    { window: 'W(t-9)', weight: 0.041, label: 'T-9' },
    { window: 'W(t-8)', weight: 0.048, label: 'T-8' },
    { window: 'W(t-7)', weight: 0.059, label: 'T-7' },
    { window: 'W(t-6)', weight: 0.076, label: 'T-6' },
    { window: 'W(t-5)', weight: 0.098, label: 'T-5' },
    { window: 'W(t-4)', weight: 0.124, label: 'T-4' },
    { window: 'W(t-3)', weight: 0.149, label: 'T-3' },
    { window: 'W(t-2)', weight: 0.182, label: 'T-2' },
    { window: 'W(t-1)', weight: 0.231, label: 'T-1' },
    { window: 'W(t-0)', weight: 0.342, label: 'T-0' }
  ];

  const shapFeatures = currentData?.shapFeatures || [];

  const enclaves = [
    {
      id: 'zone_0',
      name: 'Zone 0: Perimeter Edge (Untrusted)',
      trustScore: isMitigated ? 88 : 42,
      status: isMitigated ? 'Inspected' : 'Hostile Infiltration',
      color: 'red',
      policy: 'Continuous mTLS + Threat Ingress Filtering',
      nodes: ['198.51.100.1 (Edge NGFW)', '198.51.100.25 (Border BGP Router)'],
      attentionImpact: 'High (0.89)'
    },
    {
      id: 'zone_1',
      name: 'Zone 1: DMZ Reverse Proxy & Web API',
      trustScore: isMitigated ? 94 : 31,
      status: currentData?.riskTier === 'Critical' && !isMitigated ? 'Compromised Target' : 'Nominal Verification',
      color: 'amber',
      policy: 'Strict OAuth2 JWT Validation + Web App Firewall',
      nodes: ['172.16.10.50 (DMZ Reverse Proxy)', '172.16.10.88 (API Gateway)'],
      attentionImpact: 'Critical (0.94)'
    },
    {
      id: 'zone_2',
      name: 'Zone 2: Core Enterprise Datacenter',
      trustScore: isMitigated ? 96 : 74,
      status: isMitigated ? 'Protected' : 'Elevated Recon Watch',
      color: 'cyan',
      policy: 'Zero-Trust Microsegmentation + Dynamic Bastion SSH',
      nodes: ['10.0.4.12 (SQL Master Vault)', '10.0.2.88 (SecOps Bastion)'],
      attentionImpact: 'Moderate (0.62)'
    },
    {
      id: 'zone_3',
      name: 'Zone 3: Air-Gapped Identity Core / SCADA',
      trustScore: 99,
      status: 'Air-Gap Enforced',
      color: 'emerald',
      policy: 'Unidirectional Data Diode + Hardware Security Module (HSM)',
      nodes: ['10.0.1.5 (Active Directory T0)', '10.0.1.99 (HSM Key Vault)'],
      attentionImpact: 'Low (0.12)'
    }
  ];

  const currentEnclave = enclaves.find(e => e.id === selectedEnclave) || enclaves[1];

  return (
    <div className="space-y-6 animate-fadeIn font-inter">

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 glass-card tactical-card rounded-2xl border border-cyan-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Lock className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300">
                ZERO-TRUST TOPOLOGY & ATTENTION ENGINE
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                NIST SP 800-207 Architecture · Axiomatic Integrated Gradients · Dynamic Microsegmentation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 font-mono text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-400">Enforcement:</span>
            <strong className="text-cyan-300">Continuous Verify</strong>
          </div>

          <button
            onClick={onToggleMitigation}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${
              isMitigated
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 glow-box-emerald'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{isMitigated ? 'Microsegmentation Enforced' : 'Enforce Air-Gap Quarantine'}</span>
          </button>
        </div>
      </div>

      {/* 4 Enclave Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {enclaves.map((enc) => {
          const isSelected = selectedEnclave === enc.id;
          return (
            <button
              key={enc.id}
              onClick={() => { cyberSound.playClick(); setSelectedEnclave(enc.id); }}
              className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/40'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-300">{enc.name.split(':')[0]}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    enc.trustScore < 50
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                      : enc.trustScore < 85
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    Trust: {enc.trustScore}%
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 line-clamp-1">{enc.name.split(':')[1] || enc.name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">{enc.status}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Attention Weight:</span>
                <span className="font-bold text-cyan-300">{enc.attentionImpact}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Interactive Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Temporal Attention Weights + Feature Drivers (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Dual Explainability Hub */}
          <div className="glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="text-sm font-bold font-orbitron text-slate-100 tracking-wide">
                    AXIOMATIC ATTENTION & ROOT CAUSE ATTRIBUTION
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Axiomatically grounded path-integral attribution (ICML 2017) + Softmax Attention
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => { cyberSound.playClick(); setActiveTab('temporal'); }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'temporal'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Temporal Windows (When)
                </button>
                <button
                  onClick={() => { cyberSound.playClick(); setActiveTab('features'); }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'features'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Feature Drivers (What)
                </button>
              </div>
            </div>

            {/* TAB 1: TEMPORAL ATTENTION WEIGHTS */}
            {activeTab === 'temporal' && (
              <div className="space-y-4 my-2 animate-fadeIn font-mono">
                <p className="text-xs text-slate-400">
                  Attention probability distribution over observation windows <strong className="text-amber-400">W(t-9) ... W(t-0)</strong>:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                  {attentionWeights.map((w, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center flex flex-col justify-between hover:border-amber-400/40 transition-all"
                    >
                      <span className="text-[10px] text-slate-400 font-bold block">{w.label}</span>
                      <div className="my-2 h-20 bg-slate-950 rounded-lg p-0.5 flex items-end justify-center">
                        <div 
                          className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded transition-all duration-500 shadow-[0_0_8px_#f59e0b]"
                          style={{ height: `${Math.min(100, Math.max(12, w.weight * 280))}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-amber-300">
                        {(w.weight * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <span>Inflection Window: <strong className="text-amber-400">Window T-0 (Recent 30s)</strong> triggered forward rollout escalation</span>
                  <span>Completeness Error: <strong className="text-cyan-400">&lt; 0.001 (Axiomatic)</strong></span>
                </div>
              </div>
            )}

            {/* TAB 2: INTEGRATED GRADIENTS FEATURE ATTRIBUTION */}
            {activeTab === 'features' && (
              <div className="space-y-3.5 my-2 animate-fadeIn">
                {(shapFeatures.length > 0 ? shapFeatures : [
                  { name: "lg_bwd_len_mean", impact: 14.29, value: "1,420 bytes", desc: "Abnormal surge in backward response payload sizes" },
                  { name: "frac_port_ftp", impact: 11.45, value: "Port 21 Target", desc: "Targeting legacy authentication credentials" },
                  { name: "lg_init_bwd_win", impact: 8.82, value: "65,535 win", desc: "Aggressive TCP receiver buffer negotiation" },
                  { name: "frac_psh", impact: 7.21, value: "84.2% flags", desc: "High density of PSH flags (active exfiltration buffer)" },
                  { name: "lg_pps", impact: 6.43, value: "4,820 pkts/s", desc: "Abrupt surge in packet transmission cadence" }
                ]).map((feat, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all font-mono">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-cyan-300">{feat.name}</span>
                      <span className="text-slate-400 font-bold">+{feat.impact}% impact</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-1.5">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full shadow-[0_0_8px_#00f0ff]" 
                        style={{ width: `${Math.min(100, feat.impact * 5)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">{feat.desc}</p>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Zero-Trust Policy Matrix Card */}
          <div className="glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 font-mono">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              Active Zero-Trust Microsegmentation Rules
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Zone 0 → Zone 1 Ingress:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  mTLS Mutual Auth (TLS 1.3)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Zone 1 → Zone 2 SQL Pipe:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Ephemeral Identity Token (TTL: 60s)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Zone 2 → Zone 3 HSM Vault:</span>
                <span className={`px-2 py-0.5 rounded ${
                  isMitigated 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {isMitigated ? 'Unidirectional Air-Gap Enforced' : 'Quarantine Standby'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Selected Enclave Details & Graph Connectivity (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Enclave Inspector Panel */}
          <div className="glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Selected Microsegment</span>
                <h3 className="text-base font-bold font-orbitron text-slate-100">{currentEnclave.name}</h3>
              </div>
              <div className={`px-3 py-1 rounded-xl font-mono text-xs font-bold ${
                currentEnclave.trustScore < 50
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/50'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
              }`}>
                Trust: {currentEnclave.trustScore}%
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block uppercase font-bold mb-1">Enforcement Policy</span>
                <span className="text-slate-200 font-semibold">{currentEnclave.policy}</span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block uppercase font-bold mb-1">Protected Enclave Hosts</span>
                <div className="space-y-1 mt-1">
                  {currentEnclave.nodes.map((node, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{node}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block uppercase font-bold mb-1">Graph Attention Weight (GATv2)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-300">Edge Attention Coefficient:</span>
                  <strong className="text-cyan-300 font-orbitron">{currentEnclave.attentionImpact}</strong>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => {
                cyberSound.playClick();
                onToggleMitigation();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
            >
              {isMitigated ? '🛡️ Recalibrate Enclave Trust Baseline' : '🚨 Trigger Microsegment Air-Gap Isolation'}
            </button>
          </div>

          {/* Compliance & Standards Callout */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero-Trust Standard Compliance</span>
            </div>
            <p>
              Adheres strictly to <strong className="text-slate-300">NIST SP 800-207 (Zero Trust Architecture)</strong>, 
              incorporating dynamic real-time policy decision points (PDP) driven by World Model state estimation.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
