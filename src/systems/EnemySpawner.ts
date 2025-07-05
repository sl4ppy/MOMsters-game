import { Container } from 'pixi.js';
import { Camera } from '../core/Camera';
import { CollisionManager } from '../core/CollisionManager';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { BasicEnemy } from '../entities/enemies/BasicEnemy';
import { BlobEnemy } from '../entities/enemies/BlobEnemy';
import { ChompChestEnemy } from '../entities/enemies/ChompChestEnemy';
import { EnemySpriteManager } from '../core/EnemySpriteManager';
import { Vector2D } from '../core/Vector2D';

export class EnemySpawner {
  private enemies: Enemy[] = [];
  private gameContainer: Container;
  private camera: Camera;
  private collisionManager: CollisionManager;
  private player: Player;
  private enemySpriteManager: EnemySpriteManager;

  // Enhanced spawn settings
  private baseSpawnRate: number = 1.5; // Enemies per second at start (reduced for better ramping)
  private currentSpawnRate: number = 1.5;
  private timeSinceLastSpawn: number = 0;
  private maxEnemies: number = 50; // Limit for performance

  // Wave progression system
  private gameTimer: number = 0;
  private currentEnemyType: number = 0; // Current enemy type being spawned (0-29)
  private enemyPhaseDuration: number = 60; // Seconds per enemy type
  private enemyPhaseTimer: number = 0;
  private enemyProgressionEnabled: boolean = true;

  // Per-enemy-type spawn rate ramping
  private currentPhaseSpawnRate: number = 1.5; // Current phase's spawn rate
  private phaseSpawnRateMultiplier: number = 1.0; // Multiplier for current phase
  private maxPhaseSpawnRate: number = 8.0; // Maximum spawn rate for any phase

  // Progressive difficulty scaling
  private globalDifficultyMultiplier: number = 1.0; // Increases with each phase
  private difficultyIncreasePerPhase: number = 0.15; // Each phase starts 15% faster than previous

  // Callbacks
  public onEnemyKilled?: (enemy: Enemy, position: { x: number; y: number }) => void;

  constructor(
    gameContainer: Container,
    camera: Camera,
    collisionManager: CollisionManager,
    player: Player,
    enemySpriteManager: EnemySpriteManager
  ) {
    this.gameContainer = gameContainer;
    this.camera = camera;
    this.collisionManager = collisionManager;
    this.player = player;
    this.enemySpriteManager = enemySpriteManager;
  }

  /**
   * Update the spawner - spawn new enemies and update existing ones
   */
  public update(_deltaTime: number): void {
    // Update spawner logic
    // TODO: Implement spawner update logic
  }

  /**
   * Update game timer for progression tracking
   */
  private updateGameTimer(deltaTime: number): void {
    this.gameTimer += deltaTime / 60; // Convert to seconds
  }

  /**
   * Update enemy progression - advance to next enemy type over time
   */
  private updateEnemyProgression(deltaTime: number): void {
    if (!this.enemyProgressionEnabled) return;

    this.enemyPhaseTimer += deltaTime / 60; // Convert to seconds

    if (this.enemyPhaseTimer >= this.enemyPhaseDuration) {
      this.enemyPhaseTimer = 0;
      this.advanceToNextEnemyType();
    }
  }

  /**
   * Advance to the next enemy type in the progression
   */
  private advanceToNextEnemyType(): void {
    if (this.currentEnemyType < 29) {
      this.currentEnemyType++;

      // Increase global difficulty multiplier for each phase
      this.globalDifficultyMultiplier += this.difficultyIncreasePerPhase;

      // Calculate new phase spawn rate (each phase starts faster than the previous)
      const basePhaseRate = this.baseSpawnRate * (1 + this.currentEnemyType * 0.1); // 10% increase per phase
      this.currentPhaseSpawnRate = Math.min(this.maxPhaseSpawnRate, basePhaseRate);

      // Reset phase timer and calculate new duration
      this.enemyPhaseTimer = 0;
      this.enemyPhaseDuration = 50 + Math.random() * 20; // 50-70 seconds per phase

      const enemyConfig = this.enemySpriteManager.getEnemyConfig(this.currentEnemyType);
      if (enemyConfig) {
        console.warn(
          `🎯 Enemy progression: Now spawning ${enemyConfig.name} (Type ${this.currentEnemyType})`
        );
        console.warn(
          `📈 Phase spawn rate: ${this.currentPhaseSpawnRate.toFixed(1)}/s, Global difficulty: ${this.globalDifficultyMultiplier.toFixed(2)}x`
        );
      }
    } else {
      // All enemy types have been introduced
      console.warn('🎯 All 30 enemy types have been introduced!');
      this.enemyProgressionEnabled = false;
    }
  }

  /**
   * Update spawn rate ramping within the current enemy phase
   */
  private updatePhaseSpawnRate(_deltaTime: number): void {
    // Calculate how far we are into the current phase (0.0 to 1.0)
    const phaseProgress = this.enemyPhaseTimer / this.enemyPhaseDuration;

    // Ramp up spawn rate over the course of the phase
    // Start at base rate, end at max rate for this phase
    const targetSpawnRate = this.currentPhaseSpawnRate * this.phaseSpawnRateMultiplier;
    const rampedSpawnRate =
      this.baseSpawnRate + (targetSpawnRate - this.baseSpawnRate) * phaseProgress;

    // Apply global difficulty multiplier
    this.currentSpawnRate = Math.min(
      this.maxPhaseSpawnRate,
      rampedSpawnRate * this.globalDifficultyMultiplier
    );
  }

  /**
   * Handle enemy spawning
   */
  private updateSpawning(deltaTime: number): void {
    if (this.enemies.length >= this.maxEnemies) return;

    this.timeSinceLastSpawn += deltaTime / 60; // Convert to seconds

    const spawnInterval = 1 / this.currentSpawnRate;
    if (this.timeSinceLastSpawn >= spawnInterval) {
      this.spawnEnemy();
      this.timeSinceLastSpawn = 0;
    }
  }

  /**
   * Spawn a new enemy at the edge of the screen
   */
  private spawnEnemy(): void {
    // Get the current enemy configuration
    const enemyConfig = this.enemySpriteManager.getEnemyConfig(this.currentEnemyType);
    if (!enemyConfig) {
      console.warn(`No enemy config found for type ${this.currentEnemyType}`);
      return;
    }

    // Use specialized enemy classes for specific enemy types
    let enemy: Enemy;
    if (this.currentEnemyType === 0) {
      // Use BlobEnemy for the blob (enemy type 0)
      enemy = new BlobEnemy(this.enemySpriteManager);
    } else if (this.currentEnemyType === 6) {
      // Use ChompChestEnemy for the ChompChest (enemy type 6)
      enemy = new ChompChestEnemy(this.enemySpriteManager);
    } else {
      // Use BasicEnemy for all other enemy types
      enemy = new BasicEnemy(this.enemySpriteManager, this.currentEnemyType);
    }

    // Get spawn position at screen edge
    const spawnPos = this.getSpawnPosition();
    enemy.sprite.x = spawnPos.x;
    enemy.sprite.y = spawnPos.y;

    // Add to world and systems
    this.gameContainer.addChild(enemy.sprite);
    enemy.sprite.zIndex = 50; // Ensure enemies render above terrain (which has zIndex = -10000) but below player (zIndex = 1500)
    this.collisionManager.addEntity(enemy);
    this.enemies.push(enemy);

    // Less verbose logging - only every 10th enemy
    if (this.enemies.length % 10 === 0) {
      console.warn(
        `Spawned ${enemyConfig.name} #${this.enemies.length} at (${spawnPos.x.toFixed(0)}, ${spawnPos.y.toFixed(0)})`
      );
    }
    console.warn('EnemySpawner: Enemy spawned successfully');
  }

  /**
   * Get a random spawn position at the edge of the visible screen
   */
  private getSpawnPosition(): { x: number; y: number } {
    const bounds = this.camera.getVisibleBounds(100); // 100px margin outside screen
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left

    let x: number, y: number;

    switch (side) {
      case 0: // Top
        x = bounds.left + Math.random() * (bounds.right - bounds.left);
        y = bounds.top;
        break;
      case 1: // Right
        x = bounds.right;
        y = bounds.top + Math.random() * (bounds.bottom - bounds.top);
        break;
      case 2: // Bottom
        x = bounds.left + Math.random() * (bounds.right - bounds.left);
        y = bounds.bottom;
        break;
      case 3: // Left
        x = bounds.left;
        y = bounds.top + Math.random() * (bounds.bottom - bounds.top);
        break;
      default:
        x = bounds.left;
        y = bounds.top;
    }

    return { x, y };
  }

  /**
   * Update all enemies
   */
  private updateEnemies(deltaTime: number): void {
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.update(deltaTime, this.player);
      }
    }
  }

  /**
   * Remove dead enemies from the game
   */
  private cleanupDeadEnemies(): void {
    const aliveEnemies: Enemy[] = [];

    for (const enemy of this.enemies) {
      if (enemy.alive) {
        aliveEnemies.push(enemy);
      } else {
        // Call enemy killed callback before cleanup
        if (this.onEnemyKilled) {
          this.onEnemyKilled(enemy, { x: enemy.sprite.x, y: enemy.sprite.y });
        }

        // Remove from collision system
        this.collisionManager.removeEntity(enemy);

        // Remove from display if still present
        if (enemy.sprite.parent) {
          enemy.sprite.parent.removeChild(enemy.sprite);
        }
      }
    }

    const removedCount = this.enemies.length - aliveEnemies.length;
    if (removedCount > 0 && removedCount >= 5) {
      console.warn(`Cleaned up ${removedCount} dead enemies`);
    }

    this.enemies = aliveEnemies;
  }

  /**
   * Get current enemy stats
   */
  getStats(): {
    count: number;
    spawnRate: number;
    maxEnemies: number;
    phaseSpawnRate: number;
    globalDifficulty: number;
    phaseProgress: number;
  } {
    const phaseProgress = this.enemyPhaseTimer / this.enemyPhaseDuration;
    return {
      count: this.enemies.length,
      spawnRate: this.currentSpawnRate,
      maxEnemies: this.maxEnemies,
      phaseSpawnRate: this.currentPhaseSpawnRate,
      globalDifficulty: this.globalDifficultyMultiplier,
      phaseProgress,
    };
  }

  /**
   * Get current enemy progression info
   */
  getProgressionInfo(): {
    currentEnemyType: number;
    currentEnemyName: string;
    gameTime: number;
    phaseTimer: number;
    phaseDuration: number;
    progressionEnabled: boolean;
    phaseProgress: number;
    currentSpawnRate: number;
    phaseSpawnRate: number;
    globalDifficulty: number;
  } {
    const enemyConfig = this.enemySpriteManager.getEnemyConfig(this.currentEnemyType);
    const phaseProgress = this.enemyPhaseTimer / this.enemyPhaseDuration;
    return {
      currentEnemyType: this.currentEnemyType,
      currentEnemyName: enemyConfig?.name || 'Unknown',
      gameTime: this.gameTimer,
      phaseTimer: this.enemyPhaseTimer,
      phaseDuration: this.enemyPhaseDuration,
      progressionEnabled: this.enemyProgressionEnabled,
      phaseProgress,
      currentSpawnRate: this.currentSpawnRate,
      phaseSpawnRate: this.currentPhaseSpawnRate,
      globalDifficulty: this.globalDifficultyMultiplier,
    };
  }

  /**
   * Get all active enemies
   */
  getEnemies(): Enemy[] {
    return this.enemies.filter(enemy => enemy.alive);
  }

  /**
   * Clear all enemies (for game reset)
   */
  clear(): void {
    for (const enemy of this.enemies) {
      this.collisionManager.removeEntity(enemy);
      if (enemy.sprite.parent) {
        enemy.sprite.parent.removeChild(enemy.sprite);
      }
    }
    this.enemies = [];
  }

  /**
   * Set spawn rate manually (for testing or power-ups)
   */
  setSpawnRate(rate: number): void {
    this.currentSpawnRate = Math.max(0.1, Math.min(this.maxPhaseSpawnRate, rate));
  }

  /**
   * Get wave information for UI display
   */
  getWaveInfo(): {
    currentWave: number;
    waveName: string;
    waveProgress: number;
    spawnRate: number;
    difficulty: number;
  } {
    const enemyConfig = this.enemySpriteManager.getEnemyConfig(this.currentEnemyType);
    const waveProgress = this.enemyPhaseTimer / this.enemyPhaseDuration;

    return {
      currentWave: this.currentEnemyType + 1,
      waveName: enemyConfig?.name || 'Unknown',
      waveProgress,
      spawnRate: this.currentSpawnRate,
      difficulty: this.globalDifficultyMultiplier,
    };
  }

  private updateSpawnTimers(_deltaTime: number): void {
    // ... existing code ...
  }

  private createEnemy(enemyType: string, position: Vector2D): Enemy {
    const enemy = new BasicEnemy(position.x, position.y);
    return enemy;
  }

  private createWaveEnemy(enemyType: string, position: Vector2D): Enemy {
    const enemy = new BasicEnemy(position.x, position.y);
    return enemy;
  }

  private createBossEnemy(enemyType: string, position: Vector2D): Enemy {
    const enemy = new BasicEnemy(position.x, position.y);
    return enemy;
  }
}
