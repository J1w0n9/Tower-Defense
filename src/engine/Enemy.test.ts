import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';

describe('Enemy', () => {
  it('starts at full hp and not dead', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.grunt);
    expect(enemy.hp).toBe(50);
    expect(enemy.isDead).toBe(false);
    expect(enemy.hpFraction).toBe(1);
  });

  it('advances distanceTraveled based on speed and dt', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.scout);
    enemy.advance(2);
    expect(enemy.distanceTraveled).toBe(5);
  });

  it('reduces incoming damage by damageReduction', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.shielded);
    enemy.takeDamage(10);
    expect(enemy.hp).toBe(80 - 7);
  });

  it('becomes dead once hp drops to 0 or below', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.scout);
    enemy.takeDamage(100);
    expect(enemy.isDead).toBe(true);
  });

  it('moves at reduced speed while slowed, then returns to base speed', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.grunt);
    enemy.applySlow(0.5, 1);
    expect(enemy.speed).toBe(0.75);
    enemy.advance(1.5);
    expect(enemy.speed).toBe(1.5);
  });
});
