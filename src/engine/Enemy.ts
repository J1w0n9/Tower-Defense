import type { EnemyStats } from './types';

export class Enemy {
  readonly id: string;
  readonly statsId: string;
  readonly maxHp: number;
  readonly reward: number;
  readonly speed: number;
  readonly damageReduction: number;
  readonly isBoss: boolean;
  hp: number;
  distanceTraveled = 0;

  burnDamagePerTick = 0;
  burnTicksRemaining = 0;
  private burnTickInterval = 0;
  private burnTickTimer = 0;

  constructor(id: string, stats: EnemyStats) {
    this.id = id;
    this.statsId = stats.id;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.reward = stats.reward;
    this.speed = stats.speed;
    this.damageReduction = stats.damageReduction ?? 0;
    this.isBoss = stats.isBoss ?? false;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  get hpFraction(): number {
    return Math.max(0, this.hp / this.maxHp);
  }

  takeDamage(amount: number): void {
    this.hp -= amount * (1 - this.damageReduction);
  }

  advance(dt: number): void {
    this.distanceTraveled += this.speed * dt;
  }

  applyBurn(damagePerTick: number, durationSec: number, tickIntervalSec: number): void {
    this.burnDamagePerTick = damagePerTick;
    this.burnTickInterval = tickIntervalSec;
    this.burnTickTimer = tickIntervalSec;
    this.burnTicksRemaining = Math.round(durationSec / tickIntervalSec);
  }

  tickBurn(dt: number): void {
    if (this.burnTicksRemaining <= 0) return;
    this.burnTickTimer -= dt;
    while (this.burnTickTimer <= 0 && this.burnTicksRemaining > 0) {
      this.takeDamage(this.burnDamagePerTick);
      this.burnTicksRemaining -= 1;
      this.burnTickTimer += this.burnTickInterval;
    }
  }
}
