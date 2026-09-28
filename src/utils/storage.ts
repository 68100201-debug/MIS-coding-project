import { UserProgress } from '../types/game';

const STORAGE_KEY = 'neon_space_defender_save_v1';

export const DEFAULT_USER_PROGRESS: UserProgress = {
  scrapCredits: 120, // Small starting allowance for first upgrade test
  unlockedSkinIds: ['cyber_falcon'],
  selectedSkinId: 'cyber_falcon',
  selectedTrailColor: '#00e1ff',
  highestSectorUnlocked: 1,
  sectorHighScores: {},
  sectorStars: {},
  stats: {
    fireRateLevel: 1,
    multiShotLevel: 1,
    damageLevel: 1,
    hullLevel: 1,
    shieldLevel: 1,
    magnetLevel: 1,
    critLevel: 1,
    bombLevel: 1,
  },
  soundEnabled: true,
  musicEnabled: true,
  autoFire: true,
  controlMode: 'mouse',
};

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_PROGRESS,
      ...parsed,
      stats: {
        ...DEFAULT_USER_PROGRESS.stats,
        ...(parsed.stats || {}),
      },
    };
  } catch (err) {
    console.warn('Failed to load user progress:', err);
    return DEFAULT_USER_PROGRESS;
  }
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('Failed to save user progress:', err);
  }
}
