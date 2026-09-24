import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import { cyberSound } from '../utils/soundEffects';

export default function TimeScrubber({
  currentStep,
  maxSteps,
  onStepChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange
}) {
  return (
    <div className="glass-card tactical-card rounded-2xl p-4 border border-cyan-500/20 mb-6 relative overflow-hidden">
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Playback Controls & Velocity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { cyberSound.playClick(); onStepChange(0); }}
            className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 text-slate-400 light:text-slate-600 border border-slate-800 light:border-slate-300 hover:text-slate-200 light:hover:text-slate-900 transition-colors"
            title="Jump to Start"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => { cyberSound.playClick(); onTogglePlay(); }}
            className={`p-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
              isPlaying 
                ? "bg-amber-500/20 light:bg-amber-100 text-amber-300 light:text-amber-800 border border-amber-500/40" 
                : "bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-500/40 glow-box-cyan"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-cyan-300 light:fill-cyan-700" />}
          </button>

          <button
            onClick={() => { cyberSound.playClick(); onStepChange(Math.min(maxSteps, currentStep + 1)); }}
            className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 text-slate-400 light:text-slate-600 border border-slate-800 light:border-slate-300 hover:text-slate-200 light:hover:text-slate-900 transition-colors"
            title="Step Forward (+1)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-900/90 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300 text-xs font-mono">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => { cyberSound.playClick(); onSpeedChange(spd); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  playbackSpeed === spd
                    ? "bg-cyan-500 light:bg-cyan-600 text-slate-950 light:text-white"
                    : "text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Time Slider */}
        <div className="flex-1 w-full flex items-center gap-3">
          <Clock className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />

          <div className="relative w-full flex items-center">
            <input
              type="range"
              min="0"
              max={maxSteps}
              value={currentStep}
              onChange={(e) => onStepChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-900 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 light:accent-cyan-600 border border-slate-800 light:border-slate-300 focus:outline-none"
            />
          </div>

          <span className="text-xs font-mono font-bold text-cyan-300 light:text-cyan-700 min-w-[85px] text-right">
            Step t = {currentStep}
          </span>
        </div>

      </div>

    </div>
  );
}

