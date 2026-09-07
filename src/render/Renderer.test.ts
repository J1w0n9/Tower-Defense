import { describe, expect, it, vi } from 'vitest';
import { drawGame } from './Renderer';
import type { EngineSnapshot } from '../engine/GameEngine';
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

const SNAPSHOT: EngineSnapshot = {
  towers: [{ id: 't1', statsId: 'basic', position: { x: 1, y: 0 }, level: 1 }],
  enemies: [{ id: 'e1', statsId: 'scout', position: { x: 2, y: 2.5 }, hpFraction: 0.5 }],
  projectiles: [{ id: 'p1', position: { x: 1.5, y: 2.5 } }],
  gold: 100,
  lives: 20,
  waveNumber: 1,
  totalWaves: 3,
  isWaveInProgress: true,
  status: 'playing',
};

describe('drawGame', () => {
  it('clears the canvas and draws without throwing', () => {
    const ctx = createMockContext();
    expect(() => drawGame(ctx, MAP, SNAPSHOT)).not.toThrow();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, MAP.gridWidth * MAP.cellSize, MAP.gridHeight * MAP.cellSize);
  });

  it('draws one arc per tower, enemy, and projectile', () => {
    const ctx = createMockContext();
    drawGame(ctx, MAP, SNAPSHOT);
    // 타워 1개 + 적 1개 + 투사체 1개 = arc 3번 호출
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBe(3);
  });
});
