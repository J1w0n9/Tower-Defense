export interface Point {
  x: number;
  y: number;
}

export type TargetingStrategy = 'first' | 'closest' | 'strongest';

export type SupportMode = 'range' | 'damage' | 'discount';

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
  /** Soldier: fires this many shots in quick succession before the fireRate cooldown starts. */
  burstCount?: number;
  burstIntervalSec?: number;
  /** Minigunner: seconds of spin-up required after acquiring a target before the first shot. */
  spinUpSec?: number;
  /** Flamethrower: applies a burning DoT instead of (or in addition to) instant damage. */
  burnDurationSec?: number;
  burnTickIntervalSec?: number;
  burnDamagePerTick?: number;
  /** Commander/DJ: never fires, buffs nearby combat towers instead. */
  support?: SupportTowerStats;
}

export interface SupportTowerStats {
  buffPercent: number;
  /** Commander: undefined (buffs range/damage/fireRate simultaneously, fixed).
   *  DJ: cyclable mode list, one active at a time. */
  modes?: SupportMode[];
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
