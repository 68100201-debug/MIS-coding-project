import React from 'react';
import { Trophy, AlertOctagon, RotateCcw, ArrowRight, Home, Disc, Crosshair, Star } from 'lucide-react';
import { SectorDefinition } from '../types/game';

interface GameOverModalProps {
  isVictory: boolean;
  score: number;
  highScore: number;
  scrapEarned: number;
  enemiesDefeated: number;
  accuracy: number;
  sector: SectorDefinition;
  hasNextSector: boolean;
  onNextSector: () => void;
  onRestart: () => void;
  onHangar: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  score,
  highScore,
  scrapEarned,
  enemiesDefeated,
  accuracy,
  sector,
  hasNextSector,
  onNextSector,
  onRestart,
  onHangar,
}) => {
  const isNewHighScore = score > highScore;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-sm p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col gap-6">
        {/* Banner */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`p-3 rounded-full mb-3 ${
              isVictory
                ? 'bg-emerald-500/10 border border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-rose-500/10 border border-rose-500 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
            }`}
          >
            {isVictory ? <Trophy className="w-8 h-8" /> : <AlertOctagon className="w-8 h-8" />}
          </div>

          <h2
            className={`text-2xl md:text-3xl font-extrabold font-mono tracking-wider ${
              isVictory ? 'text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]'
            }`}
          >
            {isVictory ? 'SECTOR SECURED' : 'VESSEL DESTROYED'}
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
            {sector.name} · {sector.subtitle}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/70 border border-slate-800 p-4 rounded-xs">
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">FINAL SCORE</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {score.toLocaleString()}
            </span>
            {isNewHighScore && (
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-amber-400" /> NEW RECORD!
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">SCRAP RECOVERED</span>
            <span className="text-xl font-bold font-mono text-amber-300 tabular-nums flex items-center gap-1.5">
              <Disc className="w-4 h-4 text-amber-400 animate-spin" />
              +{scrapEarned}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">HOSTILES ELIMINATED</span>
            <span className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
              {enemiesDefeated}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">TARGETING ACCURACY</span>
            <span className="text-lg font-bold font-mono text-purple-300 tabular-nums flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5" />
              {accuracy}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {isVictory && hasNextSector && (
            <button
              onClick={onNextSector}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-200 font-mono text-sm font-bold tracking-wider rounded-sm shadow-[0_0_16px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-98"
            >
              ADVANCE TO NEXT SECTOR
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs md:text-sm tracking-wider rounded-sm transition-all cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              RETRY MISSION
            </button>

            <button
              onClick={onHangar}
              className="flex items-center justify-center gap-2 py-2.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/60 text-cyan-300 font-mono text-xs md:text-sm tracking-wider rounded-sm transition-all cursor-pointer active:scale-98 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
            >
              <Home className="w-4 h-4" />
              HANGAR & UPGRADES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
