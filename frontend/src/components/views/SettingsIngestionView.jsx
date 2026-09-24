import React, { useState } from 'react';
import { 
  Sliders, 
  UploadCloud, 
  Database, 
  Cpu, 
  Save, 
  Check, 
  FolderOpen
} from 'lucide-react';
import { cyberSound } from '../../utils/soundEffects';

export default function SettingsIngestionView({ onOpenUploadModal }) {
  const [threshold, setThreshold] = useState(0.75);
  const [lookahead, setLookahead] = useState(5);
  const [streamSource, setStreamSource] = useState('CIC-IDS2018');
  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = () => {
    cyberSound.playMitigate();
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card tactical-card p-6 rounded-2xl border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyan-400 light:text-cyan-600 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 light:from-cyan-700 light:to-indigo-800">
              DATASET INGESTION & MODEL HYPERPARAMETERS
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 font-mono mt-1">
            Manage live packet streams, tweak AI threat prediction sensitivity thresholds, and configure dataset parsers.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-500/50 hover:bg-cyan-500/30 text-xs font-mono font-bold transition-all shadow-md"
        >
          {savedStatus ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          <span>{savedStatus ? 'SETTINGS SAVED!' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Data Stream & Ingestion Modal Launcher */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 light:border-slate-200 space-y-5">
          <h3 className="text-sm font-bold font-mono text-slate-200 light:text-slate-800 flex items-center gap-2 border-b border-slate-800 light:border-slate-200 pb-3">
            <Database className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
            Telemetry Stream & Ingestion
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 light:text-slate-600 mb-1.5">
                Active Benchmark Dataset Stream
              </label>
              <select
                value={streamSource}
                onChange={(e) => setStreamSource(e.target.value)}
                className="w-full bg-slate-900 light:bg-white text-slate-200 light:text-slate-800 text-xs font-mono py-2.5 px-3 rounded-xl border border-slate-800 light:border-slate-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="CIC-IDS2018">CIC-IDS2018 Real Network Attack Stream</option>
                <option value="UNSW-NB15">UNSW-NB15 Synthetic Threat Benchmark</option>
                <option value="DARPA99">DARPA 1999 Legacy Intrusion Stream</option>
                <option value="CUSTOM">Custom Uploaded Stream (.PCAP)</option>
              </select>
            </div>

            {/* PCAP Upload Modal Launcher Box */}
            <div className="border-2 border-dashed border-cyan-500/30 light:border-cyan-400/40 rounded-2xl p-6 text-center bg-cyan-950/20 light:bg-cyan-50/50 hover:bg-cyan-950/40 transition-all">
              <UploadCloud className="w-8 h-8 text-cyan-400 light:text-cyan-600 mx-auto mb-2 animate-bounce" />
              <h4 className="text-sm font-mono font-bold text-slate-200 light:text-slate-800">Upload External PCAP / Log File</h4>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-1 max-w-sm mx-auto">
                Drag and drop your network trace files (.pcap, .cap, .json, .csv) to execute forecast inference.
              </p>
              <button
                onClick={onOpenUploadModal}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-500/50 text-xs font-mono font-bold hover:bg-cyan-500/30 transition-all inline-flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Launch File Parser
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Model Hyperparameters */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 light:border-slate-200 space-y-5">
          <h3 className="text-sm font-bold font-mono text-slate-200 light:text-slate-800 flex items-center gap-2 border-b border-slate-800 light:border-slate-200 pb-3">
            <Cpu className="w-4 h-4 text-indigo-400 light:text-indigo-600" />
            AI Forecast Engine Hyperparameters
          </h3>

          <div className="space-y-5">
            {/* Alarm Sensitivity Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-slate-300 light:text-slate-700">Critical Threat Alert Threshold</span>
                <span className="font-bold text-cyan-400 light:text-cyan-600">{Math.round(threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Lower threshold triggers earlier warnings but increases false positives.</p>
            </div>

            {/* Lookahead Horizon Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-slate-300 light:text-slate-700">Prediction Lookahead Horizon (t + N)</span>
                <span className="font-bold text-indigo-400 light:text-indigo-600">{lookahead} Steps</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={lookahead}
                onChange={(e) => setLookahead(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Number of future time steps predicted by the Markov world model.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
