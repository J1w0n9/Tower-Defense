import type { EnemyStats } from './types';

export class Enemy {
  readonly id: string;
  readonly statsId: string;
  readonly maxHp: number;
  readonly reward: number;
  readonly baseSpeed: number;
  readonly damageReduction: number;
  readonly isBoss: boolean;
  hp: number;
  distanceTraveled = 0;
  private slowTimeRemaining = 0;
  private slowFactor = 0;

  constructor(id: string, stats: EnemyStats) {
    this.id = id;
    this.statsId = stats.id;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.reward = stats.reward;
    this.baseSpeed = stats.speed;
    this.damageReduction = stats.damageReduction ?? 0;
    this.isBoss = stats.isBoss ?? false;
  }

  get speed(): number {
    return this.slowTimeRemaining > 0 ? this.baseSpeed * (1 - this.slowFactor) : this.baseSpeed;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  get hpFraction(): number {
    return Math.max(0, this.hp / this.maxHp);
  }

  applySlow(factor: number, duration: number): void {
    this.slowFactor = factor;
    this.slowTimeRemaining = duration;
  }

  takeDamage(amount: number): void {
    this.hp -= amount * (1 - this.damageReduction);
  }

  advance(dt: number): void {
    this.distanceTraveled += this.speed * dt;
    if (this.slowTimeRemaining > 0) {
      this.slowTimeRemaining = Math.max(0, this.slowTimeRemaining - dt);
    }
  }
}
