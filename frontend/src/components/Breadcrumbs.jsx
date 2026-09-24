import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Home,
  AlertTriangle,
  Shield,
  Clock,
  Activity
} from 'lucide-react';

const routeMap = {
  '/': { label: 'Command HUD', icon: Home },
  '/architecture': { label: 'World Model Architecture', icon: null },
  '/benchmarks': { label: 'Benchmarks & Evaluation', icon: null },
  '/topology': { label: 'Topology Explorer', icon: null },
  '/critical-sectors': { label: 'NCIIPC Critical Sectors', icon: null },
  '/mitigation': { label: 'SOAR Defense Center', icon: null },
  '/forensics': { label: 'Forensic Audit Lab', icon: null },
  '/settings': { label: 'Dataset Ingestion', icon: null },
  '/analytics': { label: 'Analytics Radar', icon: null },
};

export default function Breadcrumbs({ riskTier, isMitigated, currentStep, ingestRate }) {
  const location = useLocation();
  const currentRoute = routeMap[location.pathname] || { label: 'Unknown' };
  const isHome = location.pathname === '/';

  const riskConfig = {
    Critical: {
      label: 'CRITICAL',
      cls: 'status-badge-critical',
      icon: AlertTriangle,
    },
    Warning: {
      label: 'WARNING',
      cls: 'status-badge-warning',
      icon: AlertTriangle,
    },
    Normal: {
      label: 'NORMAL',
      cls: 'status-badge-safe',
      icon: Shield,
    }
  };

  const risk = riskConfig[riskTier] || riskConfig.Normal;
  const RiskIcon = risk.icon;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5 px-1">
      {/* Breadcrumb Path */}
      <div className="flex items-center gap-1.5 text-xs font-mono">
        <Link to="/" className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1">
          <Home className="w-3 h-3" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        {!isHome && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-200 font-semibold">{currentRoute.label}</span>
          </>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-2">
        {/* Risk Badge */}
        <span className={`status-badge ${risk.cls}`}>
          <RiskIcon className="w-3 h-3" />
          {risk.label}
        </span>

        {/* Mitigation Badge */}
        {isMitigated && (
          <span className="status-badge status-badge-safe">
            <Shield className="w-3 h-3" />
            MITIGATED
          </span>
        )}

        {/* Mobile Telemetry (visible on sm screens only) */}
        <div className="flex items-center gap-2 sm:hidden">
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
            <Activity className="w-3 h-3" />
            {ingestRate.toLocaleString()}/s
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
            <Clock className="w-3 h-3" />
            t={currentStep}
          </span>
        </div>
      </div>
    </div>
  );
}
