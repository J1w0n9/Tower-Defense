export interface Point {
  x: number;
  y: number;
}

export type TargetingStrategy = 'first' | 'closest' | 'strongest';

export interface TowerStats {
  id: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  targeting: TargetingStrategy;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
}

export interface EnemyStats {
  id: string;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  damageReduction?: number;
  isBoss?: boolean;
}

export interface WaveSpawn {
  enemyId: string;
  count: number;
  spawnIntervalSec: number;
}

export interface WaveDefinition {
  waveNumber: number;
  spawns: WaveSpawn[];
}

export interface MapDefinition {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  path: Point[];
  buildableTiles: Point[];
  waves: WaveDefinition[];
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface WaveChangedPayload {
  current: number;
  total: number;
}

export interface GameEventMap {
  'gold-changed': number;
  'lives-changed': number;
  'wave-changed': WaveChangedPayload;
  'status-changed': GameStatus;
  [key: string]: unknown;
}
