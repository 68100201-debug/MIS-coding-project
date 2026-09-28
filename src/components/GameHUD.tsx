import React from 'react';
import { Pause, Zap, Shield, Heart, Disc, Award } from 'lucide-react';
import { Enemy } from '../types/game';

interface GameHUDProps {
  score: number;
  combo: number;
  scrapCredits: number;
  currentSector: number;
  sectorName: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  empCharge: number; // 0 to 1
  activeBoss: Enemy | null;
  activeBuffs: { type: string; timeLeft: number; label: string }[];
  onPause: () => void;
  onTriggerEMP: () => void;
  empCooldownSec: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  combo,
  scrapCredits,
  currentSector,
  sectorName,
  hp,
  maxHp,
  shield,
  maxShield,
  empCharge,
  activeBoss,
  activeBuffs,
  onPause,
  onTriggerEMP,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (shield / maxShield) * 100));
  const empReady = empCharge >= 1;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-4 w-full">
        {/* Left: Player Status Vitals */}
        <div className="flex flex-col gap-2 min-w-[200px] md:min-w-[280px]">
          {/* Hull Integrity Bar */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-xs tracking-wider text-rose-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                HULL INTEGRITY
              </span>
              <span className="font-mono tabular-nums text-slate-300">
                {Math.max(0, Math.round(hp))} / {maxHp}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900/80 rounded-sm overflow-hidden border border-rose-900/50 backdrop-blur-xs">
              <div
                className="h-full bg-linear-to-r from-rose-600 via-rose-500 to-amber-500 transition-all duration-150 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Energy Shield Bar */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-xs tracking-wider text-cyan-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                SHIELD BARRIER
              </span>
              <span className="font-mono tabular-nums text-slate-300">
                {Math.max(0, Math.round(shield))} / {maxShield}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900/80 rounded-sm overflow-hidden border border-cyan-900/50 backdrop-blur-xs">
              <div
                className="h-full bg-linear-to-r from-cyan-600 via-cyan-400 to-sky-300 transition-all duration-150 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Active Buffs Pill-free status text */}
          {activeBuffs.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {activeBuffs.map((buff, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-slate-900/80 px-2 py-0.5 border border-amber-500/40 rounded-xs"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{buff.label}</span>
                  <span className="text-amber-200 tabular-nums">({buff.timeLeft.toFixed(1)}s)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: Sector Name & Boss Indicator */}
        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            SECTOR 0{currentSector}
          </span>
          <span className="text-sm md:text-base font-bold text-slate-100 tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {sectorName}
          </span>

          {/* Boss HP Bar */}
          {activeBoss && (
            <div className="w-64 md:w-80 mt-2 flex flex-col gap-1 pointer-events-none">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-rose-400 tracking-widest">
                <span className="animate-pulse">WARNING: {activeBoss.bossName}</span>
                <span className="tabular-nums">
                  {Math.max(0, Math.round(activeBoss.hp))} / {activeBoss.maxHp}
                </span>
              </div>
              <div className="h-3 w-full bg-black/90 rounded-xs border border-rose-500 overflow-hidden shadow-[0_0_12px_rgba(244,63,94,0.6)]">
                <div
                  className="h-full bg-linear-to-r from-rose-600 via-red-500 to-amber-500 transition-all duration-100"
                  style={{ width: `${Math.max(0, Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Score, Scraps, Combo & Controls */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-end text-right">
            <span className="text-[11px] font-mono tracking-wider text-slate-400">SCORE</span>
            <span className="text-xl md:text-2xl font-bold font-mono tabular-nums text-white tracking-wider drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              {score.toLocaleString()}
            </span>

            <div className="flex items-center gap-3 mt-1 text-xs font-mono">
              <span className="flex items-center gap-1 text-amber-300">
                <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="tabular-nums font-semibold">{scrapCredits} SCRAP</span>
              </span>

              {combo > 1 && (
                <span className="flex items-center gap-1 text-emerald-400 font-bold animate-bounce">
                  <Award className="w-3.5 h-3.5" />
                  <span>{combo}x COMBO</span>
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onPause}
            className="pointer-events-auto p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 rounded-sm text-slate-200 hover:text-white transition-all duration-150 backdrop-blur-md active:scale-95 cursor-pointer"
            title="Pause Game (ESC)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Action Area: Overdrive EMP Button */}
      <div className="flex justify-between items-end w-full">
        {/* Helper keys hint */}
        <div className="hidden md:flex flex-col text-[11px] font-mono text-slate-400/80 bg-slate-950/70 p-2 border border-slate-800 rounded-xs">
          <span>[WASD / MOUSE] Steer Defender</span>
          <span>[LEFT CLICK / AUTO] Fire Cannons</span>
          <span>[E / SPACE] Detonate EMP Shockwave</span>
        </div>

        {/* EMP Special Ability Trigger */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          <button
            onClick={onTriggerEMP}
            disabled={!empReady}
            className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-sm font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              empReady
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(0,240,255,0.4)] active:scale-95 animate-pulse'
                : 'bg-slate-900/60 border border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className={`w-4 h-4 ${empReady ? 'text-cyan-300 fill-cyan-300/40' : 'text-slate-600'}`} />
            <span>EMP SHOCKWAVE {empReady ? '· READY' : `[${Math.round(empCharge * 100)}%]`}</span>

            {/* Circular or progress fill behind */}
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-cyan-400 transition-all duration-150"
              style={{ width: `${Math.min(100, empCharge * 100)}%` }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
