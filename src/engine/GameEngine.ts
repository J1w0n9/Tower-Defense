import { Economy } from './Economy';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';
import { getPathLength, getPositionAtDistance } from './path';
import { Projectile } from './Projectile';
import { Tower } from './Tower';
import { TOWERS_BY_ID } from './towers';
import type { GameEventMap, GameStatus, MapDefinition, Point, SupportMode } from './types';
import type { SerializedGameState } from '../persistence/SaveService';
import { EventEmitter } from './EventEmitter';
import { distance } from './vector';
import { WaveManager } from './WaveManager';
import { generateEndlessWave } from './waveGenerator';

export interface EngineActionResult {
  success: boolean;
  reason?: string;
}

export interface TowerSnapshot {
  id: string;
  towerTypeId: string;
  position: Point;
  isSupport: boolean;
  supportMode?: SupportMode;
  range: number;
}

export interface EnemySnapshot {
  id: string;
  position: Point;
  hpFraction: number;
  isBoss: boolean;
  isBurning: boolean;
}

export interface ProjectileSnapshot {
  id: string;
  position: Point;
}

export interface TowerSaveEntry {
  towerTypeId: string;
  position: Point;
  level: number;
  supportMode: SupportMode | undefined;
}

export interface GameSaveState extends SerializedGameState {
  mapId: string;
  gold: number;
  lives: number;
  completedWaves: number;
  towers: TowerSaveEntry[];
}

export interface EngineSnapshot {
  towers: TowerSnapshot[];
  enemies: EnemySnapshot[];
  projectiles: ProjectileSnapshot[];
  gold: number;
  lives: number;
  waveNumber: number;
  totalWaves: number;
  status: GameStatus;
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
    const { enemyPool, bossId } = map;
    const endlessGenerator =
      enemyPool && bossId ? (waveNumber: number) => generateEndlessWave(waveNumber, enemyPool, bossId) : undefined;
    this.waveManager = new WaveManager(map.waves, endlessGenerator);
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

  sellTower(towerId: string): EngineActionResult {
    const index = this.towers.findIndex((t) => t.id === towerId);
    if (index === -1) return { success: false, reason: 'not-found' };

    const tower = this.towers[index];
    const refund = tower.sellValue;
    this.towers.splice(index, 1);
    this.economy.addGold(refund);
    this.events.emit('gold-changed', this.economy.gold);
    return { success: true };
  }

  cycleSupportMode(towerId: string): void {
    this.towers.find((t) => t.id === towerId)?.cycleSupportMode();
  }

  serialize(): GameSaveState {
    return {
      mapId: this.map.id,
      gold: this.economy.gold,
      lives: this.economy.lives,
      completedWaves: this.waveManager.currentWaveNumber,
      towers: this.towers.map((tower) => ({
        towerTypeId: tower.stats.id,
        position: tower.position,
        level: tower.level,
        supportMode: tower.supportMode,
      })),
    };
  }

  /** Restores gold/lives/towers/wave progress from a save. Mid-wave enemies/projectiles are not preserved. */
  loadSnapshot(state: GameSaveState): void {
    this.economy.gold = state.gold;
    this.economy.lives = state.lives;
    this.enemies = [];
    this.projectiles = [];
    this.towers.length = 0;
    for (const entry of state.towers) {
      const stats = TOWERS_BY_ID[entry.towerTypeId];
      if (!stats) continue;
      const tower = new Tower(this.generateId('tower'), stats, entry.position);
      for (let i = 1; i < entry.level; i++) tower.upgrade();
      if (entry.supportMode) tower.supportMode = entry.supportMode;
      this.towers.push(tower);
    }
    this.waveManager.skipToWave(state.completedWaves);
    this.status = 'playing';
    this.events.emit('gold-changed', this.economy.gold);
    this.events.emit('lives-changed', this.economy.lives);
    this.events.emit('wave-changed', {
      current: this.waveManager.currentWaveNumber,
      total: this.waveManager.totalWaves,
    });
    this.events.emit('status-changed', 'playing');
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

  getSnapshot(): EngineSnapshot {
    return {
      towers: this.towers.map((tower) => ({
        id: tower.id,
        towerTypeId: tower.stats.id,
        position: tower.position,
        isSupport: tower.isSupport,
        supportMode: tower.supportMode,
        range: tower.range,
      })),
      enemies: this.enemies.map((enemy) => ({
        id: enemy.id,
        position: this.enemyPosition(enemy),
        hpFraction: enemy.hpFraction,
        isBoss: enemy.isBoss,
        isBurning: enemy.burnTicksRemaining > 0,
      })),
      projectiles: this.projectiles.map((projectile) => ({ id: projectile.id, position: projectile.position })),
      gold: this.economy.gold,
      lives: this.economy.lives,
      waveNumber: this.waveManager.currentWaveNumber,
      totalWaves: this.waveManager.totalWaves,
      status: this.status,
    };
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
