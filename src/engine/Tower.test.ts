import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';
import { Tower } from './Tower';
import { TOWERS_BY_ID } from './towers';

function makeCandidate(id: string, statsId: string, distanceTraveled: number, position: { x: number; y: number }) {
  const enemy = new Enemy(id, ENEMIES_BY_ID[statsId]);
  enemy.distanceTraveled = distanceTraveled;
  return { enemy, position };
}

describe('Tower', () => {
  it('reports its center position as the middle of its grid cell', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 2, y: 3 });
    expect(tower.centerPosition).toEqual({ x: 2.5, y: 3.5 });
  });

  it('increases range and damage with each upgrade level', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    const baseRange = tower.range;
    const baseDamage = tower.damage;
    tower.upgrade();
    expect(tower.range).toBeGreaterThan(baseRange);
    expect(tower.damage).toBeGreaterThan(baseDamage);
  });

  it('refuses to upgrade past the max level', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    tower.upgrade();
    tower.upgrade();
    expect(tower.canUpgrade()).toBe(false);
    tower.upgrade();
    expect(tower.level).toBe(3);
  });

  it('cannot fire until the cooldown reaches zero, then resets on fire', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    expect(tower.canFire).toBe(true);
    tower.resetCooldown();
    expect(tower.canFire).toBe(false);
    tower.tick(1);
    expect(tower.canFire).toBe(true);
  });

  it('returns null when no enemy is within range', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    const candidates = [makeCandidate('e1', 'scout', 0, { x: 50, y: 50 })];
    expect(tower.findTarget(candidates)).toBeNull();
  });

  it('targets the enemy furthest along the path for "first" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    const near = makeCandidate('near', 'scout', 1, { x: 0.5, y: 0.5 });
    const far = makeCandidate('far', 'scout', 5, { x: 1.5, y: 0.5 });
    const target = tower.findTarget([near, far]);
    expect(target).toBe(far.enemy);
  });

  it('targets the highest-hp enemy for "strongest" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.sniper, { x: 0, y: 0 });
    const weak = makeCandidate('weak', 'scout', 0, { x: 0.5, y: 0.5 });
    const strong = makeCandidate('strong', 'tank', 0, { x: 1.5, y: 0.5 });
    const target = tower.findTarget([weak, strong]);
    expect(target).toBe(strong.enemy);
  });

  it('targets the physically closest enemy for "closest" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.splash, { x: 0, y: 0 });
    const near = makeCandidate('near', 'scout', 0, { x: 0.6, y: 0.5 });
    const far = makeCandidate('far', 'scout', 0, { x: 2, y: 0.5 });
    const target = tower.findTarget([near, far]);
    expect(target).toBe(near.enemy);
  });
});
