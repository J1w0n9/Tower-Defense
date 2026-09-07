import { describe, expect, it } from 'vitest';
import { buildWaveList } from './waveGenerator';

describe('buildWaveList', () => {
  it('creates one wave per waveCount plus a final boss wave', () => {
    const waves = buildWaveList(['scout', 'grunt'], 3, 'boss');
    expect(waves).toHaveLength(4);
    expect(waves[3].spawns).toEqual([{ enemyId: 'boss', count: 1, spawnIntervalSec: 1 }]);
  });

  it('cycles through the enemy pool and increases enemy count each wave', () => {
    const waves = buildWaveList(['scout', 'grunt'], 4, 'boss');
    expect(waves[0].spawns[0].enemyId).toBe('scout');
    expect(waves[1].spawns[0].enemyId).toBe('grunt');
    expect(waves[2].spawns[0].enemyId).toBe('scout');
    expect(waves[1].spawns[0].count).toBeGreaterThan(waves[0].spawns[0].count);
  });

  it('numbers waves starting at 1', () => {
    const waves = buildWaveList(['scout'], 2, 'boss');
    expect(waves.map((w) => w.waveNumber)).toEqual([1, 2, 3]);
  });
});
