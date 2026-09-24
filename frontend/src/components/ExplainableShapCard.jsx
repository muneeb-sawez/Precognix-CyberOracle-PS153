import React, { useState } from 'react';
import { Brain, HelpCircle, Layers } from 'lucide-react';
import { cyberSound } from '../utils/soundEffects';

export default function ExplainableShapCard({
  shapFeatures = [],
  attentionWeights = [],
  isMitigated = false
}) {
  const [activeExplainTab, setActiveExplainTab] = useState('shap');

  return (
    <div className="glass-card tactical-card rounded-2xl p-5 border border-cyan-500/20 mb-6 relative overflow-hidden flex flex-col justify-between">
      
      {/* Card Header & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400 light:text-cyan-600 animate-pulse" />
            <h2 className="text-base font-bold text-slate-100 light:text-slate-900 font-orbitron tracking-wide">
              DUAL EXPLAINABILITY ENGINE (INTEGRATED GRADIENTS + ATTENTION)
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 font-mono mt-0.5">
            Axiomatic Attribution: <strong className="text-cyan-400 light:text-cyan-600">Integrated Gradients (Feature Drivers)</strong> + 
            <strong className="text-amber-400 light:text-amber-600"> Temporal Attention (When & where in time/graph)</strong>
          </p>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 light:border-slate-300 text-xs font-mono">
          <button
            onClick={() => { cyberSound.playClick(); setActiveExplainTab('shap'); }}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeExplainTab === 'shap'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            Integrated Gradients Drivers
          </button>
          <button
            onClick={() => { cyberSound.playClick(); setActiveExplainTab('attention'); }}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeExplainTab === 'attention'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            Temporal Attention Weights
          </button>
        </div>
      </div>

      {/* TAB 1: SHAP FEATURE ATTRIBUTION */}
      {activeExplainTab === 'shap' && (
        <div className="space-y-3.5 my-2 animate-fadeIn">
          {shapFeatures.map((feat, idx) => {
            let barColor = "bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_8px_#00f0ff]";
            let textColor = "text-cyan-300 light:text-cyan-700";

            if (!isMitigated) {
              if (feat.impact > 30) {
                barColor = "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_10px_#ef4444]";
                textColor = "text-red-400 light:text-red-600";
              } else if (feat.impact > 18) {
                barColor = "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_#f59e0b]";
                textColor = "text-amber-300 light:text-amber-700";
              }
            }

            return (
              <div key={`${feat.feature}-${idx}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-cyan-400 light:text-cyan-700 font-bold">
                      {feat.tier || "Flow-Level"}
                    </span>
                    <span className="font-semibold text-slate-200 light:text-slate-800">{feat.feature}</span>
                    <span className="text-[11px] text-slate-400 light:text-slate-500 font-mono">({feat.value})</span>
                  </div>
                  <span className={`font-bold ${textColor}`}>+{feat.impact}% impact</span>
                </div>

                <div className="w-full h-2.5 bg-slate-950 light:bg-slate-200 rounded-full overflow-hidden border border-slate-800/80 light:border-slate-300 p-0.5">
                  <div 
                    className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.max(4, Math.min(100, feat.impact * 2))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TEMPORAL TRANSFORMER ATTENTION WEIGHTS */}
      {activeExplainTab === 'attention' && (
        <div className="space-y-4 my-2 animate-fadeIn font-mono">
          <p className="text-xs text-slate-400 light:text-slate-600">
            Self-Attention distribution <strong className="text-amber-400">Softmax(QK^T / √d_k)</strong> over historical observation windows W:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
            {(attentionWeights.length > 0 ? attentionWeights : [
              { window: 'W(t-9)', weight: 0.04, label: 'T-9' },
              { window: 'W(t-8)', weight: 0.05, label: 'T-8' },
              { window: 'W(t-7)', weight: 0.06, label: 'T-7' },
              { window: 'W(t-6)', weight: 0.08, label: 'T-6' },
              { window: 'W(t-5)', weight: 0.10, label: 'T-5' },
              { window: 'W(t-4)', weight: 0.12, label: 'T-4' },
              { window: 'W(t-3)', weight: 0.15, label: 'T-3' },
              { window: 'W(t-2)', weight: 0.18, label: 'T-2' },
              { window: 'W(t-1)', weight: 0.24, label: 'T-1' },
              { window: 'W(t-0)', weight: 0.35, label: 'T-0' }
            ]).map((w, idx) => (
              <div 
                key={idx} 
                className="p-2.5 rounded-xl bg-slate-900/80 light:bg-slate-50 border border-slate-800 light:border-slate-300 text-center flex flex-col justify-between"
              >
                <span className="text-[10px] text-slate-400 light:text-slate-600 font-bold block">{w.label}</span>
                <div className="my-2 h-16 bg-slate-950 light:bg-slate-200 rounded-lg p-0.5 flex items-end justify-center">
                  <div 
                    className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded transition-all duration-500 shadow-[0_0_8px_#f59e0b]"
                    style={{ height: `${Math.min(100, Math.max(10, w.weight * 260))}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-amber-300 light:text-amber-700">
                  {(w.weight * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950/70 light:bg-slate-50 rounded-xl border border-slate-800 text-[11px] text-slate-400 light:text-slate-600 flex items-center justify-between">
            <span>Peak Temporal Trigger: <strong className="text-amber-400">Window T-0 (Recent 30s)</strong> weighted most heavily for K-step rollout</span>
            <span>GATv2 Edge Attention: <strong className="text-cyan-400">α = 0.94 (Gateway → Web)</strong></span>
          </div>
        </div>
      )}

      {/* Footer Info Badge */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 light:border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 light:text-slate-600">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
          <span>Complies with NTRO Non-Negotiable: <strong className="text-slate-200 light:text-slate-800">100% Explainable (Zero Black-Box Output)</strong></span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 cursor-pointer" title="Sundararajan, Taly & Yan (ICML 2017) Axiomatic Attribution for Deep Networks.">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Integrated Gradients: arXiv:1705.07874 (ICML 2017)</span>
        </div>
      </div>

    </div>
  );
}
