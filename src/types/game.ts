export type GameState = 'HANGAR' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export interface ShipSkin {
  id: string;
  name: string;
  tagline: string;
  hullColor: string;
  accentColor: string;
  glowColor: string;
  trailColor: string;
  projectileColor: string;
  unlockCost: number; // in scrap credits
  unlockLevel: number;
  perkName: string;
  perkDescription: string;
  agilityBonus: number; // 1.0 = baseline
  damageBonus: number;
  critChanceBonus: number;
  shieldBonus: number;
  bombRechargeBonus: number;
}

export interface PlayerStats {
  fireRateLevel: number; // Increases fire rate
  multiShotLevel: number; // 1 = single, 2 = twin, 3 = triple, 4 = quad + beam
  damageLevel: number; // Flat/percent damage scaling
  hullLevel: number; // Max HP
  shieldLevel: number; // Max shield & regen speed
  magnetLevel: number; // Attraction radius for scraps
  critLevel: number; // Crit rate & crit damage
  bombLevel: number; // Overdrive EMP radius & cooldown
}

export interface UserProgress {
  scrapCredits: number;
  unlockedSkinIds: string[];
  selectedSkinId: string;
  selectedTrailColor: string;
  highestSectorUnlocked: number;
  sectorHighScores: Record<number, number>;
  sectorStars: Record<number, number>;
  stats: PlayerStats;
  soundEnabled: boolean;
  musicEnabled: boolean;
  autoFire: boolean;
  controlMode: 'mouse' | 'keyboard' | 'touch';
}

export type EnemyType = 
  | 'drone'          // Basic fast flyer
  | 'swarmer'        // Groups of quick zig-zagging darts
  | 'sniper'         // Halts and charges a powerful sniper laser
  | 'cruiser'        // Armored frigate with dual pulse cannons
  | 'shielder'       // Generates a neon shield aura for nearby allies
  | 'kamikaze'       // Rush-down explosive mine craft
  | 'asteroid_small' // Destructible asteroid
  | 'asteroid_large' // Splits into 2 small asteroids
  | 'boss';          // Multi-phase Sector Dreadnought

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
  damage: number;
  isPlayer: boolean;
  pierceCount: number;
  isCrit?: boolean;
  isHoming?: boolean;
  homingTargetId?: string;
  trailParticles?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'ring' | 'star';
  glow?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  duration: number;
  isCrit?: boolean;
}

export interface PowerUp {
  id: string;
  type: 'scrap' | 'shield' | 'rapid_fire' | 'triple_shot' | 'bomb_charge' | 'invulnerable';
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number; // e.g. scrap amount
  duration?: number;
  color: string;
  pulsePhase: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  points: number;
  scrapValue: number;
  shootTimer: number;
  shootInterval: number;
  patternTimer: number;
  color: string;
  accentColor: string;
  shieldActive?: boolean;
  shieldHp?: number;
  sniperCharging?: boolean;
  sniperChargeProgress?: number; // 0 to 1
  bossPhase?: number;
  bossMaxPhases?: number;
  bossName?: string;
}

export interface SectorDefinition {
  sector: number;
  name: string;
  subtitle: string;
  description: string;
  bgColor: string;
  ambientGlow: string;
  starColor: string;
  targetScore: number;
  waveCount: number;
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  enemyFireRateMultiplier: number;
  allowedEnemies: EnemyType[];
  hasBoss: boolean;
  bossName?: string;
  bossHp?: number;
  scrapBonus: number;
}
