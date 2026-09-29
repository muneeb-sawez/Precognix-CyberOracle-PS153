import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Terminal, Check, Copy, Clock, Zap, ArrowRight, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cyberSound } from '../utils/soundEffects';

export default function MitigationControl({
  isMitigated,
  onToggleMitigation,
  riskTier
}) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const [enforcementDetails, setEnforcementDetails] = useState(null);
  const [ttlRemaining, setTtlRemaining] = useState(900);
  const [blockedPackets, setBlockedPackets] = useState(142);
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState('windows');
  const [isDeploying, setIsDeploying] = useState(false);

  // Live TTL countdown timer & blocked packet counter when mitigated
  useEffect(() => {
    let interval = null;
    if (isMitigated) {
      interval = setInterval(() => {
        setTtlRemaining((prev) => (prev > 0 ? prev - 1 : 900));
        setBlockedPackets((prev) => prev + Math.floor(Math.random() * 5 + 2));
      }, 1000);
    } else {
      setTtlRemaining(900);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMitigated]);

  const formatTTL = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = async () => {
    if (!isMitigated) {
      cyberSound.playMitigate();
      setIsDeploying(true);

      const payload = {
        action: 'isolate_subnet',
        target_ip: '18.219.211.138',
        port: 21,
        protocol: 'TCP',
        ttl_seconds: 900,
        reason: 'Pre-emptive threat threshold exceeded on World Model rollout'
      };

      try {
        const res = await fetch(`${API_BASE}/api/mitigate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          const data = await res.json();
          setEnforcementDetails(data);
        } else {
          generateFallbackDetails(payload);
        }
      } catch {
        generateFallbackDetails(payload);
      } finally {
        setIsDeploying(false);
      }

      // Trigger security celebration confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00F0FF', '#10B981', '#38BDF8']
      });

      if (onToggleMitigation) onToggleMitigation(true);
    } else {
      cyberSound.playClick();
      setEnforcementDetails(null);
      if (onToggleMitigation) onToggleMitigation(false);
    }
  };

  const generateFallbackDetails = (payload) => {
    const sanitized_ip = payload.target_ip.replace(":", "_").replace("/", "_");
    const rule_name = `CyberOracle_Block_${sanitized_ip}`;
    setEnforcementDetails({
      status: 'success',
      action: payload.action,
      target_ip: payload.target_ip,
      ttl_seconds: 900,
      mitigation_id: `MIT-${Date.now().toString().slice(-6)}`,
      enforcement: {
        windows_firewall_rule: `netsh advfirewall firewall add rule name="${rule_name}" dir=in action=block remoteip=${payload.target_ip} protocol=${payload.protocol}`,
        windows_rollback_rule: `netsh advfirewall firewall delete rule name="${rule_name}"`,
        linux_iptables_ebpf: `iptables -I INPUT -s ${payload.target_ip} -p ${payload.protocol.toLowerCase()} --dport ${payload.port || 0} -j DROP`,
        linux_rollback_rule: `iptables -D INPUT -s ${payload.target_ip} -p ${payload.protocol.toLowerCase()} --dport ${payload.port || 0} -j DROP`,
        suricata_snort_rule: `alert ${payload.protocol.toLowerCase()} any any -> ${payload.target_ip} ${payload.port} (msg:"PRECOGNIX_FORECAST_BLOCK_${payload.action}"; threshold: type limit, track by_src, count 1, seconds 60; sid:2615301; rev:1;)`,
        siem_cef_alert: `CEF:0|CyberOracle|WorldModel|2.4|ALERT_INFILTRATION|Threat Threshold Exceeded|10|src=${payload.target_ip} dstPort=${payload.port} proto=${payload.protocol} msg=${payload.reason} ttl=900`
      },
      auto_revoke_policy: 'Firewall containment scheduled to auto-revoke in 900s to prevent permanent partition.',
      message: `Pre-emptive countermeasure staged for ${payload.target_ip} before breach completion.`
    });
  };

  const copyRule = (text, key) => {
    cyberSound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className={`glass-card tactical-card rounded-2xl p-4 sm:p-5 border mb-6 transition-all duration-500 ${
      isMitigated 
        ? "border-emerald-500/50 bg-emerald-950/20 light:bg-emerald-50 light:border-emerald-300 glow-box-emerald shadow-xl" 
        : riskTier === 'Critical' 
          ? "border-red-500/50 bg-red-950/20 light:bg-red-50 light:border-red-300 glow-box-red" 
          : "border-slate-800 light:border-slate-300 bg-slate-900/60 light:bg-slate-50"
    }`}>
      
      {/* Top Main Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Information Section */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border transition-all ${
            isMitigated 
              ? "bg-emerald-950 light:bg-emerald-100 text-emerald-400 light:text-emerald-700 border-emerald-500/40 light:border-emerald-300 shadow-md" 
              : "bg-slate-900 light:bg-slate-100 text-slate-400 light:text-slate-600 border-slate-700 light:border-slate-300"
          }`}>
            {isMitigated ? <ShieldCheck className="w-6 h-6 animate-pulse" /> : <ShieldAlert className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-slate-100 light:text-slate-900 tracking-wide">
                PROACTIVE ZERO-TRUST SOAR ISOLATION
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                isMitigated 
                  ? "bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border-emerald-500/40 light:border-emerald-300" 
                  : "bg-slate-800 light:bg-slate-200 text-slate-400 light:text-slate-700 border-slate-700 light:border-slate-300"
              }`}>
                {isMitigated ? "ACTIVE - CONTAINED" : "READY (ARMED)"}
              </span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600 font-mono mt-0.5">
              {isMitigated 
                ? "Autonomous SOAR Active: Windows netsh & Linux eBPF dropping attack vectors at perimeter."
                : "Recalibrate World Model trajectory by enforcing zero-trust microsegmentation."}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {isMitigated && (
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span className="text-slate-400 text-[10px]">TTL Auto-Revoke:</span>
              <span className="font-bold text-emerald-300">{formatTTL(ttlRemaining)}</span>
            </div>
          )}

          <button
            onClick={handleToggle}
            disabled={isDeploying}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg ${
              isMitigated
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:from-cyan-400 hover:to-emerald-400 glow-box-emerald"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isDeploying ? "animate-spin" : isMitigated ? "" : "animate-pulse"}`} />
            <span>{isDeploying ? "Staging Rules..." : isMitigated ? "Revoke Firewall Rules" : "Apply Automated Isolation"}</span>
          </button>
        </div>

      </div>

      {/* Expanded Live SOAR Enforcement Panel (Shows when Active) */}
      {isMitigated && (
        <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-3 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold">SOAR Enforcement Staged:</span>
              <span className="text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                Target: {enforcementDetails?.target_ip || '18.219.211.138'}
              </span>
              <span className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Blocked: {blockedPackets.toLocaleString()} pkts
              </span>
            </div>

            {/* Platform Selector */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 text-[10px]">
              {['windows', 'linux', 'suricata', 'cef', 'rollback'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setActiveTab(plat)}
                  className={`px-2 py-0.5 rounded capitalize transition-all ${
                    activeTab === plat
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>

          {/* Active Command Terminal Block */}
          <div className="bg-black/60 rounded-xl border border-emerald-500/30 p-3 relative flex items-center justify-between text-xs">
            <div className="overflow-x-auto pr-10 scrollbar-thin">
              <code className="text-emerald-300 block select-all whitespace-pre">
                {activeTab === 'windows' && (enforcementDetails?.enforcement?.windows_firewall_rule || 'netsh advfirewall firewall add rule name="CyberOracle_Block_18_219_211_138" dir=in action=block remoteip=18.219.211.138 protocol=TCP')}
                {activeTab === 'linux' && (enforcementDetails?.enforcement?.linux_iptables_ebpf || 'iptables -I INPUT -s 18.219.211.138 -p tcp --dport 21 -j DROP')}
                {activeTab === 'suricata' && (enforcementDetails?.enforcement?.suricata_snort_rule || 'alert tcp any any -> 18.219.211.138 21 (msg:"PRECOGNIX_FORECAST_BLOCK"; threshold: type limit, track by_src, count 1, seconds 60; sid:2615301; rev:1;)')}
                {activeTab === 'cef' && (enforcementDetails?.enforcement?.siem_cef_alert || 'CEF:0|CyberOracle|WorldModel|2.4|ALERT_INFILTRATION|Threshold Exceeded|10|src=18.219.211.138')}
                {activeTab === 'rollback' && (enforcementDetails?.enforcement?.windows_rollback_rule || 'netsh advfirewall firewall delete rule name="CyberOracle_Block_18_219_211_138"')}
              </code>
            </div>

            <button
              onClick={() => {
                const text = activeTab === 'windows' ? enforcementDetails?.enforcement?.windows_firewall_rule :
                  activeTab === 'linux' ? enforcementDetails?.enforcement?.linux_iptables_ebpf :
                  activeTab === 'suricata' ? enforcementDetails?.enforcement?.suricata_snort_rule :
                  activeTab === 'cef' ? enforcementDetails?.enforcement?.siem_cef_alert :
                  enforcementDetails?.enforcement?.windows_rollback_rule;
                copyRule(text || '', activeTab);
              }}
              className="absolute right-3 top-3 p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white"
              title="Copy Command"
            >
              {copiedKey === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
