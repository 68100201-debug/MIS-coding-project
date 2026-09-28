import React from 'react';
import { X, Play, Lock, Skull, Star, Award, ShieldAlert } from 'lucide-react';
import { SECTORS } from '../data/levels';

interface LevelSelectModalProps {
  highestSectorUnlocked: number;
  sectorHighScores: Record<number, number>;
  selectedSector: number;
  onSelectSector: (sector: number) => void;
  onLaunch: (sector: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  highestSectorUnlocked,
  sectorHighScores,
  selectedSector,
  onSelectSector,
  onLaunch,
  onClose,
}) => {
  const currentDef = SECTORS.find((s) => s.sector === selectedSector) || SECTORS[0];
  const isUnlocked = selectedSector <= highestSectorUnlocked;
  const currentHighScore = sectorHighScores[selectedSector] || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold font-mono text-white tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              SECTOR NAVIGATION CONSOLE
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select defensive sector deployment zone · Difficulty increases progressively
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Sector Grid, Right Detail Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Sectors List / Grid */}
          <div className="md:col-span-7 p-4 overflow-y-auto space-y-2 border-r border-slate-800">
            {SECTORS.map((sec) => {
              const unlocked = sec.sector <= highestSectorUnlocked;
              const isSelected = sec.sector === selectedSector;
              const hs = sectorHighScores[sec.sector] || 0;

              return (
                <button
                  key={sec.sector}
                  disabled={!unlocked}
                  onClick={() => onSelectSector(sec.sector)}
                  className={`w-full flex items-center justify-between p-3 rounded-xs border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : unlocked
                      ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      : 'bg-slate-950/30 border-slate-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xs flex items-center justify-center font-mono font-bold text-sm ${
                        sec.hasBoss
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-600/50'
                          : isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {unlocked ? (sec.hasBoss ? <Skull className="w-4 h-4" /> : `0${sec.sector}`) : <Lock className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold font-mono ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {sec.name}
                        </span>
                        {sec.hasBoss && (
                          <span className="text-[10px] font-mono font-bold text-rose-400 px-1 border border-rose-500/40 bg-rose-950/30 rounded-2xs">
                            BOSS
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{sec.subtitle}</div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    {unlocked ? (
                      <>
                        <span className="text-[11px] font-mono text-slate-400">BEST SCORE</span>
                        <span className="text-xs font-mono font-semibold text-cyan-400 tabular-nums">
                          {hs > 0 ? hs.toLocaleString() : '---'}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-mono text-slate-600">LOCKED</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="md:col-span-5 p-5 bg-slate-950/60 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-mono tracking-widest text-cyan-400">SECTOR BRIEFING</span>
                <h3 className="text-xl font-bold font-mono text-white mt-1">{currentDef.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{currentDef.description}</p>
              </div>

              {/* Threat Matrix & Progressive Curve Data */}
              <div className="border border-slate-800 bg-slate-900/70 p-3 rounded-xs space-y-2.5">
                <span className="text-[11px] font-mono text-slate-400 tracking-wider">DIFFICULTY SCALING MATRIX</span>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded-xs border border-slate-800">
                    <span className="text-slate-400">Enemy HP:</span>
                    <span className="text-rose-400 font-semibold">{currentDef.enemyHpMultiplier}x</span>
                  </div>

                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded-xs border border-slate-800">
                    <span className="text-slate-400">Enemy Speed:</span>
                    <span className="text-amber-400 font-semibold">{currentDef.enemySpeedMultiplier}x</span>
                  </div>

                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded-xs border border-slate-800">
                    <span className="text-slate-400">Salvo Rate:</span>
                    <span className="text-cyan-400 font-semibold">{currentDef.enemyFireRateMultiplier}x</span>
                  </div>

                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded-xs border border-slate-800">
                    <span className="text-slate-400">Clear Scrap:</span>
                    <span className="text-emerald-400 font-semibold">+{currentDef.scrapBonus}</span>
                  </div>
                </div>

                {currentDef.hasBoss && (
                  <div className="p-2 border border-rose-900/60 bg-rose-950/30 rounded-xs flex items-center gap-2 text-xs font-mono text-rose-300">
                    <Skull className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>DREADNOUGHT SIGNATURE: {currentDef.bossName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                disabled={!isUnlocked}
                onClick={() => onLaunch(selectedSector)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-sm font-mono text-sm font-bold tracking-wider transition-all cursor-pointer ${
                  isUnlocked
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-[0_0_16px_rgba(0,240,255,0.3)] active:scale-98'
                    : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-cyan-400" />
                {isUnlocked ? `LAUNCH SECTOR 0${selectedSector}` : 'SECTOR LOCKED'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
