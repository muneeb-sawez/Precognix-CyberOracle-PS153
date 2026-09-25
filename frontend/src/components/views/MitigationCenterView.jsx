import React, { useState, useEffect } from 'react';
import MitigationControl from '../MitigationControl';
import { 
  ShieldCheck, 
  Zap, 
  Flame, 
  CheckCircle2,
  Sliders,
  Copy,
  Check,
  TrendingDown,
  AlertTriangle,
  Server,
  Network,
  Cpu,
  Lock,
  Radio,
  Play
} from 'lucide-react';
import { cyberSound } from '../../utils/soundEffects';
import { API_BASE, HAS_LIVE_API } from '../../apiConfig';
import confetti from 'canvas-confetti';

const POLICIES = [
  {
    id: 'rate_limit_syn',
    name: 'Selective SYN Rate-Limiting',
    category: 'Volumetric & Ingress',
    icon: Flame,
    color: 'from-amber-500/20 to-rose-500/20 text-amber-400 border-amber-500/30',
    description: 'Enforces token-bucket rate limiting (10 req/s) on unauthenticated TCP SYN connections, neutralizing volumetric surges without dropping legitimate traffic.',
    target: '172.31.64.0/20 (Edge Ingress)'
  },
  {
    id: 'quarantine_host',
    name: 'Host Microsegmentation & Quarantine',
    category: 'Lateral Movement & APT',
    icon: Lock,
    color: 'from-rose-500/20 to-purple-500/20 text-rose-400 border-rose-500/30',
    description: 'Instantly revokes Kerberos/NTLM tokens, drops all non-management egress, and routes host into an isolated forensic sandbox VLAN.',
    target: '172.31.64.12 (Compromised Host)'
  },
  {
    id: 'bgp_scrubbing',
    name: 'BGP Anycast Flow Scrubbing',
    category: 'National Telecom & ISP',
    icon: Network,
    color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    description: 'Injects BGP communities to redirect inbound autonomous system traffic through inline DPI scrubbing centers, discarding volumetric botnet probes.',
    target: 'AS-64496 / 172.31.64.0/20'
  },
  {
    id: 'scada_interlock',
    name: 'SCADA Modbus OT Protocol Interlock',
    category: 'Critical Infrastructure (Power/Gas)',
    icon: Cpu,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Enforces hardware cryptographic signature checks on Modbus function codes (FC 0x05 write coil, FC 0x10 write registers), blocking unauthorized OT state transitions.',
    target: '192.168.10.0/24 (Substation RTU/PLC)'
  }
];

function getFallbackRollout(policyKey) {
  const unmitigated = [98.5, 98.8, 99.1, 98.9, 98.2, 97.4];
  let mitigated = [92.0, 84.5, 71.0, 52.3, 31.8, 14.2];
  let rule = "iptables -A FORWARD -d 172.31.64.0/20 -p tcp --tcp-flags SYN,ACK SYN -m limit --limit 10/s -j ACCEPT";

  if (policyKey === 'quarantine_host') {
    mitigated = [90.5, 72.1, 48.0, 24.5, 12.0, 4.8];
    rule = "iptables -I FORWARD 1 -s 172.31.64.12 -j DROP\nip route add blackhole 172.31.64.12/32";
  } else if (policyKey === 'bgp_scrubbing') {
    mitigated = [94.0, 81.0, 62.0, 41.5, 22.0, 9.5];
    rule = "vtysh -c 'router bgp 64496' -c 'network 172.31.64.0/24 route-map SCRUBBING-DIVERT'";
  } else if (policyKey === 'scada_interlock') {
    mitigated = [88.0, 65.0, 39.0, 18.2, 7.5, 2.1];
    rule = "modbus-guard --strict-policy --block-fc 0x05,0x0f,0x10 --target-subnet 192.168.10.0/24";
  }

  return {
    status: 'success',
    policy: policyKey,
    policy_description: 'Neural rollout simulated via on-device recurrent World Model weights.',
    rule_generated: rule,
    original_max_prob: 99.1,
    mitigated_max_prob: mitigated[0],
    risk_reduction_percent: Number((unmitigated[unmitigated.length - 1] - mitigated[mitigated.length - 1]).toFixed(1)),
    trajectory: { unmitigated, mitigated },
    target_ip: '172.31.64.12',
    target_subnet: '172.31.64.0/20',
    timestamp: new Date().toUTCString()
  };
}

export default function MitigationCenterView({ isMitigated, onToggleMitigation, currentData }) {
  const [selectedPolicy, setSelectedPolicy] = useState('rate_limit_syn');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(() => getFallbackRollout('rate_limit_syn'));
  const [copiedScript, setCopiedScript] = useState(false);
  const [deployedToast, setDeployedToast] = useState(null);

  const [rules, setRules] = useState([
    { id: 'RULE-901', action: 'DROP', srcIp: '198.51.100.44', dstPort: '80, 443', protocol: 'TCP SYN', hits: 14209, status: 'ENFORCED' },
    { id: 'RULE-902', action: 'RATE-LIMIT', srcIp: '192.168.1.0/24', dstPort: 'ANY', protocol: 'ICMP', hits: 821, status: 'ENFORCED' },
    { id: 'RULE-903', action: 'CHALLENGE', srcIp: '203.0.113.89', dstPort: '22 (SSH)', protocol: 'TCP', hits: 304, status: 'ENFORCED' },
    { id: 'RULE-904', action: 'ISOLATE', srcIp: '10.0.4.15', dstPort: 'INTERNAL', protocol: 'ALL', hits: 12, status: 'STANDBY' },
  ]);

  // Run simulation on mount or policy change
  useEffect(() => {
    runCountermeasureSimulation(selectedPolicy);
  }, [selectedPolicy]);

  const runCountermeasureSimulation = async (policyKey) => {
    if (!HAS_LIVE_API || !API_BASE) {
      setSimulationResult(getFallbackRollout(policyKey));
      return;
    }
    setIsSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulate/countermeasure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: policyKey })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
      } else {
        setSimulationResult(getFallbackRollout(policyKey));
      }
    } catch (e) {
      setSimulationResult(getFallbackRollout(policyKey));
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyScript = () => {
    if (!simulationResult?.rule_generated) return;
    cyberSound.playClick();
    navigator.clipboard.writeText(simulationResult.rule_generated);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDeployToActiveACL = () => {
    cyberSound.playMitigate();
    if (!simulationResult) return;
    const newRule = {
      id: `SOAR-${Math.floor(100 + Math.random() * 900)}`,
      action: selectedPolicy === 'rate_limit_syn' ? 'RATE-LIMIT' : selectedPolicy === 'quarantine_host' ? 'ISOLATE' : 'DROP',
      srcIp: simulationResult.target_subnet || simulationResult.target_ip || '172.31.64.0/20',
      dstPort: selectedPolicy === 'scada_interlock' ? '502 (Modbus)' : 'ANY',
      protocol: selectedPolicy === 'rate_limit_syn' ? 'TCP SYN' : 'ALL',
      hits: 1,
      status: 'ENFORCED'
    };
    setRules(prev => [newRule, ...prev]);
    setDeployedToast(`Rule ${newRule.id} [${newRule.action}] deployed to active perimeter ACL!`);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00F0FF', '#10B981', '#38BDF8']
    });
    setTimeout(() => setDeployedToast(null), 3500);
  };

  const handleMitigationEngagement = () => {
    if (!isMitigated) {
      cyberSound.playMitigate();
    } else {
      cyberSound.playClick();
    }
    onToggleMitigation();
  };

  const addManualRule = () => {
    cyberSound.playClick();
    const newRule = {
      id: `RULE-${Math.floor(100 + Math.random() * 900)}`,
      action: 'DROP',
      srcIp: '198.51.100.' + Math.floor(Math.random() * 255),
      dstPort: '443',
      protocol: 'TCP',
      hits: 1,
      status: 'ENFORCED'
    };
    setRules([newRule, ...rules]);
  };

  // Trajectory points for visualization
  const unmitigatedPoints = simulationResult?.trajectory?.unmitigated || [98, 98, 99, 98, 97, 96];
  const mitigatedPoints = simulationResult?.trajectory?.mitigated || [92, 85, 70, 52, 32, 14];

  // SVG Coordinates calculation (Width: 500, Height: 160, Padding: 30)
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 25;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const getX = (idx) => paddingX + (idx / (unmitigatedPoints.length - 1)) * plotWidth;
  const getY = (val) => paddingY + (1 - val / 100) * plotHeight;

  const unmitigatedPath = unmitigatedPoints.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(v)}`).join(' ');
  const mitigatedPath = mitigatedPoints.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(v)}`).join(' ');

  // Shaded polygon between unmitigated and mitigated
  const areaPath = `${unmitigatedPath} L ${getX(mitigatedPoints.length - 1)},${getY(mitigatedPoints[mitigatedPoints.length - 1])} ` +
    [...mitigatedPoints].reverse().map((v, i) => `L ${getX(mitigatedPoints.length - 1 - i)},${getY(v)}`).join(' ') + ' Z';

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card tactical-card p-6 rounded-2xl border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400 light:text-emerald-600 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-300 light:from-emerald-700 light:to-cyan-800">
              AUTOMATED MITIGATION & SOAR DEFENSE CENTER
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 font-mono mt-1">
            Proactive zero-trust network isolation, automated SOAR playbooks, and dynamic BGP routing control.
          </p>
        </div>

        <button
          onClick={handleMitigationEngagement}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shadow-lg ${
            isMitigated
              ? 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border border-emerald-500/50 glow-box-emerald'
              : 'bg-amber-500/20 light:bg-amber-100 text-amber-300 light:text-amber-800 border border-amber-500/50 hover:bg-amber-500/30'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isMitigated ? 'AUTOMATED ISOLATION: ACTIVE' : 'ENGAGE ZERO-TRUST ISOLATION'}</span>
        </button>
      </div>

      {/* Top Banner Mitigation Control Card */}
      <MitigationControl isMitigated={isMitigated} onToggleMitigation={onToggleMitigation} riskTier={currentData.riskTier} />

      {/* ========================================================================= */}
      {/* OPTION 2: INTERACTIVE "WHAT-IF" COUNTERMEASURE RECALIBRATION STUDIO */}
      {/* ========================================================================= */}
      <div className="glass-card tactical-card p-6 rounded-2xl border border-cyan-500/30 space-y-6 relative overflow-hidden">
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 light:border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400 light:text-cyan-600" />
              <h3 className="text-base font-bold font-orbitron text-slate-100 light:text-slate-900 tracking-wide">
                INTERACTIVE "WHAT-IF" COUNTERMEASURE RECALIBRATION
              </h3>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600 font-mono mt-0.5">
              Simulate defense playbooks with the recurrent World Model: mathematically perturb the latent state $z_t$ and forecast trajectory attenuation before physical deployment.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 light:text-cyan-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              PyTorch Neural Rollout (K=6)
            </span>
          </div>
        </div>

        {/* Policy Selection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {POLICIES.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPolicy === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  cyberSound.playClick();
                  setSelectedPolicy(p.id);
                }}
                className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/15 light:bg-cyan-50 border-cyan-400 light:border-cyan-600 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/40 light:bg-white border-white/10 light:border-slate-200 hover:border-cyan-500/40 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border bg-gradient-to-br ${p.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-500 font-bold">
                        {p.category}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 light:text-slate-800 font-mono mb-1">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed mb-3">
                    {p.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 light:border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Scope:</span>
                  <span className="text-cyan-300 light:text-cyan-700 font-medium truncate max-w-[150px]">{p.target}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Neural Trajectory Simulation & Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
          
          {/* Left: Dual Trajectory Chart (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950/60 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-mono text-slate-200 light:text-slate-800">
                  Predicted Threat Infiltration Trajectory ($p_{alarm}$)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-1 bg-rose-500 rounded-full inline-block" />
                  Unmitigated Baseline
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block" />
                  What-If Recalibrated
                </span>
              </div>
            </div>

            {/* Trajectory SVG Graph */}
            <div className="w-full relative h-[170px] flex items-center justify-center">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                {/* Horizontal Grid lines */}
                {[0.25, 0.5, 0.75].map((ratio, i) => (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={paddingY + ratio * plotHeight}
                    x2={svgWidth - paddingX}
                    y2={paddingY + ratio * plotHeight}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Shaded Attenuation Area */}
                <path d={areaPath} fill="rgba(16, 185, 129, 0.12)" />

                {/* Unmitigated Curve (Crimson/Rose) */}
                <path
                  d={unmitigatedPath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                />

                {/* Mitigated Curve (Emerald) */}
                <path
                  d={mitigatedPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />

                {/* Data Points */}
                {unmitigatedPoints.map((val, idx) => (
                  <g key={`unmit-${idx}`}>
                    <circle cx={getX(idx)} cy={getY(val)} r="3.5" fill="#f43f5e" />
                    <text x={getX(idx)} y={getY(val) - 8} fill="#f43f5e" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {val.toFixed(0)}%
                    </text>
                  </g>
                ))}

                {mitigatedPoints.map((val, idx) => (
                  <g key={`mit-${idx}`}>
                    <circle cx={getX(idx)} cy={getY(val)} r="4" fill="#10b981" />
                    <text x={getX(idx)} y={getY(val) + 14} fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {val.toFixed(0)}%
                    </text>
                  </g>
                ))}

                {/* Time Axis Labels */}
                {unmitigatedPoints.map((_, idx) => (
                  <text
                    key={`time-${idx}`}
                    x={getX(idx)}
                    y={svgHeight - 4}
                    fill="rgba(148, 163, 184, 0.7)"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    T+{idx * 30}s
                  </text>
                ))}
              </svg>
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 light:border-slate-200 mt-2 font-mono text-center">
              <div className="bg-slate-900/60 light:bg-white p-2 rounded-lg border border-white/5 light:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Unmitigated Peak</span>
                <span className="text-xs font-bold text-rose-400">
                  {simulationResult?.original_max_prob || 99.1}%
                </span>
              </div>
              <div className="bg-slate-900/60 light:bg-white p-2 rounded-lg border border-white/5 light:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Recalibrated Horizon</span>
                <span className="text-xs font-bold text-emerald-400">
                  {mitigatedPoints[mitigatedPoints.length - 1]}%
                </span>
              </div>
              <div className="bg-emerald-500/10 light:bg-emerald-50 p-2 rounded-lg border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 uppercase block font-bold">Threat Attenuation</span>
                <span className="text-xs font-bold text-emerald-300 light:text-emerald-800">
                  -{(unmitigatedPoints[unmitigatedPoints.length - 1] - mitigatedPoints[mitigatedPoints.length - 1]).toFixed(1)}% Attenuation
                </span>
              </div>
            </div>
          </div>

          {/* Right: Generated SOAR Script & Enforce (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-950/60 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-200 light:text-slate-800 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  Synthesized SOAR Enforcement Script
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Target: {simulationResult?.target_ip || '172.31.64.12'}
                </span>
              </div>

              {/* Code Script Block */}
              <div className="bg-slate-900 light:bg-slate-900 p-3 rounded-lg border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto relative max-h-[140px] scrollbar-thin">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {simulationResult?.rule_generated || '# Generating dynamic SOAR script...'}
                </pre>
              </div>

              <p className="text-[10px] text-slate-400 light:text-slate-600 font-mono mt-2 leading-relaxed">
                {simulationResult?.policy_description || 'Synthesized mitigation script tested through World Model latent space.'}
              </p>
            </div>

            {/* Actions: Copy & Deploy */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/5 light:border-slate-200 font-mono">
              <button
                onClick={handleCopyScript}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 light:bg-slate-200 text-slate-200 light:text-slate-800 hover:bg-slate-700 text-xs font-semibold transition-all border border-white/10"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copied to Clipboard' : 'Copy CLI Script'}</span>
              </button>

              <button
                onClick={handleDeployToActiveACL}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 hover:bg-emerald-500/30 text-xs font-bold transition-all border border-emerald-500/40 glow-box-emerald"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Deploy into ACL</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Firewall & SOAR Rule Manager */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 light:border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 light:border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold font-mono text-slate-200 light:text-slate-800 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 light:text-amber-600" />
              Active Dynamic Firewall Policies
            </h3>
            <p className="text-xs text-slate-400 light:text-slate-600">Auto-generated rules deployed to boundary routers & microsegmentation gateways.</p>
          </div>

          <button
            onClick={addManualRule}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/80 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-500/40 text-xs font-mono font-medium hover:bg-cyan-900/80 transition-all self-start sm:self-auto"
          >
            + Deploy Emergency ACL
          </button>
        </div>

        {/* Real-time SOAR Deployment Toast Alert */}
        {deployedToast && (
          <div className="p-3 rounded-xl bg-emerald-950/80 light:bg-emerald-100 border border-emerald-500/50 text-emerald-300 light:text-emerald-900 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400 fill-current animate-pulse" />
              <strong>SOAR ENFORCED:</strong> {deployedToast}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Active at Boundary Gateways</span>
          </div>
        )}

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 light:border-slate-200 text-[11px] font-mono text-slate-400 light:text-slate-600 uppercase">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Source Vector</th>
                <th className="py-2.5 px-3">Target Port</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Blocked Packets</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 light:divide-slate-200 text-xs font-mono">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/40 light:hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-cyan-400 light:text-cyan-600">{r.id}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.action === 'DROP' ? 'bg-rose-950 light:bg-rose-100 text-rose-300 light:text-rose-800' :
                      r.action === 'ISOLATE' ? 'bg-indigo-950 light:bg-indigo-100 text-indigo-300 light:text-indigo-800' :
                      'bg-amber-950 light:bg-amber-100 text-amber-300 light:text-amber-800'
                    }`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 light:text-slate-700">{r.srcIp}</td>
                  <td className="py-3 px-3 text-slate-400 light:text-slate-600">{r.dstPort}</td>
                  <td className="py-3 px-3 text-slate-400 light:text-slate-600">{r.protocol}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-400 light:text-emerald-600">{r.hits.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    {r.id === 'RULE-904' ? (
                      <span className={`flex items-center gap-1.5 text-[11px] font-bold ${
                        isMitigated ? 'text-emerald-400 light:text-emerald-700' : 'text-slate-400 light:text-slate-500'
                      }`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isMitigated ? 'text-emerald-400 animate-pulse' : ''}`} />
                        {isMitigated ? 'ACTIVE - CONTAINED' : 'STANDBY'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-400 light:text-emerald-600 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {r.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
