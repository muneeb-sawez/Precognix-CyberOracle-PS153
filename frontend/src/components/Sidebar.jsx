import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Brain,
  Award,
  Network,
  Building2,
  ShieldCheck,
  FileText,
  Sliders,
  Cpu,
  Activity,
  ChevronLeft,
  ChevronRight,
  Radio,
  BarChart3,
  Sparkles,
  Lock,
  Terminal,
  Crosshair
} from 'lucide-react';
import { cyberSound } from '../utils/soundEffects';

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  currentStep,
  maxSteps,
  ingestRate,
  riskTier,
  isMitigated
}) {
  const navItems = [
    { to: "/", label: "Command HUD", icon: LayoutDashboard, badge: "LIVE", color: "cyan" },
    { to: "/zero-trust-attention", label: "Zero-Trust & Attention", icon: Lock, badge: "NIST", color: "indigo" },
    { to: "/topology", label: "Network Topology", icon: Network, color: "cyan" },
    { to: "/telemetry-stream", label: "Telemetry Stream", icon: Terminal, badge: "WIRE", color: "emerald" },
    { to: "/mitre-matrix", label: "MITRE ATT&CK (v19)", icon: Crosshair, badge: "v19", color: "rose" },
    { to: "/architecture", label: "World Model", icon: Brain, color: "indigo" },
    { to: "/benchmarks", label: "Benchmarks", icon: Award, badge: "EVAL", color: "amber" },
    { to: "/critical-sectors", label: "NCIIPC Sectors", icon: Building2, color: "purple" },
    { to: "/mitigation", label: "SOAR Defense", icon: ShieldCheck, badge: isMitigated ? "ON" : "OFF", color: "emerald" },
    { to: "/forensics", label: "Forensics", icon: FileText, color: "slate" },
    { to: "/settings", label: "Ingestion", icon: Sliders, color: "cyan" },
    { to: "/analytics", label: "Analytics", icon: BarChart3, badge: "XAI", color: "amber" }
  ];


  const defconLevel = riskTier === 'Critical' ? { label: 'DEFCON 1', cls: 'text-red-400 bg-red-500/15 border-red-500/40' }
    : riskTier === 'Warning' ? { label: 'DEFCON 3', cls: 'text-amber-400 bg-amber-500/15 border-amber-500/40' }
    : { label: 'DEFCON 5', cls: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40' };

  const vramPercent = 9; // ~547MB / 6.1GB

  return (
    <aside className={`fixed top-0 left-0 bottom-0 z-40 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] flex-col justify-between hidden lg:flex ${
      isCollapsed ? 'w-[68px]' : 'w-[260px]'
    } liquid-glass border-r border-white/5 shadow-2xl`}>

      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* Brand Header */}
      <div className={`px-3 py-4 border-b border-white/5 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse-glow" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                Defense Modules
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              v2.4
            </span>
          </motion.div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => cyberSound.playClick()}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-[11px] transition-all duration-200 relative border ${
                  isActive
                    ? 'liquid-btn text-cyan-300 border-cyan-400/40 shadow-md font-bold'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border-transparent'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  } ${isCollapsed ? '' : ''}`} />

                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex-1 flex items-center justify-between truncate"
                    >
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${
                          item.badge === 'LIVE' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                          : item.badge === 'ON' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          : item.badge === 'OFF' ? 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-cyan-400"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Hardware Telemetry Panel */}
      <div className="px-2 pb-2">
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-xl bg-white/3 border border-white/5 space-y-2.5 font-mono text-[10px]"
          >
            {/* GPU Status */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                NEURAL ENGINE
              </span>
              <span className="text-emerald-400 font-bold text-[9px]">ACTIVE</span>
            </div>

            {/* Compute Memory Bar */}
            <div>
              <div className="flex justify-between text-slate-500 mb-1">
                <span>MEMORY</span>
                <span className="text-slate-300">547 MB (Allocated)</span>
              </div>
              <div className="progress-bar-track h-1.5 rounded-full">
                <motion.div
                  className="progress-fill-cyan h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${vramPercent}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Threat DEFCON */}
            <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
              <span className="text-slate-500">Threat Level</span>
              <span className={`font-bold px-1.5 py-0.5 rounded-md text-[9px] border ${defconLevel.cls} ${
                riskTier === 'Critical' ? 'animate-pulse' : ''
              }`}>
                {defconLevel.label}
              </span>
            </div>

            {/* Ingest Rate */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ingest Rate</span>
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Activity className="w-3 h-3" />
                {ingestRate.toLocaleString()}/s
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" title="Neural Engine Active" />
            <div className={`w-2 h-2 rounded-full ${
              riskTier === 'Critical' ? 'bg-red-400 animate-pulse' :
              riskTier === 'Warning' ? 'bg-amber-400' : 'bg-emerald-400'
            }`} title={defconLevel.label} />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="px-2 pb-3 pt-1 border-t border-white/5">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { cyberSound.playClick(); onToggleCollapse(); }}
          className="w-full py-1.5 px-2 rounded-lg bg-white/3 hover:bg-white/6 text-slate-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/25 transition-all flex items-center justify-center text-xs font-mono gap-1.5"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </>
          )}
        </motion.button>
      </div>
    </aside>
  );
}
