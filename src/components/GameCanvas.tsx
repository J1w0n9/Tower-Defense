import { useEffect, useRef } from 'react';
import { drawGame } from '../render/Renderer';
import type { GameEngine, PlaceTowerResult } from '../engine/GameEngine';
import type { MapDefinition } from '../engine/types';

export interface GameCanvasProps {
  map: MapDefinition;
  engine: GameEngine;
  selectedTowerId: string | null;
  onPlacementResult?: (result: PlaceTowerResult) => void;
}

export function GameCanvas({ map, engine, selectedTowerId, onPlacementResult }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      engine.update(dt);
      drawGame(ctx, map, engine.getSnapshot());
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [engine, map]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTowerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cell = {
      x: Math.floor((event.clientX - rect.left) / map.cellSize),
      y: Math.floor((event.clientY - rect.top) / map.cellSize),
    };
    const result = engine.placeTower(cell, selectedTowerId);
    onPlacementResult?.(result);
  };

  return (
    <canvas
      ref={canvasRef}
      width={map.gridWidth * map.cellSize}
      height={map.gridHeight * map.cellSize}
      onClick={handleClick}
      data-testid="game-canvas"
    />
  );
}
