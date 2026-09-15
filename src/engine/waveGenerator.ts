import type { WaveDefinition, WaveSpawn } from './types';

export function buildWaveList(enemyPool: string[], waveCount: number, bossId: string): WaveDefinition[] {
  const waves: WaveDefinition[] = [];
  for (let i = 0; i < waveCount; i++) {
    const enemyId = enemyPool[i % enemyPool.length];
    const count = 5 + i * 2;
    waves.push({ waveNumber: i + 1, spawns: [{ enemyId, count, spawnIntervalSec: 0.8 }] });
  }
  waves.push({
    waveNumber: waveCount + 1,
    spawns: [{ enemyId: bossId, count: 1, spawnIntervalSec: 1 }],
  });
  return waves;
}

/**
 * Generates a wave definition on demand for endless/survival mode, once a map's fixed wave
 * list is exhausted. Follows the same enemy-count scaling as buildWaveList so difficulty
 * ramps up smoothly across the fixed-to-endless transition, and adds an extra, ever-growing
 * boss spawn every 5th wave for escalating challenge.
 */
export function generateEndlessWave(waveNumber: number, enemyPool: string[], bossId: string): WaveDefinition {
  const enemyId = enemyPool[waveNumber % enemyPool.length];
  const count = 5 + (waveNumber - 1) * 2;
  const spawns: WaveSpawn[] = [{ enemyId, count, spawnIntervalSec: 0.8 }];

  if (waveNumber % 5 === 0) {
    spawns.push({ enemyId: bossId, count: waveNumber / 5, spawnIntervalSec: 2 });
  }

  return { waveNumber, spawns };
}
