import { describe, expect, it, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import { TOWERS_BY_ID } from './towers';
import type { MapDefinition } from './types';

const TEST_MAP: MapDefinition = {
  id: 'test',
  name: 'Test Map',
  gridWidth: 21,
  gridHeight: 6,
  cellSize: 40,
  path: [
    { x: 0.5, y: 5.5 },
    { x: 20.5, y: 5.5 },
  ],
  buildableTiles: [
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 3, y: 4 },
  ],
  waves: [
    { waveNumber: 1, spawns: [{ enemyId: 'walker', count: 1, spawnIntervalSec: 1 }] },
    { waveNumber: 2, spawns: [{ enemyId: 'crawler', count: 1, spawnIntervalSec: 1 }] },
  ],
};

describe('GameEngine setup', () => {
  it('starts with the given gold/lives and playing status', () => {
    const engine = new GameEngine(TEST_MAP, 150, 20);
    expect(engine.economy.gold).toBe(150);
    expect(engine.economy.lives).toBe(20);
    expect(engine.status).toBe('playing');
    expect(engine.towers).toHaveLength(0);
  });
});

describe('GameEngine.placeTower', () => {
  it('places a tower on a buildable tile and spends gold', () => {
    const engine = new GameEngine(TEST_MAP, 150, 20);
    const result = engine.placeTower({ x: 2, y: 4 }, 'scout');
    expect(result.success).toBe(true);
    expect(engine.towers).toHaveLength(1);
    expect(engine.economy.gold).toBe(150 - TOWERS_BY_ID.scout.cost);
  });

  it('refuses to place a tower on a non-buildable tile', () => {
    const engine = new GameEngine(TEST_MAP, 150, 20);
    expect(engine.placeTower({ x: 0, y: 1 }, 'scout')).toEqual({ success: false, reason: 'not-buildable' });
  });

  it('refuses to place a tower without enough gold', () => {
    const engine = new GameEngine(TEST_MAP, 10, 20);
    expect(engine.placeTower({ x: 2, y: 4 }, 'sniper')).toEqual({ success: false, reason: 'insufficient-gold' });
  });

  it('refuses to place a tower on an already-occupied tile', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'scout');
    expect(engine.placeTower({ x: 2, y: 4 }, 'scout')).toEqual({ success: false, reason: 'occupied' });
  });

  it('emits gold-changed after spending on a tower', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    const spy = vi.fn();
    engine.events.on('gold-changed', spy);
    engine.placeTower({ x: 2, y: 4 }, 'scout');
    expect(spy).toHaveBeenCalledWith(500 - TOWERS_BY_ID.scout.cost);
  });
});

describe('GameEngine.upgradeTower', () => {
  it('upgrades a tower when affordable and below max level', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'scout');
    const tower = engine.towers[0];
    const before = tower.damage;
    expect(engine.upgradeTower(tower.id).success).toBe(true);
    expect(tower.damage).toBeGreaterThan(before);
  });
});

describe('GameEngine support buffs', () => {
  it('buffs nearby combat towers when a commander is in range', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 1, y: 4 }, 'scout');
    engine.placeTower({ x: 2, y: 4 }, 'commander');
    engine.update(0.001);
    const scout = engine.towers.find((t) => t.stats.id === 'scout')!;
    expect(scout.rangeMultiplier).toBeCloseTo(1.3);
    expect(scout.damageMultiplier).toBeCloseTo(1.3);
  });

  it('cycles DJ modes and discounts nearby upgrade cost in discount mode', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 1, y: 4 }, 'scout');
    engine.placeTower({ x: 2, y: 4 }, 'dj');
    const dj = engine.towers.find((t) => t.stats.id === 'dj')!;
    expect(dj.supportMode).toBe('range');
    engine.cycleSupportMode(dj.id);
    engine.cycleSupportMode(dj.id);
    expect(dj.supportMode).toBe('discount');

    engine.update(0.001);
    const scout = engine.towers.find((t) => t.stats.id === 'scout')!;
    expect(scout.upgradeCostMultiplier).toBeCloseTo(0.5);
  });
});

describe('GameEngine wave and combat loop', () => {
  it('spawns enemies from the started wave', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.startNextWave();
    engine.update(1);
    expect(engine.enemies).toHaveLength(1);
    expect(engine.enemies[0].statsId).toBe('walker');
  });

  it('reduces lives, emits lives-changed, and removes the enemy once it reaches the end of the path', () => {
    const engine = new GameEngine(TEST_MAP, 500, 5);
    const spy = vi.fn();
    engine.events.on('lives-changed', spy);
    engine.startNextWave();
    for (let i = 0; i < 20; i++) engine.update(1);
    expect(engine.economy.lives).toBeLessThan(5);
    expect(engine.enemies).toHaveLength(0);
    expect(spy).toHaveBeenCalled();
  });

  it('kills a nearby enemy with tower fire and grants its gold reward', () => {
    const weakWaveMap: MapDefinition = {
      ...TEST_MAP,
      waves: [{ waveNumber: 1, spawns: [{ enemyId: 'crawler', count: 1, spawnIntervalSec: 1 }] }],
    };
    const engine = new GameEngine(weakWaveMap, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'sniper');
    engine.startNextWave();
    const goldBefore = engine.economy.gold;
    for (let i = 0; i < 10; i++) engine.update(0.5);
    expect(engine.enemies.find((e) => e.statsId === 'crawler')).toBeUndefined();
    expect(engine.economy.gold).toBeGreaterThan(goldBefore);
  });

  it('flamethrower applies a burning DoT to enemies it hits', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'flamethrower');
    engine.startNextWave();
    for (let i = 0; i < 9; i++) engine.update(0.2);
    const walker = engine.enemies.find((e) => e.statsId === 'walker');
    expect(walker?.burnTicksRemaining).toBeGreaterThan(0);
  });

  it('emits status-changed and marks the game lost once lives reach zero', () => {
    const engine = new GameEngine(TEST_MAP, 500, 1);
    const spy = vi.fn();
    engine.events.on('status-changed', spy);
    engine.startNextWave();
    for (let i = 0; i < 20; i++) engine.update(1);
    expect(engine.status).toBe('lost');
    expect(spy).toHaveBeenCalledWith('lost');
  });

  it('marks the game won once all waves are cleared and no enemies remain', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'sniper');
    engine.startNextWave();
    for (let i = 0; i < 40; i++) engine.update(0.5);
    expect(engine.enemies).toHaveLength(0);

    engine.startNextWave();
    for (let i = 0; i < 40; i++) engine.update(0.5);
    expect(engine.status).toBe('won');
  });
});
