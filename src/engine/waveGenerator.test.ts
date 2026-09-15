import { describe, expect, it } from 'vitest';
import { buildWaveList, generateEndlessWave } from './waveGenerator';

describe('buildWaveList', () => {
  it('creates one wave per waveCount plus a final boss wave', () => {
    const waves = buildWaveList(['walker', 'runner'], 3, 'boss');
    expect(waves).toHaveLength(4);
    expect(waves[3].spawns).toEqual([{ enemyId: 'boss', count: 1, spawnIntervalSec: 1 }]);
  });

  it('cycles through the enemy pool and increases enemy count each wave', () => {
    const waves = buildWaveList(['walker', 'runner'], 4, 'boss');
    expect(waves[0].spawns[0].enemyId).toBe('walker');
    expect(waves[1].spawns[0].enemyId).toBe('runner');
    expect(waves[2].spawns[0].enemyId).toBe('walker');
    expect(waves[1].spawns[0].count).toBeGreaterThan(waves[0].spawns[0].count);
  });

  it('numbers waves starting at 1', () => {
    const waves = buildWaveList(['walker'], 2, 'boss');
    expect(waves.map((w) => w.waveNumber)).toEqual([1, 2, 3]);
  });
});

describe('generateEndlessWave', () => {
  it('cycles the enemy pool and keeps increasing the enemy count', () => {
    const wave10 = generateEndlessWave(10, ['walker', 'runner'], 'boss');
    const wave11 = generateEndlessWave(11, ['walker', 'runner'], 'boss');
    expect(wave10.spawns[0].enemyId).toBe('walker');
    expect(wave11.spawns[0].enemyId).toBe('runner');
    expect(wave11.spawns[0].count).toBeGreaterThan(wave10.spawns[0].count);
  });

  it('never runs out - counts keep growing well past any fixed wave list length', () => {
    const early = generateEndlessWave(20, ['walker'], 'boss');
    const late = generateEndlessWave(50, ['walker'], 'boss');
    expect(late.spawns[0].count).toBeGreaterThan(early.spawns[0].count);
  });

  it('adds a scaling boss spawn every 5th wave on top of the regular spawn', () => {
    const wave5 = generateEndlessWave(5, ['walker'], 'boss');
    const wave10 = generateEndlessWave(10, ['walker'], 'boss');
    expect(wave5.spawns).toHaveLength(2);
    expect(wave5.spawns[1]).toMatchObject({ enemyId: 'boss', count: 1 });
    expect(wave10.spawns[1].count).toBeGreaterThan(wave5.spawns[1].count);
  });

  it('does not add a boss spawn on non-multiple-of-5 waves', () => {
    const wave7 = generateEndlessWave(7, ['walker'], 'boss');
    expect(wave7.spawns).toHaveLength(1);
  });
});
