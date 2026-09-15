import { computeBuildableTiles } from './path';
import type { MapDefinition } from './types';
import { buildWaveList } from './waveGenerator';

const RUINED_STREET_PATH = [
  { x: 0.5, y: 5.5 },
  { x: 6.5, y: 5.5 },
  { x: 6.5, y: 1.5 },
  { x: 12.5, y: 1.5 },
  { x: 12.5, y: 8.5 },
  { x: 15.5, y: 8.5 },
];

const HIGHWAY_CHECKPOINT_PATH = [
  { x: 0.5, y: 1.5 },
  { x: 3.5, y: 1.5 },
  { x: 3.5, y: 9.5 },
  { x: 9.5, y: 9.5 },
  { x: 9.5, y: 3.5 },
  { x: 14.5, y: 3.5 },
  { x: 14.5, y: 10.5 },
  { x: 17.5, y: 10.5 },
];

const BASE_GATE_PATH = [
  { x: 0.5, y: 6.5 },
  { x: 4.5, y: 6.5 },
  { x: 4.5, y: 1.5 },
  { x: 9.5, y: 1.5 },
  { x: 9.5, y: 9.5 },
  { x: 14.5, y: 9.5 },
  { x: 14.5, y: 4.5 },
  { x: 19.5, y: 4.5 },
];

const RUINED_STREET_ENEMY_POOL = ['walker', 'runner', 'crawler'];
const HIGHWAY_CHECKPOINT_ENEMY_POOL = ['runner', 'spitter', 'infected-dog', 'walker'];
const BASE_GATE_ENEMY_POOL = ['walker', 'tank', 'spitter', 'infected-dog', 'runner'];
const BOSS_ID = 'boss';

const RUINED_STREET: MapDefinition = {
  id: 'ruined-street',
  name: '폐허 시가지',
  gridWidth: 16,
  gridHeight: 10,
  cellSize: 56,
  path: RUINED_STREET_PATH,
  buildableTiles: computeBuildableTiles(16, 10, RUINED_STREET_PATH),
  waves: buildWaveList(RUINED_STREET_ENEMY_POOL, 8, BOSS_ID),
  enemyPool: RUINED_STREET_ENEMY_POOL,
  bossId: BOSS_ID,
};

const HIGHWAY_CHECKPOINT: MapDefinition = {
  id: 'highway-checkpoint',
  name: '고속도로 검문소',
  gridWidth: 18,
  gridHeight: 12,
  cellSize: 56,
  path: HIGHWAY_CHECKPOINT_PATH,
  buildableTiles: computeBuildableTiles(18, 12, HIGHWAY_CHECKPOINT_PATH),
  waves: buildWaveList(HIGHWAY_CHECKPOINT_ENEMY_POOL, 10, BOSS_ID),
  enemyPool: HIGHWAY_CHECKPOINT_ENEMY_POOL,
  bossId: BOSS_ID,
};

const BASE_GATE: MapDefinition = {
  id: 'base-gate',
  name: '군 기지 정문',
  gridWidth: 20,
  gridHeight: 12,
  cellSize: 56,
  path: BASE_GATE_PATH,
  buildableTiles: computeBuildableTiles(20, 12, BASE_GATE_PATH),
  waves: buildWaveList(BASE_GATE_ENEMY_POOL, 12, BOSS_ID),
  enemyPool: BASE_GATE_ENEMY_POOL,
  bossId: BOSS_ID,
};

export const MAPS: MapDefinition[] = [RUINED_STREET, HIGHWAY_CHECKPOINT, BASE_GATE];
