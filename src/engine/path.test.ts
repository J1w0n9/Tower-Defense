import { describe, expect, it } from 'vitest';
import { computeBuildableTiles, distanceToPath, getPathLength, getPositionAtDistance } from './path';

const SIMPLE_PATH = [
  { x: 0.5, y: 0.5 },
  { x: 3.5, y: 0.5 },
  { x: 3.5, y: 3.5 },
];

describe('getPathLength', () => {
  it('sums the length of every segment', () => {
    expect(getPathLength(SIMPLE_PATH)).toBe(6);
  });
});

describe('getPositionAtDistance', () => {
  it('returns the start point at distance 0', () => {
    expect(getPositionAtDistance(SIMPLE_PATH, 0)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('returns a point partway along the first segment', () => {
    expect(getPositionAtDistance(SIMPLE_PATH, 1.5)).toEqual({ x: 2, y: 0.5 });
  });

  it('returns a point on the second segment after crossing the first', () => {
    expect(getPositionAtDistance(SIMPLE_PATH, 4)).toEqual({ x: 3.5, y: 1.5 });
  });

  it('clamps to the final point when distance exceeds path length', () => {
    expect(getPositionAtDistance(SIMPLE_PATH, 100)).toEqual({ x: 3.5, y: 3.5 });
  });
});

describe('distanceToPath', () => {
  it('returns 0 for a point on the path', () => {
    expect(distanceToPath({ x: 2, y: 0.5 }, SIMPLE_PATH)).toBe(0);
  });

  it('returns the perpendicular distance for a point off the path', () => {
    expect(distanceToPath({ x: 1, y: 2.5 }, SIMPLE_PATH)).toBe(2);
  });
});

describe('computeBuildableTiles', () => {
  it('excludes tiles whose center is within 1 unit of the path', () => {
    const tiles = computeBuildableTiles(5, 5, SIMPLE_PATH);
    expect(tiles).not.toContainEqual({ x: 1, y: 0 });
    expect(tiles).toContainEqual({ x: 0, y: 4 });
  });
});
