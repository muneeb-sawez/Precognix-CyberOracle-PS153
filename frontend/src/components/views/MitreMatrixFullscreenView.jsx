import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  X, 
  Brain, 
  Layers, 
  Activity, 
  Globe,
  Crosshair,
  FileText,
  Zap,
  Info
} from 'lucide-react';
import { cyberSound } from '../../utils/soundEffects';

const getAptProfile = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('scada') || n.includes('modbus') || n.includes('power')) {
    return {
      actor: 'Sandworm / FROZENBARENTS (Unit 74455)',
      targetSector: 'Power Grid SCADA / Modbus OT',
      certInRef: 'NCIIPC Alert NCIIPC-2024-POW-03',
      confidence: 96.2,
      c2Pattern: 'Industroyer2 / Modbus FC 0x05 Sideload',
      origin: 'Critical Infrastructure Cyber-Warfare'
    };
  }
  if (n.includes('bgp') || n.includes('telecom')) {
    return {
      actor: 'APT41 (Winnti Group / Double Dragon)',
      targetSector: 'Telecom & Carrier Peering',
      certInRef: 'CERT-In CIAD-2024-0041',
      confidence: 94.8,
      c2Pattern: 'BGP Hijacking + Mirai C2 Mesh',
      origin: 'State-Sponsored Threat Group'
    };
  }
  if (n.includes('botnet') || n.includes('ctu-13') || n.includes('neris')) {
    return {
      actor: 'Lazarus Group / Hidden Cobra',
      targetSector: 'BFSI & Defense Enclaves',
      certInRef: 'CERT-In Advisory CIAD-2023-0182',
      confidence: 91.5,
      c2Pattern: 'CTU-13 Neris Fast-Flux DGA',
      origin: 'State-Sponsored Espionage'
    };
  }
  return {
    actor: 'APT-41 (Dynamic State Infiltration)',
    targetSector: 'Multi-Sector Enterprise Backbone',
    certInRef: 'CERT-In Alert CIAD-2024-F09',
    confidence: 94.2,
    c2Pattern: 'Low-and-Slow SMB Infiltration + C2 Beaconing',
    origin: 'Advanced Persistent Threat'
  };
};

export default function MitreMatrixFullscreenView({ currentData, isMitigated, scenarioConfig }) {
  const [selectedTech, setSelectedTech] = useState(null);
  const scenarioName = scenarioConfig?.name || 'Low-and-Slow Recon → Lateral SMB Spread';
  const apt = getAptProfile(scenarioName);

  // Full 7 Tactical Progression Columns
  const tacticalColumns = [
    {
      tactic: "Reconnaissance",
      id: "TA0043",
      status: "Completed",
      leadTime: "T - 50s",
      probability: 99.4,
      techniques: [
        { id: "T1595.001", name: "Port Scanning", desc: "Sequential and SYN port sweeps across enterprise DMZ gateways.", detection: "Abnormal SYN flag ratio (>60%)" },
        { id: "T1595.002", name: "Vulnerability Scanning", desc: "Automated probing of vulnerable web services and unpatched services.", detection: "Surge in high-frequency GET requests" },
        { id: "T1590", name: "Gather Network Info", desc: "Enumerating IP subnet allocations and domain controller records.", detection: "High DNS query velocity" }
      ]
    },
    {
      tactic: "Initial Access",
      id: "TA0001",
      status: currentData?.riskTier === 'Critical' ? "Active" : "Anticipated",
      leadTime: "T - 20s",
      probability: 94.2,
      techniques: [
        { id: "T1190", name: "Exploit Public Application", desc: "Leveraging CVE-2021-44228 / RCE vulnerability on DMZ reverse proxy.", detection: "Abnormal payload length distribution" },
        { id: "T1133", name: "External Remote Services", desc: "Unauthorized authentication attempts on exposed VPN and RDP gateways.", detection: "Repeated authentication failures" },
        { id: "T1078", name: "Valid Accounts Abuse", desc: "Using compromised credentials harvested during initial reconnaissance.", detection: "Geo-velocity login anomaly" }
      ]
    },
    {
      tactic: "Execution",
      id: "TA0002",
      status: "Predicted Horizon",
      leadTime: "T + 10s (World Model)",
      probability: 88.5,
      techniques: [
        { id: "T1059.001", name: "PowerShell Ingestion", desc: "Executing fileless memory stagers via encoded PowerShell commands.", detection: "Process spawned from w3wp.exe" },
        { id: "T1059.003", name: "Windows Command Shell", desc: "Spawning interactive cmd.exe subshells for post-exploitation staging.", detection: "Unusual parent-child process tree" }
      ]
    },
    {
      tactic: "Lateral Movement",
      id: "TA0008",
      status: "Predicted Horizon",
      leadTime: "T + 30s (World Model)",
      probability: 84.1,
      techniques: [
        { id: "T1021.002", name: "SMB/Windows Admin Shares", desc: "Spreading lateral payloads using EternalBlue (MS17-010) over port 445.", detection: "Surge in port 445 cross-subnet flows" },
        { id: "T1021.001", name: "Remote Desktop Protocol", desc: "Attempting RDP session hijacking across internal workstations.", detection: "Port 3389 internal traversal" }
      ]
    },
    {
      tactic: "Command & Control",
      id: "TA0011",
      status: "Anticipated Horizon",
      leadTime: "T + 40s (World Model)",
      probability: 79.8,
      techniques: [
        { id: "T1071.001", name: "Web Protocols (DoH)", desc: "Exfiltrating heartbeats over DNS-over-HTTPS (DoH) encrypted channels.", detection: "Periodic low-volume beacon cadence" },
        { id: "T1071.004", name: "IRC / Non-Standard C2", desc: "Custom encrypted beacon protocol over port 6667 or raw TCP sockets.", detection: "Non-standard high port egress" }
      ]
    },
    {
      tactic: "Exfiltration",
      id: "TA0010",
      status: "Pre-Empted",
      leadTime: "T + 50s (World Model)",
      probability: 65.4,
      techniques: [
        { id: "T1048.003", name: "Exfiltration Over Protocol", desc: "Tunneling sensitive enterprise records over encrypted SSH / WebDAV pipes.", detection: "Sustained high egress bandwidth" },
        { id: "T1567", name: "Exfil to Cloud Storage", desc: "Micro-burst upload of confidential archives to untrusted cloud buckets.", detection: "S3 API egress volume surge" }
      ]
    },
    {
      tactic: "Impact (DoS/DDoS)",
      id: "TA0040",
      status: "Containment Enforced",
      leadTime: "T + 60s (World Model)",
      probability: 48.2,
      techniques: [
        { id: "T1498.001", name: "SYN Flood Volumetric", desc: "Saturating gateway state tables with spoofed TCP SYN requests.", detection: "SYN arrival rate >15,000 pps" },
        { id: "T1486", name: "Data Encrypted for Impact", desc: "Cryptographic locking of internal databases and volume backups.", detection: "Rapid file rename and disk I/O burst" }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-inter">

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 glass-card tactical-card rounded-2xl border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Crosshair className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300">
                MITRE ATT&CK® KILL-CHAIN PROGRESSION MATRIX (v19)
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                NTRO Multi-Class Tactical Stage Head · Enterprise Matrix v19 · Pre-Emptive Horizon Anticipation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
            Current Stage: <strong className="text-cyan-300">Initial Access</strong>
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
            Next Predicted: <strong className="text-amber-400">Lateral Movement</strong>
          </span>
        </div>
      </div>

      {/* Threat Actor Threat Intelligence Dossier Bar */}
      <div className="glass-card tactical-card p-4 rounded-2xl border border-cyan-500/20 font-mono text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Attributed Adversary</span>
            <span className="text-sm font-bold text-slate-100 mt-1 block">{apt.actor}</span>
            <span className="text-[10px] text-slate-400">{apt.origin}</span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Target Critical Sector</span>
            <span className="text-sm font-bold text-cyan-300 mt-1 block">{apt.targetSector}</span>
            <span className="text-[10px] text-slate-400">NCIIPC Protected Entity</span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">National Advisory</span>
            <span className="text-sm font-bold text-indigo-300 mt-1 block">{apt.certInRef}</span>
            <span className="text-[10px] text-emerald-400">Confidence: {apt.confidence}%</span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">C2 Infrastructure Signature</span>
            <span className="text-sm font-bold text-amber-300 mt-1 block truncate">{apt.c2Pattern}</span>
            <span className="text-[10px] text-slate-400">Telemetry IoC Correlation</span>
          </div>
        </div>
      </div>

      {/* FULL ENTERPRISE MATRIX 7-COLUMN DECK */}
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-7 gap-3.5 min-w-[1280px]">
          {tacticalColumns.map((col, idx) => {
            const isActive = col.status.includes('Active');
            const isPredicted = col.status.includes('Predicted');

            return (
              <div 
                key={col.id} 
                className={`rounded-2xl border p-3 flex flex-col justify-between transition-all ${
                  isActive 
                    ? 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-rose-500/30'
                    : isPredicted
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <div>
                  {/* Column Header */}
                  <div className="border-b border-slate-800 pb-2.5 mb-3 font-mono">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>{col.id}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-rose-500/20 text-rose-300' : isPredicted ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {col.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold font-orbitron text-slate-100">{col.tactic}</h3>
                    <div className="text-[10px] text-cyan-400 mt-1 flex items-center justify-between">
                      <span>Lead Time:</span>
                      <strong>{col.leadTime}</strong>
                    </div>
                  </div>

                  {/* Technique Cards List */}
                  <div className="space-y-2">
                    {col.techniques.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => { cyberSound.playClick(); setSelectedTech({ ...t, tactic: col.tactic }); }}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all font-mono"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold text-cyan-300">{t.id}</span>
                          <span>🔍 Details</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 line-clamp-1">{t.name}</div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 text-center">
                  Stage Probability: <strong className="text-slate-300">{col.probability}%</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technique Modal Inspector */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-cyan-500/40 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest">{selectedTech.tactic} Tactical Vector</span>
                <h3 className="text-base font-bold text-slate-100 font-orbitron">{selectedTech.id}: {selectedTech.name}</h3>
              </div>
              <button onClick={() => setSelectedTech(null)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Adversary Procedure Description</span>
                <p className="mt-1 leading-relaxed">{selectedTech.desc}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">World Model Telemetry Indicator</span>
                <p className="mt-1 text-cyan-300 font-semibold">{selectedTech.detection}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Closed-Loop Countermeasure</span>
                <p className="mt-1 text-emerald-400 font-semibold">
                  Deploy dynamic firewall rule & stage microsegment air-gap isolation before packet window expiration.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTech(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Close Technique Inspector
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
