import type { Point, SupportMode, TowerStats } from './types';
import type { Enemy } from './Enemy';
import { distance } from './vector';

export interface TargetCandidate {
  enemy: Enemy;
  position: Point;
}

const RANGE_PER_LEVEL = 0.2;
const DAMAGE_PER_LEVEL = 0.5;
const MAX_LEVEL = 3;

export class Tower {
  readonly id: string;
  readonly stats: TowerStats;
  readonly position: Point;
  readonly isSupport: boolean;
  level = 1;
  cooldownRemaining = 0;
  supportMode: SupportMode | undefined;

  /** Set externally by GameEngine each tick from nearby support towers. */
  rangeMultiplier = 1;
  damageMultiplier = 1;
  fireRateMultiplier = 1;
  upgradeCostMultiplier = 1;

  private shotsFiredInBurst = 0;
  private burstIntervalRemaining = 0;
  private spinUpProgress = 0;

  constructor(id: string, stats: TowerStats, position: Point) {
    this.id = id;
    this.stats = stats;
    this.position = position;
    this.isSupport = !!stats.support;
    this.supportMode = stats.support?.modes?.[0];
  }

  get centerPosition(): Point {
    return { x: this.position.x + 0.5, y: this.position.y + 0.5 };
  }

  get range(): number {
    return this.stats.range * (1 + RANGE_PER_LEVEL * (this.level - 1)) * this.rangeMultiplier;
  }

  get damage(): number {
    return this.stats.damage * (1 + DAMAGE_PER_LEVEL * (this.level - 1)) * this.damageMultiplier;
  }

  get effectiveFireRate(): number {
    return this.stats.fireRate * this.fireRateMultiplier;
  }

  get upgradeCost(): number {
    return Math.round(this.stats.cost * 0.75 * this.level * this.upgradeCostMultiplier);
  }

  get sellValue(): number {
    return Math.round(this.stats.cost * 0.5 * this.level);
  }

  canUpgrade(): boolean {
    return this.level < MAX_LEVEL;
  }

  upgrade(): void {
    if (this.canUpgrade()) this.level += 1;
  }

  isInRange(position: Point): boolean {
    return distance(this.centerPosition, position) <= this.range;
  }

  get isBursting(): boolean {
    return this.shotsFiredInBurst > 0;
  }

  get canFire(): boolean {
    if (this.isBursting) return this.burstIntervalRemaining <= 0;
    return this.cooldownRemaining <= 0;
  }

  tick(dt: number): void {
    if (this.isBursting) {
      this.burstIntervalRemaining = Math.max(0, this.burstIntervalRemaining - dt);
    } else {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    }
  }

  /** Call once per shot actually fired; handles burst sequencing and cooldown. */
  registerShotFired(): void {
    const burstCount = this.stats.burstCount ?? 1;
    this.shotsFiredInBurst += 1;
    if (this.shotsFiredInBurst >= burstCount) {
      this.shotsFiredInBurst = 0;
      this.resetCooldown();
    } else {
      this.burstIntervalRemaining = this.stats.burstIntervalSec ?? 0;
    }
  }

  resetCooldown(): void {
    this.cooldownRemaining = 1 / this.effectiveFireRate;
  }

  get spinUpComplete(): boolean {
    if (!this.stats.spinUpSec) return true;
    return this.spinUpProgress >= this.stats.spinUpSec;
  }

  advanceSpinUp(dt: number): void {
    if (!this.stats.spinUpSec) return;
    this.spinUpProgress = Math.min(this.stats.spinUpSec, this.spinUpProgress + dt);
  }

  resetSpinUp(): void {
    this.spinUpProgress = 0;
  }

  cycleSupportMode(): void {
    const modes = this.stats.support?.modes;
    if (!modes || modes.length === 0) return;
    const currentIndex = modes.indexOf(this.supportMode ?? modes[0]);
    this.supportMode = modes[(currentIndex + 1) % modes.length];
  }

  findTarget(candidates: TargetCandidate[]): Enemy | null {
    const inRange = candidates.filter((c) => this.isInRange(c.position));
    if (inRange.length === 0) return null;

    switch (this.stats.targeting) {
      case 'first':
        return inRange.reduce((a, b) => (a.enemy.distanceTraveled >= b.enemy.distanceTraveled ? a : b)).enemy;
      case 'strongest':
        return inRange.reduce((a, b) => (a.enemy.hp >= b.enemy.hp ? a : b)).enemy;
      case 'closest':
      default:
        return inRange.reduce((a, b) =>
          distance(this.centerPosition, a.position) <= distance(this.centerPosition, b.position) ? a : b
        ).enemy;
    }
  }
}
