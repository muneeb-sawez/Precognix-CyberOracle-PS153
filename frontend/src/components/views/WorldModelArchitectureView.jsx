import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Layers, 
  Activity, 
  Brain, 
  Clock, 
  Network, 
  Sparkles,
  ChevronRight,
  Zap,
  Eye
} from 'lucide-react';
import { cyberSound } from '../../utils/soundEffects';

export default function WorldModelArchitectureView() {
  const [selectedComponent, setSelectedComponent] = useState('v_module');

  const components = {
    v_module: {
      id: 'v_module',
      badge: 'V-Module',
      subtitle: 'State Encoder',
      title: '49-Dimensional Flow Telemetry State Ingestion & Normalizer',
      paperRef: 'Ha & Schmidhuber (2018) + CSE-CIC-IDS2018 Standardized State Space',
      description: 'Aggregates bidirectional NetFlow and micro packet header telemetry within window t into a standardized 49-dimensional network state vector S_t ∈ R^49.',
      formula: 'S_t = [ log(N_flows), log(Pkts), Δ_IAT, Flags_{SYN,FIN,RST}, Port_Fractions ]',
      formulaSub: 'z_t = (S_t - μ_{scaler}) / σ_{scaler}  ∈  R^{49}',
      color: 'cyan',
      icon: Network,
      keyPoints: [
        { title: 'Dual-Tier Telemetry Ingestion', desc: 'Captures macro volume metrics (flow count, duration, forward/backward bytes) and micro header dynamics (inter-arrival jitter, window starvation, TCP flags).' },
        { title: 'Standardized State Space', desc: 'All 49 features are log1p-transformed and z-score normalized to ensure numeric stability during recursive rollout.' },
        { title: 'Zero Cloud Dependency', desc: '100% on-premises offline deterministic feature extraction running directly on local edge hardware.' },
        { title: 'Phase 2 Topological Scaling', desc: 'Research roadmap targets multi-sensor topological scaling via GATv2 message-passing across distributed edge nodes.' }
      ]
    },
    m_module: {
      id: 'm_module',
      badge: 'M-Module',
      subtitle: 'Dynamics Engine',
      title: 'Recurrent State-Space World Model (2-Layer GRU Dynamics)',
      paperRef: 'Ha & Schmidhuber (2018) World Model Dynamics',
      description: 'Learns the conditional state-transition dynamics P(S_{t+1} | S_t, ..., S_{t-L}) over historical context windows L=30 (5-minute rolling memory).',
      formula: 'h_t = GRU( h_{t-1}, LayerNorm( GELU( W_e z_t ) ) )',
      formulaSub: 'μ_{t+1} = z_t + W_μ h_t,   log(σ^2_{t+1}) = clip( W_σ h_t, -6, 2 )',
      color: 'indigo',
      icon: Cpu,
      keyPoints: [
        { title: 'Transition Dynamics Modeling', desc: 'Learns how network states evolve over rolling time slices instead of fitting a memoryless static classification boundary.' },
        { title: 'Gaussian State Prediction Head', desc: 'Predicts both the next-state mean vector and diagonal log-variance under Gaussian Negative Log-Likelihood loss.' },
        { title: 'Scheduled Sampling Training', desc: 'Decays teacher-forcing probability from 1.0 to 0.0 over training epochs to prevent compounding rollout exposure bias.' },
        { title: 'Context Window L=30', desc: 'Maintains 5 minutes of historical context to detect stealthy reconnaissance preceding payload detonating hours later.' }
      ]
    },
    c_module: {
      id: 'c_module',
      badge: 'C-Module',
      subtitle: 'Forward Controller',
      title: 'Free-Running K-Step Autoregressive Rollout Head (K=6 Lookahead)',
      paperRef: 'Phan & Bauschert (IEEE ICC 2026) + MITRE ATT&CK Mapping',
      description: 'Recursively feeds its own predicted state vector back into the recurrent cell to simulate the future network state trajectory K=6 steps ahead.',
      formula: 'ẑ_{t+1+k} = ẑ_{t+k} + μ(h_{t+k})   [Free-Running Rollout]',
      formulaSub: 'P_{alarm}(t, K) = max_{k=1..K} σ( W_a h_{t+k} ),   Stage = argmax Softmax( W_s h_{t+k} )',
      color: 'amber',
      icon: Clock,
      keyPoints: [
        { title: 'Autoregressive Free-Running Simulation', desc: 'Simulates future network behavior into the future without needing or waiting for future network packets.' },
        { title: 'Advance Infiltration Curve', desc: 'Outputs advance probability P(attack) across all K=6 horizon windows (T+10s to T+60s lookahead).' },
        { title: 'MITRE ATT&CK Stage Mapping', desc: 'Multi-class stage classifier projects the active kill-chain phase: Recon → Access → Lateral → C2 → Exfil.' },
        { title: 'Lead-Time Defense Advantage', desc: 'Provides defenders with crucial advance warning before exploits reach domain controllers or databases.' }
      ]
    },
    explain_module: {
      id: 'explain_module',
      badge: 'XAI Layer',
      subtitle: 'Attribution Engine',
      title: 'Axiomatic Integrated Gradients Attribution (Sundararajan et al., ICML 2017)',
      paperRef: 'Sundararajan, Taly & Yan (ICML 2017) Axiomatic Attribution',
      description: 'Fulfills the NTRO mandate that black-box alerts are unacceptable by calculating path integrals of gradients along the straight line from benign baseline to input.',
      formula: 'IG_i(x) = (x_i - x\'_i) × ∫_0^1 ( ∂F(x\' + α(x - x\')) / ∂x_i ) dα',
      formulaSub: 'Approximated via Gauss-Legendre quadrature (m=20 interpolation steps)',
      color: 'emerald',
      icon: Eye,
      keyPoints: [
        { title: 'Axiomatic Rigor', desc: 'Provably satisfies the Completeness and Implementation Invariance axioms that heuristic attribution methods violate.' },
        { title: 'Root Cause Feature Ranking', desc: 'Ranks the exact telemetry attributes driving the forecast (e.g. +38% SYN variance, +42% Port 445 sweep rate).' },
        { title: 'Deterministic On-Device Execution', desc: 'Runs directly on local edge hardware / GPU in <15ms without querying external cloud models or leaking telemetry.' },
        { title: 'SOC Analyst Actionability', desc: 'Provides L1/L2 operators with clear evidence needed to authorize automated SOAR quarantine countermeasures.' }
      ]
    }
  };

  const active = components[selectedComponent];
  const ActiveIcon = active.icon;

  const colorMap = {
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-400/40', text: 'text-cyan-400', glow: 'glow-box-cyan' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-400/40', text: 'text-indigo-400', glow: '' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-400/40', text: 'text-amber-400', glow: '' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-400/40', text: 'text-emerald-400', glow: 'glow-box-emerald' },
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card tactical-card p-5 sm:p-6 rounded-2xl relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                WORLD MODEL ARCHITECTURE
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-500 max-w-2xl">
              Ha & Schmidhuber (2018) World Model adapted for predictive cyber defence. Learning state transitions{' '}
              <span className="text-cyan-400 font-semibold">P(S&#123;t+1&#125; | S&#123;t&#125;)</span> instead of static classification.
            </p>
          </div>
          <span className="status-badge status-badge-live shrink-0">
            <Sparkles className="w-3 h-3" /> PS 26153 Core
          </span>
        </div>
      </motion.div>

      {/* Interactive Pipeline Selector */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold font-orbitron text-slate-200">
            Execution Pipeline
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(components).map(([key, comp], idx) => {
            const Icon = comp.icon;
            const isSelected = selectedComponent === key;
            const colors = colorMap[comp.color];
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.97 }}
                onClick={() => { cyberSound.playClick(); setSelectedComponent(key); }}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ${colors.glow} scale-[1.02]`
                    : 'bg-white/3 border-white/5 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="pipeline-highlight"
                    className="absolute inset-0 rounded-xl border-2 border-current opacity-20 pointer-events-none"
                    style={{ color: comp.color === 'cyan' ? '#00f0ff' : comp.color === 'indigo' ? '#818cf8' : comp.color === 'amber' ? '#f59e0b' : '#10b981' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${colors.bg} ${colors.text} font-bold tracking-wider border ${colors.border}`}>
                    0{idx + 1}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? colors.text : 'text-slate-500'}`} />
                </div>
                <h4 className="text-[11px] font-bold font-orbitron text-slate-200 mb-0.5">{comp.badge}</h4>
                <p className="text-[10px] font-mono text-slate-500">{comp.subtitle}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Component Deep Dive */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedComponent}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card tactical-card p-5 sm:p-6 rounded-2xl"
        >
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ActiveIcon className={`w-4 h-4 ${colorMap[active.color].text}`} />
                <span className={`text-xs font-mono font-bold uppercase tracking-widest ${colorMap[active.color].text}`}>
                  {active.badge} — {active.subtitle}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-orbitron text-slate-100">
                {active.title}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 mt-1">
                Foundation: <strong className="text-slate-300">{active.paperRef}</strong>
              </p>
            </div>
            <span className="status-badge status-badge-safe text-[9px] shrink-0">
              Offline Deterministic
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            {active.description}
          </p>

          {/* Mathematical Formulation */}
          <div className="bg-white/3 p-4 rounded-xl border border-white/5 mb-5 font-mono text-xs overflow-x-auto">
            <span className={`text-[10px] uppercase tracking-wider block mb-1.5 font-bold ${colorMap[active.color].text}`}>
              Mathematical Formulation
            </span>
            <code className="text-cyan-300 font-semibold text-sm block">{active.formula}</code>
            {active.formulaSub && (
              <code className="text-slate-400 text-xs block mt-1">{active.formulaSub}</code>
            )}
          </div>

          {/* Key Points Grid */}
          <h4 className="text-xs font-bold font-orbitron text-slate-400 uppercase tracking-wider mb-3">
            Implementation Highlights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {active.keyPoints.map((point, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
                className="p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all group"
              >
                <h5 className={`text-[11px] font-bold font-mono mb-1 ${colorMap[active.color].text}`}>
                  {point.title}
                </h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">{point.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dual Feature Extraction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card tactical-card p-5 rounded-2xl space-y-3"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold font-orbitron text-slate-200">
              Tier 1: Flow-Level Features
            </h4>
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Standard NetFlow / IPFIX aggregates:
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pl-1">
            {['Flow Duration, Fwd/Bwd Packet Counts', 'Bytes per Second, Packet Ingest Rates', 'TCP Flag Distributions (SYN, FIN, RST, PSH, ACK, URG)', 'Source/Destination IP Entropy & Port Fan-out'].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card tactical-card p-5 rounded-2xl space-y-3"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold font-orbitron text-slate-200">
              Tier 2: Packet-Level Timing
            </h4>
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Microsecond features for low-and-slow recon detection:
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pl-1">
            {['Inter-Arrival Time (IAT) Mean & Variance', 'TTL Variance across consecutive packets', 'TCP Window Size dispersion & zero-window flags', 'Retransmission Counts and Sequence Gaps'].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
