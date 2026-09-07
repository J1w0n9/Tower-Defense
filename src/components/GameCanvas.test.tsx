import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameCanvas } from './GameCanvas';
import type { MapDefinition } from '../engine/types';

const MAP: MapDefinition = {
  id: 'test',
  name: 'Test',
  gridWidth: 5,
  gridHeight: 5,
  cellSize: 40,
  path: [{ x: 0.5, y: 2.5 }, { x: 4.5, y: 2.5 }],
  buildableTiles: [{ x: 1, y: 0 }],
  waves: [],
};

function makeFakeEngine() {
  return {
    update: vi.fn(),
    getSnapshot: vi.fn(() => ({
      towers: [],
      enemies: [],
      projectiles: [],
      gold: 100,
      lives: 20,
      waveNumber: 0,
      totalWaves: 1,
      isWaveInProgress: false,
      status: 'playing' as const,
    })),
    placeTower: vi.fn(() => ({ success: true })),
  };
}

describe('GameCanvas', () => {
  it('does not place a tower when no tower type is selected', () => {
    const engine = makeFakeEngine();
    render(<GameCanvas map={MAP} engine={engine as never} selectedTowerId={null} />);

    const canvas = screen.getByTestId('game-canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0 } as DOMRect);
    fireEvent.click(canvas, { clientX: 60, clientY: 20 });

    expect(engine.placeTower).not.toHaveBeenCalled();
  });

  it('places a tower at the clicked grid cell when a tower type is selected', () => {
    const engine = makeFakeEngine();
    const onPlacementResult = vi.fn();
    render(
      <GameCanvas map={MAP} engine={engine as never} selectedTowerId="basic" onPlacementResult={onPlacementResult} />
    );

    const canvas = screen.getByTestId('game-canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0 } as DOMRect);
    fireEvent.click(canvas, { clientX: 60, clientY: 20 });

    expect(engine.placeTower).toHaveBeenCalledWith({ x: 1, y: 0 }, 'basic');
    expect(onPlacementResult).toHaveBeenCalledWith({ success: true });
  });
});
