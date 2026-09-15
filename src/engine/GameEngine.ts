import { Economy } from './Economy';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';
import { getPathLength, getPositionAtDistance } from './path';
import { Projectile } from './Projectile';
import { Tower } from './Tower';
import { TOWERS_BY_ID } from './towers';
import type { GameEventMap, GameStatus, MapDefinition, Point } from './types';
import { EventEmitter } from './EventEmitter';
import { distance } from './vector';
import { WaveManager } from './WaveManager';

export interface EngineActionResult {
  success: boolean;
  reason?: string;
}

export class GameEngine {
  readonly map: MapDefinition;
  readonly economy: Economy;
  readonly events = new EventEmitter<GameEventMap>();
  readonly towers: Tower[] = [];
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  status: GameStatus = 'playing';

  private readonly waveManager: WaveManager;
  private readonly pathLength: number;
  private nextId = 0;

  constructor(map: MapDefinition, startingGold: number, startingLives: number) {
    this.map = map;
    this.economy = new Economy(startingGold, startingLives);
    this.waveManager = new WaveManager(map.waves);
    this.pathLength = getPathLength(map.path);
  }

  private generateId(prefix: string): string {
    this.nextId += 1;
    return `${prefix}-${this.nextId}`;
  }

  placeTower(position: Point, towerTypeId: string): EngineActionResult {
    const stats = TOWERS_BY_ID[towerTypeId];
    if (!stats) return { success: false, reason: 'unknown-tower' };

    const isBuildable = this.map.buildableTiles.some((t) => t.x === position.x && t.y === position.y);
    if (!isBuildable) return { success: false, reason: 'not-buildable' };

    const occupied = this.towers.some((t) => t.position.x === position.x && t.position.y === position.y);
    if (occupied) return { success: false, reason: 'occupied' };

    if (!this.economy.canAfford(stats.cost)) return { success: false, reason: 'insufficient-gold' };

    this.economy.spend(stats.cost);
    this.events.emit('gold-changed', this.economy.gold);
    this.towers.push(new Tower(this.generateId('tower'), stats, position));
    return { success: true };
  }

  upgradeTower(towerId: string): EngineActionResult {
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower) return { success: false, reason: 'not-found' };
    if (!tower.canUpgrade()) return { success: false, reason: 'max-level' };
    if (!this.economy.canAfford(tower.upgradeCost)) return { success: false, reason: 'insufficient-gold' };

    this.economy.spend(tower.upgradeCost);
    this.events.emit('gold-changed', this.economy.gold);
    tower.upgrade();
    return { success: true };
  }

  cycleSupportMode(towerId: string): void {
    this.towers.find((t) => t.id === towerId)?.cycleSupportMode();
  }

  startNextWave(): boolean {
    const started = this.waveManager.startNextWave();
    if (started) {
      this.events.emit('wave-changed', {
        current: this.waveManager.currentWaveNumber,
        total: this.waveManager.totalWaves,
      });
    }
    return started;
  }

  update(dt: number): void {
    if (this.status !== 'playing') return;
    this.applySupportBuffs();
    this.spawnEnemies(dt);
    this.updateEnemies(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.removeDeadEnemies();
    this.checkGameEnd();
  }

  private enemyPosition(enemy: Enemy): Point {
    return getPositionAtDistance(this.map.path, enemy.distanceTraveled);
  }

  private applySupportBuffs(): void {
    for (const tower of this.towers) {
      tower.rangeMultiplier = 1;
      tower.damageMultiplier = 1;
      tower.fireRateMultiplier = 1;
      tower.upgradeCostMultiplier = 1;
    }
    for (const support of this.towers) {
      if (!support.isSupport) continue;
      const buffPercent = support.stats.support!.buffPercent;
      const mode = support.supportMode;
      for (const target of this.towers) {
        if (target === support) continue;
        if (!support.isInRange(target.centerPosition)) continue;
        if (!mode) {
          target.rangeMultiplier *= 1 + buffPercent;
          target.damageMultiplier *= 1 + buffPercent;
          target.fireRateMultiplier *= 1 + buffPercent;
        } else if (mode === 'range') {
          target.rangeMultiplier *= 1 + buffPercent;
        } else if (mode === 'damage') {
          target.damageMultiplier *= 1 + buffPercent;
        } else if (mode === 'discount') {
          target.upgradeCostMultiplier *= 1 - buffPercent;
        }
      }
    }
  }

  private spawnEnemies(dt: number): void {
    for (const enemyId of this.waveManager.update(dt)) {
      const stats = ENEMIES_BY_ID[enemyId];
      if (!stats) continue;
      this.enemies.push(new Enemy(this.generateId('enemy'), stats));
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      enemy.advance(dt);
      enemy.tickBurn(dt);
    }
    const remaining: Enemy[] = [];
    for (const enemy of this.enemies) {
      if (!enemy.isDead && enemy.distanceTraveled >= this.pathLength) {
        this.economy.loseLife();
        this.events.emit('lives-changed', this.economy.lives);
        continue;
      }
      remaining.push(enemy);
    }
    this.enemies = remaining;
  }

  private updateTowers(dt: number): void {
    for (const tower of this.towers) {
      if (tower.isSupport) continue;
      tower.tick(dt);

      const candidates = this.enemies.map((enemy) => ({ enemy, position: this.enemyPosition(enemy) }));
      const target = tower.findTarget(candidates);
      if (!target) {
        tower.resetSpinUp();
        continue;
      }

      tower.advanceSpinUp(dt);
      if (!tower.spinUpComplete || !tower.canFire) continue;

      this.fireProjectile(tower, target);
      tower.registerShotFired();
    }
  }

  private fireProjectile(tower: Tower, target: Enemy): void {
    const burn = tower.stats.burnDamagePerTick
      ? {
          damagePerTick: tower.stats.burnDamagePerTick,
          durationSec: tower.stats.burnDurationSec ?? 0,
          tickIntervalSec: tower.stats.burnTickIntervalSec ?? 1,
        }
      : undefined;

    this.projectiles.push(
      new Projectile(this.generateId('projectile'), tower.centerPosition, target, {
        speed: tower.stats.projectileSpeed,
        damage: tower.damage,
        splashRadius: tower.stats.splashRadius,
        burn,
      })
    );
  }

  private updateProjectiles(dt: number): void {
    const remaining: Projectile[] = [];
    for (const projectile of this.projectiles) {
      if (projectile.target.isDead || !this.enemies.includes(projectile.target)) continue;

      const targetPosition = this.enemyPosition(projectile.target);
      const distanceToTarget = distance(projectile.position, targetPosition);
      if (distanceToTarget <= projectile.speed * dt) {
        this.applyHit(projectile, targetPosition);
        continue;
      }
      projectile.advance(dt, targetPosition);
      remaining.push(projectile);
    }
    this.projectiles = remaining;
  }

  private applyHit(projectile: Projectile, impactPosition: Point): void {
    const victims = projectile.splashRadius
      ? this.enemies.filter((e) => distance(this.enemyPosition(e), impactPosition) <= projectile.splashRadius!)
      : [projectile.target];

    for (const enemy of victims) {
      enemy.takeDamage(projectile.damage);
      if (projectile.burn) {
        enemy.applyBurn(projectile.burn.damagePerTick, projectile.burn.durationSec, projectile.burn.tickIntervalSec);
      }
    }
  }

  private removeDeadEnemies(): void {
    const alive: Enemy[] = [];
    for (const enemy of this.enemies) {
      if (enemy.isDead) {
        this.economy.addGold(enemy.reward);
        this.events.emit('gold-changed', this.economy.gold);
      } else {
        alive.push(enemy);
      }
    }
    this.enemies = alive;
  }

  private checkGameEnd(): void {
    if (this.economy.isGameOver) {
      this.status = 'lost';
      this.events.emit('status-changed', 'lost');
      return;
    }
    if (
      !this.waveManager.hasMoreWaves &&
      this.waveManager.isSpawningComplete &&
      this.enemies.length === 0 &&
      this.projectiles.length === 0
    ) {
      this.status = 'won';
      this.events.emit('status-changed', 'won');
    }
  }
}
