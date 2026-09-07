import type { EngineSnapshot } from '../engine/GameEngine';
import type { MapDefinition } from '../engine/types';

export function drawGame(ctx: CanvasRenderingContext2D, map: MapDefinition, snapshot: EngineSnapshot): void {
  const { cellSize, gridWidth, gridHeight } = map;

  ctx.clearRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);

  ctx.fillStyle = '#2f3a2f';
  ctx.fillRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);

  ctx.strokeStyle = '#8a7350';
  ctx.lineWidth = cellSize * 0.8;
  ctx.beginPath();
  map.path.forEach((point, i) => {
    const px = point.x * cellSize;
    const py = point.y * cellSize;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (const tile of map.buildableTiles) {
    ctx.fillRect(tile.x * cellSize, tile.y * cellSize, cellSize, cellSize);
  }

  ctx.fillStyle = '#4a90d9';
  for (const tower of snapshot.towers) {
    ctx.beginPath();
    ctx.arc((tower.position.x + 0.5) * cellSize, (tower.position.y + 0.5) * cellSize, cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const enemy of snapshot.enemies) {
    ctx.fillStyle = '#d94a4a';
    ctx.beginPath();
    ctx.arc(enemy.position.x * cellSize, enemy.position.y * cellSize, cellSize * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222222';
    ctx.fillRect(enemy.position.x * cellSize - cellSize * 0.25, enemy.position.y * cellSize - cellSize * 0.4, cellSize * 0.5, 4);
    ctx.fillStyle = '#4ad94a';
    ctx.fillRect(
      enemy.position.x * cellSize - cellSize * 0.25,
      enemy.position.y * cellSize - cellSize * 0.4,
      cellSize * 0.5 * enemy.hpFraction,
      4
    );
  }

  ctx.fillStyle = '#f5e642';
  for (const projectile of snapshot.projectiles) {
    ctx.beginPath();
    ctx.arc(projectile.position.x * cellSize, projectile.position.y * cellSize, cellSize * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}
