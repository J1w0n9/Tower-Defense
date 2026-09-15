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

describe('Tower basics', () => {
  it('reports its center position as the middle of its grid cell', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 2, y: 3 });
    expect(tower.centerPosition).toEqual({ x: 2.5, y: 3.5 });
  });

  it('increases range and damage with each upgrade level', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 0, y: 0 });
    const baseRange = tower.range;
    const baseDamage = tower.damage;
    tower.upgrade();
    expect(tower.range).toBeGreaterThan(baseRange);
    expect(tower.damage).toBeGreaterThan(baseDamage);
  });

  it('scales sell value with level', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 0, y: 0 });
    const baseValue = tower.sellValue;
    tower.upgrade();
    expect(tower.sellValue).toBeGreaterThan(baseValue);
  });

  it('refuses to upgrade past the max level', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 0, y: 0 });
    tower.upgrade();
    tower.upgrade();
    expect(tower.canUpgrade()).toBe(false);
    tower.upgrade();
    expect(tower.level).toBe(3);
  });

  it('cannot fire until the cooldown reaches zero, then resets on fire', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 0, y: 0 });
    expect(tower.canFire).toBe(true);
    tower.registerShotFired();
    expect(tower.canFire).toBe(false);
    tower.tick(10);
    expect(tower.canFire).toBe(true);
  });

  it('returns null when no enemy is within range', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 0, y: 0 });
    const candidates = [makeCandidate('e1', 'walker', 0, { x: 50, y: 50 })];
    expect(tower.findTarget(candidates)).toBeNull();
  });

  it('targets the enemy furthest along the path for "first" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 0, y: 0 });
    const near = makeCandidate('near', 'walker', 1, { x: 0.5, y: 0.5 });
    const far = makeCandidate('far', 'walker', 5, { x: 1.5, y: 0.5 });
    expect(tower.findTarget([near, far])).toBe(far.enemy);
  });

  it('targets the highest-hp enemy for "strongest" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.sniper, { x: 0, y: 0 });
    const weak = makeCandidate('weak', 'walker', 0, { x: 0.5, y: 0.5 });
    const strong = makeCandidate('strong', 'tank', 0, { x: 1.5, y: 0.5 });
    expect(tower.findTarget([weak, strong])).toBe(strong.enemy);
  });

  it('targets the physically closest enemy for "closest" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.flamethrower, { x: 0, y: 0 });
    const near = makeCandidate('near', 'walker', 0, { x: 0.6, y: 0.5 });
    const far = makeCandidate('far', 'walker', 0, { x: 1.5, y: 0.5 });
    expect(tower.findTarget([near, far])).toBe(near.enemy);
  });
});

describe('Tower burst fire (soldier)', () => {
  it('fires the full burst without waiting for the fireRate cooldown between shots, then cools down once', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.soldier, { x: 0, y: 0 });

    expect(tower.canFire).toBe(true);
    tower.registerShotFired();
    expect(tower.canFire).toBe(false);

    tower.tick(0.1);
    expect(tower.canFire).toBe(true);
    tower.registerShotFired();
    expect(tower.canFire).toBe(false);

    tower.tick(0.1);
    expect(tower.canFire).toBe(true);
    tower.registerShotFired();

    expect(tower.canFire).toBe(false);
    tower.tick(0.1);
    expect(tower.canFire).toBe(false);
    tower.tick(1);
    expect(tower.canFire).toBe(true);
  });
});

describe('Tower spin-up (minigunner)', () => {
  it('is not ready to fire until spin-up completes, and resets when the target is fully lost', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.minigunner, { x: 0, y: 0 });

    expect(tower.spinUpComplete).toBe(false);
    tower.advanceSpinUp(1);
    expect(tower.spinUpComplete).toBe(false);
    tower.advanceSpinUp(1);
    expect(tower.spinUpComplete).toBe(true);

    tower.resetSpinUp();
    expect(tower.spinUpComplete).toBe(false);
  });
});

describe('Tower burn payload (flamethrower)', () => {
  it('exposes its burn configuration for the engine to apply on hit', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.flamethrower, { x: 0, y: 0 });
    expect(tower.stats.burnDamagePerTick).toBe(3);
    expect(tower.stats.burnDurationSec).toBe(5);
    expect(tower.stats.burnTickIntervalSec).toBe(1);
  });
});

describe('Support towers', () => {
  it('marks commander and DJ as support towers that never fire', () => {
    const commander = new Tower('t1', TOWERS_BY_ID.commander, { x: 0, y: 0 });
    const dj = new Tower('t2', TOWERS_BY_ID.dj, { x: 0, y: 0 });
    expect(commander.isSupport).toBe(true);
    expect(dj.isSupport).toBe(true);
  });

  it('applies externally-set buff multipliers to range and damage', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 0, y: 0 });
    const baseRange = tower.range;
    const baseDamage = tower.damage;
    tower.rangeMultiplier = 1.3;
    tower.damageMultiplier = 1.3;
    expect(tower.range).toBeCloseTo(baseRange * 1.3);
    expect(tower.damage).toBeCloseTo(baseDamage * 1.3);
  });

  it('applies the upgrade cost multiplier for discounted upgrades', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.scout, { x: 0, y: 0 });
    const baseCost = tower.upgradeCost;
    tower.upgradeCostMultiplier = 0.5;
    expect(tower.upgradeCost).toBeCloseTo(baseCost * 0.5);
  });

  it('starts DJ in its first mode and cycles range -> damage -> discount -> range', () => {
    const dj = new Tower('t1', TOWERS_BY_ID.dj, { x: 0, y: 0 });
    expect(dj.supportMode).toBe('range');
    dj.cycleSupportMode();
    expect(dj.supportMode).toBe('damage');
    dj.cycleSupportMode();
    expect(dj.supportMode).toBe('discount');
    dj.cycleSupportMode();
    expect(dj.supportMode).toBe('range');
  });

  it('leaves commander (no cyclable modes) with an undefined support mode', () => {
    const commander = new Tower('t1', TOWERS_BY_ID.commander, { x: 0, y: 0 });
    expect(commander.supportMode).toBeUndefined();
    commander.cycleSupportMode();
    expect(commander.supportMode).toBeUndefined();
  });
});
