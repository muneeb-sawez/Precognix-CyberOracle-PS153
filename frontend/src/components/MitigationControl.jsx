import React from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cyberSound } from '../utils/soundEffects';
import { API_BASE, HAS_LIVE_API } from '../apiConfig';

export default function MitigationControl({
  isMitigated,
  onToggleMitigation,
  riskTier
}) {
  const handleToggle = () => {
    if (!isMitigated) {
      cyberSound.playMitigate();
      // Send active defense countermeasure request if live backend is attached
      if (HAS_LIVE_API && API_BASE) {
        fetch(`${API_BASE}/api/mitigate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'isolate_subnet',
            target_ip: '18.219.211.138',
            port: 21,
            protocol: 'TCP',
            reason: 'Pre-emptive threat threshold exceeded on World Model rollout'
          })
        }).then(r => r.json()).then(data => {
          console.log('⚡ CyberOracle Active Defense Enforced:', data);
        }).catch(err => console.warn('Mitigation API offline:', err));
      }

      // Trigger festive security confetti celebration!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00F0FF', '#10B981', '#38BDF8']
      });
    } else {
      cyberSound.playClick();
    }
    onToggleMitigation();
  };

  return (
    <div className={`glass-card tactical-card rounded-2xl p-4 border mb-6 transition-all duration-500 ${
      isMitigated 
        ? "border-emerald-500/50 bg-emerald-950/20 light:bg-emerald-50 light:border-emerald-300 glow-box-emerald" 
        : riskTier === 'Critical' 
          ? "border-red-500/50 bg-red-950/20 light:bg-red-50 light:border-red-300 glow-box-red" 
          : "border-slate-800 light:border-slate-300 bg-slate-900/60 light:bg-slate-50"
    }`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Information */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${
            isMitigated 
              ? "bg-emerald-950 light:bg-emerald-100 text-emerald-400 light:text-emerald-700 border-emerald-500/40 light:border-emerald-300" 
              : "bg-slate-900 light:bg-slate-100 text-slate-400 light:text-slate-600 border-slate-700 light:border-slate-300"
          }`}>
            {isMitigated ? <ShieldCheck className="w-6 h-6 animate-pulse" /> : <ShieldAlert className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-slate-100 light:text-slate-900">
                PROACTIVE AI ISOLATION PROTOCOL
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isMitigated 
                  ? "bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border-emerald-500/40 light:border-emerald-300 font-bold" 
                  : "bg-slate-800 light:bg-slate-200 text-slate-400 light:text-slate-700 border-slate-700 light:border-slate-300"
              }`}>
                {isMitigated ? "ACTIVE - CONTAINED" : "READY"}
              </span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600 font-mono mt-0.5">
              {isMitigated 
                ? "Firewall Rule #8902 Active: Dropping ingress port 445/3389 packets at Edge Gateway."
                : "Recalibrate World Model trajectory by enforcing zero-trust microsegmentation."}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg ${
            isMitigated
              ? "bg-emerald-500 text-slate-950 border border-emerald-400 hover:bg-emerald-400 glow-box-emerald"
              : "bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 hover:from-cyan-400 hover:to-sky-400 glow-box-cyan"
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isMitigated ? "animate-spin" : ""}`} />
          <span>{isMitigated ? "Deactivate Isolation" : "Apply Automated Isolation"}</span>
        </button>

      </div>

      {/* Real-time SOAR Enforced Banner */}
      {isMitigated && (
        <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-bold">SOAR Active Rule:</span>
            <code className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
              iptables -I INPUT -s 18.219.211.138 -p tcp --dport 21 -j DROP
            </code>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            Auto-TTL: 900s
          </span>
        </div>
      )}
    </div>
  );
}
