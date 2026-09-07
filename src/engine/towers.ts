import type { TowerStats } from './types';

export const TOWER_LIST: TowerStats[] = [
  { id: 'basic', name: '기본 터렛', cost: 50, range: 3, damage: 10, fireRate: 1, projectileSpeed: 8, targeting: 'first' },
  { id: 'sniper', name: '저격 타워', cost: 100, range: 6, damage: 35, fireRate: 0.5, projectileSpeed: 12, targeting: 'strongest' },
  { id: 'rapid', name: '속사 타워', cost: 75, range: 2.5, damage: 4, fireRate: 4, projectileSpeed: 10, targeting: 'first' },
  {
    id: 'splash',
    name: '스플래시 캐논',
    cost: 120,
    range: 2.5,
    damage: 15,
    fireRate: 0.7,
    projectileSpeed: 6,
    targeting: 'closest',
    splashRadius: 1.2,
  },
  {
    id: 'slow',
    name: '슬로우 타워',
    cost: 90,
    range: 3,
    damage: 2,
    fireRate: 1,
    projectileSpeed: 8,
    targeting: 'first',
    slowFactor: 0.5,
    slowDuration: 2,
  },
];

export const TOWERS_BY_ID: Record<string, TowerStats> = Object.fromEntries(
  TOWER_LIST.map((tower) => [tower.id, tower])
);
