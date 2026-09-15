import type { EngineSnapshot, EnemySnapshot, TowerSnapshot } from '../engine/GameEngine';
import type { MapDefinition, SupportMode } from '../engine/types';

const COLORS = {
  background: '#2f3a2f',
  path: '#5c5240',
  buildable: 'rgba(255,255,255,0.05)',
  combatTower: '#7a7a5f',
  supportFixed: '#d9822b',
  supportByMode: {
    range: '#d9b32b',
    damage: '#d9542b',
    discount: '#3ab3d9',
  } satisfies Record<SupportMode, string>,
  enemy: '#5f7a3a',
  boss: '#33501f',
  burnOutline: '#e0602b',
  hpBarBg: '#222222',
  hpBarFg: '#4ad94a',
  projectile: '#f5e642',
};

export function getTowerColor(tower: TowerSnapshot): string {
  if (!tower.isSupport) return COLORS.combatTower;
  if (!tower.supportMode) return COLORS.supportFixed;
  return COLORS.supportByMode[tower.supportMode];
}

export function getEnemyColor(enemy: EnemySnapshot): string {
  return enemy.isBoss ? COLORS.boss : COLORS.enemy;
}

export function drawGame(ctx: CanvasRenderingContext2D, map: MapDefinition, snapshot: EngineSnapshot): void {
  const { cellSize, gridWidth, gridHeight } = map;

  ctx.clearRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);

  ctx.strokeStyle = COLORS.path;
  ctx.lineWidth = cellSize * 0.8;
  ctx.beginPath();
  map.path.forEach((point, i) => {
    const px = point.x * cellSize;
    const py = point.y * cellSize;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = COLORS.buildable;
  for (const tile of map.buildableTiles) {
    ctx.fillRect(tile.x * cellSize, tile.y * cellSize, cellSize, cellSize);
  }

  for (const tower of snapshot.towers) {
    ctx.fillStyle = getTowerColor(tower);
    ctx.fillRect(tower.position.x * cellSize, tower.position.y * cellSize, cellSize, cellSize);
  }

  for (const enemy of snapshot.enemies) {
    const radius = (enemy.isBoss ? 0.4 : 0.25) * cellSize;
    const px = enemy.position.x * cellSize;
    const py = enemy.position.y * cellSize;

    ctx.fillStyle = getEnemyColor(enemy);
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.isBurning) {
      ctx.strokeStyle = COLORS.burnOutline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    const barWidth = cellSize * 0.5;
    const barX = px - barWidth / 2;
    const barY = py - radius - 6;
    ctx.fillStyle = COLORS.hpBarBg;
    ctx.fillRect(barX, barY, barWidth, 4);
    ctx.fillStyle = COLORS.hpBarFg;
    ctx.fillRect(barX, barY, barWidth * enemy.hpFraction, 4);
  }

  ctx.fillStyle = COLORS.projectile;
  for (const projectile of snapshot.projectiles) {
    ctx.beginPath();
    ctx.arc(projectile.position.x * cellSize, projectile.position.y * cellSize, cellSize * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}
