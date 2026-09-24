import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Cpu, Activity, Lock, Terminal, Award, Sparkles, Globe } from 'lucide-react';

export default function Footer({ currentStep, maxSteps, isMitigated }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 relative z-10">
      {/* Gradient Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-8" />

      {/* Main Footer Content */}
      <div className="liquid-glass rounded-2xl p-6 sm:p-8">
        {/* Top Section: Brand + Badges */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/25 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-orbitron font-bold text-sm text-slate-100 tracking-wider">
                  CYBERORACLE
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono font-bold">
                  PS 26153
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Predictive Cyber Defense World Model
              </p>
            </div>
          </div>

          {/* Hardware Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="status-badge status-badge-live text-[10px]">
              <Cpu className="w-3 h-3" /> CUDA / CPU ENGINE
            </div>
            <div className="status-badge status-badge-safe text-[10px]">
              <ShieldCheck className="w-3 h-3" /> AIR-GAPPED
            </div>
            <div className="status-badge status-badge-warning text-[10px]">
              <Activity className="w-3 h-3" /> 0.42ms LATENCY
            </div>
          </div>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
          {/* Column 1 */}
          <div className="space-y-2">
            <h4 className="font-orbitron text-[11px] font-bold text-cyan-400 tracking-wider uppercase">
              Problem Statement
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-400 font-inter">
              PS 26153 (NTRO): AI-based network attack forecasting. Autoregressive World Model forecasting infiltration trajectories K-steps ahead.
            </p>
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
              <Lock className="w-3 h-3 text-cyan-400" />
              Zero Data Leakage Time-Splits
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-2">
            <h4 className="font-orbitron text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
              Core Architecture
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400 font-inter">
              <li className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span><strong className="text-slate-300">State Space:</strong> 49-dim flow vectors per 10s window</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span><strong className="text-slate-300">Dynamics:</strong> GRU Free-Running Rollout P(S&#123;t+1&#125; | S&#123;≤t&#125;)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span><strong className="text-slate-300">XAI:</strong> Integrated Gradients Attributions</span>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="space-y-2">
            <h4 className="font-orbitron text-[11px] font-bold text-amber-400 tracking-wider uppercase">
              Verified Benchmarks
            </h4>
            <div className="bg-white/3 p-3 rounded-xl border border-white/5 space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Test AUPRC</span>
                <strong className="text-emerald-400">0.6932</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Precision</span>
                <strong className="text-cyan-300">96.4% (tau=0.999)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Test FPR</span>
                <strong className="text-amber-300">0.45%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Device</span>
                <strong className="text-slate-200">LOCAL ACCELERATOR</strong>
              </div>
            </div>
          </div>

          {/* Column 4 */}
          <div className="space-y-2">
            <h4 className="font-orbitron text-[11px] font-bold text-purple-400 tracking-wider uppercase">
              Critical Infrastructure
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-400 font-inter">
              NCIIPC Critical Sectors protection & CERT-In pre-emption directives for Power, BFSI, Telecom, and Transport.
            </p>
            <span className="inline-block px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-mono">
              NIST SP 800-207 Zero-Trust
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
          <div>
            © {year} Team Precognix · SIH {year} · PS 26153 (NTRO)
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Pipeline Connected
            </span>
            <span>•</span>
            <span>:8000 FastAPI</span>
            <span>•</span>
            <span>:5173 Vite</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
