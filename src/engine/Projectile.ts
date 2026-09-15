import type { Point } from './types';
import type { Enemy } from './Enemy';
import { add, distance, normalize, scale, subtract } from './vector';

export interface BurnPayload {
  damagePerTick: number;
  durationSec: number;
  tickIntervalSec: number;
}

export interface ProjectileOptions {
  speed: number;
  damage: number;
  splashRadius?: number;
  burn?: BurnPayload;
}

const HIT_THRESHOLD = 0.2;

export class Projectile {
  readonly id: string;
  readonly target: Enemy;
  readonly speed: number;
  readonly damage: number;
  readonly splashRadius?: number;
  readonly burn?: BurnPayload;
  position: Point;

  constructor(id: string, origin: Point, target: Enemy, options: ProjectileOptions) {
    this.id = id;
    this.position = { ...origin };
    this.target = target;
    this.speed = options.speed;
    this.damage = options.damage;
    this.splashRadius = options.splashRadius;
    this.burn = options.burn;
  }

  advance(dt: number, targetPosition: Point): void {
    const direction = normalize(subtract(targetPosition, this.position));
    this.position = add(this.position, scale(direction, this.speed * dt));
  }

  hasReached(targetPosition: Point): boolean {
    return distance(this.position, targetPosition) <= HIT_THRESHOLD;
  }
}
