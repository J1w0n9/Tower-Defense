import { computeBuildableTiles } from './path';
import type { MapDefinition } from './types';
import { buildWaveList } from './waveGenerator';

const MEADOW_PATH = [
  { x: 0.5, y: 5.5 },
  { x: 6.5, y: 5.5 },
  { x: 6.5, y: 1.5 },
  { x: 12.5, y: 1.5 },
  { x: 12.5, y: 8.5 },
  { x: 15.5, y: 8.5 },
];

const CANYON_PATH = [
  { x: 0.5, y: 1.5 },
  { x: 3.5, y: 1.5 },
  { x: 3.5, y: 9.5 },
  { x: 9.5, y: 9.5 },
  { x: 9.5, y: 3.5 },
  { x: 14.5, y: 3.5 },
  { x: 14.5, y: 10.5 },
  { x: 17.5, y: 10.5 },
];

const FORTRESS_PATH = [
  { x: 0.5, y: 6.5 },
  { x: 4.5, y: 6.5 },
  { x: 4.5, y: 1.5 },
  { x: 9.5, y: 1.5 },
  { x: 9.5, y: 9.5 },
  { x: 14.5, y: 9.5 },
  { x: 14.5, y: 4.5 },
  { x: 19.5, y: 4.5 },
];

const MEADOW: MapDefinition = {
  id: 'meadow',
  name: '초원 경로',
  gridWidth: 16,
  gridHeight: 10,
  cellSize: 40,
  path: MEADOW_PATH,
  buildableTiles: computeBuildableTiles(16, 10, MEADOW_PATH),
  waves: buildWaveList(['scout', 'grunt', 'runner'], 8, 'boss'),
};

const CANYON: MapDefinition = {
  id: 'canyon',
  name: '협곡 경로',
  gridWidth: 18,
  gridHeight: 12,
  cellSize: 40,
  path: CANYON_PATH,
  buildableTiles: computeBuildableTiles(18, 12, CANYON_PATH),
  waves: buildWaveList(['runner', 'shielded', 'swarm', 'grunt'], 10, 'boss'),
};

const FORTRESS: MapDefinition = {
  id: 'fortress',
  name: '요새 경로',
  gridWidth: 20,
  gridHeight: 12,
  cellSize: 40,
  path: FORTRESS_PATH,
  buildableTiles: computeBuildableTiles(20, 12, FORTRESS_PATH),
  waves: buildWaveList(['grunt', 'tank', 'shielded', 'swarm', 'runner'], 12, 'boss'),
};

export const MAPS: MapDefinition[] = [MEADOW, CANYON, FORTRESS];
