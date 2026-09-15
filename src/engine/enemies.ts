import type { EnemyStats } from './types';

export const ENEMY_LIST: EnemyStats[] = [
  { id: 'walker', name: '워커', hp: 50, speed: 1.5, reward: 8 },
  { id: 'runner', name: '러너', hp: 15, speed: 3.5, reward: 6 },
  { id: 'tank', name: '탱커', hp: 150, speed: 0.8, reward: 20 },
  { id: 'crawler', name: '크롤러', hp: 10, speed: 2, reward: 3 },
  { id: 'spitter', name: '스피터', hp: 40, speed: 1.8, reward: 10 },
  { id: 'infected-dog', name: '인펙티드 도그', hp: 20, speed: 4, reward: 7 },
  { id: 'boss', name: '변이체', hp: 800, speed: 0.6, reward: 100, isBoss: true },
];

export const ENEMIES_BY_ID: Record<string, EnemyStats> = Object.fromEntries(
  ENEMY_LIST.map((enemy) => [enemy.id, enemy])
);
