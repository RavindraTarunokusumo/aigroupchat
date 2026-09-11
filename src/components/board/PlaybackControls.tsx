import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  X,
  FastForward,
  History
} from 'lucide-react';

interface PlaybackControlsProps {
  currentStep: number; // 1 to totalSteps
  totalSteps: number;
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSeek: (step: number) => void;
  onSpeedChange: (speed: 1 | 2 | 5) => void;
  onExitReplay: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlayPause,
  onStepBack,
  onStepForward,
  onSeek,
  onSpeedChange,
  onExitReplay
}) => {
  const speeds: Array<1 | 2 | 5> = [1, 2, 5];

  const handleNextSpeed = () => {
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onSpeedChange(speeds[nextIndex]);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-indigo-950/60 transition-all duration-300">
      {/* Header / Info Row */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-indigo-400 font-mono">
            <History className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Time-Travel Replay
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Post {currentStep} of {totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed badge */}
          <button
            type="button"
            onClick={handleNextSpeed}
            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[11px] border border-slate-700 transition flex items-center gap-1"
            title="Toggle playback speed"
          >
            <FastForward className="w-3 h-3" />
            <span>{speed}x</span>
          </button>

          {/* Exit Replay Button */}
          <button
            type="button"
            onClick={onExitReplay}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Exit time-travel replay"
            aria-label="Exit time-travel replay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrubber Slider */}
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[10px] font-mono text-slate-500">1</span>
        <input
          type="range"
          min={1}
          max={Math.max(1, totalSteps)}
          value={currentStep}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
        />
        <span className="text-[10px] font-mono text-slate-500">{totalSteps}</span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        {/* Reset to Beginning */}
        <button
          type="button"
          onClick={() => onSeek(1)}
          disabled={currentStep <= 1}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition"
          title="Jump to beginning"
          aria-label="Jump to beginning"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Step Back */}
        <button
          type="button"
          onClick={onStepBack}
          disabled={currentStep <= 1}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition"
          title="Previous contribution"
          aria-label="Previous contribution"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={onPlayPause}
          className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition flex items-center justify-center"
          title={isPlaying ? 'Pause replay' : 'Play replay'}
          aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </button>

        {/* Step Forward */}
        <button
          type="button"
          onClick={onStepForward}
          disabled={currentStep >= totalSteps}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition"
          title="Next contribution"
          aria-label="Next contribution"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Jump to End */}
        <button
          type="button"
          onClick={() => onSeek(totalSteps)}
          disabled={currentStep >= totalSteps}
          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition font-medium"
          title="Jump to latest"
        >
          Latest
        </button>
      </div>
    </div>
  );
};
