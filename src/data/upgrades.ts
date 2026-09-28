import { PlayerStats, ShipSkin } from '../types/game';

export interface UpgradeDefinition {
  key: keyof PlayerStats;
  name: string;
  category: 'offense' | 'defense' | 'utility';
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  formatValue: (level: number) => string;
}

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    key: 'damageLevel',
    name: 'Plasma Overcharge',
    category: 'offense',
    description: 'Increases kinetic & plasma bolt impact damage.',
    maxLevel: 8,
    baseCost: 80,
    costMultiplier: 1.6,
    formatValue: (lvl) => `${10 + lvl * 4} DMG/bolt`,
  },
  {
    key: 'fireRateLevel',
    name: 'Rapid Fire Cycling',
    category: 'offense',
    description: 'Accelerates cyclic rate of primary blasters.',
    maxLevel: 8,
    baseCost: 90,
    costMultiplier: 1.65,
    formatValue: (lvl) => `${(5.5 + lvl * 0.75).toFixed(1)} shots/s`,
  },
  {
    key: 'multiShotLevel',
    name: 'Spread Hardpoints',
    category: 'offense',
    description: 'Deploys dual, triple, or quad flanking cannons.',
    maxLevel: 5,
    baseCost: 200,
    costMultiplier: 2.1,
    formatValue: (lvl) => {
      if (lvl === 1) return 'Single Center Cannon';
      if (lvl === 2) return 'Twin Parallel Blasters';
      if (lvl === 3) return 'Triple Spread Cannons';
      if (lvl === 4) return 'Quad Heavy Spread';
      return 'Vanguard 5-Way Barrage';
    },
  },
  {
    key: 'critLevel',
    name: 'Targeting Matrix',
    category: 'offense',
    description: 'Boosts critical hit probability and crit damage multiplier.',
    maxLevel: 6,
    baseCost: 120,
    costMultiplier: 1.75,
    formatValue: (lvl) => `${5 + lvl * 5}% Chance (2.2x DMG)`,
  },
  {
    key: 'hullLevel',
    name: 'Reinforced Bulkhead',
    category: 'defense',
    description: 'Reinforces ship armor and increases total maximum HP.',
    maxLevel: 8,
    baseCost: 100,
    costMultiplier: 1.55,
    formatValue: (lvl) => `${100 + lvl * 30} Max HP`,
  },
  {
    key: 'shieldLevel',
    name: 'Aegis Forcefield',
    category: 'defense',
    description: 'Increases energy shield capacity and emergency regen speed.',
    maxLevel: 8,
    baseCost: 110,
    costMultiplier: 1.6,
    formatValue: (lvl) => `${60 + lvl * 25} Shield · +${(lvl * 12)}% Regen`,
  },
  {
    key: 'magnetLevel',
    name: 'Nano Graviton Collector',
    category: 'utility',
    description: 'Pulls neon scrap and powerups toward your vessel from afar.',
    maxLevel: 6,
    baseCost: 75,
    costMultiplier: 1.5,
    formatValue: (lvl) => `${70 + lvl * 35}px Radius`,
  },
  {
    key: 'bombLevel',
    name: 'EMP Super Weapon',
    category: 'utility',
    description: 'Broadens EMP shockwave radius and shortens charge cycle.',
    maxLevel: 5,
    baseCost: 160,
    costMultiplier: 1.9,
    formatValue: (lvl) => `${300 + lvl * 60}px EMP Radius`,
  },
];

export function getUpgradeCost(key: keyof PlayerStats, currentLevel: number): number {
  const def = UPGRADE_DEFINITIONS.find((u) => u.key === key);
  if (!def) return 9999;
  return Math.round(def.baseCost * Math.pow(def.costMultiplier, currentLevel - 1));
}

export function computeShipAttributes(stats: PlayerStats, skin: ShipSkin) {
  // Base stats influenced by stats + skin perks
  const rawDamage = (10 + stats.damageLevel * 4) * skin.damageBonus;
  const shotsPerSec = 5.5 + stats.fireRateLevel * 0.75;
  const fireIntervalMs = 1000 / shotsPerSec;
  const cannonsCount = Math.min(stats.multiShotLevel, 5);

  const maxHp = Math.round((100 + stats.hullLevel * 30));
  const maxShield = Math.round((60 + stats.shieldLevel * 25) * skin.shieldBonus);
  const shieldRegenRate = (1.5 + stats.shieldLevel * 0.4) * (skin.shieldBonus > 1 ? 1.25 : 1.0);

  const critChance = Math.min(0.75, (0.05 + stats.critLevel * 0.05) + skin.critChanceBonus);
  const critMultiplier = 2.2;

  const magnetRadius = 70 + stats.magnetLevel * 35;
  const speed = 360 * skin.agilityBonus;

  const empBombCooldown = Math.max(12, 28 - stats.bombLevel * 2.8) / skin.bombRechargeBonus;
  const empRadius = 300 + stats.bombLevel * 60;

  return {
    damage: Math.round(rawDamage),
    fireIntervalMs,
    cannonsCount,
    maxHp,
    maxShield,
    shieldRegenRate,
    critChance,
    critMultiplier,
    magnetRadius,
    speed,
    empBombCooldown,
    empRadius,
  };
}
