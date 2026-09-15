import type { WaveDefinition } from './types';

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
