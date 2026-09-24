import React, { useState } from 'react';
import { 
  Shield, 
  Server, 
  Database, 
  Laptop, 
  KeyRound, 
  Radio, 
  AlertOctagon, 
  CheckCircle,
  Activity,
  X,
  Lock,
  Network
} from 'lucide-react';
import { cyberSound } from '../utils/soundEffects';

export default function NetworkTopologyMap({
  nodes = [],
  activeLinks = [],
  isMitigated = false
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Industry-Standard 4-Zone Enterprise Architecture (NIST SP 800-207 Zero-Trust & Purdue Model)
  // Layout: Left-to-Right progression with non-overlapping hierarchical coordinates
  const nodePositions = {
    ext_gw: { x: 60, y: 140, icon: Shield, zone: "PERIMETER" },
    web_srv: { x: 175, y: 140, icon: Server, zone: "DMZ" },
    db_srv: { x: 300, y: 90, icon: Database, zone: "INTERNAL CORE" },
    admin_pc: { x: 300, y: 200, icon: Laptop, zone: "MANAGEMENT" },
    domain_ctrl: { x: 440, y: 140, icon: KeyRound, zone: "TIER-0 IDENTITY" }
  };

  // Defensible Enterprise Links:
  // - Perimeter -> DMZ
  // - DMZ -> Core Database (via Internal Firewall)
  // - Admin Bastion manages Web & Database
  // - Active Directory (Tier 0) communicates ONLY with Admin Bastion via Kerberos/LDAP (No direct web/DB link!)
  const linkCoordinates = [
    { from: "ext_gw", to: "web_srv", id: "ext_gw-web_srv", label: "α=0.94 (WAF Ingress)", type: "ingress" },
    { from: "web_srv", to: "db_srv", id: "web_srv-db_srv", label: "α=0.88 (mTLS / SQL)", type: "internal" },
    { from: "admin_pc", to: "web_srv", id: "admin_pc-web_srv", label: "α=0.62 (SSH Bastion)", type: "mgmt" },
    { from: "admin_pc", to: "db_srv", id: "admin_pc-db_srv", label: "α=0.71 (DBA Session)", type: "mgmt" },
    { from: "admin_pc", to: "domain_ctrl", id: "admin_pc-domain_ctrl", label: "α=0.96 (Kerberos / T0)", type: "identity" }
  ];

  const zones = [
    { name: "ZONE 0: PERIMETER", x: 20, y: 30, width: 85, height: 220, color: "rgba(14, 165, 233, 0.08)", border: "rgba(14, 165, 233, 0.25)" },
    { name: "ZONE 1: DMZ", x: 130, y: 30, width: 90, height: 220, color: "rgba(245, 158, 11, 0.06)", border: "rgba(245, 158, 11, 0.2)" },
    { name: "ZONE 2: SECURE INTERNAL CORE", x: 245, y: 30, width: 115, height: 220, color: "rgba(16, 185, 129, 0.06)", border: "rgba(16, 185, 129, 0.2)" },
    { name: "ZONE 3: TIER-0 IDENTITY", x: 385, y: 30, width: 115, height: 220, color: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.25)" }
  ];

  return (
    <div className="glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 relative overflow-hidden flex flex-col justify-between h-full min-h-[410px]">
      
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400 light:text-cyan-600 animate-pulse" />
          <div>
            <h2 className="text-base font-bold text-slate-100 light:text-slate-900 font-orbitron tracking-wide flex items-center gap-2">
              <span>ZERO-TRUST TOPOLOGY & ATTENTION</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                NIST SP 800-207
              </span>
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-600 font-mono">
              GATv2 Spatial Attention on Dynamic Edge-Attributed Enclaves
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-[11px] font-mono text-slate-300 light:text-slate-700 font-bold">
          <Activity className="w-3 h-3 text-emerald-400 light:text-emerald-600" />
          <span>5 Nodes • 4 Security Zones</span>
        </span>
      </div>

      {/* Interactive SVG Topology Graph with Enterprise Zone Enclaves */}
      <div className="relative w-full h-[280px] bg-slate-950/95 light:bg-slate-50 rounded-xl border border-slate-800/90 light:border-slate-300 overflow-hidden flex items-center justify-center shadow-inner">
        
        {/* Subtle Cyber Grid Background */}
        <div className="absolute inset-0 cyber-grid-dots opacity-30 pointer-events-none" />

        <svg className="w-full h-full z-10" viewBox="0 0 520 270">
          
          {/* Defs for Glows and Gradients */}
          <defs>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Security Enclave Zones */}
          {zones.map((z, idx) => (
            <g key={idx}>
              <rect
                x={z.x}
                y={z.y}
                width={z.width}
                height={z.height}
                rx="8"
                fill={z.color}
                stroke={z.border}
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <text
                x={z.x + 8}
                y={z.y + 14}
                fill="#94a3b8"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.5"
              >
                {z.name}
              </text>
            </g>
          ))}

          {/* Render Connections / Edge Lines */}
          {linkCoordinates.map((link) => {
            const p1 = nodePositions[link.from];
            const p2 = nodePositions[link.to];
            const isThreatLink = !isMitigated && activeLinks.some(
              al => (al.source === link.from && al.target === link.to) || (al.source === link.to && al.target === link.from)
            );

            // Midpoint with calculated orthogonal offset to prevent label collision
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - (link.id.includes("admin_pc-web_srv") ? 10 : 6);

            return (
              <g key={link.id}>
                {/* Edge Path Line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isThreatLink ? "#EF4444" : "#334155"}
                  strokeWidth={isThreatLink ? 2.5 : 1.5}
                  strokeDasharray={isThreatLink ? "6 3" : ""}
                  className={isThreatLink ? "animate-pulse" : ""}
                />

                {/* GATv2 Attention Tag with dark background pill */}
                <rect
                  x={midX - 32}
                  y={midY - 7}
                  width="64"
                  height="12"
                  rx="3"
                  fill="#030712"
                  stroke={isThreatLink ? "rgba(239,68,68,0.5)" : "rgba(51,65,85,0.6)"}
                  strokeWidth="0.8"
                />
                <text
                  x={midX}
                  y={midY + 2}
                  textAnchor="middle"
                  fill={isThreatLink ? "#f87171" : "#94a3b8"}
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {link.label}
                </text>

                {/* Animated Packet Moving Along Edge */}
                <circle r={isThreatLink ? 4 : 2.5} fill={isThreatLink ? "#EF4444" : "#00F0FF"} filter={isThreatLink ? "url(#glowRed)" : "url(#glowCyan)"}>
                  <animateMotion
                    path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    dur={isThreatLink ? "1.4s" : "3.2s"}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            const Icon = pos.icon;

            let strokeColor = "#1E293B";
            let fillColor = "#080F24";
            let iconColor = "#94A3B8";

            if (node.status === 'critical') {
              strokeColor = "#EF4444";
              fillColor = "#2A0A0E";
              iconColor = "#EF4444";
            } else if (node.status === 'compromised') {
              strokeColor = "#F59E0B";
              fillColor = "#2A1A05";
              iconColor = "#F59E0B";
            } else if (node.status === 'warning') {
              strokeColor = "#00F0FF";
              fillColor = "#0A1E2B";
              iconColor = "#00F0FF";
            } else if (node.status === 'normal') {
              strokeColor = "#10B981";
              fillColor = "#0A1F18";
              iconColor = "#10B981";
            }

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => { cyberSound.playClick(); setSelectedNode(node); }}
              >
                {/* Threat Pulse Ring */}
                {node.status === 'critical' && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    className="animate-ping"
                    opacity="0.6"
                  />
                )}

                {/* Node Outer Circle */}
                <circle
                  r="19"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="2"
                  className="transition-all duration-300 group-hover:scale-110"
                />

                {/* Node Icon */}
                <foreignObject x="-10" y="-10" width="20" height="20">
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                </foreignObject>

                {/* Label Cleanly Placed with background contrast pill */}
                <text
                  y="28"
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.label}
                </text>
                <text
                  y="37"
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  {node.ip}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Node Inspector Card overlay (Hover or Click) */}
        {(selectedNode || hoveredNode) && (
          <div className="absolute bottom-2.5 left-2.5 bg-slate-950/95 light:bg-white border border-cyan-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs z-20 max-w-xs animate-fadeIn">
            <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-2">
                {(selectedNode || hoveredNode).status === 'critical' ? (
                  <AlertOctagon className="w-4 h-4 text-red-400 animate-bounce" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                <h4 className="font-bold text-slate-100 light:text-slate-900 font-orbitron text-xs">{(selectedNode || hoveredNode).label}</h4>
              </div>
              {selectedNode && (
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Security Zone: <strong className="text-cyan-300">{nodePositions[(selectedNode || hoveredNode).id]?.zone || "CORE"}</strong></p>
            <p className="text-[11px] text-slate-400">IP Enclave: <strong className="text-slate-200">{(selectedNode || hoveredNode).ip}</strong></p>
            <p className="text-[11px] text-slate-400">Protocol: <strong className="text-amber-300">{(selectedNode || hoveredNode).protocol || "TCP/IP"}</strong></p>
            <p className="text-[11px] text-slate-400">GNN Spatial Attention: <strong className="text-emerald-400">α = {(selectedNode || hoveredNode).gnnWeight || 0.88}</strong></p>
            <p className="text-[11px] text-slate-400 mt-1">Status: <strong className={(selectedNode || hoveredNode).status === 'critical' ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400'}>{(selectedNode || hoveredNode).status.toUpperCase()}</strong></p>
          </div>
        )}

      </div>

      {/* Legend & Compliance Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Normal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Inspected</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Lateral Probe</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Infiltration Path</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Lock className="w-3 h-3 text-cyan-400" />
          <span>Zero-Trust Tiered Enclaves (No Direct DMZ-to-T0 Link)</span>
        </div>
      </div>

    </div>
  );
}
