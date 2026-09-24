import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Breadcrumbs from './components/Breadcrumbs';
import Footer from './components/Footer';

import HeroForecastWidget from './components/HeroForecastWidget';
import MitreMatrix from './components/MitreMatrix';
import ExplainableShapCard from './components/ExplainableShapCard';
import NetworkTopologyMap from './components/NetworkTopologyMap';
import TelemetryTerminal from './components/TelemetryTerminal';
import TimeScrubber from './components/TimeScrubber';
import UploadModal from './components/UploadModal';
import MitigationControl from './components/MitigationControl';

import WorldModelArchitectureView from './components/views/WorldModelArchitectureView';
import BenchmarksEvaluationView from './components/views/BenchmarksEvaluationView';
import NciipcCriticalSectorsView from './components/views/NciipcCriticalSectorsView';
import TopologyExplorerView from './components/views/TopologyExplorerView';
import MitigationCenterView from './components/views/MitigationCenterView';
import ForensicExportView from './components/views/ForensicExportView';
import SettingsIngestionView from './components/views/SettingsIngestionView';
import AnalyticsHistoryView from './components/views/AnalyticsHistoryView';
import ZeroTrustAttentionView from './components/views/ZeroTrustAttentionView';
import DualTierTelemetryStreamView from './components/views/DualTierTelemetryStreamView';
import MitreMatrixFullscreenView from './components/views/MitreMatrixFullscreenView';


import { SCENARIOS, getStepData } from './data/attackScenarios';
import { convertApiToStepData } from './utils/apiAdapter';
import { cyberSound } from './utils/soundEffects';

// =========================================================================
// THEME SYSTEM — 3 distinct visual identities
// =========================================================================
const THEMES = {
  professional: {
    id: 'professional',
    label: 'Professional Dark',
    description: 'Clean, modern dark interface',
    bodyClass: 'dark theme-professional',
    bg: 'bg-[#0a0f1e]',
    text: 'text-slate-100',
  },
  light: {
    id: 'light',
    label: 'Clean Light',
    description: 'Bright, accessible workspace',
    bodyClass: 'light theme-light',
    bg: 'bg-[#f8fafc]',
    text: 'text-slate-900',
  },
  tactical: {
    id: 'tactical',
    label: 'SOC Tactical',
    description: 'Cyber operations HUD',
    bodyClass: 'dark theme-tactical',
    bg: 'bg-[#030712]',
    text: 'text-slate-100',
  },
};


export default function App() {
  const [scenarioId, setScenarioId] = useState('slow_scan');
  const [stepIndex, setStepIndex] = useState(SCENARIOS.slow_scan.initialStep);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMitigated, setIsMitigated] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [liveApiData, setLiveApiData] = useState(null);

  // Live Hardware Interface Sniffer State
  const [isSnifferActive, setIsSnifferActive] = useState(false);
  const [snifferStats, setSnifferStats] = useState(null);

  // Theme & UI State
  const [themeId, setThemeId] = useState('professional');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(false);

  const currentTheme = THEMES[themeId] || THEMES.professional;

  const fallbackData = getStepData(scenarioId, stepIndex, isMitigated);
  const baseData = liveApiData 
    ? (convertApiToStepData(liveApiData, stepIndex, isMitigated) || fallbackData)
    : fallbackData;

  // Seamlessly merge live sniffer stream into dashboard when active
  const currentData = (isSnifferActive && snifferStats) ? {
    ...baseData,
    ingestRate: snifferStats.ingest_rate || baseData.ingestRate,
    infiltrationProb: snifferStats.latest_prediction?.p_alarm ?? baseData.infiltrationProb,
    riskTier: snifferStats.latest_prediction?.risk_tier || baseData.riskTier,
    leadTimeMinutes: snifferStats.latest_prediction?.lead_time || baseData.leadTimeMinutes,
    forecast: snifferStats.latest_prediction?.forecast_trajectory || baseData.forecast,
    packetLogs: snifferStats.latest_packets && snifferStats.latest_packets.length > 0
      ? snifferStats.latest_packets.map((pkt, idx) => ({
          id: pkt.flow_id || `LIVE-${idx}`,
          timestamp: pkt.time || new Date().toLocaleTimeString(),
          protocol: pkt.proto || 'TCP',
          srcIp: pkt.src || '127.0.0.1',
          dstPort: pkt.port || 443,
          tcpFlags: pkt.flags || '[SYN, ACK]',
          ttl: pkt.ttl || 64,
          windowSize: 64240,
          entropy: '3.42 bits',
          threatLabel: pkt.label || 'Live Ingress'
        }))
      : baseData.packetLogs
  } : baseData;
  const scenarioConfig = currentData.scenario || SCENARIOS[scenarioId] || SCENARIOS.slow_scan;

  const prevRiskTierRef = useRef(currentData.riskTier);

  // Sync theme with document root
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Clear all theme classes
    root.classList.remove('light', 'dark', 'theme-professional', 'theme-light', 'theme-tactical');
    body.classList.remove('light', 'dark', 'theme-professional', 'theme-light', 'theme-tactical');
    
    // Apply new theme classes
    const classes = currentTheme.bodyClass.split(' ');
    classes.forEach(cls => {
      root.classList.add(cls);
      body.classList.add(cls);
    });
  }, [themeId, currentTheme.bodyClass]);

  // Audio alert on critical threat spike
  useEffect(() => {
    if (currentData.riskTier === 'Critical' && prevRiskTierRef.current !== 'Critical' && !isMitigated) {
      cyberSound.playAlert();
    }
    prevRiskTierRef.current = currentData.riskTier;
  }, [currentData.riskTier, isMitigated]);

  // Live Ingest Ticking Loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setStepIndex((prevStep) => {
          if (prevStep >= scenarioConfig.maxSteps) return 0;
          return prevStep + 1;
        });
      }, 1200 / playbackSpeed);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, playbackSpeed, scenarioConfig.maxSteps]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Poll Live Packet Sniffer when enabled
  useEffect(() => {
    let pollInterval = null;
    if (isSnifferActive) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/sniffer/status');
          if (res.ok) {
            const data = await res.json();
            setSnifferStats(data);
          }
        } catch (err) {
          console.warn('Sniffer poll error:', err);
        }
      }, 1000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isSnifferActive]);

  const handleToggleSniffer = async () => {
    cyberSound.playClick();
    if (!isSnifferActive) {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/sniffer/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (res.ok) {
          setIsSnifferActive(true);
        }
      } catch (e) {
        console.error('Failed to start sniffer:', e);
      }
    } else {
      try {
        await fetch('http://127.0.0.1:8000/api/sniffer/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      } catch (e) {
        console.error('Failed to stop sniffer:', e);
      }
      setIsSnifferActive(false);
    }
  };

  // Theme cycling: professional → light → tactical → professional
  const handleCycleTheme = () => {
    const order = ['professional', 'light', 'tactical'];
    const idx = order.indexOf(themeId);
    setThemeId(order[(idx + 1) % order.length]);
  };

  const handleSelectScenario = (id) => {
    setLiveApiData(null);
    setScenarioId(id);
    const targetSc = SCENARIOS[id] || SCENARIOS.slow_scan;
    setStepIndex(targetSc.initialStep);
    setIsMitigated(false);
  };

  const handleReset = () => {
    setStepIndex(0);
    setIsPlaying(false);
    setIsMitigated(false);
  };

  const handleFileParsed = (fileName, apiResult) => {
    if (apiResult && apiResult.timeline && apiResult.timeline.length > 0) {
      setLiveApiData(apiResult);
      const flaggedIdx = apiResult.timeline.findIndex(t => t.flagged);
      setStepIndex(flaggedIdx >= 0 ? Math.max(0, flaggedIdx - 1) : 0);
    } else {
      setLiveApiData(null);
      setScenarioId('syn_flood');
      setStepIndex(8);
    }
    setIsPlaying(true);
  };

  return (
    <HashRouter>
      <div className={`min-h-screen transition-colors duration-400 ${currentTheme.bg} ${currentTheme.text} font-inter relative`}>

        {/* ===== ANIMATED BACKGROUND LAYERS ===== */}
        {themeId !== 'light' && (
          <>
            <div className={`fixed -top-32 left-1/5 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none animate-blob-1 ${
              themeId === 'tactical' ? 'bg-cyan-500/8' : 'bg-indigo-500/6'
            }`} />
            <div className={`fixed -bottom-40 right-1/4 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none animate-blob-2 ${
              themeId === 'tactical' ? 'bg-indigo-600/10' : 'bg-violet-500/5'
            }`} />
            <div className={`fixed top-1/3 right-10 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none animate-blob-3 ${
              themeId === 'tactical' ? 'bg-emerald-600/6' : 'bg-blue-500/4'
            }`} />
          </>
        )}
        {themeId === 'light' && (
          <>
            <div className="fixed -top-32 left-1/5 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none animate-blob-1 bg-sky-400/10" />
            <div className="fixed -bottom-40 right-1/4 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none animate-blob-2 bg-indigo-400/10" />
          </>
        )}

        {/* Grid Overlay (only tactical & professional) */}
        {themeId !== 'light' && (
          <div className={`fixed inset-0 cyber-grid pointer-events-none z-0 ${
            themeId === 'tactical' ? 'opacity-20' : 'opacity-8'
          }`} />
        )}

        {/* Optional Scanlines (tactical only) */}
        {scanlinesEnabled && themeId === 'tactical' && (
          <div className="fixed inset-0 scanlines z-40 opacity-20 pointer-events-none" />
        )}

        {/* ===== SIDEBAR (Desktop only) ===== */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentStep={stepIndex}
          maxSteps={scenarioConfig.maxSteps}
          ingestRate={currentData.ingestRate}
          riskTier={currentData.riskTier}
          isMitigated={isMitigated}
          themeId={themeId}
        />

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className={`transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-[260px]'
        }`}>

          {/* HEADER */}
          <div className="sticky top-0 z-50 px-3 sm:px-5 pt-3 pb-1">
            <Header
              scenarioId={scenarioId}
              onSelectScenario={handleSelectScenario}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onReset={handleReset}
              currentStep={stepIndex}
              maxSteps={scenarioConfig.maxSteps}
              ingestRate={currentData.ingestRate}
              isMitigated={isMitigated}
              onToggleMitigation={() => setIsMitigated(!isMitigated)}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              themeId={themeId}
              themes={THEMES}
              onCycleTheme={handleCycleTheme}
              onSelectTheme={setThemeId}
              scanlinesEnabled={scanlinesEnabled}
              onToggleScanlines={() => setScanlinesEnabled(!scanlinesEnabled)}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              isSnifferActive={isSnifferActive}
              onToggleSniffer={handleToggleSniffer}
              snifferStats={snifferStats}
            />
          </div>

          {/* MAIN PAGE CONTENT */}
          <main className="px-3 sm:px-5 py-4 min-h-[calc(100vh-200px)]">
            <div className="max-w-[1440px] mx-auto">

              <Breadcrumbs
                riskTier={currentData.riskTier}
                isMitigated={isMitigated}
                currentStep={stepIndex}
                ingestRate={currentData.ingestRate}
              />

              {/* Route-based page transitions — key changes on path only, not on every tick */}
              <AppRoutes
                scenarioId={scenarioId}
                stepIndex={stepIndex}
                setStepIndex={setStepIndex}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                isMitigated={isMitigated}
                setIsMitigated={setIsMitigated}
                currentData={currentData}
                scenarioConfig={scenarioConfig}
                setIsUploadModalOpen={setIsUploadModalOpen}
                isSnifferActive={isSnifferActive}
                handleToggleSniffer={handleToggleSniffer}
                snifferStats={snifferStats}
              />

              <Footer
                currentStep={stepIndex}
                maxSteps={scenarioConfig.maxSteps}
                isMitigated={isMitigated}
              />
            </div>
          </main>
        </div>

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onFileParsed={handleFileParsed}
        />
      </div>
    </HashRouter>
  );
}

// =========================================================================
// ROUTE COMPONENT — Separated to use useLocation for AnimatePresence keying
// The key here is location.pathname so pages only animate on ROUTE CHANGE,
// not on every state update (timer tick, etc.) which caused the blinking.
// =========================================================================
function AppRoutes({
  scenarioId, stepIndex, setStepIndex,
  isPlaying, setIsPlaying,
  playbackSpeed, setPlaybackSpeed,
  isMitigated, setIsMitigated,
  currentData, scenarioConfig,
  setIsUploadModalOpen,
  isSnifferActive, handleToggleSniffer, snifferStats
}) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.2 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route
            path="/"
            element={
              <div className="space-y-6">
                <TimeScrubber
                  currentStep={stepIndex}
                  maxSteps={scenarioConfig.maxSteps}
                  onStepChange={setStepIndex}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  playbackSpeed={playbackSpeed}
                  onSpeedChange={setPlaybackSpeed}
                />
                <MitigationControl
                  isMitigated={isMitigated}
                  onToggleMitigation={() => setIsMitigated(!isMitigated)}
                  riskTier={currentData.riskTier}
                />
                <HeroForecastWidget
                  historical={currentData.historical}
                  forecast={currentData.forecast}
                  infiltrationProb={currentData.infiltrationProb}
                  riskTier={currentData.riskTier}
                  scenarioName={scenarioConfig.name}
                  leadTimeMinutes={currentData.leadTimeMinutes}
                  baselineRisk={currentData.baselineRisk}
                  isMitigated={isMitigated}
                />
                <MitreMatrix
                  mitreStages={currentData.mitreStages}
                  mitreTechniques={scenarioConfig.mitreTechniques}
                  isMitigated={isMitigated}
                  shapFeatures={currentData.shapFeatures}
                  attentionWeights={currentData.attentionWeights}
                  scenarioName={scenarioConfig.name}
                />
                <ExplainableShapCard
                  shapFeatures={currentData.shapFeatures}
                  attentionWeights={currentData.attentionWeights}
                  isMitigated={isMitigated}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <NetworkTopologyMap
                    nodes={currentData.nodes}
                    activeLinks={currentData.activeLinks}
                    isMitigated={isMitigated}
                  />
                  <TelemetryTerminal
                    packetLogs={currentData.packetLogs}
                    ingestRate={currentData.ingestRate}
                  />
                </div>
              </div>
            }
          />
          {/* DEDICATED FULL-SCREEN PAGES */}
          <Route 
            path="/zero-trust-attention" 
            element={
              <ZeroTrustAttentionView 
                currentData={currentData} 
                isMitigated={isMitigated} 
                onToggleMitigation={() => setIsMitigated(!isMitigated)} 
                scenarioConfig={scenarioConfig} 
              />
            } 
          />
          <Route 
            path="/topology" 
            element={
              <TopologyExplorerView 
                currentData={currentData} 
                isMitigated={isMitigated} 
                onToggleMitigation={() => setIsMitigated(!isMitigated)} 
              />
            } 
          />
          <Route 
            path="/telemetry-stream" 
            element={
              <DualTierTelemetryStreamView 
                currentData={currentData} 
                isSnifferActive={isSnifferActive} 
                onToggleSniffer={handleToggleSniffer} 
                snifferStats={snifferStats} 
              />
            } 
          />
          <Route 
            path="/mitre-matrix" 
            element={
              <MitreMatrixFullscreenView 
                currentData={currentData} 
                isMitigated={isMitigated} 
                scenarioConfig={scenarioConfig} 
              />
            } 
          />

          {/* ADDITIONAL SOC OPERATIONAL VIEWS */}
          <Route path="/architecture" element={<WorldModelArchitectureView />} />
          <Route path="/benchmarks" element={<BenchmarksEvaluationView />} />
          <Route path="/critical-sectors" element={<NciipcCriticalSectorsView />} />
          <Route path="/mitigation" element={
            <MitigationCenterView isMitigated={isMitigated} onToggleMitigation={() => setIsMitigated(!isMitigated)} currentData={currentData} />
          } />
          <Route path="/forensics" element={
            <ForensicExportView currentData={currentData} scenarioConfig={scenarioConfig} isMitigated={isMitigated} />
          } />
          <Route path="/settings" element={
            <SettingsIngestionView onOpenUploadModal={() => setIsUploadModalOpen(true)} />
          } />
          <Route path="/analytics" element={
            <AnalyticsHistoryView currentData={currentData} scenarioId={scenarioId} />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

