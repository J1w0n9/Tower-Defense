import { describe, expect, it } from 'vitest';
import { add, distance, normalize, scale, subtract } from './vector';

describe('vector utils', () => {
  it('computes euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('subtracts two points', () => {
    expect(subtract({ x: 5, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 3, y: 4 });
  });

  it('adds two points', () => {
    expect(add({ x: 1, y: 1 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 });
  });

  it('scales a vector by a factor', () => {
    expect(scale({ x: 2, y: 3 }, 2)).toEqual({ x: 4, y: 6 });
  });

  it('normalizes a vector to unit length', () => {
    const result = normalize({ x: 3, y: 4 });
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);
  });

  it('normalizes a zero vector to zero without dividing by zero', () => {
    expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
});
