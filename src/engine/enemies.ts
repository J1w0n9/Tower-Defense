import type { EnemyStats } from './types';

export const ENEMY_LIST: EnemyStats[] = [
  { id: 'scout', name: '스카우트', hp: 20, speed: 2.5, reward: 5 },
  { id: 'grunt', name: '그런트', hp: 50, speed: 1.5, reward: 8 },
  { id: 'runner', name: '러너', hp: 15, speed: 3.5, reward: 6 },
  { id: 'tank', name: '탱크', hp: 150, speed: 0.8, reward: 20 },
  { id: 'shielded', name: '실드병', hp: 80, speed: 1.2, reward: 15, damageReduction: 0.3 },
  { id: 'swarm', name: '스웜', hp: 10, speed: 2, reward: 3 },
  { id: 'boss', name: '보스', hp: 800, speed: 0.6, reward: 100, isBoss: true },
];

export const ENEMIES_BY_ID: Record<string, EnemyStats> = Object.fromEntries(
  ENEMY_LIST.map((enemy) => [enemy.id, enemy])
);
