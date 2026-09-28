import { ShipSkin } from '../types/game';

export const SHIP_SKINS: ShipSkin[] = [
  {
    id: 'cyber_falcon',
    name: 'Cyber Falcon',
    tagline: 'Standard Vanguard Interceptor',
    hullColor: '#00f0ff',
    accentColor: '#0077ff',
    glowColor: '#00f0ff',
    trailColor: '#00e1ff',
    projectileColor: '#00f0ff',
    unlockCost: 0,
    unlockLevel: 1,
    perkName: 'Vector Thrusters',
    perkDescription: '+15% Flight agility and responsive turn recovery.',
    agilityBonus: 1.15,
    damageBonus: 1.0,
    critChanceBonus: 0,
    shieldBonus: 1.0,
    bombRechargeBonus: 1.0,
  },
  {
    id: 'void_phoenix',
    name: 'Void Phoenix',
    tagline: 'Hyper-Thermal Assault Striker',
    hullColor: '#ff2a6d',
    accentColor: '#ff9900',
    glowColor: '#ff0055',
    trailColor: '#ff5500',
    projectileColor: '#ff2a6d',
    unlockCost: 350,
    unlockLevel: 2,
    perkName: 'Inferno Overheat',
    perkDescription: '+25% Primary weapon plasma damage.',
    agilityBonus: 0.98,
    damageBonus: 1.25,
    critChanceBonus: 0.05,
    shieldBonus: 0.95,
    bombRechargeBonus: 1.0,
  },
  {
    id: 'quantum_viper',
    name: 'Quantum Viper',
    tagline: 'Stealth Railgun Infiltrator',
    hullColor: '#05ffa1',
    accentColor: '#00b4d8',
    glowColor: '#05ffa1',
    trailColor: '#00ffaa',
    projectileColor: '#05ffa1',
    unlockCost: 750,
    unlockLevel: 3,
    perkName: 'Critical Matrix',
    perkDescription: '+20% Critical strike chance and piercing needle fire.',
    agilityBonus: 1.1,
    damageBonus: 1.05,
    critChanceBonus: 0.20,
    shieldBonus: 0.9,
    bombRechargeBonus: 1.05,
  },
  {
    id: 'solar_valkyrie',
    name: 'Solar Valkyrie',
    tagline: 'Heavy Bulwark Dread-Guard',
    hullColor: '#ffb703',
    accentColor: '#fb8500',
    glowColor: '#ffb703',
    trailColor: '#ffaa00',
    projectileColor: '#ffd166',
    unlockCost: 1200,
    unlockLevel: 4,
    perkName: 'Aegis Shielding',
    perkDescription: '+40% Shield capacity and 25% faster shield reboot.',
    agilityBonus: 0.92,
    damageBonus: 1.0,
    critChanceBonus: 0,
    shieldBonus: 1.4,
    bombRechargeBonus: 1.0,
  },
  {
    id: 'phantom_spectre',
    name: 'Phantom Spectre',
    tagline: 'Dark Matter Phase Cruiser',
    hullColor: '#bd00ff',
    accentColor: '#ff00a0',
    glowColor: '#c77dff',
    trailColor: '#d946ef',
    projectileColor: '#c77dff',
    unlockCost: 1800,
    unlockLevel: 5,
    perkName: 'Singularity Core',
    perkDescription: '+35% Faster EMP bomb recharge rate and auto-pulls debris.',
    agilityBonus: 1.08,
    damageBonus: 1.1,
    critChanceBonus: 0.08,
    shieldBonus: 1.05,
    bombRechargeBonus: 1.35,
  },
  {
    id: 'neon_apex',
    name: 'Neon Apex',
    tagline: 'S-Tier Prismatic Prototype',
    hullColor: '#ffffff',
    accentColor: '#00f0ff',
    glowColor: '#00f0ff',
    trailColor: '#e0aaff',
    projectileColor: '#ffffff',
    unlockCost: 3200,
    unlockLevel: 7,
    perkName: 'Prismatic Overcharge',
    perkDescription: '+15% Agility, +15% Damage, +15% Shield and +10% Crit.',
    agilityBonus: 1.15,
    damageBonus: 1.15,
    critChanceBonus: 0.10,
    shieldBonus: 1.15,
    bombRechargeBonus: 1.2,
  },
];

export const TRAIL_COLOR_PRESETS = [
  { id: 'default', name: 'Original', hex: '#00e1ff' },
  { id: 'cyan', name: 'Cyber Cyan', hex: '#00f0ff' },
  { id: 'crimson', name: 'Solar Crimson', hex: '#ff0055' },
  { id: 'emerald', name: 'Matrix Emerald', hex: '#05ffa1' },
  { id: 'amber', name: 'Hyper Gold', hex: '#ffb703' },
  { id: 'violet', name: 'Void Violet', hex: '#bd00ff' },
  { id: 'pure_white', name: 'Nova White', hex: '#ffffff' },
];

/**
 * Procedural neon ship drawing for canvas rendering
 */
export function drawShipHull(
  ctx: CanvasRenderingContext2D,
  skin: ShipSkin,
  x: number,
  y: number,
  angle: number,
  scale = 1,
  trailColorOverride?: string,
  isInvulnerable = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const hull = isInvulnerable ? '#ffffff' : skin.hullColor;
  const accent = isInvulnerable ? '#00f0ff' : skin.accentColor;
  const glow = isInvulnerable ? '#ffffff' : skin.glowColor;

  ctx.shadowColor = glow;
  ctx.shadowBlur = 14;

  switch (skin.id) {
    case 'cyber_falcon': {
      // Sleek delta fighter
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(18, 18);
      ctx.lineTo(9, 14);
      ctx.lineTo(6, 22);
      ctx.lineTo(0, 18);
      ctx.lineTo(-6, 22);
      ctx.lineTo(-9, 14);
      ctx.lineTo(-18, 18);
      ctx.closePath();
      ctx.fillStyle = '#061325';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hull;
      ctx.stroke();

      // Wing accents
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(10, 10);
      ctx.moveTo(0, -14);
      ctx.lineTo(-10, 10);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Cockpit
      ctx.beginPath();
      ctx.ellipse(0, -6, 3, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fill();
      break;
    }

    case 'void_phoenix': {
      // Aggressive swept-forward claws
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(8, -12);
      ctx.lineTo(24, 6);
      ctx.lineTo(20, 22);
      ctx.lineTo(12, 14);
      ctx.lineTo(5, 20);
      ctx.lineTo(0, 15);
      ctx.lineTo(-5, 20);
      ctx.lineTo(-12, 14);
      ctx.lineTo(-20, 22);
      ctx.lineTo(-24, 6);
      ctx.lineTo(-8, -12);
      ctx.closePath();
      ctx.fillStyle = '#22040d';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hull;
      ctx.stroke();

      // Inner flame rib
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(14, 2);
      ctx.lineTo(0, 8);
      ctx.lineTo(-14, 2);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Cockpit core
      ctx.beginPath();
      ctx.arc(0, -4, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff4cc';
      ctx.fill();
      break;
    }

    case 'quantum_viper': {
      // Angular stealth diamond with split dual needle nose
      ctx.beginPath();
      ctx.moveTo(-4, -28);
      ctx.lineTo(-2, -10);
      ctx.lineTo(2, -10);
      ctx.lineTo(4, -28);
      ctx.lineTo(10, -8);
      ctx.lineTo(22, 16);
      ctx.lineTo(14, 18);
      ctx.lineTo(6, 24);
      ctx.lineTo(0, 16);
      ctx.lineTo(-6, 24);
      ctx.lineTo(-14, 18);
      ctx.lineTo(-22, 16);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fillStyle = '#021810';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hull;
      ctx.stroke();

      // Rail channels
      ctx.beginPath();
      ctx.moveTo(-4, -20);
      ctx.lineTo(-4, 10);
      ctx.moveTo(4, -20);
      ctx.lineTo(4, 10);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Diamond core
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(4, -2);
      ctx.lineTo(0, 6);
      ctx.lineTo(-4, -2);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }

    case 'solar_valkyrie': {
      // Heavy hexagonal fortress chassis
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(14, -12);
      ctx.lineTo(24, 4);
      ctx.lineTo(22, 18);
      ctx.lineTo(14, 22);
      ctx.lineTo(6, 20);
      ctx.lineTo(0, 24);
      ctx.lineTo(-6, 20);
      ctx.lineTo(-14, 22);
      ctx.lineTo(-22, 18);
      ctx.lineTo(-24, 4);
      ctx.lineTo(-14, -12);
      ctx.closePath();
      ctx.fillStyle = '#1c1300';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = hull;
      ctx.stroke();

      // Shield plates
      ctx.beginPath();
      ctx.moveTo(12, -4);
      ctx.lineTo(18, 12);
      ctx.lineTo(10, 16);
      ctx.moveTo(-12, -4);
      ctx.lineTo(-18, 12);
      ctx.lineTo(-10, 16);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Heavy golden power core
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
      ctx.fill();
      break;
    }

    case 'phantom_spectre': {
      // Phased curved hull with floating detached energy rings
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.quadraticCurveTo(12, -10, 18, 8);
      ctx.lineTo(14, 22);
      ctx.lineTo(4, 16);
      ctx.lineTo(0, 22);
      ctx.lineTo(-4, 16);
      ctx.lineTo(-14, 22);
      ctx.quadraticCurveTo(-12, -10, -18, 8);
      ctx.closePath();
      ctx.fillStyle = '#140024';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hull;
      ctx.stroke();

      // Ghostly phase winglets
      ctx.beginPath();
      ctx.arc(17, 10, 6, 0, Math.PI * 2);
      ctx.arc(-17, 10, 6, 0, Math.PI * 2);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Singularity core
      ctx.beginPath();
      ctx.arc(0, -2, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 16;
      ctx.fill();
      break;
    }

    case 'neon_apex':
    default: {
      // Apex triple-tier prismatic fighter
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(8, -14);
      ctx.lineTo(26, 12);
      ctx.lineTo(18, 20);
      ctx.lineTo(10, 16);
      ctx.lineTo(5, 26);
      ctx.lineTo(0, 20);
      ctx.lineTo(-5, 26);
      ctx.lineTo(-10, 16);
      ctx.lineTo(-18, 20);
      ctx.lineTo(-26, 12);
      ctx.lineTo(-8, -14);
      ctx.closePath();
      ctx.fillStyle = '#050c18';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Double cyan/pink inner lines
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(14, 8);
      ctx.moveTo(0, -22);
      ctx.lineTo(-14, 8);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(8, 6);
      ctx.moveTo(0, -14);
      ctx.lineTo(-8, 6);
      ctx.strokeStyle = '#ff00aa';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Coronal crystal core
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.fill();
      break;
    }
  }

  // Thruster fire glow
  const trailColor = trailColorOverride || skin.trailColor;
  ctx.beginPath();
  ctx.moveTo(-5, 18);
  ctx.lineTo(0, 28 + Math.random() * 8);
  ctx.lineTo(5, 18);
  ctx.fillStyle = trailColor;
  ctx.shadowColor = trailColor;
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.restore();
}
