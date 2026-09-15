import { fireEvent, render, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import { MAPS } from './engine/maps';

function mockCanvasRect(canvas: HTMLCanvasElement) {
  // Match the mocked rect to the canvas's own internal resolution so displayed size == internal
  // size (scale factor 1), independent of GameCanvas's CSS scaling (covered separately).
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: canvas.width,
    bottom: canvas.height,
    width: canvas.width,
    height: canvas.height,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

function clickTile(canvas: HTMLCanvasElement, tile: { x: number; y: number }): Promise<void> {
  const cellSize = MAPS[0].cellSize;
  return fireEvent.click(canvas, { clientX: tile.x * cellSize + 1, clientY: tile.y * cellSize + 1 });
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the map select screen first', () => {
    render(App);
    expect(screen.getByText(MAPS[0].name)).toBeInTheDocument();
  });

  it('shows the HUD, tower shop, and canvas once a map is selected', async () => {
    render(App);
    await fireEvent.click(screen.getByText(MAPS[0].name));

    expect(screen.getByText(/골드/)).toBeInTheDocument();
    expect(document.querySelector('canvas')).not.toBeNull();
  });

  it('selecting a placed tower shows the upgrade panel, and upgrading raises its level', async () => {
    const { container } = render(App);
    await fireEvent.click(screen.getByText(MAPS[0].name));
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    mockCanvasRect(canvas);
    const tile = MAPS[0].buildableTiles[0];

    await fireEvent.click(screen.getByText('스카웃 (40G)'));
    await clickTile(canvas, tile);
    await fireEvent.click(screen.getByText('스카웃 (40G)'));
    await clickTile(canvas, tile);

    expect(screen.getByText('스카웃 (Lv.1)')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: /업그레이드/ }));
    expect(screen.getByText('스카웃 (Lv.2)')).toBeInTheDocument();
  });

  it('selling a placed tower refunds gold and removes the inspector panel', async () => {
    const { container } = render(App);
    await fireEvent.click(screen.getByText(MAPS[0].name));
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    mockCanvasRect(canvas);
    const tile = MAPS[0].buildableTiles[0];

    await fireEvent.click(screen.getByText('스카웃 (40G)'));
    await clickTile(canvas, tile);
    await fireEvent.click(screen.getByText('스카웃 (40G)'));
    await clickTile(canvas, tile);
    expect(screen.getByText('골드: 110')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /판매/ }));

    expect(screen.getByText('골드: 130')).toBeInTheDocument();
    expect(screen.queryByText(/스카웃 \(Lv\./)).not.toBeInTheDocument();
  });

  it('save then load restores gold to the value at save time', async () => {
    const { container } = render(App);
    await fireEvent.click(screen.getByText(MAPS[0].name));
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    mockCanvasRect(canvas);

    await fireEvent.click(screen.getByText('스카웃 (40G)'));
    await clickTile(canvas, MAPS[0].buildableTiles[0]);
    expect(screen.getByText('골드: 110')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await clickTile(canvas, MAPS[0].buildableTiles[1]);
    expect(screen.getByText('골드: 70')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: '불러오기' }));
    expect(screen.getByText('골드: 110')).toBeInTheDocument();
  });
});
