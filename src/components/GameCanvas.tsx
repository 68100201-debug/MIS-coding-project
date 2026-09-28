import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Enemy,
  EnemyType,
  FloatingText,
  Particle,
  PowerUp,
  Projectile,
  SectorDefinition,
  ShipSkin,
  UserProgress,
} from '../types/game';
import { computeShipAttributes } from '../data/upgrades';
import { drawShipHull } from '../data/skins';
import { SECTORS } from '../data/levels';
import { sound } from '../utils/audio';
import { GameHUD } from './GameHUD';
import { PauseMenu } from './PauseMenu';
import { GameOverModal } from './GameOverModal';

interface GameCanvasProps {
  progress: UserProgress;
  sectorNumber: number;
  equippedSkin: ShipSkin;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onReturnToHangar: () => void;
  onLaunchSector: (sectorNum: number) => void;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  progress,
  sectorNumber,
  equippedSkin,
  onUpdateProgress,
  onReturnToHangar,
  onLaunchSector,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sector definition
  const sectorDef: SectorDefinition =
    SECTORS.find((s) => s.sector === sectorNumber) || SECTORS[0];

  // Game UI State
  const [isPaused, setIsPaused] = useState(false);
  const [gameOverState, setGameOverState] = useState<{
    show: boolean;
    isVictory: boolean;
    score: number;
    highScore: number;
    scrapEarned: number;
    enemiesDefeated: number;
    accuracy: number;
  } | null>(null);

  // HUD sync states
  const [hudHp, setHudHp] = useState(100);
  const [hudMaxHp, setHudMaxHp] = useState(100);
  const [hudShield, setHudShield] = useState(60);
  const [hudMaxShield, setHudMaxShield] = useState(60);
  const [hudScore, setHudScore] = useState(0);
  const [hudCombo, setHudCombo] = useState(0);
  const [hudScraps, setHudScraps] = useState(progress.scrapCredits);
  const [hudEmpCharge, setHudEmpCharge] = useState(0);
  const [activeBossState, setActiveBossState] = useState<Enemy | null>(null);
  const [activeBuffs, setActiveBuffs] = useState<
    { type: string; timeLeft: number; label: string }[]
  >([]);

  // Internal persistent game state refs for smooth 60FPS loop
  const gameStateRef = useRef({
    isRunning: true,
    isPaused: false,
    score: 0,
    shotsFired: 0,
    shotsHit: 0,
    enemiesDefeated: 0,
    scrapGatheredInRun: 0,
    combo: 0,
    comboTimer: 0,

    // Player position & physics
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20,
      angle: 0,
      hp: 100,
      maxHp: 100,
      shield: 60,
      maxShield: 60,
      shieldRegenRate: 2,
      shieldHitCooldown: 0,
      empCharge: 0,
      empCooldownMax: 20,
      isInvulnerable: false,
      invulnerableTimer: 0,
      rapidFireTimer: 0,
      tripleShotTimer: 0,
    },

    // Attributes computed from upgrades + skin
    attr: computeShipAttributes(progress.stats, equippedSkin),

    // Controls
    input: {
      mouseX: 0,
      mouseY: 0,
      isMouseDown: false,
      keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false,
        e: false,
      },
    },

    // Weapon timing
    lastShootTime: 0,

    // Spawning & Waves
    wave: 1,
    waveSpawnTimer: 0,
    waveSpawnDelay: 1.2,
    waveCleared: false,
    bossSpawned: false,

    // Screen Shake
    shakeMagnitude: 0,
    shakeDuration: 0,

    // Entities
    projectiles: [] as Projectile[],
    enemies: [] as Enemy[],
    powerups: [] as PowerUp[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as Star[],
  });

  // Shockwave trigger ref
  const triggerEMPRef = useRef<() => void>(() => {});

  // Initialize or re-init stats
  useEffect(() => {
    const s = gameStateRef.current;
    s.attr = computeShipAttributes(progress.stats, equippedSkin);
    s.player.maxHp = s.attr.maxHp;
    s.player.hp = s.attr.maxHp;
    s.player.maxShield = s.attr.maxShield;
    s.player.shield = s.attr.maxShield;
    s.player.shieldRegenRate = s.attr.shieldRegenRate;
    s.player.empCooldownMax = s.attr.empBombCooldown;
    s.player.empCharge = 0.5; // Start with half charge

    setHudHp(s.player.hp);
    setHudMaxHp(s.player.maxHp);
    setHudShield(s.player.shield);
    setHudMaxShield(s.player.maxShield);
  }, [progress.stats, equippedSkin]);

  // Main Canvas Setup and Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTimestamp = performance.now();
    const g = gameStateRef.current;

    // Resize canvas to match screen
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (g.player.x === 0 && g.player.y === 0) {
        g.player.x = width / 2;
        g.player.y = height * 0.8;
        g.input.mouseX = width / 2;
        g.input.mouseY = height * 0.8;
      }

      // Generate background starfield
      if (g.stars.length === 0) {
        const starCount = Math.floor((width * height) / 4500);
        g.stars = [];
        for (let i = 0; i < starCount; i++) {
          g.stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 0.8 + Math.random() * 2.2,
            speed: 0.4 + Math.random() * 2.8,
            alpha: 0.2 + Math.random() * 0.8,
          });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Screen Shake Helper
    const addScreenShake = (mag: number, dur = 0.25) => {
      g.shakeMagnitude = Math.max(g.shakeMagnitude, mag);
      g.shakeDuration = Math.max(g.shakeDuration, dur);
    };

    // Add Floating Text Helper
    const addFloatingText = (
      text: string,
      x: number,
      y: number,
      color = '#ffffff',
      isCrit = false
    ) => {
      g.floatingTexts.push({
        id: Math.random().toString(),
        text,
        x,
        y,
        color,
        alpha: 1,
        scale: isCrit ? 1.4 : 1.0,
        duration: isCrit ? 1.0 : 0.7,
        isCrit,
      });
    };

    // Spawn Particles
    const spawnExplosionParticles = (
      x: number,
      y: number,
      color: string,
      count = 18,
      sizeMult = 1
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (2 + Math.random() * 6) * sizeMult;
        g.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (2 + Math.random() * 4) * sizeMult,
          color,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.03,
          shape: Math.random() < 0.3 ? 'spark' : 'circle',
          glow: true,
        });
      }

      // Add a shockwave ring
      g.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 8,
        color,
        alpha: 0.9,
        decay: 0.04,
        shape: 'ring',
        glow: true,
      });
    };

    // Trigger EMP Shockwave
    const triggerEMP = () => {
      if (g.player.empCharge < 1) return;
      g.player.empCharge = 0;

      sound.playEMPShockwave();
      addScreenShake(14, 0.4);

      const px = g.player.x;
      const py = g.player.y;
      const radius = g.attr.empRadius;

      // Wipe out all enemy projectiles in radius
      let wipedBullets = 0;
      g.projectiles = g.projectiles.filter((p) => {
        if (!p.isPlayer) {
          const dist = Math.hypot(p.x - px, p.y - py);
          if (dist <= radius) {
            wipedBullets++;
            spawnExplosionParticles(p.x, p.y, '#00f0ff', 4, 0.6);
            return false;
          }
        }
        return true;
      });

      // Blast all enemies in radius
      g.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - px, enemy.y - py);
        if (dist <= radius) {
          const empDmg = Math.round(280 * equippedSkin.damageBonus);
          enemy.hp -= empDmg;
          addFloatingText(`-${empDmg} EMP!`, enemy.x, enemy.y, '#00f0ff', true);
          spawnExplosionParticles(enemy.x, enemy.y, '#00f0ff', 8, 1);
        }
      });

      // EMP Shockwave visual ring
      for (let i = 0; i < 3; i++) {
        g.particles.push({
          x: px,
          y: py,
          vx: 0,
          vy: 0,
          size: 15 + i * 10,
          color: '#00f0ff',
          alpha: 1,
          decay: 0.025,
          shape: 'ring',
          glow: true,
        });
      }

      addFloatingText('EMP OVERDRIVE DETONATED!', px, py - 40, '#00f0ff', true);
    };

    triggerEMPRef.current = triggerEMP;

    // Fire Player Weapons
    const firePlayerCannons = (now: number) => {
      let interval = g.attr.fireIntervalMs;
      if (g.player.rapidFireTimer > 0) {
        interval *= 0.5; // Rapid fire powerup
      }

      if (now - g.lastShootTime < interval) return;
      g.lastShootTime = now;

      g.shotsFired++;
      const px = g.player.x;
      const py = g.player.y - 18;

      let cannonCount = g.attr.cannonsCount;
      if (g.player.tripleShotTimer > 0) {
        cannonCount = Math.min(5, cannonCount + 2);
      }

      const isCrit = Math.random() < g.attr.critChance;
      const baseDmg = isCrit ? Math.round(g.attr.damage * g.attr.critMultiplier) : g.attr.damage;
      const bulletColor = isCrit ? '#ffea00' : equippedSkin.projectileColor;
      const bulletSpeed = -14;

      sound.playLaser(isCrit);

      if (cannonCount === 1) {
        g.projectiles.push({
          id: Math.random().toString(),
          x: px,
          y: py,
          vx: 0,
          vy: bulletSpeed,
          radius: isCrit ? 4.5 : 3.5,
          color: bulletColor,
          glowColor: isCrit ? '#ffd700' : equippedSkin.glowColor,
          damage: baseDmg,
          isPlayer: true,
          pierceCount: equippedSkin.id === 'neon_apex' ? 2 : 1,
          isCrit,
        });
      } else if (cannonCount === 2) {
        [-10, 10].forEach((offset) => {
          g.projectiles.push({
            id: Math.random().toString(),
            x: px + offset,
            y: py,
            vx: 0,
            vy: bulletSpeed,
            radius: 3.5,
            color: bulletColor,
            glowColor: equippedSkin.glowColor,
            damage: Math.round(baseDmg * 0.9),
            isPlayer: true,
            pierceCount: 1,
            isCrit,
          });
        });
      } else if (cannonCount === 3) {
        [-1.8, 0, 1.8].forEach((spreadAngle, i) => {
          const vx = spreadAngle * 1.8;
          g.projectiles.push({
            id: Math.random().toString(),
            x: px + (i === 1 ? 0 : spreadAngle * 6),
            y: py,
            vx,
            vy: bulletSpeed,
            radius: 3.5,
            color: bulletColor,
            glowColor: equippedSkin.glowColor,
            damage: Math.round(baseDmg * 0.85),
            isPlayer: true,
            pierceCount: 1,
            isCrit,
          });
        });
      } else if (cannonCount === 4) {
        [-2.4, -0.8, 0.8, 2.4].forEach((spreadAngle) => {
          g.projectiles.push({
            id: Math.random().toString(),
            x: px + spreadAngle * 5,
            y: py,
            vx: spreadAngle * 1.5,
            vy: bulletSpeed,
            radius: 3.5,
            color: bulletColor,
            glowColor: equippedSkin.glowColor,
            damage: Math.round(baseDmg * 0.8),
            isPlayer: true,
            pierceCount: 1,
            isCrit,
          });
        });
      } else {
        // 5-way heavy vanguard spread + center railgun
        [-3.2, -1.5, 0, 1.5, 3.2].forEach((spreadAngle, i) => {
          const isCenter = i === 2;
          g.projectiles.push({
            id: Math.random().toString(),
            x: px + spreadAngle * 5,
            y: py,
            vx: spreadAngle * 1.4,
            vy: bulletSpeed,
            radius: isCenter ? 5 : 3.5,
            color: isCenter ? '#ffffff' : bulletColor,
            glowColor: isCenter ? '#00f0ff' : equippedSkin.glowColor,
            damage: isCenter ? Math.round(baseDmg * 1.3) : Math.round(baseDmg * 0.75),
            isPlayer: true,
            pierceCount: isCenter ? 2 : 1,
            isCrit,
          });
        });
      }
    };

    // Enemy Spawning Logic
    const spawnEnemy = (type: EnemyType, width: number) => {
      const hpMult = sectorDef.enemyHpMultiplier;
      const speedMult = sectorDef.enemySpeedMultiplier;
      const fireMult = sectorDef.enemyFireRateMultiplier;

      const id = Math.random().toString();
      const x = 50 + Math.random() * (width - 100);
      const y = -40;

      switch (type) {
        case 'drone':
          g.enemies.push({
            id,
            type,
            x,
            y,
            vx: (Math.random() - 0.5) * 1.5 * speedMult,
            vy: (2.0 + Math.random() * 1.5) * speedMult,
            radius: 16,
            hp: Math.round(35 * hpMult),
            maxHp: Math.round(35 * hpMult),
            points: 100,
            scrapValue: 5,
            shootTimer: 0,
            shootInterval: (2.2 / fireMult) + Math.random() * 0.8,
            patternTimer: Math.random() * Math.PI,
            color: '#00f0ff',
            accentColor: '#0284c7',
          });
          break;

        case 'swarmer':
          g.enemies.push({
            id,
            type,
            x,
            y,
            vx: (Math.random() < 0.5 ? -3 : 3) * speedMult,
            vy: (3.2 + Math.random() * 1.5) * speedMult,
            radius: 13,
            hp: Math.round(20 * hpMult),
            maxHp: Math.round(20 * hpMult),
            points: 150,
            scrapValue: 8,
            shootTimer: 0,
            shootInterval: (1.8 / fireMult) + Math.random() * 0.5,
            patternTimer: 0,
            color: '#a855f7',
            accentColor: '#d946ef',
          });
          break;

        case 'sniper':
          g.enemies.push({
            id,
            type,
            x,
            y,
            vx: 0,
            vy: 2.2 * speedMult,
            radius: 18,
            hp: Math.round(65 * hpMult),
            maxHp: Math.round(65 * hpMult),
            points: 250,
            scrapValue: 14,
            shootTimer: 0,
            shootInterval: (3.0 / fireMult),
            patternTimer: 0,
            sniperCharging: false,
            sniperChargeProgress: 0,
            color: '#f43f5e',
            accentColor: '#fda4af',
          });
          break;

        case 'cruiser':
          g.enemies.push({
            id,
            type,
            x,
            y,
            vx: (Math.random() - 0.5) * 1.0 * speedMult,
            vy: 1.2 * speedMult,
            radius: 28,
            hp: Math.round(180 * hpMult),
            maxHp: Math.round(180 * hpMult),
            points: 400,
            scrapValue: 30,
            shootTimer: 0,
            shootInterval: (2.5 / fireMult),
            patternTimer: 0,
            color: '#f97316',
            accentColor: '#fde047',
          });
          break;

        case 'shielder':
          g.enemies.push({
            id,
            type,
            x,
            y,
            vx: (Math.random() - 0.5) * 1.2 * speedMult,
            vy: 1.5 * speedMult,
            radius: 22,
            hp: Math.round(110 * hpMult),
            maxHp: Math.round(110 * hpMult),
            points: 300,
            scrapValue: 22,
            shootTimer: 0,
            shootInterval: 9999, // Doesn't shoot, projects shield
            patternTimer: 0,
            color: '#38bdf8',
            accentColor: '#0ea5e9',
          });
          break;

        case 'kamikaze':
          g.enemies.push({
            id,
            type,
            x,
            y,
            vx: 0,
            vy: 3.5 * speedMult,
            radius: 15,
            hp: Math.round(40 * hpMult),
            maxHp: Math.round(40 * hpMult),
            points: 180,
            scrapValue: 10,
            shootTimer: 0,
            shootInterval: 9999,
            patternTimer: 0,
            color: '#ef4444',
            accentColor: '#fee2e2',
          });
          break;

        case 'asteroid_small':
        case 'asteroid_large':
          const isLarge = type === 'asteroid_large';
          g.enemies.push({
            id,
            type,
            x,
            y,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (1.5 + Math.random() * 1.5) * (isLarge ? 0.8 : 1.2),
            radius: isLarge ? 30 : 16,
            hp: Math.round((isLarge ? 100 : 40) * hpMult),
            maxHp: Math.round((isLarge ? 100 : 40) * hpMult),
            points: isLarge ? 120 : 60,
            scrapValue: isLarge ? 25 : 12,
            shootTimer: 0,
            shootInterval: 9999,
            patternTimer: Math.random() * Math.PI * 2,
            color: '#64748b',
            accentColor: '#94a3b8',
          });
          break;

        case 'boss':
          if (g.bossSpawned) return;
          g.bossSpawned = true;
          sound.playBossAlarm();
          addScreenShake(12, 0.6);
          addFloatingText(`WARNING: ${sectorDef.bossName}!`, width / 2, 120, '#f43f5e', true);

          const bossHp = Math.round((sectorDef.bossHp || 3000) * hpMult);
          const boss: Enemy = {
            id,
            type: 'boss',
            x: width / 2,
            y: -80,
            vx: 1.5 * speedMult,
            vy: 0.8 * speedMult,
            radius: 54,
            hp: bossHp,
            maxHp: bossHp,
            points: 5000,
            scrapValue: 200,
            shootTimer: 0,
            shootInterval: 1.2 / fireMult,
            patternTimer: 0,
            bossPhase: 1,
            bossMaxPhases: 3,
            bossName: sectorDef.bossName || 'DREADNOUGHT',
            color: '#f43f5e',
            accentColor: '#ffd700',
          };
          g.enemies.push(boss);
          setActiveBossState(boss);
          break;
      }
    };

    // Main 60FPS Game Loop
    const gameLoop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      const width = window.innerWidth;
      const height = window.innerHeight;

      if (!g.isPaused && g.isRunning) {
        // --- 1. UPDATE PLAYER ---
        const p = g.player;

        // Recharge EMP
        if (p.empCharge < 1) {
          p.empCharge = Math.min(1, p.empCharge + dt / p.empCooldownMax);
        }

        // Active Buffs Countdown
        if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
        p.isInvulnerable = p.invulnerableTimer > 0;

        if (p.rapidFireTimer > 0) p.rapidFireTimer -= dt;
        if (p.tripleShotTimer > 0) p.tripleShotTimer -= dt;

        // Shield Recharge (if not hit recently)
        if (p.shieldHitCooldown > 0) {
          p.shieldHitCooldown -= dt;
        } else if (p.shield < p.maxShield) {
          p.shield = Math.min(p.maxShield, p.shield + p.shieldRegenRate * dt * 15);
        }

        // Combo decay
        if (g.comboTimer > 0) {
          g.comboTimer -= dt;
          if (g.comboTimer <= 0) {
            g.combo = 0;
          }
        }

        // Handle Movement
        if (progress.controlMode === 'mouse') {
          // Smooth follow towards mouse
          const dx = g.input.mouseX - p.x;
          const dy = g.input.mouseY - p.y;
          p.vx = dx * 10 * dt;
          p.vy = dy * 10 * dt;
          p.x += p.vx;
          p.y += p.vy;
          p.angle = Math.max(-0.25, Math.min(0.25, p.vx * 0.03));
        } else {
          // Keyboard WASD Movement
          const moveSpeed = g.attr.speed;
          let kx = 0;
          let ky = 0;
          if (g.input.keys.a || g.input.keys.ArrowLeft) kx -= 1;
          if (g.input.keys.d || g.input.keys.ArrowRight) kx += 1;
          if (g.input.keys.w || g.input.keys.ArrowUp) ky -= 1;
          if (g.input.keys.s || g.input.keys.ArrowDown) ky += 1;

          p.vx = kx * moveSpeed;
          p.vy = ky * moveSpeed;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.angle = Math.max(-0.25, Math.min(0.25, kx * 0.2));
        }

        // Clamp player in screen
        p.x = Math.max(30, Math.min(width - 30, p.x));
        p.y = Math.max(60, Math.min(height - 40, p.y));

        // Player Thruster Particles
        if (Math.random() < 0.7) {
          const trailColor = progress.selectedTrailColor || equippedSkin.trailColor;
          g.particles.push({
            x: p.x + (Math.random() * 6 - 3),
            y: p.y + 18,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 4 + Math.random() * 3,
            size: 2 + Math.random() * 3,
            color: trailColor,
            alpha: 0.8,
            decay: 0.04,
            glow: true,
          });
        }

        // Auto or Manual Firing
        if (progress.autoFire || g.input.isMouseDown || g.input.keys.Space) {
          firePlayerCannons(timestamp);
        }

        // Check EMP key trigger
        if (g.input.keys.e) {
          triggerEMP();
          g.input.keys.e = false;
        }

        // --- 2. WAVE SPAWNING & PROGRESSION ---
        g.waveSpawnTimer += dt;
        if (g.waveSpawnTimer >= g.waveSpawnDelay) {
          g.waveSpawnTimer = 0;

          // Check if sector has boss and it's time for boss
          if (
            sectorDef.hasBoss &&
            !g.bossSpawned &&
            (g.wave >= sectorDef.waveCount || g.score >= sectorDef.targetScore * 0.7)
          ) {
            spawnEnemy('boss', width);
          } else if (g.enemies.length < 8 + g.wave * 2) {
            // Spawn random allowed enemies
            const allowed = sectorDef.allowedEnemies.filter((e) => e !== 'boss');
            const randomType = allowed[Math.floor(Math.random() * allowed.length)];
            spawnEnemy(randomType, width);
          }
        }

        // Check Sector Victory condition
        const bossAlive = g.enemies.some((e) => e.type === 'boss');
        if (
          !g.waveCleared &&
          ((sectorDef.hasBoss && g.bossSpawned && !bossAlive) ||
            (!sectorDef.hasBoss && g.score >= sectorDef.targetScore))
        ) {
          g.waveCleared = true;
          sound.playPowerup();

          // Award bonus scrap
          const earnedScrap = g.scrapGatheredInRun + sectorDef.scrapBonus;
          const accuracy =
            g.shotsFired > 0 ? Math.round((g.shotsHit / g.shotsFired) * 100) : 100;

          // Update saved user progress
          onUpdateProgress((prev) => {
            const nextUnlocked = Math.max(
              prev.highestSectorUnlocked,
              Math.min(SECTORS.length, sectorNumber + 1)
            );
            const currentHigh = prev.sectorHighScores[sectorNumber] || 0;
            return {
              ...prev,
              scrapCredits: prev.scrapCredits + earnedScrap,
              highestSectorUnlocked: nextUnlocked,
              sectorHighScores: {
                ...prev.sectorHighScores,
                [sectorNumber]: Math.max(currentHigh, g.score),
              },
            };
          });

          setGameOverState({
            show: true,
            isVictory: true,
            score: g.score,
            highScore: Math.max(
              progress.sectorHighScores[sectorNumber] || 0,
              g.score
            ),
            scrapEarned: earnedScrap,
            enemiesDefeated: g.enemiesDefeated,
            accuracy,
          });
        }

        // --- 3. UPDATE PROJECTILES ---
        for (let i = g.projectiles.length - 1; i >= 0; i--) {
          const proj = g.projectiles[i];
          proj.x += proj.vx;
          proj.y += proj.vy;

          // Out of screen
          if (
            proj.y < -30 ||
            proj.y > height + 30 ||
            proj.x < -30 ||
            proj.x > width + 30
          ) {
            g.projectiles.splice(i, 1);
            continue;
          }

          // Player Bullet hitting Enemy
          if (proj.isPlayer) {
            let hit = false;
            for (let j = g.enemies.length - 1; j >= 0; j--) {
              const enemy = g.enemies[j];
              const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);

              if (dist <= proj.radius + enemy.radius) {
                hit = true;
                g.shotsHit++;
                enemy.hp -= proj.damage;

                // Sound & visual hit effects
                sound.playHit(false);
                spawnExplosionParticles(proj.x, proj.y, proj.color, 4, 0.6);

                if (proj.isCrit) {
                  addFloatingText(
                    `+${proj.damage} CRIT!`,
                    enemy.x,
                    enemy.y - 10,
                    '#ffd700',
                    true
                  );
                }

                // Check Enemy Death
                if (enemy.hp <= 0) {
                  g.enemiesDefeated++;
                  g.score += enemy.points * (1 + g.combo * 0.2);
                  g.combo = Math.min(8, g.combo + 1);
                  g.comboTimer = 2.5;

                  sound.playExplosion(
                    enemy.type === 'boss'
                      ? 'boss'
                      : enemy.type === 'cruiser'
                      ? 'medium'
                      : 'small'
                  );
                  addScreenShake(enemy.type === 'boss' ? 16 : 4, 0.3);
                  spawnExplosionParticles(
                    enemy.x,
                    enemy.y,
                    enemy.color,
                    enemy.type === 'boss' ? 48 : 18,
                    enemy.type === 'boss' ? 2 : 1
                  );

                  // Asteroid splitting
                  if (enemy.type === 'asteroid_large') {
                    for (let k = 0; k < 2; k++) {
                      g.enemies.push({
                        id: Math.random().toString(),
                        type: 'asteroid_small',
                        x: enemy.x + (k === 0 ? -12 : 12),
                        y: enemy.y,
                        vx: (k === 0 ? -2 : 2) + (Math.random() - 0.5),
                        vy: 1.5 + Math.random(),
                        radius: 16,
                        hp: 35,
                        maxHp: 35,
                        points: 60,
                        scrapValue: 12,
                        shootTimer: 0,
                        shootInterval: 9999,
                        patternTimer: 0,
                        color: '#64748b',
                        accentColor: '#94a3b8',
                      });
                    }
                  }

                  // Drop Neon Scrap
                  g.powerups.push({
                    id: Math.random().toString(),
                    type: 'scrap',
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -1.5,
                    value: enemy.scrapValue,
                    color: '#f59e0b',
                    pulsePhase: 0,
                  });

                  // Chance to drop powerup orb
                  const roll = Math.random();
                  if (roll < 0.14) {
                    const powerTypes: PowerUp['type'][] = [
                      'shield',
                      'rapid_fire',
                      'triple_shot',
                      'bomb_charge',
                      'invulnerable',
                    ];
                    const selectedPower =
                      powerTypes[Math.floor(Math.random() * powerTypes.length)];
                    g.powerups.push({
                      id: Math.random().toString(),
                      type: selectedPower,
                      x: enemy.x + (Math.random() * 16 - 8),
                      y: enemy.y,
                      vx: (Math.random() - 0.5) * 1.5,
                      vy: -1.0,
                      value: 1,
                      duration: 8,
                      color:
                        selectedPower === 'shield'
                          ? '#00f0ff'
                          : selectedPower === 'rapid_fire'
                          ? '#ff0055'
                          : selectedPower === 'triple_shot'
                          ? '#ffd700'
                          : selectedPower === 'bomb_charge'
                          ? '#bd00ff'
                          : '#ffffff',
                      pulsePhase: 0,
                    });
                  }

                  // Remove defeated enemy
                  if (enemy.type === 'boss') {
                    setActiveBossState(null);
                  }
                  g.enemies.splice(j, 1);
                }

                proj.pierceCount--;
                if (proj.pierceCount <= 0) {
                  g.projectiles.splice(i, 1);
                  break;
                }
              }
            }
          } else {
            // Enemy Bullet hitting Player
            const distToPlayer = Math.hypot(proj.x - p.x, proj.y - p.y);
            if (distToPlayer <= proj.radius + p.radius) {
              g.projectiles.splice(i, 1);

              if (!p.isInvulnerable) {
                addScreenShake(6, 0.2);
                p.shieldHitCooldown = 2.5;

                // Take damage from shield first, then hull
                if (p.shield > 0) {
                  sound.playHit(true);
                  if (p.shield >= proj.damage) {
                    p.shield -= proj.damage;
                  } else {
                    const leftover = proj.damage - p.shield;
                    p.shield = 0;
                    p.hp -= leftover;
                  }
                } else {
                  sound.playHit(false);
                  p.hp -= proj.damage;
                }

                spawnExplosionParticles(p.x, p.y, '#f43f5e', 8, 0.8);

                // Player Death Check
                if (p.hp <= 0 && !gameOverState) {
                  p.hp = 0;
                  sound.playExplosion('boss');
                  addScreenShake(20, 0.8);
                  spawnExplosionParticles(p.x, p.y, '#f43f5e', 40, 2);

                  // Update saved scrap collected so far
                  onUpdateProgress((prev) => ({
                    ...prev,
                    scrapCredits: prev.scrapCredits + g.scrapGatheredInRun,
                  }));

                  const accuracy =
                    g.shotsFired > 0
                      ? Math.round((g.shotsHit / g.shotsFired) * 100)
                      : 0;

                  setGameOverState({
                    show: true,
                    isVictory: false,
                    score: g.score,
                    highScore: Math.max(
                      progress.sectorHighScores[sectorNumber] || 0,
                      g.score
                    ),
                    scrapEarned: g.scrapGatheredInRun,
                    enemiesDefeated: g.enemiesDefeated,
                    accuracy,
                  });
                }
              }
            }
          }
        }

        // --- 4. UPDATE ENEMIES ---
        for (let i = g.enemies.length - 1; i >= 0; i--) {
          const enemy = g.enemies[i];
          enemy.patternTimer += dt;

          // Motion by type
          if (enemy.type === 'drone') {
            enemy.y += enemy.vy;
            enemy.x += Math.sin(enemy.patternTimer * 2) * 2;
          } else if (enemy.type === 'swarmer') {
            enemy.y += enemy.vy;
            enemy.x += enemy.vx;
            if (enemy.x < 30 || enemy.x > width - 30) {
              enemy.vx = -enemy.vx;
            }
          } else if (enemy.type === 'sniper') {
            // Sniper stops at y = 140 to aim and fire
            if (enemy.y < 130) {
              enemy.y += enemy.vy;
            } else {
              enemy.x += Math.sin(enemy.patternTimer * 1.5) * 1.2;
            }
          } else if (enemy.type === 'kamikaze') {
            // Kamikaze accelerates toward player position
            const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            enemy.vx += Math.cos(angle) * 12 * dt;
            enemy.vy += Math.sin(angle) * 12 * dt;
            // Cap max speed
            const speed = Math.hypot(enemy.vx, enemy.vy);
            if (speed > 7.5) {
              enemy.vx = (enemy.vx / speed) * 7.5;
              enemy.vy = (enemy.vy / speed) * 7.5;
            }
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
          } else if (enemy.type === 'boss') {
            // Boss enters from top, then sweeps back and forth
            if (enemy.y < 120) {
              enemy.y += enemy.vy;
            } else {
              enemy.x += enemy.vx;
              if (enemy.x < 120 || enemy.x > width - 120) {
                enemy.vx = -enemy.vx;
              }
            }
          } else {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
          }

          // Off-screen cleanup (for regular enemies that passed by)
          if (enemy.y > height + 50 && enemy.type !== 'boss') {
            g.enemies.splice(i, 1);
            continue;
          }

          // Collision with Player (Ramming)
          const distToPlayer = Math.hypot(enemy.x - p.x, enemy.y - p.y);
          if (distToPlayer <= enemy.radius + p.radius) {
            if (!p.isInvulnerable) {
              const ramDmg = Math.round(enemy.hp * 0.6);
              if (p.shield >= ramDmg) {
                p.shield -= ramDmg;
              } else {
                p.hp -= ramDmg - p.shield;
                p.shield = 0;
              }
              enemy.hp -= 80;
              p.shieldHitCooldown = 2.5;
              sound.playHit(false);
              addScreenShake(8, 0.25);
            }
          }

          // Enemy Shooting AI
          enemy.shootTimer += dt;
          if (enemy.shootTimer >= enemy.shootInterval) {
            enemy.shootTimer = 0;

            if (enemy.type === 'drone') {
              sound.playEnemyLaser();
              g.projectiles.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y + enemy.radius,
                vx: 0,
                vy: 6.5,
                radius: 4,
                color: '#ff2a6d',
                glowColor: '#ff0055',
                damage: 15,
                isPlayer: false,
                pierceCount: 1,
              });
            } else if (enemy.type === 'swarmer') {
              sound.playEnemyLaser();
              g.projectiles.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y + enemy.radius,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 7.5,
                radius: 3.5,
                color: '#d946ef',
                glowColor: '#a855f7',
                damage: 12,
                isPlayer: false,
                pierceCount: 1,
              });
            } else if (enemy.type === 'sniper') {
              // Telegraphed high speed rail bolt
              sound.playEnemyLaser();
              const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
              g.projectiles.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y + enemy.radius,
                vx: Math.cos(angle) * 11,
                vy: Math.sin(angle) * 11,
                radius: 4.5,
                color: '#f43f5e',
                glowColor: '#e11d48',
                damage: 30,
                isPlayer: false,
                pierceCount: 1,
              });
            } else if (enemy.type === 'cruiser') {
              sound.playEnemyLaser();
              // Dual cannons
              [-14, 14].forEach((off) => {
                g.projectiles.push({
                  id: Math.random().toString(),
                  x: enemy.x + off,
                  y: enemy.y + enemy.radius,
                  vx: (off / 14) * 1.2,
                  vy: 5.5,
                  radius: 5.5,
                  color: '#f97316',
                  glowColor: '#ea580c',
                  damage: 22,
                  isPlayer: false,
                  pierceCount: 1,
                });
              });
            } else if (enemy.type === 'boss') {
              sound.playEnemyLaser();
              // Boss Spiral & Ring Barrage
              const count = 10;
              for (let k = 0; k < count; k++) {
                const angle = (k / count) * Math.PI * 2 + enemy.patternTimer * 3;
                g.projectiles.push({
                  id: Math.random().toString(),
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(angle) * 4.5,
                  vy: Math.sin(angle) * 4.5,
                  radius: 5,
                  color: '#f43f5e',
                  glowColor: '#ffd700',
                  damage: 18,
                  isPlayer: false,
                  pierceCount: 1,
                });
              }
            }
          }
        }

        // --- 5. UPDATE POWERUPS & SCRAPS ---
        const magnetR = g.attr.magnetRadius;
        for (let i = g.powerups.length - 1; i >= 0; i--) {
          const item = g.powerups[i];
          item.pulsePhase += dt * 5;

          // Magnet attraction
          const dist = Math.hypot(p.x - item.x, p.y - item.y);
          if (dist <= magnetR) {
            const pullSpeed = (1 - dist / magnetR) * 14;
            const angle = Math.atan2(p.y - item.y, p.x - item.x);
            item.vx += Math.cos(angle) * pullSpeed;
            item.vy += Math.sin(angle) * pullSpeed;
          } else {
            item.vy += 0.05; // Gentle downward float
          }

          item.x += item.vx;
          item.y += item.vy;
          item.vx *= 0.95;
          item.vy *= 0.95;

          // Collect powerup
          if (dist <= p.radius + 14) {
            g.powerups.splice(i, 1);

            if (item.type === 'scrap') {
              g.scrapGatheredInRun += item.value;
              sound.playScrapCollect(g.combo);
              addFloatingText(`+${item.value} SCRAP`, p.x, p.y - 15, '#f59e0b');
            } else if (item.type === 'shield') {
              p.shield = Math.min(p.maxShield, p.shield + 60);
              sound.playPowerup();
              addFloatingText('+60 SHIELD RESTORED', p.x, p.y - 15, '#00f0ff');
            } else if (item.type === 'rapid_fire') {
              p.rapidFireTimer = 8;
              sound.playPowerup();
              addFloatingText('RAPID FIRE OVERCHARGE!', p.x, p.y - 15, '#ff0055', true);
            } else if (item.type === 'triple_shot') {
              p.tripleShotTimer = 8;
              sound.playPowerup();
              addFloatingText('SPREAD CANNONS ONLINE!', p.x, p.y - 15, '#ffd700', true);
            } else if (item.type === 'bomb_charge') {
              p.empCharge = 1;
              sound.playPowerup();
              addFloatingText('EMP CHARGED!', p.x, p.y - 15, '#bd00ff', true);
            } else if (item.type === 'invulnerable') {
              p.invulnerableTimer = 6;
              sound.playPowerup();
              addFloatingText('AEGIS INVULNERABILITY!', p.x, p.y - 15, '#ffffff', true);
            }
          }

          // Off screen
          if (item.y > height + 40) {
            g.powerups.splice(i, 1);
          }
        }

        // --- 6. UPDATE PARTICLES & TEXTS ---
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const pt = g.particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.alpha -= pt.decay;
          if (pt.shape === 'ring') pt.size += 2.5;

          if (pt.alpha <= 0) {
            g.particles.splice(i, 1);
          }
        }

        for (let i = g.floatingTexts.length - 1; i >= 0; i--) {
          const ft = g.floatingTexts[i];
          ft.y -= 1.2;
          ft.alpha -= 0.025;
          if (ft.alpha <= 0) {
            g.floatingTexts.splice(i, 1);
          }
        }

        // Update Screen Shake
        if (g.shakeDuration > 0) {
          g.shakeDuration -= dt;
          if (g.shakeDuration <= 0) {
            g.shakeMagnitude = 0;
          }
        }

        // --- 7. SYNC HUD STATES ON TICK ---
        setHudHp(p.hp);
        setHudMaxHp(p.maxHp);
        setHudShield(p.shield);
        setHudMaxShield(p.maxShield);
        setHudScore(g.score);
        setHudCombo(g.combo);
        setHudScraps(progress.scrapCredits + g.scrapGatheredInRun);
        setHudEmpCharge(p.empCharge);

        const buffs = [];
        if (p.rapidFireTimer > 0) {
          buffs.push({ type: 'rapid', timeLeft: p.rapidFireTimer, label: 'RAPID BLITZ' });
        }
        if (p.tripleShotTimer > 0) {
          buffs.push({ type: 'triple', timeLeft: p.tripleShotTimer, label: 'EXTRA CANNONS' });
        }
        if (p.invulnerableTimer > 0) {
          buffs.push({ type: 'invuln', timeLeft: p.invulnerableTimer, label: 'AEGIS BARRIER' });
        }
        setActiveBuffs(buffs);
      }

      // --- 8. RENDER PASS ---
      ctx.save();

      // Apply screen shake
      if (g.shakeMagnitude > 0) {
        const sx = (Math.random() - 0.5) * g.shakeMagnitude * 2;
        const sy = (Math.random() - 0.5) * g.shakeMagnitude * 2;
        ctx.translate(sx, sy);
      }

      // Background clear
      ctx.fillStyle = sectorDef.bgColor;
      ctx.fillRect(0, 0, width, height);

      // Deep space ambient nebula glow
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        80,
        width / 2,
        height / 2,
        width * 0.7
      );
      grad.addColorStop(0, `${sectorDef.ambientGlow}15`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Starfield rendering
      for (let i = 0; i < g.stars.length; i++) {
        const star = g.stars[i];
        if (!g.isPaused) {
          star.y += star.speed;
          if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
          }
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = sectorDef.starColor;
        ctx.globalAlpha = star.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Draw PowerUps / Scraps
      for (let i = 0; i < g.powerups.length; i++) {
        const item = g.powerups[i];
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 12;

        if (item.type === 'scrap') {
          // Rotating neon mineral geode
          ctx.rotate(item.pulsePhase);
          ctx.strokeStyle = '#f59e0b';
          ctx.fillStyle = '#78350f';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.rect(-6, -6, 12, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-2, -2, 4, 4);
        } else {
          // Floating pulsing powerup capsule
          const pulse = 1 + Math.sin(item.pulsePhase) * 0.15;
          ctx.scale(pulse, pulse);
          ctx.strokeStyle = item.color;
          ctx.fillStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Icon or core letter
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const symbol =
            item.type === 'shield'
              ? 'S'
              : item.type === 'rapid_fire'
              ? 'R'
              : item.type === 'triple_shot'
              ? '3'
              : item.type === 'bomb_charge'
              ? 'B'
              : 'A';
          ctx.fillText(symbol, 0, 0);
        }
        ctx.restore();
      }

      // Draw Enemies
      for (let i = 0; i < g.enemies.length; i++) {
        const enemy = g.enemies[i];
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12;

        if (enemy.type === 'drone') {
          // Inverted neon triangular flyer
          ctx.beginPath();
          ctx.moveTo(0, 16);
          ctx.lineTo(14, -12);
          ctx.lineTo(0, -6);
          ctx.lineTo(-14, -12);
          ctx.closePath();
          ctx.fillStyle = '#09182b';
          ctx.fill();
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 2, 3, 0, Math.PI * 2);
          ctx.fillStyle = enemy.accentColor;
          ctx.fill();
        } else if (enemy.type === 'swarmer') {
          // Sleek purple dart
          ctx.beginPath();
          ctx.moveTo(0, 16);
          ctx.lineTo(10, -10);
          ctx.lineTo(-10, -10);
          ctx.closePath();
          ctx.fillStyle = '#1c072b';
          ctx.fill();
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (enemy.type === 'sniper') {
          // Long barrel rail shooter
          ctx.beginPath();
          ctx.moveTo(0, 22);
          ctx.lineTo(12, -14);
          ctx.lineTo(0, -8);
          ctx.lineTo(-12, -14);
          ctx.closePath();
          ctx.fillStyle = '#260810';
          ctx.fill();
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // Telegraph targeting beam
          ctx.beginPath();
          ctx.moveTo(0, 22);
          ctx.lineTo(0, 300);
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (enemy.type === 'cruiser') {
          // Heavy battleship
          ctx.beginPath();
          ctx.moveTo(0, 26);
          ctx.lineTo(24, 6);
          ctx.lineTo(18, -20);
          ctx.lineTo(-18, -20);
          ctx.lineTo(-24, 6);
          ctx.closePath();
          ctx.fillStyle = '#240f03';
          ctx.fill();
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (enemy.type === 'kamikaze') {
          // Red spiked mine
          ctx.rotate(enemy.patternTimer * 4);
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#300a0a';
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          for (let s = 0; s < 4; s++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 12);
            ctx.lineTo(0, 18);
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else if (
          enemy.type === 'asteroid_small' ||
          enemy.type === 'asteroid_large'
        ) {
          // Neon cracked asteroid
          ctx.rotate(enemy.patternTimer);
          const r = enemy.radius;
          ctx.beginPath();
          ctx.moveTo(r, 0);
          for (let a = 0; a < 8; a++) {
            const rad = (a / 8) * Math.PI * 2;
            const dist = r * (0.8 + (a % 2 === 0 ? 0.2 : -0.1));
            ctx.lineTo(Math.cos(rad) * dist, Math.sin(rad) * dist);
          }
          ctx.closePath();
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.strokeStyle = enemy.accentColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (enemy.type === 'boss') {
          // Colossal Dreadnought flagship
          ctx.beginPath();
          ctx.moveTo(0, 52);
          ctx.lineTo(48, 12);
          ctx.lineTo(36, -34);
          ctx.lineTo(16, -48);
          ctx.lineTo(-16, -48);
          ctx.lineTo(-36, -34);
          ctx.lineTo(-48, 12);
          ctx.closePath();
          ctx.fillStyle = '#210515';
          ctx.fill();
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Pulsing boss core
          ctx.beginPath();
          ctx.arc(0, -6, 14, 0, Math.PI * 2);
          ctx.fillStyle = '#ffd700';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 20;
          ctx.fill();
        }

        // Mini HP Bar over enemy if damaged
        if (enemy.hp < enemy.maxHp && enemy.type !== 'boss') {
          const barW = enemy.radius * 1.8;
          const barH = 3;
          const pct = Math.max(0, enemy.hp / enemy.maxHp);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-barW / 2, -enemy.radius - 10, barW, barH);
          ctx.fillStyle = enemy.color;
          ctx.fillRect(-barW / 2, -enemy.radius - 10, barW * pct, barH);
        }

        ctx.restore();
      }

      // Draw Projectiles
      for (let i = 0; i < g.projectiles.length; i++) {
        const proj = g.projectiles[i];
        ctx.save();
        ctx.shadowColor = proj.glowColor;
        ctx.shadowBlur = proj.isCrit ? 16 : 8;

        ctx.beginPath();
        if (proj.isPlayer) {
          // Sleek neon bolt with trailing tail
          ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
          ctx.fillStyle = proj.color;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(proj.x - proj.radius * 0.8, proj.y);
          ctx.lineTo(proj.x, proj.y + 12);
          ctx.lineTo(proj.x + proj.radius * 0.8, proj.y);
          ctx.fillStyle = proj.color;
          ctx.fill();
        } else {
          // Circular plasma orb
          ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
          ctx.fillStyle = proj.color;
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Player Ship
      const p = g.player;
      drawShipHull(
        ctx,
        equippedSkin,
        p.x,
        p.y,
        p.angle,
        1.1,
        progress.selectedTrailColor,
        p.isInvulnerable
      );

      // Draw Shield Aura if active
      if (p.shield > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 2, 32, 34, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.25 + (p.shield / p.maxShield) * 0.45})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Particles
      for (let i = 0; i < g.particles.length; i++) {
        const pt = g.particles[i];
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.strokeStyle = pt.color;
        ctx.fillStyle = pt.color;
        if (pt.glow) {
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 8;
        }

        if (pt.shape === 'ring') {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (pt.shape === 'spark') {
          ctx.beginPath();
          ctx.moveTo(pt.x - pt.size, pt.y);
          ctx.lineTo(pt.x + pt.size, pt.y);
          ctx.moveTo(pt.x, pt.y - pt.size);
          ctx.lineTo(pt.x, pt.y + pt.size);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Floating Combat Texts
      for (let i = 0; i < g.floatingTexts.length; i++) {
        const ft = g.floatingTexts[i];
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = `${ft.isCrit ? 'bold 15px' : 'bold 12px'} "JetBrains Mono", monospace`;
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = ft.isCrit ? 10 : 4;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // end screen shake
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    // Mouse and Keyboard Listeners
    const handleMouseMove = (e: MouseEvent) => {
      g.input.mouseX = e.clientX;
      g.input.mouseY = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) g.input.isMouseDown = true;
      if (e.button === 2) {
        e.preventDefault();
        triggerEMP();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) g.input.isMouseDown = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') g.input.keys.w = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') g.input.keys.a = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') g.input.keys.s = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') g.input.keys.d = true;
      if (e.code === 'Space') {
        e.preventDefault();
        g.input.keys.Space = true;
        triggerEMP();
      }
      if (e.code === 'KeyE') {
        triggerEMP();
      }
      if (e.code === 'Escape') {
        setIsPaused((prev) => {
          g.isPaused = !prev;
          return !prev;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') g.input.keys.w = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') g.input.keys.a = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') g.input.keys.s = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') g.input.keys.d = false;
      if (e.code === 'Space') g.input.keys.Space = false;
    };

    // Touch Support
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        g.input.mouseX = e.touches[0].clientX;
        g.input.mouseY = e.touches[0].clientY;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      g.input.isMouseDown = true;
      if (e.touches.length > 0) {
        g.input.mouseX = e.touches[0].clientX;
        g.input.mouseY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      g.input.isMouseDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [sectorDef, sectorNumber, equippedSkin, progress.selectedTrailColor, progress.controlMode, progress.autoFire]);

  // Pause Controls
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      gameStateRef.current.isPaused = next;
      return next;
    });
  }, []);

  const handleResume = () => {
    setIsPaused(false);
    gameStateRef.current.isPaused = false;
  };

  const handleRestart = () => {
    setIsPaused(false);
    setGameOverState(null);
    onLaunchSector(sectorNumber);
  };

  const handleTriggerEMP = () => {
    triggerEMPRef.current();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-slate-950 cursor-crosshair"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Cockpit Neon HUD */}
      <GameHUD
        score={hudScore}
        combo={hudCombo}
        scrapCredits={hudScraps}
        currentSector={sectorNumber}
        sectorName={sectorDef.name}
        hp={hudHp}
        maxHp={hudMaxHp}
        shield={hudShield}
        maxShield={hudMaxShield}
        empCharge={hudEmpCharge}
        activeBoss={activeBossState}
        activeBuffs={activeBuffs}
        onPause={handleTogglePause}
        onTriggerEMP={handleTriggerEMP}
        empCooldownSec={gameStateRef.current.attr.empBombCooldown}
      />

      {/* Pause Menu Modal */}
      {isPaused && (
        <PauseMenu
          progress={progress}
          onResume={handleResume}
          onRestart={handleRestart}
          onHangar={onReturnToHangar}
          onToggleSound={() => {
            onUpdateProgress((prev) => {
              const next = !prev.soundEnabled;
              sound.setSoundEnabled(next);
              return { ...prev, soundEnabled: next };
            });
          }}
          onToggleMusic={() => {
            onUpdateProgress((prev) => {
              const next = !prev.musicEnabled;
              sound.setMusicEnabled(next);
              return { ...prev, musicEnabled: next };
            });
          }}
          onToggleAutoFire={() => {
            onUpdateProgress((prev) => ({
              ...prev,
              autoFire: !prev.autoFire,
            }));
          }}
          onChangeControlMode={(mode) => {
            onUpdateProgress((prev) => ({
              ...prev,
              controlMode: mode,
            }));
          }}
        />
      )}

      {/* Game Over / Victory Modal */}
      {gameOverState?.show && (
        <GameOverModal
          isVictory={gameOverState.isVictory}
          score={gameOverState.score}
          highScore={gameOverState.highScore}
          scrapEarned={gameOverState.scrapEarned}
          enemiesDefeated={gameOverState.enemiesDefeated}
          accuracy={gameOverState.accuracy}
          sector={sectorDef}
          hasNextSector={sectorNumber < SECTORS.length}
          onNextSector={() => {
            setGameOverState(null);
            onLaunchSector(sectorNumber + 1);
          }}
          onRestart={handleRestart}
          onHangar={onReturnToHangar}
        />
      )}
    </div>
  );
};
