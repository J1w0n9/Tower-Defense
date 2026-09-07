import type { Point } from './types';
import { distance } from './vector';

export function getPathLength(path: Point[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distance(path[i - 1], path[i]);
  }
  return total;
}

export function getPositionAtDistance(path: Point[], targetDistance: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  let remaining = targetDistance;
  for (let i = 1; i < path.length; i++) {
    const segStart = path[i - 1];
    const segEnd = path[i];
    const segLength = distance(segStart, segEnd);
    if (remaining <= segLength) {
      const t = segLength === 0 ? 0 : remaining / segLength;
      return {
        x: segStart.x + (segEnd.x - segStart.x) * t,
        y: segStart.y + (segEnd.y - segStart.y) * t,
      };
    }
    remaining -= segLength;
  }
  return path[path.length - 1];
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;
  let t = lengthSquared === 0 ? 0 : ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  const closest = { x: a.x + abx * t, y: a.y + aby * t };
  return distance(p, closest);
}

export function distanceToPath(point: Point, path: Point[]): number {
  let min = Infinity;
  for (let i = 1; i < path.length; i++) {
    const d = pointToSegmentDistance(point, path[i - 1], path[i]);
    if (d < min) min = d;
  }
  return min;
}

export function computeBuildableTiles(gridWidth: number, gridHeight: number, path: Point[]): Point[] {
  const tiles: Point[] = [];
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const cellCenter = { x: x + 0.5, y: y + 0.5 };
      if (distanceToPath(cellCenter, path) >= 1.0) {
        tiles.push({ x, y });
      }
    }
  }
  return tiles;
}
