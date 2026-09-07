import type { WaveDefinition } from './types';

interface SpawnQueueEntry {
  enemyId: string;
  timeRemaining: number;
  intervalSec: number;
  remainingCount: number;
}

export class WaveManager {
  private waves: WaveDefinition[];
  private currentWaveIndex = -1;
  private spawnQueue: SpawnQueueEntry[] = [];
  private spawningComplete = true;

  constructor(waves: WaveDefinition[]) {
    this.waves = waves;
  }

  get totalWaves(): number {
    return this.waves.length;
  }

  get currentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  get hasMoreWaves(): boolean {
    return this.currentWaveIndex < this.waves.length - 1;
  }

  get isSpawningComplete(): boolean {
    return this.spawningComplete;
  }

  startNextWave(): boolean {
    if (!this.hasMoreWaves) return false;
    this.currentWaveIndex += 1;
    const wave = this.waves[this.currentWaveIndex];
    this.spawnQueue = wave.spawns.map((spawn) => ({
      enemyId: spawn.enemyId,
      timeRemaining: 0,
      intervalSec: spawn.spawnIntervalSec,
      remainingCount: spawn.count,
    }));
    this.spawningComplete = false;
    return true;
  }

  update(dt: number): string[] {
    const spawned: string[] = [];
    for (const entry of this.spawnQueue) {
      if (entry.remainingCount <= 0) continue;
      entry.timeRemaining -= dt;
      if (entry.timeRemaining <= 0) {
        spawned.push(entry.enemyId);
        entry.remainingCount -= 1;
        entry.timeRemaining = entry.intervalSec;
      }
    }
    this.spawningComplete = this.spawnQueue.every((entry) => entry.remainingCount <= 0);
    return spawned;
  }
}
