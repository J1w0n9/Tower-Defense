import type { Point, TowerStats } from './types';
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
  level = 1;
  cooldownRemaining = 0;

  constructor(id: string, stats: TowerStats, position: Point) {
    this.id = id;
    this.stats = stats;
    this.position = position;
  }

  get centerPosition(): Point {
    return { x: this.position.x + 0.5, y: this.position.y + 0.5 };
  }

  get range(): number {
    return this.stats.range * (1 + RANGE_PER_LEVEL * (this.level - 1));
  }

  get damage(): number {
    return this.stats.damage * (1 + DAMAGE_PER_LEVEL * (this.level - 1));
  }

  get upgradeCost(): number {
    return Math.round(this.stats.cost * 0.75 * this.level);
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

  tick(dt: number): void {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
  }

  get canFire(): boolean {
    return this.cooldownRemaining <= 0;
  }

  resetCooldown(): void {
    this.cooldownRemaining = 1 / this.stats.fireRate;
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
