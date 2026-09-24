import React, { useState } from 'react';
import NetworkTopologyMap from '../NetworkTopologyMap';
import { 
  Network, 
  Server, 
  ShieldCheck
} from 'lucide-react';
import { cyberSound } from '../../utils/soundEffects';

export default function TopologyExplorerView({ currentData, isMitigated, onToggleMitigation }) {
  const [selectedSubnet, setSelectedSubnet] = useState('all');

  const subnets = [
    { id: 'all', name: 'All Subnets', count: 12, status: 'Active' },
    { id: 'dmz', name: 'DMZ Boundary (192.168.1.x)', count: 3, status: isMitigated ? 'Protected' : 'Threat Detected' },
    { id: 'core', name: 'Core Infrastructure (10.0.4.x)', count: 4, status: 'Normal' },
    { id: 'database', name: 'Database Cluster (10.0.8.x)', count: 5, status: 'Normal' },
  ];

  const nodeStats = [
    { name: 'Edge Firewall (FW-01)', ip: '192.168.1.1', load: '78%', status: 'Active Ingest', health: 92 },
    { name: 'Core Router (RT-CORE-02)', ip: '10.0.0.1', load: '45%', status: 'Healthy', health: 98 },
    { name: 'Auth Server (AUTH-01)', ip: '10.0.4.15', load: '89%', status: currentData.forecastProb > 0.6 ? 'High Load' : 'Healthy', health: currentData.forecastProb > 0.6 ? 64 : 95 },
    { name: 'SQL Master (DB-PRIMARY)', ip: '10.0.8.100', load: '32%', status: 'Healthy', health: 99 },
    { name: 'Web Gateway (HTTP-GW)', ip: '192.168.1.50', load: '94%', status: currentData.threatLevel === 'Critical' ? 'Under Attack' : 'Healthy', health: currentData.threatLevel === 'Critical' ? 41 : 90 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card tactical-card p-6 rounded-2xl border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-6 h-6 text-cyan-400 light:text-cyan-600 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 light:from-cyan-700 light:to-indigo-800">
              NETWORK TOPOLOGY & GNN GRAPH EXPLORER
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 font-mono mt-1">
            Real-time multi-tier node connectivity, GATv2 edge attention distribution, and zero-trust segment isolation console.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMitigation}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
              isMitigated
                ? 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border border-emerald-500/50 glow-box-emerald'
                : 'bg-rose-500/20 light:bg-rose-100 text-rose-300 light:text-rose-800 border border-rose-500/50 hover:bg-rose-500/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isMitigated ? 'Segment Isolation Active' : 'Isolate Subnet Vector'}</span>
          </button>
        </div>
      </div>

      {/* Subnet Quick Selector Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subnets.map((sub) => (
          <button
            key={sub.id}
            onClick={() => { cyberSound.playClick(); setSelectedSubnet(sub.id); }}
            className={`glass-card p-4 rounded-xl text-left border transition-all ${
              selectedSubnet === sub.id
                ? 'border-cyan-400 light:border-cyan-600 bg-cyan-950/40 light:bg-cyan-50/80 shadow-md'
                : 'border-slate-800 light:border-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-300 light:text-slate-700">{sub.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                sub.status.includes('Threat') || sub.status.includes('Attack')
                  ? 'bg-rose-950 light:bg-rose-100 text-rose-400 light:text-rose-700 border border-rose-500/40'
                  : 'bg-emerald-950 light:bg-emerald-100 text-emerald-400 light:text-emerald-700 border border-emerald-500/40'
              }`}>
                {sub.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 light:text-slate-500 mt-2 font-mono">{sub.count} Active Nodes Connected</p>
          </button>
        ))}
      </div>

      {/* Main Expanded Topology Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Expanded Interactive Topology Map */}
        <div className="lg:col-span-2">
          <NetworkTopologyMap nodes={currentData.nodes} activeLinks={currentData.activeLinks} isMitigated={isMitigated} />
        </div>

        {/* Right 1 Col: Node Inspector Panel */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 light:border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 light:border-slate-200 pb-3">
            <h3 className="text-sm font-bold font-mono text-slate-200 light:text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
              Node Telemetry Inspector
            </h3>
            <span className="text-xs font-mono text-slate-400 light:text-slate-600">5 Nodes Monitored</span>
          </div>

          <div className="space-y-3">
            {nodeStats.map((node, i) => (
              <div key={i} className="bg-slate-900/60 light:bg-slate-50 p-3 rounded-xl border border-slate-800/80 light:border-slate-200 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-200 light:text-slate-800">{node.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    node.status === 'Healthy'
                      ? 'bg-emerald-950/80 text-emerald-300 light:bg-emerald-100 light:text-emerald-800'
                      : 'bg-amber-950/80 text-amber-300 light:bg-amber-100 light:text-amber-800'
                  }`}>
                    {node.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 light:text-slate-600 mt-2 font-mono">
                  <span>IP: {node.ip}</span>
                  <span>CPU Load: {node.load}</span>
                </div>

                {/* Health progress bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>Node Health</span>
                    <span>{node.health}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        node.health > 80 ? 'bg-emerald-400' : node.health > 50 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${node.health}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
