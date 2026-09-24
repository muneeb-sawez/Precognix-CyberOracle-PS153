import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  UploadCloud,
  Activity,
  Cpu,
  Zap,
  ShieldCheck,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  LayoutDashboard,
  Network,
  Sliders,
  Brain,
  Award,
  Building2,
  FileText,
  Volume2,
  VolumeX,
  Tv,
  BarChart3,
  Menu,
  X,
  Signal,
  Check
} from 'lucide-react';
import { SCENARIOS } from '../data/attackScenarios';
import { cyberSound } from '../utils/soundEffects';

export default function Header({
  scenarioId,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  onReset,
  currentStep,
  maxSteps,
  ingestRate,
  isMitigated,
  onToggleMitigation,
  onOpenUploadModal,
  themeId = 'professional',
  themes = {},
  onCycleTheme,
  onSelectTheme,
  scanlinesEnabled,
  onToggleScanlines,
  isSidebarCollapsed,
  onToggleSidebar,
  isSnifferActive = false,
  onToggleSniffer,
  snifferStats = null
}) {
  const [isMuted, setIsMuted] = useState(!cyberSound.isSoundEnabled());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setThemeDropdownOpen(false);
  }, [location.pathname]);

  const handleSoundToggle = () => {
    const enabled = cyberSound.toggleSound();
    setIsMuted(!enabled);
  };

  const navTabs = [
    { to: '/', label: 'Command HUD', icon: LayoutDashboard, shortLabel: 'HUD' },
    { to: '/architecture', label: 'World Model', icon: Brain, shortLabel: 'Model' },
    { to: '/benchmarks', label: 'Benchmarks', icon: Award, shortLabel: 'Bench' },
    { to: '/topology', label: 'Topology', icon: Network, shortLabel: 'Topo' },
    { to: '/critical-sectors', label: 'NCIIPC Sectors', icon: Building2, shortLabel: 'NCIIPC' },
    { to: '/mitigation', label: 'SOAR Defense', icon: ShieldCheck, shortLabel: 'SOAR' },
    { to: '/forensics', label: 'Forensics', icon: FileText, shortLabel: 'Audit' },
    { to: '/settings', label: 'Ingestion', icon: Sliders, shortLabel: 'Ingest' },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, shortLabel: 'Radar' },
  ];

  const currentThemeConfig = themes[themeId] || {
    id: 'professional',
    label: 'Professional Dark',
    description: 'Clean modern dark interface'
  };

  return (
    <header className={`w-full transition-all duration-300 ${
      scrolled ? 'liquid-glass shadow-2xl' : 'glass-card'
    } rounded-2xl relative border border-white/10 light:border-slate-200/80`}>

      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70 pointer-events-none" />

      {/* ===== THREAT TICKER BAR ===== */}
      <div className="px-4 sm:px-6 py-1.5 border-b border-white/5 light:border-slate-200 bg-slate-950/40 light:bg-slate-100/60 text-[11px] font-mono">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-500 light:text-slate-600 uppercase tracking-widest text-[9px] font-bold shrink-0">Live Feed</span>
            <span className="text-slate-400 light:text-slate-600 truncate">
              CERT-In 2025: <strong className="text-slate-200 light:text-slate-800">29,441 incidents</strong> (+2.5x) • Power Grid: <strong className="text-cyan-400 light:text-cyan-700">~200k probes</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 light:text-emerald-700 text-[10px]">
              <Cpu className="w-3 h-3" />
              <span>NEURAL ENGINE</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 light:text-cyan-700 text-[10px]">
              <ShieldCheck className="w-3 h-3" />
              <span>AIR-GAP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN HEADER ROW ===== */}
      <div className="px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">

          {/* Left: Brand Identity (Guaranteed No-Overlap with shrink-0) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 light:bg-slate-200 border border-white/10 light:border-slate-300 text-slate-300 light:text-slate-700 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <NavLink
              to="/"
              onClick={() => cyberSound.playClick()}
              className="flex items-center gap-2.5 group cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              title="Return to Home / Command HUD"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center shrink-0 transition-all">
                <ShieldAlert className="w-5 h-5 text-cyan-400 light:text-cyan-600 animate-pulse group-hover:scale-110 transition-transform" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 light:from-cyan-700 light:via-sky-800 light:to-emerald-700 font-orbitron leading-tight group-hover:from-cyan-300 group-hover:to-emerald-300 transition-all">
                    CYBERORACLE
                  </h1>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    HOME ⌂
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-500 light:text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Signal className="w-2.5 h-2.5 text-emerald-400 light:text-emerald-600 animate-pulse" />
                  <span>World Model v2.4 · PS 26153</span>
                </p>
              </div>
            </NavLink>
          </div>


          {/* Right: Controls Toolbar */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">

            {/* 1. Scenario Selector Dropdown */}
            <div className="relative hidden sm:block">
              <select
                value={scenarioId}
                onChange={(e) => { cyberSound.playClick(); onSelectScenario(e.target.value); }}
                className="appearance-none bg-slate-900/90 light:bg-white text-slate-200 light:text-slate-800 text-xs font-mono py-1.5 pl-3 pr-8 rounded-xl border border-white/15 light:border-slate-300 hover:border-cyan-400/40 focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[210px] lg:max-w-[240px] truncate shadow-sm transition-all"
              >
                <optgroup label="⚡ CRITICAL INFRASTRUCTURE (NCIIPC)" className="bg-slate-900 light:bg-slate-100 text-cyan-400 light:text-cyan-700 font-bold">
                  <option value="scada_intrusion" className="text-slate-200 light:text-slate-800 font-normal">
                    Power Grid SCADA / Modbus OT
                  </option>
                  <option value="telecom_bgp_hijack" className="text-slate-200 light:text-slate-800 font-normal">
                    Telecom BGP Hijack & Mirai Storm
                  </option>
                </optgroup>

                <optgroup label="🎯 ZERO-DAY & MULTI-STAGE APT" className="bg-slate-900 light:bg-slate-100 text-amber-400 light:text-amber-700 font-bold">
                  <option value="held_out_botnet" className="text-slate-200 light:text-slate-800 font-normal">
                    Held-Out Zero-Day (CTU-13 Neris) ★
                  </option>
                  <option value="ransomware" className="text-slate-200 light:text-slate-800 font-normal">
                    Multi-Stage Ransomware (MS17-010)
                  </option>
                  <option value="supply_chain_dll" className="text-slate-200 light:text-slate-800 font-normal">
                    SolarWinds Supply Chain & DLL Hijack ★
                  </option>
                </optgroup>

                <optgroup label="🔍 RECON & EXFILTRATION" className="bg-slate-900 light:bg-slate-100 text-sky-400 light:text-sky-700 font-bold">
                  <option value="slow_scan" className="text-slate-200 light:text-slate-800 font-normal">
                    Low-and-Slow Recon → Lateral SMB
                  </option>
                  <option value="syn_flood" className="text-slate-200 light:text-slate-800 font-normal">
                    SYN Surge & Volumetric Cloak
                  </option>
                  <option value="cloud_credential_api" className="text-slate-200 light:text-slate-800 font-normal">
                    BFSI API Gateway Token Forgery
                  </option>
                </optgroup>

                <optgroup label="🛡️ BASELINE TESTING" className="bg-slate-900 light:bg-slate-100 text-emerald-400 light:text-emerald-700 font-bold">
                  <option value="normal" className="text-slate-200 light:text-slate-800 font-normal">
                    Clean Baseline Normal Telemetry
                  </option>
                </optgroup>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 2. Simulation Playback Controls Pill */}
            <div className="flex items-center gap-1 bg-slate-900/80 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl p-0.5 shadow-sm font-mono">
              {/* Play/Pause */}
              <button
                onClick={() => { cyberSound.playClick(); onTogglePlay(); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isPlaying
                    ? 'bg-amber-500/20 text-amber-300 light:text-amber-800 border border-amber-500/30'
                    : 'liquid-btn text-cyan-300 light:text-cyan-800'
                }`}
                title={isPlaying ? 'Pause Simulation' : 'Start Simulation'}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span className="hidden md:inline">{isPlaying ? 'Pause' : 'Live'}</span>
              </button>

              {/* SOAR Isolation Trigger */}
              <button
                onClick={() => { cyberSound.playClick(); onToggleMitigation(); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                  isMitigated
                    ? 'liquid-btn-emerald text-emerald-300 light:text-emerald-800 border border-emerald-500/40 font-bold'
                    : 'bg-transparent text-slate-400 light:text-slate-600 hover:text-emerald-300'
                }`}
                title="Trigger Automated SOAR Containment"
              >
                <ShieldCheck className={`w-3 h-3 ${isMitigated ? 'text-emerald-400 light:text-emerald-700' : ''}`} />
                <span className="hidden md:inline">{isMitigated ? 'Active' : 'Isolate'}</span>
              </button>

              {/* Reset to T-0 */}
              <button
                onClick={() => { cyberSound.playClick(); onReset(); }}
                className="p-1.5 rounded-lg text-slate-400 light:text-slate-600 hover:text-white light:hover:text-black transition-all"
                title="Reset Timeline to T-0"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* 3. Action Buttons (Upload & Dossier & Live Sniffer) */}
            <div className="flex items-center gap-1.5 font-mono">
              {/* Live Sniffer Hardware NIC Button */}
              <button
                onClick={() => { cyberSound.playClick(); if (onToggleSniffer) onToggleSniffer(); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all shadow-sm ${
                  isSnifferActive
                    ? 'bg-rose-500/20 text-rose-300 light:text-rose-700 border-rose-500/50 glow-box-critical font-bold'
                    : 'bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-700 border-emerald-500/30 light:border-emerald-200 hover:bg-emerald-500/20'
                }`}
                title={isSnifferActive ? "Halt Live Interface Packet Sniffer" : "Attach Live Wire Packet Sniffer (Real Network Adapter)"}
              >
                <span className={`w-2 h-2 rounded-full ${isSnifferActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                <span className="hidden sm:inline">{isSnifferActive ? 'Sniffing: Live' : 'Live Sniffer'}</span>
                <span className="sm:hidden">{isSnifferActive ? 'Live' : 'Sniff'}</span>
              </button>

              <button
                onClick={() => { cyberSound.playClick(); onOpenUploadModal(); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 light:bg-indigo-50 text-indigo-300 light:text-indigo-800 border border-indigo-500/30 light:border-indigo-200 hover:bg-indigo-500/20 text-xs transition-all shadow-sm"
                title="Upload custom flow CSV for on-device inference"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Upload</span>
              </button>

              <NavLink
                to="/forensics"
                onClick={() => cyberSound.playClick()}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all shadow-sm ${
                    isActive
                      ? 'bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border-cyan-400 font-bold'
                      : 'bg-cyan-500/10 light:bg-sky-50 text-cyan-300 light:text-cyan-800 border-cyan-500/30 light:border-sky-200 hover:bg-cyan-500/20'
                  }`
                }
                title="Generate & Export NTRO / CERT-In Incident Dossier"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-700" />
                <span className="hidden sm:inline">Dossier</span>
              </NavLink>
            </div>

            {/* 4. System Settings (Theme & Audio) */}
            <div className="flex items-center gap-1 border-l border-white/10 light:border-slate-300 pl-2">
              {/* Theme Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/10 light:border-slate-300 bg-slate-900/60 light:bg-white text-xs font-mono text-slate-300 light:text-slate-700 hover:border-cyan-400/50 shadow-sm transition-all"
                  title="Switch Visual Theme"
                >
                  {themeId === 'light' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  ) : themeId === 'tactical' ? (
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {themeDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-slate-900/95 light:bg-white border border-white/15 light:border-slate-200 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 z-50 space-y-1">
                    <div className="px-2 py-1 text-[9px] font-mono text-slate-400 light:text-slate-500 uppercase tracking-wider font-bold">
                      Interface Theme
                    </div>
                    {Object.values(themes).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          cyberSound.playClick();
                          if (onSelectTheme) onSelectTheme(t.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition-all ${
                          themeId === t.id
                            ? 'bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 font-bold border border-cyan-500/30 light:border-cyan-300'
                            : 'text-slate-300 light:text-slate-700 hover:bg-white/5 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {t.id === 'light' ? (
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                          ) : t.id === 'tactical' ? (
                            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <Moon className="w-3.5 h-3.5 text-sky-400" />
                          )}
                          <span>{t.label}</span>
                        </div>
                        {themeId === t.id && (
                          <Check className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-700" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sound Toggle */}
              <button
                onClick={handleSoundToggle}
                className={`p-1.5 rounded-lg border transition-all ${
                  !isMuted 
                    ? 'bg-cyan-500/15 light:bg-cyan-50 text-cyan-300 light:text-cyan-700 border-cyan-500/30' 
                    : 'bg-transparent text-slate-500 light:text-slate-400 border-transparent hover:text-slate-300'
                }`}
                title="Toggle Audio Cues"
              >
                {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Scanlines Toggle (tactical only) */}
              {themeId === 'tactical' && (
                <button
                  onClick={() => { cyberSound.playClick(); onToggleScanlines(); }}
                  className={`p-1.5 rounded-lg border transition-all ${
                    scanlinesEnabled ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-transparent text-slate-500 border-transparent'
                  }`}
                  title="Toggle Scanlines HUD"
                >
                  <Tv className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* ===== HORIZONTAL NAVIGATION & LIVE TELEMETRY BAR ===== */}
      <div className="px-4 sm:px-6 py-1.5 border-t border-white/5 light:border-slate-200 flex items-center justify-between gap-4">
        {/* Navigation Tabs (Left) */}
        <nav className="overflow-x-auto scrollbar-none flex-1">
          <div className="flex items-center gap-1 min-w-max">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === '/'}
                  onClick={() => cyberSound.playClick()}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all whitespace-nowrap border ${
                      isActive
                        ? 'liquid-btn text-cyan-300 light:text-cyan-800 border-cyan-400/50 light:border-cyan-500 shadow-sm font-bold'
                        : 'bg-transparent text-slate-500 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-100 border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400 light:text-cyan-700' : 'text-slate-500'}`} />
                      <span className="hidden xl:inline">{tab.label}</span>
                      <span className="xl:hidden">{tab.shortLabel}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Live Telemetry Pill (Right - Permanently Separated, Zero-Overlap) */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/60 light:bg-slate-100/90 border border-white/10 light:border-slate-200 px-3 py-1 rounded-xl font-mono text-[11px] shrink-0 text-slate-300 light:text-slate-700 shadow-sm">
          {isSnifferActive && (
            <>
              <div className="flex items-center gap-1.5 text-rose-400 font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-slate-400">NIC:</span>
                <span>{(snifferStats?.packets_captured || 0).toLocaleString()} pkts</span>
              </div>
              <div className="w-px h-3 bg-white/10 light:bg-slate-300" />
            </>
          )}
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-cyan-400 light:text-cyan-600 animate-pulse" />
            <span className="text-slate-500 light:text-slate-500">Ingest:</span>
            <span className="text-cyan-300 light:text-cyan-800 font-bold">{ingestRate.toLocaleString()}<span className="text-slate-500 font-normal">/s</span></span>
          </div>
          <div className="w-px h-3 bg-white/10 light:bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-slate-500 light:text-slate-500">Step:</span>
            <span className="text-amber-300 light:text-amber-800 font-bold">{currentStep}<span className="text-slate-500 font-normal">/{maxSteps}</span></span>
          </div>
          <div className="w-px h-3 bg-white/10 light:bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-emerald-400 light:text-emerald-700" />
            <span className="text-slate-500 light:text-slate-500">Horizon:</span>
            <span className="text-emerald-300 light:text-emerald-800 font-bold">K=5</span>
          </div>
        </div>
      </div>

      {/* ===== MOBILE SLIDE-DOWN MENU ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden border-t border-white/5 light:border-slate-200 bg-slate-950/95 light:bg-white p-4 space-y-3"
          >
            {/* Scenario Selector on Mobile */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Attack Scenario
              </span>
              <select
                value={scenarioId}
                onChange={(e) => { cyberSound.playClick(); onSelectScenario(e.target.value); }}
                className="w-full bg-slate-900 light:bg-slate-100 text-slate-200 light:text-slate-800 text-xs font-mono py-2 px-3 rounded-lg border border-white/10 light:border-slate-300"
              >
                {Object.values(SCENARIOS).map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} {sc.heldOutFamily ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Nav Links */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 light:border-slate-200">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    end={tab.to === '/'}
                    onClick={() => {
                      cyberSound.playClick();
                      setMobileMenuOpen(false);
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2 p-2 rounded-lg text-xs font-mono border ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}
