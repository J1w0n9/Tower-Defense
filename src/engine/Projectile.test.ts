import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';
import { Projectile } from './Projectile';

describe('Projectile', () => {
  it('moves toward the target position at its configured speed', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.walker);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, { speed: 10, damage: 5 });

    projectile.advance(1, { x: 10, y: 0 });

    expect(projectile.position.x).toBeCloseTo(10);
    expect(projectile.position.y).toBeCloseTo(0);
  });

  it('reports it has reached the target once within the hit threshold', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.walker);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, { speed: 0.1, damage: 5 });

    expect(projectile.hasReached({ x: 5, y: 0 })).toBe(false);

    projectile.advance(1, { x: 0.1, y: 0 });

    expect(projectile.hasReached({ x: 0.1, y: 0 })).toBe(true);
  });

  it('carries optional splash and burn configuration', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.walker);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, {
      speed: 6,
      damage: 1,
      splashRadius: 1,
      burn: { damagePerTick: 3, durationSec: 5, tickIntervalSec: 1 },
    });

    expect(projectile.splashRadius).toBe(1);
    expect(projectile.burn).toEqual({ damagePerTick: 3, durationSec: 5, tickIntervalSec: 1 });
  });
});
