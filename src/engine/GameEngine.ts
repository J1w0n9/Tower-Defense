import { Economy } from './Economy';
import { ENEMIES_BY_ID } from './enemies';
import { Enemy } from './Enemy';
import { EventEmitter } from './EventEmitter';
import { getPathLength, getPositionAtDistance } from './path';
import { Projectile } from './Projectile';
import { Tower, type TargetCandidate } from './Tower';
import { TOWERS_BY_ID } from './towers';
import type { GameEventMap, GameStatus, MapDefinition, Point } from './types';
import { distance } from './vector';
import { WaveManager } from './WaveManager';

const STARTING_GOLD = 150;
const STARTING_LIVES = 20;

export interface PlaceTowerResult {
  success: boolean;
  reason?: 'occupied' | 'not-buildable' | 'insufficient-gold';
}

export interface EngineSnapshot {
  towers: { id: string; statsId: string; position: Point; level: number }[];
  enemies: { id: string; statsId: string; position: Point; hpFraction: number }[];
  projectiles: { id: string; position: Point }[];
  gold: number;
  lives: number;
  waveNumber: number;
  totalWaves: number;
  isWaveInProgress: boolean;
  status: GameStatus;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export class GameEngine extends EventEmitter<GameEventMap> {
  private map: MapDefinition;
  private pathLength: number;
  private waveManager: WaveManager;
  private economy: Economy;
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private status: GameStatus = 'playing';

  constructor(map: MapDefinition) {
    super();
    this.map = map;
    this.pathLength = getPathLength(map.path);
    this.waveManager = new WaveManager(map.waves);
    this.economy = new Economy(STARTING_GOLD, STARTING_LIVES);
  }

  getSnapshot(): EngineSnapshot {
    return {
      towers: this.towers.map((t) => ({ id: t.id, statsId: t.stats.id, position: t.position, level: t.level })),
      enemies: this.enemies.map((e) => ({
        id: e.id,
        statsId: e.statsId,
        position: getPositionAtDistance(this.map.path, e.distanceTraveled),
        hpFraction: e.hpFraction,
      })),
      projectiles: this.projectiles.map((p) => ({ id: p.id, position: p.position })),
      gold: this.economy.gold,
      lives: this.economy.lives,
      waveNumber: this.waveManager.currentWaveNumber,
      totalWaves: this.waveManager.totalWaves,
      isWaveInProgress:
        this.waveManager.currentWaveNumber > 0 &&
        !(this.waveManager.isSpawningComplete && this.enemies.length === 0),
      status: this.status,
    };
  }

  placeTower(cell: Point, towerId: string): PlaceTowerResult {
    const isBuildable = this.map.buildableTiles.some((t) => t.x === cell.x && t.y === cell.y);
    if (!isBuildable) return { success: false, reason: 'not-buildable' };

    const occupied = this.towers.some((t) => t.position.x === cell.x && t.position.y === cell.y);
    if (occupied) return { success: false, reason: 'occupied' };

    const stats = TOWERS_BY_ID[towerId];
    if (!this.economy.canAfford(stats.cost)) return { success: false, reason: 'insufficient-gold' };

    this.economy.spend(stats.cost);
    this.emit('gold-changed', this.economy.gold);
    this.towers.push(new Tower(nextId('tower'), stats, cell));
    return { success: true };
  }

  startNextWave(): boolean {
    const started = this.waveManager.startNextWave();
    if (started) {
      this.emit('wave-changed', { current: this.waveManager.currentWaveNumber, total: this.waveManager.totalWaves });
    }
    return started;
  }

  update(dt: number): void {
    if (this.status !== 'playing') return;

    const spawnedIds = this.waveManager.update(dt);
    for (const enemyId of spawnedIds) {
      this.enemies.push(new Enemy(nextId('enemy'), ENEMIES_BY_ID[enemyId]));
    }

    for (const enemy of this.enemies) {
      enemy.advance(dt);
    }

    const reachedEnd = this.enemies.filter((e) => e.distanceTraveled >= this.pathLength);
    if (reachedEnd.length > 0) {
      this.economy.loseLife(reachedEnd.length);
      this.enemies = this.enemies.filter((e) => e.distanceTraveled < this.pathLength);
      this.emit('lives-changed', this.economy.lives);
      if (this.economy.isGameOver) {
        this.status = 'lost';
        this.emit('status-changed', 'lost');
        return;
      }
    }

    const candidates: TargetCandidate[] = this.enemies.map((enemy) => ({
      enemy,
      position: getPositionAtDistance(this.map.path, enemy.distanceTraveled),
    }));

    for (const tower of this.towers) {
      tower.tick(dt);
      if (!tower.canFire) continue;
      const target = tower.findTarget(candidates);
      if (!target) continue;
      tower.resetCooldown();
      this.projectiles.push(
        new Projectile(nextId('proj'), tower.centerPosition, target, {
          speed: tower.stats.projectileSpeed,
          damage: tower.damage,
          splashRadius: tower.stats.splashRadius,
          slowFactor: tower.stats.slowFactor,
          slowDuration: tower.stats.slowDuration,
        })
      );
    }

    const remainingProjectiles: Projectile[] = [];
    for (const projectile of this.projectiles) {
      if (projectile.target.isDead || !this.enemies.includes(projectile.target)) continue;
      const targetPos = candidates.find((c) => c.enemy === projectile.target)?.position;
      if (!targetPos) continue;

      projectile.advance(dt, targetPos);
      if (projectile.hasReached(targetPos)) {
        this.resolveHit(projectile, targetPos, candidates);
      } else {
        remainingProjectiles.push(projectile);
      }
    }
    this.projectiles = remainingProjectiles;

    const dead = this.enemies.filter((e) => e.isDead);
    if (dead.length > 0) {
      const reward = dead.reduce((sum, e) => sum + e.reward, 0);
      this.economy.addGold(reward);
      this.emit('gold-changed', this.economy.gold);
      this.enemies = this.enemies.filter((e) => !e.isDead);
    }

    if (
      this.waveManager.isSpawningComplete &&
      !this.waveManager.hasMoreWaves &&
      this.enemies.length === 0 &&
      this.projectiles.length === 0 &&
      this.waveManager.currentWaveNumber > 0
    ) {
      this.status = 'won';
      this.emit('status-changed', 'won');
    }
  }

  private resolveHit(projectile: Projectile, targetPos: Point, candidates: TargetCandidate[]): void {
    projectile.target.takeDamage(projectile.damage);
    if (projectile.slowFactor && projectile.slowDuration) {
      projectile.target.applySlow(projectile.slowFactor, projectile.slowDuration);
    }
    if (projectile.splashRadius) {
      for (const candidate of candidates) {
        if (candidate.enemy === projectile.target) continue;
        if (distance(candidate.position, targetPos) <= projectile.splashRadius) {
          candidate.enemy.takeDamage(projectile.damage);
        }
      }
    }
  }
}
