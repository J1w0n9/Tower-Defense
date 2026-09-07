import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';

describe('MAPS', () => {
  it('defines exactly 3 maps with unique ids', () => {
    expect(MAPS).toHaveLength(3);
    expect(new Set(MAPS.map((m) => m.id)).size).toBe(3);
  });

  it('gives every map at least one wave plus a boss wave', () => {
    for (const map of MAPS) {
      expect(map.waves.length).toBeGreaterThan(1);
      expect(map.waves.at(-1)?.spawns[0].enemyId).toBe('boss');
    }
  });

  it('keeps every map path fully inside its grid bounds', () => {
    for (const map of MAPS) {
      for (const point of map.path) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(map.gridWidth);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(map.gridHeight);
      }
    }
  });

  it('gives every map at least one buildable tile', () => {
    for (const map of MAPS) {
      expect(map.buildableTiles.length).toBeGreaterThan(0);
    }
  });
});
