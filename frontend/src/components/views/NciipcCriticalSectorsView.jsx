import React, { useState } from 'react';
import { 
  Building2, 
  Zap, 
  Radio, 
  Truck, 
  Landmark, 
  Shield
} from 'lucide-react';
import { NCIIPC_SECTORS } from '../../data/attackScenarios';
import { cyberSound } from '../../utils/soundEffects';

export default function NciipcCriticalSectorsView() {
  const [selectedSector, setSelectedSector] = useState(NCIIPC_SECTORS[0]);

  const sectorIcons = {
    power: Zap,
    bfsi: Building2,
    telecom: Radio,
    transport: Truck,
    government: Landmark,
    strategic: Shield
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* View Header */}
      <div className="glass-card tactical-card p-6 rounded-2xl border border-cyan-500/20 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400 light:text-cyan-600 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-emerald-400 light:from-cyan-700 light:to-emerald-800">
                NCIIPC CRITICAL SECTORS DEFENCE MATRIX
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 light:text-slate-600 mt-1 max-w-3xl">
              Protecting India's Critical Information Infrastructure (CII) under Section 70A of the Information Technology Act 2000.
              Moving the defensive intervention point from <span className="text-rose-400 font-bold">after the loud breach</span> to 
              <span className="text-emerald-400 font-bold"> during the quiet build-up</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-cyan-950/80 light:bg-cyan-100 border border-cyan-500/40 text-cyan-300 light:text-cyan-800 font-bold">
              Mandate: nciipc.gov.in
            </span>
          </div>
        </div>
      </div>

      {/* India National Threat Trajectory Data Callouts (Part 2.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card tactical-card p-4 rounded-xl border border-slate-800 light:border-slate-200">
          <span className="text-[10px] font-mono text-slate-400 light:text-slate-600 uppercase">
            CERT-In 2025 Incidents Tracked
          </span>
          <div className="text-2xl font-orbitron font-bold text-rose-400 light:text-rose-600 mt-1">
            29.44 Lakh+
          </div>
          <span className="text-[10px] font-mono text-rose-300/80 light:text-rose-700">
            2.5x increase since 2020 (11.58 Lakh)
          </span>
        </div>

        <div className="glass-card tactical-card p-4 rounded-xl border border-slate-800 light:border-slate-200">
          <span className="text-[10px] font-mono text-slate-400 light:text-slate-600 uppercase">
            Power Sector Targeting (2026)
          </span>
          <div className="text-2xl font-orbitron font-bold text-amber-400 light:text-amber-600 mt-1">
            ~200,000
          </div>
          <span className="text-[10px] font-mono text-amber-300/80 light:text-amber-700">
            Intrusion attempts on single CII sector
          </span>
        </div>

        <div className="glass-card tactical-card p-4 rounded-xl border border-slate-800 light:border-slate-200">
          <span className="text-[10px] font-mono text-slate-400 light:text-slate-600 uppercase">
            Operation Sindoor Surge (May 2025)
          </span>
          <div className="text-2xl font-orbitron font-bold text-cyan-400 light:text-cyan-600 mt-1">
            1.5 Million
          </div>
          <span className="text-[10px] font-mono text-cyan-300/80 light:text-cyan-700">
            Cyberattacks during border flashpoint
          </span>
        </div>

        <div className="glass-card tactical-card p-4 rounded-xl border border-slate-800 light:border-slate-200">
          <span className="text-[10px] font-mono text-slate-400 light:text-slate-600 uppercase">
            Citizen Reach Protected
          </span>
          <div className="text-2xl font-orbitron font-bold text-emerald-400 light:text-emerald-600 mt-1">
            98% of Digital India
          </div>
          <span className="text-[10px] font-mono text-emerald-300/80 light:text-emerald-700">
            CERT-In Cyber Swachhta Kendra reach
          </span>
        </div>

      </div>

      {/* The 6 Critical Sectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NCIIPC_SECTORS.map((sec) => {
          const Icon = sectorIcons[sec.id] || Shield;
          const isSelected = selectedSector.id === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => { cyberSound.playClick(); setSelectedSector(sec); }}
              className={`glass-card tactical-card p-5 rounded-2xl text-left border transition-all ${
                isSelected
                  ? 'border-cyan-400 light:border-cyan-600 bg-cyan-950/40 light:bg-cyan-50 glow-box-cyan scale-[1.01]'
                  : 'border-slate-800 light:border-slate-200 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-cyan-400 light:text-cyan-600">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  sec.threatExposure === 'Critical'
                    ? 'bg-rose-950/80 light:bg-rose-100 text-rose-300 light:text-rose-800 border-rose-500/50'
                    : 'bg-amber-950/80 light:bg-amber-100 text-amber-300 light:text-amber-800 border-amber-500/50'
                }`}>
                  {sec.threatExposure} Exposure
                </span>
              </div>

              <h3 className="text-sm font-bold font-orbitron text-slate-100 light:text-slate-900">
                {sec.name}
              </h3>
              <p className="text-xs font-mono text-slate-400 light:text-slate-600 mt-1 line-clamp-2">
                {sec.impactDesc}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 light:border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Lead Time Advantage:</span>
                <span className="font-bold text-emerald-400 light:text-emerald-600">{sec.leadTimeAdvantage}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Sector Strategic Deep Dive */}
      <div className="glass-card tactical-card p-6 rounded-2xl border border-slate-800 light:border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 light:border-slate-200 pb-4 mb-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 light:text-cyan-600 uppercase tracking-widest font-bold">
              NCIIPC Critical Sector Strategic Profile
            </span>
            <h3 className="text-lg font-bold font-orbitron text-slate-100 light:text-slate-900">
              {selectedSector.name}
            </h3>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-950/80 light:bg-emerald-100 border border-emerald-500/40 text-emerald-300 light:text-emerald-800 text-xs font-mono font-bold self-start sm:self-auto">
            Early Warning: {selectedSector.leadTimeAdvantage}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 light:text-slate-500 uppercase text-[10px] block mb-1">
                Strategic Importance & Threat Grounding:
              </span>
              <p className="text-slate-200 light:text-slate-800 text-sm leading-relaxed">
                {selectedSector.impactDesc}
              </p>
            </div>

            <div>
              <span className="text-slate-400 light:text-slate-500 uppercase text-[10px] block mb-1">
                Primary Monitored Network Assets:
              </span>
              <p className="text-cyan-300 light:text-cyan-700 font-semibold">
                {selectedSector.primaryAssets}
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-slate-900/60 light:bg-slate-50 rounded-xl border border-slate-800 light:border-slate-200">
            <span className="text-slate-400 light:text-slate-500 uppercase text-[10px] block mb-1 font-bold">
              Why Reactive Detection Failed in Historical Incidents (Part 2.3):
            </span>
            <p className="text-slate-300 light:text-slate-700 leading-relaxed">
              <strong>The AIIMS Delhi (2022) & Power-Grid Case Study:</strong> Infiltrators spent days quietly conducting 
              reconnaissance and lateral movement across Active Directory shares before detonating encryption or switching breaker states. 
              Conventional SIEM rules only fired on the loud final event, causing 14+ days of national downtime. 
              CyberOracle intervenes during the quiet state-transition phase.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
