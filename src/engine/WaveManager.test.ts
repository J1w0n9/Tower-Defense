import { describe, expect, it } from 'vitest';
import { WaveManager } from './WaveManager';
import type { WaveDefinition } from './types';

const WAVES: WaveDefinition[] = [
  { waveNumber: 1, spawns: [{ enemyId: 'walker', count: 2, spawnIntervalSec: 1 }] },
  { waveNumber: 2, spawns: [{ enemyId: 'boss', count: 1, spawnIntervalSec: 1 }] },
];

describe('WaveManager', () => {
  it('reports totalWaves and starts with no wave in progress', () => {
    const manager = new WaveManager(WAVES);
    expect(manager.totalWaves).toBe(2);
    expect(manager.currentWaveNumber).toBe(0);
    expect(manager.hasMoreWaves).toBe(true);
  });

  it('advances to the next wave number when started', () => {
    const manager = new WaveManager(WAVES);
    expect(manager.startNextWave()).toBe(true);
    expect(manager.currentWaveNumber).toBe(1);
  });

  it('refuses to start a wave once all waves are exhausted', () => {
    const manager = new WaveManager(WAVES);
    manager.startNextWave();
    manager.startNextWave();
    expect(manager.hasMoreWaves).toBe(false);
    expect(manager.startNextWave()).toBe(false);
  });

  it('spawns enemies on the configured interval up to the configured count', () => {
    const manager = new WaveManager(WAVES);
    manager.startNextWave();

    expect(manager.update(1)).toEqual(['walker']);
    expect(manager.update(1)).toEqual(['walker']);
    expect(manager.update(1)).toEqual([]);
    expect(manager.isSpawningComplete).toBe(true);
  });
});
