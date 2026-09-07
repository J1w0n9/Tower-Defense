import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';
import { Projectile } from './Projectile';

describe('Projectile', () => {
  it('moves toward the target position at its configured speed', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.scout);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, { speed: 10, damage: 5 });

    projectile.advance(1, { x: 10, y: 0 });

    expect(projectile.position.x).toBeCloseTo(10);
    expect(projectile.position.y).toBeCloseTo(0);
  });

  it('reports it has reached the target once within the hit threshold', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.scout);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, { speed: 0.1, damage: 5 });

    expect(projectile.hasReached({ x: 5, y: 0 })).toBe(false);

    projectile.advance(1, { x: 0.1, y: 0 });

    expect(projectile.hasReached({ x: 0.1, y: 0 })).toBe(true);
  });

  it('carries optional splash and slow configuration', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.scout);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, {
      speed: 6,
      damage: 15,
      splashRadius: 1.2,
      slowFactor: 0.5,
      slowDuration: 2,
    });

    expect(projectile.splashRadius).toBe(1.2);
    expect(projectile.slowFactor).toBe(0.5);
    expect(projectile.slowDuration).toBe(2);
  });
});
