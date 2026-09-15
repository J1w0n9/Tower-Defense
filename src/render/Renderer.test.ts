import { describe, expect, it, vi } from 'vitest';
import { drawGame, getEnemyColor, getTowerColor } from './Renderer';
import type { EngineSnapshot, EnemySnapshot, TowerSnapshot } from '../engine/GameEngine';
import type { MapDefinition } from '../engine/types';

function createMockContext() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
}

const MAP: MapDefinition = {
  id: 'test',
  name: 'Test',
  gridWidth: 5,
  gridHeight: 5,
  cellSize: 40,
  path: [
    { x: 0.5, y: 2.5 },
    { x: 4.5, y: 2.5 },
  ],
  buildableTiles: [{ x: 1, y: 0 }],
  waves: [],
};

function baseSnapshot(overrides: Partial<EngineSnapshot> = {}): EngineSnapshot {
  return {
    towers: [],
    enemies: [],
    projectiles: [],
    gold: 100,
    lives: 20,
    waveNumber: 1,
    totalWaves: 3,
    status: 'playing',
    ...overrides,
  };
}

const combatTower: TowerSnapshot = { id: 't1', towerTypeId: 'scout', position: { x: 1, y: 0 }, isSupport: false, range: 3 };
const commanderTower: TowerSnapshot = { id: 't2', towerTypeId: 'commander', position: { x: 2, y: 0 }, isSupport: true, range: 3 };
const djRange: TowerSnapshot = { ...commanderTower, id: 't3', towerTypeId: 'dj', supportMode: 'range' };
const djDamage: TowerSnapshot = { ...djRange, id: 't4', supportMode: 'damage' };
const djDiscount: TowerSnapshot = { ...djRange, id: 't5', supportMode: 'discount' };

describe('getTowerColor', () => {
  it('gives combat towers a color distinct from support towers', () => {
    expect(getTowerColor(combatTower)).not.toBe(getTowerColor(commanderTower));
  });

  it('gives each DJ support mode a distinct tint', () => {
    const colors = new Set([getTowerColor(djRange), getTowerColor(djDamage), getTowerColor(djDiscount)]);
    expect(colors.size).toBe(3);
  });

  it('gives each of the 5 combat tower types its own distinct color', () => {
    const ids = ['scout', 'soldier', 'sniper', 'minigunner', 'flamethrower'];
    const colors = new Set(
      ids.map((id) => getTowerColor({ id: id, towerTypeId: id, position: { x: 0, y: 0 }, isSupport: false, range: 1 }))
    );
    expect(colors.size).toBe(5);
  });
});

describe('getEnemyColor', () => {
  it('gives bosses a color distinct from regular enemies', () => {
    const enemy: EnemySnapshot = { id: 'e1', position: { x: 1, y: 1 }, hpFraction: 1, isBoss: false, isBurning: false };
    const boss: EnemySnapshot = { ...enemy, id: 'e2', isBoss: true };
    expect(getEnemyColor(enemy)).not.toBe(getEnemyColor(boss));
  });
});

describe('drawGame', () => {
  it('clears the canvas and draws without throwing', () => {
    const ctx = createMockContext();
    expect(() => drawGame(ctx, MAP, baseSnapshot())).not.toThrow();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, MAP.gridWidth * MAP.cellSize, MAP.gridHeight * MAP.cellSize);
  });

  it('draws one arc per enemy and per projectile', () => {
    const ctx = createMockContext();
    const snapshot = baseSnapshot({
      enemies: [{ id: 'e1', position: { x: 2, y: 2.5 }, hpFraction: 0.5, isBoss: false, isBurning: false }],
      projectiles: [{ id: 'p1', position: { x: 1.5, y: 2.5 } }],
    });
    drawGame(ctx, MAP, snapshot);
    expect(ctx.arc).toHaveBeenCalledTimes(2);
  });

  it('draws towers as circles too', () => {
    const ctx = createMockContext();
    const snapshot = baseSnapshot({ towers: [combatTower] });
    drawGame(ctx, MAP, snapshot);
    expect(ctx.arc).toHaveBeenCalledTimes(1);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
