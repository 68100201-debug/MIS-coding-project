import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music, Crosshair, Keyboard, MousePointer } from 'lucide-react';
import { UserProgress } from '../types/game';

interface PauseMenuProps {
  progress: UserProgress;
  onResume: () => void;
  onRestart: () => void;
  onHangar: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleAutoFire: () => void;
  onChangeControlMode: (mode: 'mouse' | 'keyboard' | 'touch') => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  progress,
  onResume,
  onRestart,
  onHangar,
  onToggleSound,
  onToggleMusic,
  onToggleAutoFire,
  onChangeControlMode,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-sm p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col gap-6">
        {/* Title */}
        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-wider text-white font-mono">MISSION PAUSED</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tactical systems on standby</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 border border-cyan-500/40 text-cyan-400 rounded-xs bg-cyan-950/30">
            SECTOR DEFENSE
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-mono text-sm font-semibold tracking-wider rounded-sm transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)] active:scale-98 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-cyan-400" />
            RESUME DEFENSE
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-sm tracking-wider rounded-sm transition-all active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART SECTOR
          </button>

          <button
            onClick={onHangar}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-sm tracking-wider rounded-sm transition-all active:scale-98 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            RETURN TO HANGAR
          </button>
        </div>

        {/* Quick Settings */}
        <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
          <h3 className="text-xs font-mono text-slate-400 tracking-wider">SYSTEM PREFERENCES</h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleSound}
              className={`flex items-center justify-between px-3 py-2 text-xs font-mono rounded-sm border transition-colors cursor-pointer ${
                progress.soundEnabled
                  ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {progress.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                SFX AUDIO
              </span>
              <span>{progress.soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onToggleMusic}
              className={`flex items-center justify-between px-3 py-2 text-xs font-mono rounded-sm border transition-colors cursor-pointer ${
                progress.musicEnabled
                  ? 'border-purple-500/40 bg-purple-950/20 text-purple-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                SYNTH BGM
              </span>
              <span>{progress.musicEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-3 py-2 text-xs font-mono rounded-sm border border-slate-800 bg-slate-900/40 text-slate-300">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              AUTO-FIRE WEAPONS
            </span>
            <button
              onClick={onToggleAutoFire}
              className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold cursor-pointer ${
                progress.autoFire ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {progress.autoFire ? 'ACTIVE' : 'MANUAL'}
            </button>
          </div>

          {/* Control Mode Toggle */}
          <div className="flex items-center justify-between px-3 py-2 text-xs font-mono rounded-sm border border-slate-800 bg-slate-900/40 text-slate-300">
            <span className="flex items-center gap-1.5">
              {progress.controlMode === 'mouse' ? <MousePointer className="w-3.5 h-3.5 text-cyan-400" /> : <Keyboard className="w-3.5 h-3.5 text-amber-400" />}
              CONTROL SCHEME
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => onChangeControlMode('mouse')}
                className={`px-2 py-0.5 rounded-xs text-[11px] cursor-pointer ${
                  progress.controlMode === 'mouse' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                MOUSE
              </button>
              <button
                onClick={() => onChangeControlMode('keyboard')}
                className={`px-2 py-0.5 rounded-xs text-[11px] cursor-pointer ${
                  progress.controlMode === 'keyboard' ? 'bg-amber-500/30 text-amber-300 border border-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                WASD
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
