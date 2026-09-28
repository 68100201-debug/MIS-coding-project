import React, { useEffect, useRef, useState } from 'react';
import { Play, Map, Shield, Zap, Sparkles, Disc, Volume2, VolumeX, Music, Check, Lock, ChevronRight, Palette, Cpu } from 'lucide-react';
import { UserProgress, ShipSkin, PlayerStats } from '../types/game';
import { SHIP_SKINS, TRAIL_COLOR_PRESETS, drawShipHull } from '../data/skins';
import { UPGRADE_DEFINITIONS, getUpgradeCost, computeShipAttributes } from '../data/upgrades';
import { SECTORS } from '../data/levels';
import { sound } from '../utils/audio';

interface HangarViewProps {
  progress: UserProgress;
  onLaunch: (sector: number) => void;
  onOpenSectorMap: () => void;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
}

export const HangarView: React.FC<HangarViewProps> = ({
  progress,
  onLaunch,
  onOpenSectorMap,
  onUpdateProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'upgrades'>('skins');
  const [previewSkinId, setPreviewSkinId] = useState<string>(progress.selectedSkinId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentEquippedSkin = SHIP_SKINS.find((s) => s.id === progress.selectedSkinId) || SHIP_SKINS[0];
  const inspectingSkin = SHIP_SKINS.find((s) => s.id === previewSkinId) || currentEquippedSkin;
  const isInspectingUnlocked = progress.unlockedSkinIds.includes(inspectingSkin.id);
  const canAffordSkin = progress.scrapCredits >= inspectingSkin.unlockCost;

  const currentSectorDef = SECTORS.find((s) => s.sector === progress.highestSectorUnlocked) || SECTORS[0];
  const attributes = computeShipAttributes(progress.stats, inspectingSkin);

  // Render floating interactive 2D ship preview with glowing engine particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const particles: { x: number; y: number; vy: number; vx: number; alpha: number; size: number }[] = [];

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + Math.sin(time * 1.5) * 6;

      // Draw cyber grid background in preview
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Engine thruster particle spawner
      const trailColor = progress.selectedTrailColor || inspectingSkin.trailColor;
      if (Math.random() < 0.6) {
        particles.push({
          x: cx + (Math.random() * 8 - 4),
          y: cy + 30,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2.5 + Math.random() * 3,
          alpha: 0.9,
          size: 2.5 + Math.random() * 3,
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        p.size *= 0.96;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = trailColor;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = trailColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw subtle orbital ring around ship
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 54, 22, time * 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Draw Ship
      drawShipHull(ctx, inspectingSkin, cx, cy, 0, 1.8, trailColor, false);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [inspectingSkin, progress.selectedTrailColor]);

  // Handle skin purchase or equip
  const handleSelectOrUnlockSkin = (skin: ShipSkin) => {
    if (progress.unlockedSkinIds.includes(skin.id)) {
      onUpdateProgress((prev) => ({
        ...prev,
        selectedSkinId: skin.id,
      }));
      sound.playPowerup();
    } else if (progress.scrapCredits >= skin.unlockCost) {
      onUpdateProgress((prev) => ({
        ...prev,
        scrapCredits: prev.scrapCredits - skin.unlockCost,
        unlockedSkinIds: [...prev.unlockedSkinIds, skin.id],
        selectedSkinId: skin.id,
      }));
      sound.playPowerup();
    }
  };

  // Handle stat upgrade
  const handleUpgradeStat = (key: keyof PlayerStats) => {
    const currentLvl = progress.stats[key];
    const def = UPGRADE_DEFINITIONS.find((u) => u.key === key);
    if (!def || currentLvl >= def.maxLevel) return;

    const cost = getUpgradeCost(key, currentLvl);
    if (progress.scrapCredits < cost) return;

    onUpdateProgress((prev) => ({
      ...prev,
      scrapCredits: prev.scrapCredits - cost,
      stats: {
        ...prev.stats,
        [key]: currentLvl + 1,
      },
    }));

    sound.playPowerup();
  };

  const toggleSound = () => {
    onUpdateProgress((prev) => {
      const next = !prev.soundEnabled;
      sound.setSoundEnabled(next);
      return { ...prev, soundEnabled: next };
    });
  };

  const toggleMusic = () => {
    onUpdateProgress((prev) => {
      const next = !prev.musicEnabled;
      sound.setMusicEnabled(next);
      return { ...prev, musicEnabled: next };
    });
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-body select-none">
      {/* Top Bar Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xs bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-mono font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold font-mono tracking-wider text-white">
              NEON SPACE DEFENDER
            </h1>
            <p className="text-[11px] font-mono text-cyan-400 tracking-widest hidden sm:block">
              HANGAR FACILITY · SECTOR 0{progress.highestSectorUnlocked} READY
            </p>
          </div>
        </div>

        {/* Credits & Audio Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/40 px-3 py-1.5 rounded-xs shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <Disc className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
              {progress.scrapCredits.toLocaleString()} SCRAP
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xs border transition-colors cursor-pointer ${
                progress.soundEnabled
                  ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
              title="Toggle SFX Sound"
            >
              {progress.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleMusic}
              className={`p-2 rounded-xs border transition-colors cursor-pointer ${
                progress.musicEnabled
                  ? 'border-purple-500/40 bg-purple-950/20 text-purple-300'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
              title="Toggle Synth Music"
            >
              <Music className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Interactive Ship Showcase & Customizer (5 cols) */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 bg-linear-to-b from-slate-950 to-slate-900/60 overflow-y-auto">
          {/* Ship Turntable Preview */}
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-2">
              <span className="text-xs font-mono tracking-widest text-slate-400">VESSEL PREVIEW BAY</span>
              {progress.selectedSkinId === inspectingSkin.id && (
                <span className="text-[11px] font-mono text-cyan-300 border border-cyan-400/40 bg-cyan-950/30 px-2 py-0.5 rounded-2xs">
                  CURRENTLY EQUIPPED
                </span>
              )}
            </div>

            <div className="relative w-full h-56 rounded-sm border border-slate-800 bg-slate-950/80 overflow-hidden flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
              <canvas
                ref={canvasRef}
                width={380}
                height={220}
                className="w-full h-full object-contain"
              />

              <div className="absolute bottom-2 left-3 text-[11px] font-mono text-slate-500">
                CLASS: {inspectingSkin.tagline}
              </div>
            </div>

            {/* Inspecting Skin Details */}
            <div className="w-full mt-4 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide">
                    {inspectingSkin.name}
                  </h2>
                  <p className="text-xs text-slate-400">{inspectingSkin.tagline}</p>
                </div>

                {/* Equip / Unlock Button */}
                {isInspectingUnlocked ? (
                  <button
                    onClick={() => handleSelectOrUnlockSkin(inspectingSkin)}
                    disabled={progress.selectedSkinId === inspectingSkin.id}
                    className={`px-4 py-2 rounded-xs font-mono text-xs font-bold tracking-wider transition-all cursor-pointer ${
                      progress.selectedSkinId === inspectingSkin.id
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 active:scale-95 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    }`}
                  >
                    {progress.selectedSkinId === inspectingSkin.id ? 'EQUIPPED' : 'EQUIP VESSEL'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectOrUnlockSkin(inspectingSkin)}
                    disabled={!canAffordSkin}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xs font-mono text-xs font-bold tracking-wider transition-all cursor-pointer ${
                      canAffordSkin
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-200 active:scale-95 shadow-[0_0_14px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>UNLOCK ({inspectingSkin.unlockCost} SCRAP)</span>
                  </button>
                )}
              </div>

              {/* Skin Perk Card */}
              <div className="p-3 rounded-xs border border-cyan-500/30 bg-cyan-950/20 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SPECIAL PERK: {inspectingSkin.perkName}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{inspectingSkin.perkDescription}</p>
              </div>

              {/* Thruster Trail Customizer */}
              <div className="mt-2 flex flex-col gap-2">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  PLASMA THRUSTER TRAIL TINT
                </span>
                <div className="flex flex-wrap gap-2">
                  {TRAIL_COLOR_PRESETS.map((color) => {
                    const isSelected = (progress.selectedTrailColor || inspectingSkin.trailColor) === color.hex;
                    return (
                      <button
                        key={color.id}
                        onClick={() => {
                          onUpdateProgress((prev) => ({
                            ...prev,
                            selectedTrailColor: color.hex,
                          }));
                          sound.playHit(true);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-xs border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white bg-slate-800 text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: color.hex, boxShadow: `0 0 6px ${color.hex}` }}
                        />
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Ship Calculated Stats Summary */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-xs">
              <span className="text-slate-500 block text-[10px]">MAX HULL</span>
              <span className="text-rose-400 font-bold tabular-nums">{attributes.maxHp} HP</span>
            </div>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-xs">
              <span className="text-slate-500 block text-[10px]">SHIELD</span>
              <span className="text-cyan-400 font-bold tabular-nums">{attributes.maxShield} ENG</span>
            </div>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-xs">
              <span className="text-slate-500 block text-[10px]">FIRE RATE</span>
              <span className="text-amber-400 font-bold tabular-nums">
                {(1000 / attributes.fireIntervalMs).toFixed(1)}/s
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed System (Skins Catalog vs Upgrades Bay) (7 cols) */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden bg-slate-950">
          {/* Navigation Tabs */}
          <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/40 shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('skins')}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold tracking-wider rounded-xs border transition-all cursor-pointer ${
                  activeTab === 'skins'
                    ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                HULL SKINS ({SHIP_SKINS.length})
              </button>

              <button
                onClick={() => setActiveTab('upgrades')}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold tracking-wider rounded-xs border transition-all cursor-pointer ${
                  activeTab === 'upgrades'
                    ? 'border-amber-400 bg-amber-950/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                ARMORY UPGRADES ({UPGRADE_DEFINITIONS.length})
              </button>
            </div>

            <span className="text-xs font-mono text-slate-500 hidden sm:block">
              {activeTab === 'skins' ? 'Custom Fighters' : 'Permanent Hull Tuning'}
            </span>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'skins' ? (
              /* Skins Catalog */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {SHIP_SKINS.map((skin) => {
                  const unlocked = progress.unlockedSkinIds.includes(skin.id);
                  const isEquipped = progress.selectedSkinId === skin.id;
                  const isSelectedForPreview = previewSkinId === skin.id;

                  return (
                    <div
                      key={skin.id}
                      onClick={() => setPreviewSkinId(skin.id)}
                      className={`p-4 rounded-xs border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelectedForPreview
                          ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_14px_rgba(0,240,255,0.15)]'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: skin.hullColor, boxShadow: `0 0 8px ${skin.glowColor}` }}
                            />
                            <h3 className="font-mono font-bold text-sm text-white">{skin.name}</h3>
                          </div>

                          {isEquipped ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold">
                              <Check className="w-3.5 h-3.5" /> EQUIPPED
                            </span>
                          ) : unlocked ? (
                            <span className="text-[11px] font-mono text-slate-400">OWNED</span>
                          ) : (
                            <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1 font-semibold">
                              <Disc className="w-3 h-3" /> {skin.unlockCost} SCRAP
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-1">{skin.tagline}</p>
                      </div>

                      {/* Perk description */}
                      <div className="text-[11px] font-mono text-cyan-300 bg-slate-950/70 p-2 rounded-2xs border border-slate-800/80">
                        <span className="font-semibold text-white">{skin.perkName}: </span>
                        {skin.perkDescription}
                      </div>

                      {/* Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewSkinId(skin.id);
                          handleSelectOrUnlockSkin(skin);
                        }}
                        className={`w-full py-1.5 text-xs font-mono font-bold tracking-wider rounded-2xs border transition-all cursor-pointer ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-default'
                            : unlocked
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/60 text-cyan-200'
                            : progress.scrapCredits >= skin.unlockCost
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/60 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? 'ACTIVE VESSEL' : unlocked ? 'EQUIP SKIN' : `PURCHASE (${skin.unlockCost} SCRAP)`}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Upgrades Bay */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {UPGRADE_DEFINITIONS.map((def) => {
                  const currentLevel = progress.stats[def.key];
                  const isMax = currentLevel >= def.maxLevel;
                  const cost = getUpgradeCost(def.key, currentLevel);
                  const canAfford = progress.scrapCredits >= cost;

                  return (
                    <div
                      key={def.key}
                      className="p-4 rounded-xs border border-slate-800 bg-slate-900/50 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-mono font-bold text-sm text-white">{def.name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{def.description}</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
                            LVL {currentLevel}/{def.maxLevel}
                          </span>
                        </div>

                        {/* Current value display */}
                        <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center justify-between">
                          <span>Effect:</span>
                          <span className="font-semibold">{def.formatValue(currentLevel)}</span>
                        </div>

                        {/* Level pip bar */}
                        <div className="flex gap-1 mt-2">
                          {Array.from({ length: def.maxLevel }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 flex-1 rounded-2xs ${
                                idx < currentLevel
                                  ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.6)]'
                                  : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Upgrade action button */}
                      <button
                        onClick={() => handleUpgradeStat(def.key)}
                        disabled={isMax || !canAfford}
                        className={`w-full py-2 text-xs font-mono font-bold tracking-wider rounded-2xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isMax
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            : canAfford
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/80 text-amber-200 active:scale-98 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                            : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? (
                          'MAX UPGRADE REACHED'
                        ) : (
                          <>
                            <Disc className="w-3.5 h-3.5 text-amber-400" />
                            <span>UPGRADE · {cost.toLocaleString()} SCRAP</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Launch & Sector Footer Controls */}
          <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">
                ASSIGNED COMBAT ZONE
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-white text-base">
                  {currentSectorDef.name}
                </span>
                <span className="text-xs text-slate-400 hidden md:inline">
                  ({currentSectorDef.subtitle})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onOpenSectorMap}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold tracking-wider rounded-sm transition-all active:scale-95 cursor-pointer"
              >
                <Map className="w-4 h-4 text-cyan-400" />
                <span>SECTOR MAP</span>
              </button>

              <button
                onClick={() => onLaunch(progress.highestSectorUnlocked)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-mono text-sm font-bold tracking-widest rounded-sm shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-cyan-400" />
                <span>LAUNCH DEFENSE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
