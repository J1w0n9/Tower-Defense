import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import type { EnemyStats } from './types';

const WALKER: EnemyStats = { id: 'test-walker', name: 'Walker', hp: 50, speed: 1.5, reward: 8 };
const RUNNER: EnemyStats = { id: 'test-runner', name: 'Runner', hp: 15, speed: 3.5, reward: 6 };
const TANK: EnemyStats = { id: 'test-tank', name: 'Tank', hp: 150, speed: 0.8, reward: 20, damageReduction: 0.3 };
const CRAWLER: EnemyStats = { id: 'test-crawler', name: 'Crawler', hp: 10, speed: 2, reward: 3 };

describe('Enemy', () => {
  it('starts at full hp and not dead', () => {
    const enemy = new Enemy('e1', WALKER);
    expect(enemy.hp).toBe(50);
    expect(enemy.isDead).toBe(false);
    expect(enemy.hpFraction).toBe(1);
  });

  it('advances distanceTraveled based on speed and dt', () => {
    const enemy = new Enemy('e1', RUNNER);
    enemy.advance(2);
    expect(enemy.distanceTraveled).toBe(7);
  });

  it('reduces incoming damage by damageReduction', () => {
    const enemy = new Enemy('e1', TANK);
    enemy.takeDamage(10);
    expect(enemy.hp).toBe(150 - 7);
  });

  it('becomes dead once hp drops to 0 or below', () => {
    const enemy = new Enemy('e1', CRAWLER);
    enemy.takeDamage(100);
    expect(enemy.isDead).toBe(true);
  });

  it('starts with no burning status', () => {
    const enemy = new Enemy('e1', WALKER);
    expect(enemy.burnTicksRemaining).toBe(0);
  });

  it('applies burning damage once per tick interval until ticks run out', () => {
    const enemy = new Enemy('e1', WALKER);
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
    const enemy = new Enemy('e1', WALKER);
    enemy.applyBurn(3, 5, 1);
    enemy.tickBurn(1);
    expect(enemy.burnTicksRemaining).toBe(4);

    enemy.applyBurn(3, 5, 1);
    expect(enemy.burnTicksRemaining).toBe(5);
  });

  it('stops burning once all ticks are consumed', () => {
    const enemy = new Enemy('e1', WALKER);
    enemy.applyBurn(3, 2, 1);
    enemy.tickBurn(1);
    enemy.tickBurn(1);
    expect(enemy.burnTicksRemaining).toBe(0);
    enemy.tickBurn(1);
    expect(enemy.hp).toBe(50 - 6);
  });
});
