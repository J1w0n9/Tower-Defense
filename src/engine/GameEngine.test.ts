import { describe, expect, it, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import type { MapDefinition } from './types';

const TEST_MAP: MapDefinition = {
  id: 'test',
  name: 'Test Map',
  gridWidth: 5,
  gridHeight: 5,
  cellSize: 40,
  path: [
    { x: 0.5, y: 2.5 },
    { x: 4.5, y: 2.5 },
  ],
  buildableTiles: [
    { x: 1, y: 0 },
    { x: 1, y: 4 },
  ],
  waves: [
    { waveNumber: 1, spawns: [{ enemyId: 'scout', count: 1, spawnIntervalSec: 0.1 }] },
    { waveNumber: 2, spawns: [{ enemyId: 'boss', count: 1, spawnIntervalSec: 0.1 }] },
  ],
};

describe('GameEngine placeTower', () => {
  it('places a tower on a buildable tile and deducts gold', () => {
    const engine = new GameEngine(TEST_MAP);
    const startingGold = engine.getSnapshot().gold;

    const result = engine.placeTower({ x: 1, y: 0 }, 'basic');

    expect(result).toEqual({ success: true });
    expect(engine.getSnapshot().gold).toBe(startingGold - 50);
    expect(engine.getSnapshot().towers).toHaveLength(1);
  });

  it('refuses placement on a non-buildable tile', () => {
    const engine = new GameEngine(TEST_MAP);
    const result = engine.placeTower({ x: 2, y: 2 }, 'basic');
    expect(result).toEqual({ success: false, reason: 'not-buildable' });
  });

  it('refuses placement on an already-occupied tile', () => {
    const engine = new GameEngine(TEST_MAP);
    engine.placeTower({ x: 1, y: 0 }, 'basic');
    const result = engine.placeTower({ x: 1, y: 0 }, 'basic');
    expect(result).toEqual({ success: false, reason: 'occupied' });
  });

  it('refuses placement without enough gold', () => {
    const engine = new GameEngine(TEST_MAP);
    engine.placeTower({ x: 1, y: 0 }, 'sniper');
    const result = engine.placeTower({ x: 1, y: 4 }, 'sniper');
    expect(result).toEqual({ success: false, reason: 'insufficient-gold' });
  });
});

describe('GameEngine update loop', () => {
  it('spawns enemies from the active wave and moves them along the path', () => {
    const engine = new GameEngine(TEST_MAP);
    engine.startNextWave();

    engine.update(0.2); // spawnIntervalSec 0.1 이후 스폰

    const snapshot = engine.getSnapshot();
    expect(snapshot.enemies).toHaveLength(1);
    expect(snapshot.enemies[0].position.x).toBeGreaterThan(0.5);
  });

  // dt=0.02 (not 0.1) is deliberate: the projectile homes toward the target's
  // *current* position each tick, so a coarse dt combined with a fast
  // projectile (sniper speed 12) overshoots past a slow-moving scout every
  // tick and never lands within HIT_THRESHOLD — verified by simulation before
  // writing this test. dt=0.02 matches real per-frame granularity and converges.
  it('kills an enemy with a tower, grants gold, and removes the projectile', () => {
    const engine = new GameEngine(TEST_MAP);
    engine.placeTower({ x: 1, y: 0 }, 'sniper');
    engine.startNextWave();

    const goldAfterPlacement = engine.getSnapshot().gold;

    for (let i = 0; i < 1000; i++) {
      engine.update(0.02);
      if (engine.getSnapshot().enemies.length === 0) break;
    }

    const snapshot = engine.getSnapshot();
    expect(snapshot.enemies).toHaveLength(0);
    expect(snapshot.projectiles).toHaveLength(0);
    expect(snapshot.gold).toBeGreaterThan(goldAfterPlacement);
  });

  it('loses a life and emits lives-changed when an enemy reaches the end of the path', () => {
    const engine = new GameEngine(TEST_MAP);
    const livesListener = vi.fn();
    engine.on('lives-changed', livesListener);
    engine.startNextWave();

    for (let i = 0; i < 100; i++) {
      engine.update(0.5);
    }

    expect(engine.getSnapshot().lives).toBeLessThan(20);
    expect(livesListener).toHaveBeenCalled();
  });

  it('sets status to lost and stops simulating once lives reach zero', () => {
    const manyWaves = {
      ...TEST_MAP,
      waves: Array.from({ length: 25 }, (_, i) => ({
        waveNumber: i + 1,
        spawns: [{ enemyId: 'scout', count: 1, spawnIntervalSec: 0.1 }],
      })),
    };
    const engine = new GameEngine(manyWaves);
    const statusListener = vi.fn();
    engine.on('status-changed', statusListener);

    for (let wave = 0; wave < 20; wave++) {
      engine.startNextWave();
      for (let i = 0; i < 50; i++) {
        engine.update(0.5);
      }
    }

    expect(engine.getSnapshot().status).toBe('lost');
    expect(statusListener).toHaveBeenCalledWith('lost');
  });

  // Same dt=0.02 reasoning as the kill test above — a coarse dt would let
  // the scout escape before the sniper's projectile ever converges.
  it('sets status to won once all waves are cleared with no enemies remaining', () => {
    const winMap: MapDefinition = {
      ...TEST_MAP,
      waves: [{ waveNumber: 1, spawns: [{ enemyId: 'scout', count: 1, spawnIntervalSec: 0.1 }] }],
    };
    const engine = new GameEngine(winMap);
    engine.placeTower({ x: 1, y: 0 }, 'sniper');
    engine.startNextWave();

    for (let i = 0; i < 500; i++) {
      engine.update(0.02);
    }

    expect(engine.getSnapshot().status).toBe('won');
  });
});
