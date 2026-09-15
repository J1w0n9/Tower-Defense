import { fireEvent, render } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import GameCanvas from './GameCanvas.vue';
import { GameEngine } from '../engine/GameEngine';
import type { MapDefinition } from '../engine/types';

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

function mockRect(canvas: HTMLElement) {
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 200,
    bottom: 200,
    width: 200,
    height: 200,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

describe('GameCanvas', () => {
  it('renders a canvas sized from the map', () => {
    const engine = new GameEngine(MAP, 500, 20);
    const { container } = render(GameCanvas, { props: { map: MAP, engine, selectedTowerId: null } });
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(MAP.gridWidth * MAP.cellSize);
    expect(canvas.height).toBe(MAP.gridHeight * MAP.cellSize);
  });

  it('places a tower at the clicked cell when a tower is selected and emits the result', async () => {
    const engine = new GameEngine(MAP, 500, 20);
    const spy = vi.spyOn(engine, 'placeTower');
    const { container, emitted } = render(GameCanvas, { props: { map: MAP, engine, selectedTowerId: 'scout' } });
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    mockRect(canvas);

    await fireEvent.click(canvas, { clientX: 45, clientY: 5 });

    expect(spy).toHaveBeenCalledWith({ x: 1, y: 0 }, 'scout');
    expect(emitted()['placement-result']).toBeTruthy();
  });

  it('does not place a tower when no tower is selected', async () => {
    const engine = new GameEngine(MAP, 500, 20);
    const spy = vi.spyOn(engine, 'placeTower');
    const { container } = render(GameCanvas, { props: { map: MAP, engine, selectedTowerId: null } });
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    mockRect(canvas);

    await fireEvent.click(canvas, { clientX: 45, clientY: 5 });

    expect(spy).not.toHaveBeenCalled();
  });
});
