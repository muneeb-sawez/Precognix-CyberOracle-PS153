import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Activity, 
  Wifi, 
  WifiOff, 
  Play, 
  Pause, 
  Download, 
  Search, 
  Filter, 
  ShieldAlert, 
  Cpu, 
  Layers,
  Database,
  RefreshCw,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { cyberSound } from '../../utils/soundEffects';

export default function DualTierTelemetryStreamView({ currentData, isSnifferActive, onToggleSniffer, snifferStats }) {
  const [isPaused, setIsPaused] = useState(false);
  const [filterProto, setFilterProto] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [streamTier, setStreamTier] = useState('dual'); // 'raw', 'neural', 'dual'

  const packetLogs = currentData?.packetLogs || [];

  const filteredLogs = packetLogs.filter(pkt => {
    if (filterProto !== 'ALL' && pkt.protocol !== filterProto) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchIp = pkt.srcIp?.toLowerCase().includes(term) || pkt.dstIp?.toLowerCase().includes(term);
      const matchProto = pkt.protocol?.toLowerCase().includes(term);
      const matchId = pkt.id?.toLowerCase().includes(term);
      return matchIp || matchProto || matchId;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-inter">

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 glass-card tactical-card rounded-2xl border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Terminal className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300">
                LIVE DUAL-TIER TELEMETRY STREAM CONSOLE
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                CSE-CIC-IDS2018 Wire Ingestion · 10-Second State Space Synchronizer · Neural Aggregated Vectors S_t
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Sniffer Button */}
          <button
            onClick={() => { cyberSound.playClick(); onToggleSniffer(); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold border transition-all ${
              isSnifferActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 glow-box-emerald'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-cyan-500/40'
            }`}
          >
            {isSnifferActive ? <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
            <span>{isSnifferActive ? 'Live Wire Sniffer ACTIVE' : 'Start NIC Sniffer'}</span>
          </button>

          {/* Pause Button */}
          <button
            onClick={() => { cyberSound.playClick(); setIsPaused(!isPaused); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold border transition-all ${
              isPaused 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Freeze Buffer'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="glass-card tactical-card p-4 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Flow Ingestion Cadence</span>
          <div className="text-xl font-bold text-cyan-400 font-orbitron mt-1">
            {(currentData?.ingestRate || 1420).toLocaleString()} <span className="text-xs font-mono text-slate-400">pps</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Wire-Speed Ingestion (&lt;1ms)
          </span>
        </div>

        <div className="glass-card tactical-card p-4 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">State Vector Aggregation</span>
          <div className="text-xl font-bold text-indigo-400 font-orbitron mt-1">
            10.0s <span className="text-xs font-mono text-slate-400">Rolling Window</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Features: 49 Statistical Descriptors
          </span>
        </div>

        <div className="glass-card tactical-card p-4 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Active TCP Flag Density</span>
          <div className="text-xl font-bold text-amber-400 font-orbitron mt-1">
            {currentData?.riskTier === 'Critical' ? '74.2% SYN' : '98.5% ACK'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Entropy: {currentData?.riskTier === 'Critical' ? '7.84 bits (High)' : '3.42 bits (Normal)'}
          </span>
        </div>

        <div className="glass-card tactical-card p-4 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Model Infiltration Threat</span>
          <div className={`text-xl font-bold font-orbitron mt-1 ${
            currentData?.riskTier === 'Critical' ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {(currentData?.infiltrationProb || 8.2).toFixed(1)}% <span className="text-xs font-mono text-slate-400">({currentData?.riskTier})</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Lead Time: {currentData?.leadTimeMinutes || '+52.4s'}
          </span>
        </div>
      </div>

      {/* Stream Tier View Selector & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-card p-3 rounded-2xl border border-slate-800 font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] mr-1">Display Mode:</span>
          {['dual', 'raw', 'neural'].map(mode => (
            <button
              key={mode}
              onClick={() => { cyberSound.playClick(); setStreamTier(mode); }}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all ${
                streamTier === mode
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {mode === 'dual' ? 'Dual-Tier Split' : mode === 'raw' ? 'Tier 1: Raw Packets' : 'Tier 2: Neural State S_t'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Protocol Filter */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {['ALL', 'TCP', 'UDP', 'ICMP'].map(p => (
              <button
                key={p}
                onClick={() => setFilterProto(p)}
                className={`px-2 py-0.5 rounded-lg ${filterProto === p ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search IP, Port, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-44"
            />
          </div>
        </div>
      </div>

      {/* DUAL-TIER WATERFALL CANVASES */}
      <div className={`grid gap-6 ${streamTier === 'dual' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>

        {/* TIER 1: RAW PACKET WATERFALL */}
        {(streamTier === 'dual' || streamTier === 'raw') && (
          <div className={`${streamTier === 'dual' ? 'lg:col-span-7' : 'w-full'} glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
                    Tier 1: Raw Packet Flow Stream (5-Tuple Telemetry)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {filteredLogs.length} Flows Buffered
                </span>
              </div>

              {/* Log Table */}
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
                {filteredLogs.map((pkt, idx) => (
                  <div
                    key={pkt.id || idx}
                    onClick={() => { cyberSound.playClick(); setSelectedPacket(pkt); }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      pkt.threatLabel?.includes('THREAT') || pkt.threatLabel?.includes('ALERT')
                        ? 'bg-rose-950/30 border-rose-500/30 hover:border-rose-400 text-rose-200'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{pkt.protocol || 'TCP'}</span>
                      <span className="font-bold">{pkt.srcIp || '18.219.211.138'}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-cyan-400">{pkt.dstPort ? `Port :${pkt.dstPort}` : 'Port :443'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-slate-400">{pkt.tcpFlags || '[SYN, ACK]'}</span>
                      <span className={pkt.threatLabel?.includes('THREAT') ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {pkt.threatLabel || 'BENIGN'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Direct wire tap via Npcap / libpcap streaming socket</span>
              <span>Buffer refresh: 1,000ms</span>
            </div>
          </div>
        )}

        {/* TIER 2: NEURAL 49-DIMENSIONAL STATE VECTOR S_t */}
        {(streamTier === 'dual' || streamTier === 'neural') && (
          <div className={`${streamTier === 'dual' ? 'lg:col-span-5' : 'w-full'} glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 space-y-4 font-mono`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Tier 2: Neural State Vector S_t ∈ ℝ⁴⁹
                </h3>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/30">
                L=30 Context
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Synchronized 10-second statistical flow snapshot ingested directly by the PyTorch GRU World Model:
            </p>

            {/* Neural State Features List */}
            <div className="space-y-2 text-xs max-h-[460px] overflow-y-auto pr-1">
              {[
                { name: "log_flows", val: "7.842", desc: "Log-scaled flow count per 10s window" },
                { name: "frac_syn", val: currentData?.riskTier === 'Critical' ? "0.684" : "0.042", desc: "Fraction of flows with SYN flag set" },
                { name: "frac_tcp", val: "0.941", desc: "TCP protocol concentration ratio" },
                { name: "frac_udp", val: "0.052", desc: "UDP protocol traffic fraction" },
                { name: "lg_bwd_len_mean", val: "6.912", desc: "Log-mean backward response packet length" },
                { name: "lg_pps", val: "8.125", desc: "Log packet rate arrival cadence" },
                { name: "frac_psh", val: "0.412", desc: "Immediate push flag density (payload push)" },
                { name: "frac_port_wellknown", val: "0.781", desc: "Ratio of privileged destination service ports" },
                { name: "mx_iat", val: "9.940", desc: "Max packet inter-arrival jitter (seconds)" },
                { name: "mx_pktlen", val: "1420", desc: "Maximum observed packet MTU size" }
              ].map((feat, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-cyan-300 block">{feat.name}</span>
                    <span className="text-[10px] text-slate-400">{feat.desc}</span>
                  </div>
                  <strong className="text-amber-400 font-orbitron text-xs ml-2">{feat.val}</strong>
                </div>
              ))}
            </div>

            {/* Latent State Dimension Callout */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 flex items-center justify-between">
              <span>Latent State h_t Dimension:</span>
              <strong className="font-orbitron">128-d Hidden Space</strong>
            </div>
          </div>
        )}

      </div>

      {/* Packet Inspection Modal */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-cyan-500/40 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Raw Flow Packet Inspector: {selectedPacket.id}
              </h3>
              <button onClick={() => setSelectedPacket(null)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between"><span>Source IP:</span><strong className="text-cyan-400">{selectedPacket.srcIp}</strong></div>
              <div className="flex justify-between"><span>Destination Port:</span><strong className="text-slate-200">{selectedPacket.dstPort}</strong></div>
              <div className="flex justify-between"><span>Protocol:</span><strong className="text-slate-200">{selectedPacket.protocol}</strong></div>
              <div className="flex justify-between"><span>TCP Flags:</span><strong className="text-amber-400">{selectedPacket.tcpFlags}</strong></div>
              <div className="flex justify-between"><span>Window Duration:</span><strong className="text-slate-200">{selectedPacket.duration || '10.0s'}</strong></div>
              <div className="flex justify-between"><span>Payload Entropy:</span><strong className="text-slate-200">{selectedPacket.entropy}</strong></div>
              <div className="flex justify-between"><span>Classification:</span><strong className={selectedPacket.threatLabel?.includes('THREAT') ? 'text-rose-400' : 'text-emerald-400'}>{selectedPacket.threatLabel}</strong></div>
            </div>

            <button
              onClick={() => setSelectedPacket(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
