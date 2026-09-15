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

  it('skipToWave marks the given wave number complete without queuing spawns', () => {
    const manager = new WaveManager(WAVES);
    manager.skipToWave(1);
    expect(manager.currentWaveNumber).toBe(1);
    expect(manager.isSpawningComplete).toBe(true);
    expect(manager.update(1)).toEqual([]);
    expect(manager.hasMoreWaves).toBe(true);
  });

  it('skipToWave(0) resets to before the first wave', () => {
    const manager = new WaveManager(WAVES);
    manager.startNextWave();
    manager.skipToWave(0);
    expect(manager.currentWaveNumber).toBe(0);
    expect(manager.hasMoreWaves).toBe(true);
  });

  it('without a generator, hasMoreWaves becomes false once the fixed list is exhausted', () => {
    const manager = new WaveManager(WAVES);
    manager.startNextWave();
    manager.startNextWave();
    expect(manager.hasMoreWaves).toBe(false);
  });

  it('with a generator, hasMoreWaves stays true past the fixed list, and startNextWave uses it', () => {
    const generateWave = (waveNumber: number) => ({
      waveNumber,
      spawns: [{ enemyId: 'endless', count: waveNumber, spawnIntervalSec: 0.5 }],
    });
    const manager = new WaveManager(WAVES, generateWave);
    manager.startNextWave();
    manager.startNextWave();
    expect(manager.hasMoreWaves).toBe(true);

    expect(manager.startNextWave()).toBe(true);
    expect(manager.currentWaveNumber).toBe(3);
    expect(manager.update(1)).toEqual(['endless']);
  });
});
