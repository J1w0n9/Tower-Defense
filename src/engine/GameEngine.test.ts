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

describe('GameEngine.sellTower', () => {
  it('removes the tower and refunds half its level-scaled cost', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'scout');
    const tower = engine.towers[0];
    engine.upgradeTower(tower.id);
    const goldBefore = engine.economy.gold;

    const result = engine.sellTower(tower.id);

    expect(result.success).toBe(true);
    expect(engine.towers).toHaveLength(0);
    expect(engine.economy.gold).toBe(goldBefore + Math.round(TOWERS_BY_ID.scout.cost * 0.5 * tower.level));
  });

  it('emits gold-changed on sell', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'scout');
    const spy = vi.fn();
    engine.events.on('gold-changed', spy);
    engine.sellTower(engine.towers[0].id);
    expect(spy).toHaveBeenCalledWith(engine.economy.gold);
  });

  it('fails when the tower does not exist', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    expect(engine.sellTower('nope')).toEqual({ success: false, reason: 'not-found' });
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

describe('GameEngine save/load', () => {
  it('serializes gold, lives, towers, and completed wave count', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'sniper');
    engine.startNextWave();

    const state = engine.serialize();
    expect(state).toEqual({
      mapId: 'test',
      gold: 500 - TOWERS_BY_ID.sniper.cost,
      lives: 20,
      completedWaves: 1,
      towers: [{ towerTypeId: 'sniper', position: { x: 2, y: 4 }, level: 1, supportMode: undefined }],
    });
  });

  it('loadSnapshot restores gold, lives, towers (with level/mode), and wave progress', () => {
    const source = new GameEngine(TEST_MAP, 500, 20);
    source.placeTower({ x: 2, y: 4 }, 'scout');
    source.upgradeTower(source.towers[0].id);
    source.placeTower({ x: 1, y: 4 }, 'dj');
    source.cycleSupportMode(source.towers[1].id);
    source.startNextWave();
    const state = source.serialize();

    const restored = new GameEngine(TEST_MAP, 999, 1);
    restored.loadSnapshot(state);

    expect(restored.economy.gold).toBe(state.gold);
    expect(restored.economy.lives).toBe(20);
    expect(restored.status).toBe('playing');
    expect(restored.towers).toHaveLength(2);
    const scout = restored.towers.find((t) => t.stats.id === 'scout')!;
    expect(scout.level).toBe(2);
    const dj = restored.towers.find((t) => t.stats.id === 'dj')!;
    expect(dj.supportMode).toBe('damage');
    expect(restored.getSnapshot().waveNumber).toBe(1);

    restored.update(1);
    expect(restored.enemies).toHaveLength(0);
  });
});

describe('GameEngine.getSnapshot', () => {
  it('exposes render-relevant tower and enemy state', () => {
    const engine = new GameEngine(TEST_MAP, 500, 20);
    engine.placeTower({ x: 2, y: 4 }, 'dj');
    engine.startNextWave();
    engine.update(1);

    const snapshot = engine.getSnapshot();
    expect(snapshot.towers).toEqual([
      expect.objectContaining({ towerTypeId: 'dj', isSupport: true, supportMode: 'range' }),
    ]);
    expect(snapshot.enemies).toHaveLength(1);
    expect(snapshot.enemies[0]).toEqual(
      expect.objectContaining({ hpFraction: 1, isBoss: false, isBurning: false })
    );
    expect(snapshot.gold).toBe(engine.economy.gold);
    expect(snapshot.totalWaves).toBe(2);
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
