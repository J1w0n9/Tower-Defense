import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';

describe('Enemy', () => {
  it('starts at full hp and not dead', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.walker);
    expect(enemy.hp).toBe(50);
    expect(enemy.isDead).toBe(false);
    expect(enemy.hpFraction).toBe(1);
  });

  it('advances distanceTraveled based on speed and dt', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.runner);
    enemy.advance(2);
    expect(enemy.distanceTraveled).toBe(7);
  });

  it('reduces incoming damage by damageReduction', () => {
    const enemy = new Enemy('e1', { ...ENEMIES_BY_ID.tank, damageReduction: 0.3 });
    enemy.takeDamage(10);
    expect(enemy.hp).toBe(150 - 7);
  });

  it('becomes dead once hp drops to 0 or below', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.crawler);
    enemy.takeDamage(100);
    expect(enemy.isDead).toBe(true);
  });

  it('starts with no burning status', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.walker);
    expect(enemy.burnTicksRemaining).toBe(0);
  });

  it('applies burning damage once per tick interval until ticks run out', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.walker);
    enemy.applyBurn(3, 5, 1);
    expect(enemy.burnTicksRemaining).toBe(5);

    enemy.tickBurn(1);
    expect(enemy.hp).toBe(47);
    expect(enemy.burnTicksRemaining).toBe(4);

    enemy.tickBurn(0.5);
    expect(enemy.hp).toBe(47);

    enemy.tickBurn(0.5);
    expect(enemy.hp).toBe(44);
    expect(enemy.burnTicksRemaining).toBe(3);
  });

  it('refreshes duration instead of stacking when re-applied', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.walker);
    enemy.applyBurn(3, 5, 1);
    enemy.tickBurn(1);
    expect(enemy.burnTicksRemaining).toBe(4);

    enemy.applyBurn(3, 5, 1);
    expect(enemy.burnTicksRemaining).toBe(5);
  });

  it('stops burning once all ticks are consumed', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.walker);
    enemy.applyBurn(3, 2, 1);
    enemy.tickBurn(1);
    enemy.tickBurn(1);
    expect(enemy.burnTicksRemaining).toBe(0);
    enemy.tickBurn(1);
    expect(enemy.hp).toBe(50 - 6);
  });
});
