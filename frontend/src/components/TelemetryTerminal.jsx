import React, { useState } from 'react';
import { Terminal, Search, Copy, Check } from 'lucide-react';
import { cyberSound } from '../utils/soundEffects';

export default function TelemetryTerminal({
  packetLogs = [],
  ingestRate = 0
}) {
  const [filterText, setFilterText] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredLogs = packetLogs.filter(log => 
    log.id.toLowerCase().includes(filterText.toLowerCase()) ||
    log.srcIp.toLowerCase().includes(filterText.toLowerCase()) ||
    log.protocol.toLowerCase().includes(filterText.toLowerCase()) ||
    log.threatLabel.toLowerCase().includes(filterText.toLowerCase()) ||
    String(log.dstPort).includes(filterText)
  );

  const handleCopyLogs = () => {
    cyberSound.playClick();
    const text = packetLogs.map(l => `[${l.timestamp}] ${l.id} | ${l.protocol} | ${l.srcIp} -> :${l.dstPort} | Flags: ${l.tcpFlags} | TTL: ${l.ttl || 64} | Win: ${l.windowSize || 65535} | Entropy: ${l.entropy} | Label: ${l.threatLabel}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 relative overflow-hidden flex flex-col justify-between h-full min-h-[380px]">
      
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400 light:text-emerald-600" />
          <div>
            <h2 className="text-base font-bold text-slate-100 light:text-slate-900 font-orbitron tracking-wide">
              LIVE DUAL-TIER TELEMETRY STREAM
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-600 font-mono">
              Flow Aggregates + Microsecond Packet Headers ({packetLogs.length} flows)
            </p>
          </div>
        </div>

        {/* Filter Input & Tools */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter IP / port / label..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-slate-950 light:bg-white text-xs font-mono text-slate-200 light:text-slate-800 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 light:border-slate-300 focus:outline-none focus:border-cyan-400 w-44 shadow-inner"
            />
          </div>

          <button
            onClick={handleCopyLogs}
            className="p-1.5 rounded-lg bg-slate-900 light:bg-slate-100 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 hover:border-cyan-500/40 transition-colors"
            title="Copy Logs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="w-full h-72 bg-slate-950 light:bg-slate-900 rounded-xl border border-slate-900 light:border-slate-800 p-3 font-mono text-xs overflow-y-auto relative shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="pb-2">Time</th>
              <th className="pb-2">Flow ID</th>
              <th className="pb-2">Proto</th>
              <th className="pb-2">Source IP</th>
              <th className="pb-2">Port</th>
              <th className="pb-2">Flags</th>
              <th className="pb-2">TTL</th>
              <th className="pb-2">Entropy</th>
              <th className="pb-2">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60 text-[11px]">
            {filteredLogs.map((log) => {
              const isMalicious = log.threatLabel !== 'BENIGN';
              return (
                <tr key={log.id} className={`hover:bg-slate-900/60 transition-colors ${isMalicious ? 'bg-red-950/20 text-red-300' : 'text-slate-300'}`}>
                  <td className="py-1.5 text-slate-500">{log.timestamp}</td>
                  <td className="py-1.5 text-cyan-400 font-bold">{log.id}</td>
                  <td className="py-1.5 text-slate-400">{log.protocol}</td>
                  <td className="py-1.5 font-mono">{log.srcIp}</td>
                  <td className="py-1.5 text-amber-300 font-bold">:{log.dstPort}</td>
                  <td className="py-1.5 text-slate-400">{log.tcpFlags}</td>
                  <td className="py-1.5 text-slate-400">{log.ttl || 64}</td>
                  <td className="py-1.5 text-slate-400">{log.entropy}</td>
                  <td className="py-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isMalicious ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                      {log.threatLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Terminal Footer */}
      <div className="mt-3 pt-2 border-t border-slate-800 light:border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-400 light:text-slate-600">
        <span>Parser: <strong className="text-slate-300 light:text-slate-700">CICFlowMeter Normalized Schema</strong></span>
        <span>Throughput: <strong className="text-cyan-300 light:text-cyan-700 font-bold">{ingestRate.toLocaleString()} pkts/s</strong></span>
      </div>

    </div>
  );
}
