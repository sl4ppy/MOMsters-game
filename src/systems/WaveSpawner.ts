import { Container } from 'pixi.js';
import { Camera } from '../core/Camera';
import { CollisionManager } from '../core/CollisionManager';
import { Enemy } from '../entities/Enemy';
import { BasicEnemy } from '../entities/enemies/BasicEnemy';
import { BlobEnemy } from '../entities/enemies/BlobEnemy';
import { ChompChestEnemy } from '../entities/enemies/ChompChestEnemy';
import { EnemySpriteManager } from '../core/EnemySpriteManager';

// Interface for player-like objects
interface PlayerLike {
  position: { x: number; y: number };
  sprite: { x: number; y: number };
}

// Wave configuration interface
interface WaveConfig {
  start_time: number;
  end_time: number;
  enemies: string[];
  spawn_rate: number;
  max_count: number;
  event: string;
}

// Formation types for special events
enum FormationType {
  NORMAL = 'Normal',
  CIRCLE = 'CircleFormation',
  BOSS = 'BossEvent',
  SWARM = 'SwarmEvent',
  FINAL_ASSAULT = 'FinalAssault',
}

export class WaveSpawner {
  private enemies: Enemy[] = [];
  private gameContainer: Container;
  private camera: Camera;
  private collisionManager: CollisionManager;
  private player: PlayerLike;
  private enemySpriteManager: EnemySpriteManager;

  // Wave system
  private gameTime: number = 0; // Game time in minutes
  private currentWaveIndex: number = 0;
  private currentWave: WaveConfig | null = null;
  private timeSinceLastSpawn: number = 0;

  // Enemy name to type mapping
  private enemyNameToType: Map<string, number> = new Map();

  // Special event state
  private isEventActive: boolean = false;
  private eventTimer: number = 0;
  private eventDuration: number = 0;

  // Circle formation state
  private circleFormationAngle: number = 0;
  private circleFormationRadius: number = 300;

  // Boss event state
  private bossSpawned: boolean = false;

  // Callbacks
  public onEnemyKilled?: (enemy: Enemy, position: { x: number; y: number }) => void;
  public onWaveChanged?: (waveIndex: number, waveConfig: WaveConfig) => void;
  public onGameComplete?: () => void;

  // Wave configuration data
  private waveConfigs: WaveConfig[] = [
    {
      start_time: 0,
      end_time: 1,
      enemies: ['Blob'],
      spawn_rate: 50.0,
      max_count: 50,
      event: 'Normal',
    },
    {
      start_time: 0.5,
      end_time: 2,
      enemies: ['Goblin', 'Plant'],
      spawn_rate: 60.0,
      max_count: 60,
      event: 'Normal',
    },
    {
      start_time: 1.5,
      end_time: 2.5,
      enemies: ['Hobgoblin'],
      spawn_rate: 75.0,
      max_count: 70,
      event: 'Normal',
    },
    {
      start_time: 2,
      end_time: 3,
      enemies: ['Mermaid', 'Gargoyle'],
      spawn_rate: 90.0,
      max_count: 80,
      event: 'CircleFormation',
    },
    {
      start_time: 2.5,
      end_time: 4,
      enemies: ['ChompChest', 'TreeEnt'],
      spawn_rate: 100.0,
      max_count: 90,
      event: 'Normal',
    },
    {
      start_time: 3.5,
      end_time: 5,
      enemies: ['Reaper', 'Palomino'],
      spawn_rate: 110.0,
      max_count: 100,
      event: 'Normal',
    },
    {
      start_time: 4.5,
      end_time: 5.25,
      enemies: ['Green Dragon'],
      spawn_rate: 5.0,
      max_count: 1,
      event: 'BossEvent',
    },
    {
      start_time: 4.75,
      end_time: 6,
      enemies: ['Red Dragon', 'Blue Dragon'],
      spawn_rate: 125.0,
      max_count: 110,
      event: 'Normal',
    },
    {
      start_time: 5.5,
      end_time: 7,
      enemies: ['Skeleton', 'Mollusk'],
      spawn_rate: 135.0,
      max_count: 120,
      event: 'Normal',
    },
    {
      start_time: 6.5,
      end_time: 7.5,
      enemies: ['Banshee', 'Floating Maw'],
      spawn_rate: 150.0,
      max_count: 130,
      event: 'SwarmEvent',
    },
    {
      start_time: 7,
      end_time: 8.5,
      enemies: ['Cacodemon', 'Sea Hag'],
      spawn_rate: 160.0,
      max_count: 140,
      event: 'Normal',
    },
    {
      start_time: 8,
      end_time: 9.5,
      enemies: ['Demon', 'Centaur'],
      spawn_rate: 175.0,
      max_count: 150,
      event: 'Normal',
    },
    {
      start_time: 9,
      end_time: 10,
      enemies: ['Green Orc', 'Golden Orc'],
      spawn_rate: 190.0,
      max_count: 160,
      event: 'CircleFormation',
    },
    {
      start_time: 9.5,
      end_time: 10.25,
      enemies: ['Void'],
      spawn_rate: 5.0,
      max_count: 1,
      event: 'BossEvent',
    },
    {
      start_time: 9.75,
      end_time: 11,
      enemies: ['Golem', 'Ice Golem'],
      spawn_rate: 200.0,
      max_count: 170,
      event: 'Normal',
    },
    {
      start_time: 10.5,
      end_time: 12,
      enemies: ['Jawa', 'Mud Golem'],
      spawn_rate: 210.0,
      max_count: 180,
      event: 'Normal',
    },
    {
      start_time: 11.5,
      end_time: 12.5,
      enemies: ['Skull', 'PlasmaMan'],
      spawn_rate: 225.0,
      max_count: 190,
      event: 'SwarmEvent',
    },
    {
      start_time: 12,
      end_time: 13.5,
      enemies: ['Red Dragon', 'Demon', 'Void'],
      spawn_rate: 240.0,
      max_count: 200,
      event: 'Normal',
    },
    {
      start_time: 13,
      end_time: 14.5,
      enemies: ['PlasmaMan', 'Ice Golem', 'Void'],
      spawn_rate: 250.0,
      max_count: 220,
      event: 'Normal',
    },
    {
      start_time: 14,
      end_time: 15,
      enemies: ['Golden Orc', 'Void', 'PlasmaMan'],
      spawn_rate: 275.0,
      max_count: 250,
      event: 'FinalAssault',
    },
    {
      start_time: 14.5,
      end_time: 15.5,
      enemies: ['Skull King'],
      spawn_rate: 5.0,
      max_count: 1,
      event: 'BossEvent',
    },
  ];

  constructor(
    gameContainer: Container,
    camera: Camera,
    collisionManager: CollisionManager,
    player: PlayerLike,
    enemySpriteManager: EnemySpriteManager
  ) {
    this.gameContainer = gameContainer;
    this.camera = camera;
    this.collisionManager = collisionManager;
    this.player = player;
    this.enemySpriteManager = enemySpriteManager;

    this.initializeEnemyMapping();
    this.updateCurrentWave();

    console.warn('WaveSpawner: WaveSpawner initialized with ' + this.waveConfigs.length + ' waves');
    console.warn(
      'WaveSpawner: Initial wave: ' + (this.currentWave ? this.currentWave.enemies.join(', ') : 'None')
    );
    console.warn('WaveSpawner: Game time: ' + this.gameTime.toFixed(3) + ' minutes');
    console.warn(
      'WaveSpawner: Current wave index: ' + this.currentWaveIndex + ', Wave: ' + (this.currentWave ? `${this.currentWave.start_time}-${this.currentWave.end_time}min, spawn_rate: ${this.currentWave.spawn_rate}/s` : 'None')
    );
  }

  /**
   * Initialize the mapping from enemy names to enemy type IDs
   */
  private initializeEnemyMapping(): void {
    // Map enemy names to their sprite atlas indices
    this.enemyNameToType.set('Blob', 0);
    this.enemyNameToType.set('Goblin', 1);
    this.enemyNameToType.set('Plant', 2);
    this.enemyNameToType.set('Hobgoblin', 3);
    this.enemyNameToType.set('Mermaid', 4);
    this.enemyNameToType.set('Gargoyle', 5);
    this.enemyNameToType.set('ChompChest', 6);
    this.enemyNameToType.set('TreeEnt', 7);
    this.enemyNameToType.set('Reaper', 8);
    this.enemyNameToType.set('Palomino', 9);
    this.enemyNameToType.set('Green Dragon', 10);
    this.enemyNameToType.set('Red Dragon', 11);
    this.enemyNameToType.set('Blue Dragon', 12);
    this.enemyNameToType.set('Skeleton', 13);
    this.enemyNameToType.set('Mollusk', 14);
    this.enemyNameToType.set('Banshee', 15);
    this.enemyNameToType.set('Floating Maw', 16);
    this.enemyNameToType.set('Cacodemon', 17);
    this.enemyNameToType.set('Sea Hag', 18);
    this.enemyNameToType.set('Demon', 19);
    this.enemyNameToType.set('Centaur', 20);
    this.enemyNameToType.set('Green Orc', 21);
    this.enemyNameToType.set('Golden Orc', 22);
    this.enemyNameToType.set('Void', 23);
    this.enemyNameToType.set('Golem', 24);
    this.enemyNameToType.set('Ice Golem', 25);
    this.enemyNameToType.set('Jawa', 26);
    this.enemyNameToType.set('Mud Golem', 27);
    this.enemyNameToType.set('Skull', 28);
    this.enemyNameToType.set('PlasmaMan', 29);
    // Note: Skull King is not in the original 30 enemies, so we'll use Skull (28) as a placeholder
    this.enemyNameToType.set('Skull King', 28);
  }

  /**
   * Update the spawner - main game loop method
   */
  update(deltaTime: number): void {
    this.updateGameTime(deltaTime);
    this.updateCurrentWave();
    this.updateSpecialEvents(deltaTime);
    this.updateSpawning(deltaTime);
    this.updateEnemies(deltaTime);
    this.cleanupDeadEnemies();
  }

  /**
   * Update the game time and check for game completion
   */
  private updateGameTime(deltaTime: number): void {
    const previousGameTime = this.gameTime;
    this.gameTime += deltaTime / 60000; // Convert to minutes (deltaTime is in milliseconds)

    // Debug time calculation more frequently during first few minutes
    if (this.gameTime < 5.0 && Math.floor(this.gameTime * 20) > Math.floor(previousGameTime * 20)) {
      console.warn(
        'WaveSpawner: Game time: ' + this.gameTime.toFixed(3) + ' minutes (deltaTime: ' + deltaTime.toFixed(1) + 'ms) - Real time passed: ' + (this.gameTime * 60).toFixed(1) + 's'
      );
      console.warn(
        'WaveSpawner: Current wave should be: ' + this.getCurrentExpectedWaveIndex() + ' (' + this.getExpectedWaveName() + ')'
      );
    }

    // Check if game is complete (30.5 minutes)
    if (this.gameTime >= 30.5) {
      this.onGameComplete?.();
    }
  }

  /**
   * Helper to get expected wave index for current time
   */
  private getCurrentExpectedWaveIndex(): number {
    for (let i = 0; i < this.waveConfigs.length; i++) {
      const wave = this.waveConfigs[i];
      if (this.gameTime >= wave.start_time && this.gameTime < wave.end_time) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Helper to get expected wave name for current time
   */
  private getExpectedWaveName(): string {
    const waveIndex = this.getCurrentExpectedWaveIndex();
    if (waveIndex >= 0) {
      return this.waveConfigs[waveIndex].enemies.join(', ');
    }
    return 'None';
  }

  /**
   * Update the current wave based on game time
   */
  private updateCurrentWave(): void {
    const previousWaveIndex = this.currentWaveIndex;
    const previousWave = this.currentWave;

    // Find the current wave
    for (let i = 0; i < this.waveConfigs.length; i++) {
      const wave = this.waveConfigs[i];
      if (this.gameTime >= wave.start_time && this.gameTime < wave.end_time) {
        this.currentWaveIndex = i;
        this.currentWave = wave;
        break;
      }
    }

    // Debug: Log only when no current wave is found (should not happen)
    if (!this.currentWave) {
      console.warn('WaveSpawner: No current wave found for time ' + this.gameTime.toFixed(3) + ' min');
      console.warn(
        'WaveSpawner: gameTime: ' + this.gameTime + ', previousWave: ' + (previousWave ? `${previousWave.start_time}-${previousWave.end_time}` : 'null')
      );
    }

    // If wave changed, notify callback and reset event state
    if (previousWaveIndex !== this.currentWaveIndex && this.currentWave) {
      this.onWaveChanged?.(this.currentWaveIndex, this.currentWave);
      this.resetEventState();
      console.warn('WaveSpawner: WAVE CHANGED! From ' + previousWaveIndex + ' to ' + this.currentWaveIndex);
      console.warn(
        'WaveSpawner: Wave ' + (this.currentWaveIndex + 1) + ': ' + this.currentWave.enemies.join(', ') + ' (' + this.currentWave.event + ') - spawn_rate: ' + this.currentWave.spawn_rate + '/s, max: ' + this.currentWave.max_count
      );
      console.warn(
        'WaveSpawner: Time range: ' + this.currentWave.start_time + '-' + this.currentWave.end_time + ' minutes, Current time: ' + this.gameTime.toFixed(3) + ' minutes'
      );
    }

    // Debug current wave status at end of method
    if (this.gameTime < 5.0 && this.currentWave) {
      // Log every 0.5 minutes during the first 5 minutes
      const halfMinuteMarker = Math.floor(this.gameTime * 2);
      if (halfMinuteMarker !== Math.floor((this.gameTime - 0.001) * 2)) {
        console.warn(
          'WaveSpawner: Wave Status: gameTime=' + this.gameTime.toFixed(3) + 'min, currentWaveIndex=' + this.currentWaveIndex + ', currentWave=' + this.currentWave.enemies.join(',')
        );
      }
    }
  }

  /**
   * Reset event state when changing waves
   */
  private resetEventState(): void {
    this.isEventActive = false;
    this.eventTimer = 0;
    this.eventDuration = 0;
    this.bossSpawned = false;
    this.circleFormationAngle = 0;
  }

  /**
   * Update special events
   */
  private updateSpecialEvents(deltaTime: number): void {
    if (!this.currentWave || this.currentWave.event === FormationType.NORMAL) return;

    const deltaTimeSeconds = deltaTime / 1000;

    switch (this.currentWave.event) {
      case FormationType.CIRCLE:
        this.updateCircleFormation(deltaTimeSeconds);
        break;
      case FormationType.BOSS:
        this.updateBossEvent(deltaTimeSeconds);
        break;
      case FormationType.SWARM:
        this.updateSwarmEvent(deltaTimeSeconds);
        break;
      case FormationType.FINAL_ASSAULT:
        this.updateFinalAssault(deltaTimeSeconds);
        break;
    }
  }

  /**
   * Update circle formation event
   */
  private updateCircleFormation(deltaTimeSeconds: number): void {
    this.circleFormationAngle += deltaTimeSeconds * 0.5; // Rotate slowly
    if (this.circleFormationAngle >= Math.PI * 2) {
      this.circleFormationAngle = 0;
    }
  }

  /**
   * Update boss event
   */
  private updateBossEvent(_deltaTimeSeconds: number): void {
    // Boss events typically spawn only once per wave
    if (this.bossSpawned) return;

    // Clear some regular enemies to make room for boss
    if (this.enemies.length > 10) {
      const excessEnemies = this.enemies.slice(10);
      excessEnemies.forEach(enemy => {
        // Remove from collision system and display
        this.collisionManager.removeEntity(enemy);
        if (enemy.sprite.parent) {
          enemy.sprite.parent.removeChild(enemy.sprite);
        }
      });
      // Keep only the first 10 enemies
      this.enemies = this.enemies.slice(0, 10);
    }
  }

  /**
   * Update swarm event
   */
  private updateSwarmEvent(deltaTimeSeconds: number): void {
    // Swarm events spawn enemies in bursts
    this.eventTimer += deltaTimeSeconds;
    if (this.eventTimer >= 2.0) {
      // Burst every 2 seconds
      this.eventTimer = 0;
      // Spawn a burst of enemies
      for (let i = 0; i < 5; i++) {
        if (this.enemies.length < (this.currentWave?.max_count || 100)) {
          this.spawnEnemy();
        }
      }
    }
  }

  /**
   * Update final assault event
   */
  private updateFinalAssault(deltaTimeSeconds: number): void {
    // Final assault has increased spawn rate and multiple spawn points
    this.eventTimer += deltaTimeSeconds;
    if (this.eventTimer >= 0.3) {
      // Spawn every 0.3 seconds
      this.eventTimer = 0;
      // Spawn from multiple points
      for (let i = 0; i < 3; i++) {
        if (this.enemies.length < (this.currentWave?.max_count || 250)) {
          this.spawnEnemy();
        }
      }
    }
  }

  /**
   * Handle enemy spawning
   */
  private updateSpawning(deltaTime: number): void {
    if (!this.currentWave) {
      console.warn('WaveSpawner: updateSpawning early return: no currentWave');
      return;
    }

    // Count only alive enemies for max_count check
    const aliveEnemyCount = this.enemies.filter(enemy => enemy.alive).length;

    if (aliveEnemyCount >= this.currentWave.max_count) {
      // Only log occasionally to avoid spam
      if (aliveEnemyCount % 10 === 0) {
        console.warn(
          'WaveSpawner: updateSpawning early return: alive enemies=' + aliveEnemyCount + ' >= max_count=' + this.currentWave.max_count + ' (total in array: ' + this.enemies.length + ')'
        );
      }
      return;
    }

    // Skip regular spawning during special events that handle their own spawning
    if (
      this.currentWave.event === FormationType.SWARM ||
      this.currentWave.event === FormationType.FINAL_ASSAULT
    ) {
      console.warn('WaveSpawner: updateSpawning early return: special event ' + this.currentWave.event);
      return;
    }

    this.timeSinceLastSpawn += deltaTime / 1000; // Convert to seconds

    const spawnInterval = 1 / this.currentWave.spawn_rate;

    // Reduced debug logging since spawn rates are working
    // Only log when spawning or when debugging time issues

    if (this.timeSinceLastSpawn >= spawnInterval) {
      // Only log spawning occasionally to reduce spam
      if (aliveEnemyCount % 10 === 0 || aliveEnemyCount < 10) {
        console.warn(
          'WaveSpawner: Spawning enemy! Alive enemies: ' + aliveEnemyCount + '/' + this.currentWave.max_count + ', spawn_rate: ' + this.currentWave.spawn_rate + '/s'
        );
      }
      this.spawnEnemy();
      this.timeSinceLastSpawn = 0;
    }
  }

  /**
   * Spawn a new enemy
   */
  private spawnEnemy(): void {
    if (!this.currentWave || this.currentWave.enemies.length === 0) {
      console.warn(
        'WaveSpawner: Cannot spawn enemy: currentWave=' + !!this.currentWave + ', enemies=' + (this.currentWave?.enemies.length || 0)
      );
      return;
    }

    // Select random enemy type from current wave
    const randomIndex = Math.floor(Math.random() * this.currentWave.enemies.length);
    const enemyName = this.currentWave.enemies[randomIndex];
    const enemyType = this.enemyNameToType.get(enemyName);

    if (enemyType === undefined) {
      console.warn('WaveSpawner: Unknown enemy type: ' + enemyName);
      return;
    }

    console.warn('WaveSpawner: Spawning enemy: ' + enemyName + ' (type ' + enemyType + ')');

    // Create enemy based on type
    let enemy: Enemy;
    if (enemyType === 0) {
      // Blob enemy
      enemy = new BlobEnemy(this.enemySpriteManager);
    } else if (enemyType === 6) {
      // ChompChest enemy
      enemy = new ChompChestEnemy(this.enemySpriteManager);
    } else {
      // Basic enemy
      enemy = new BasicEnemy(this.enemySpriteManager, enemyType);
    }

    // Get spawn position based on event type
    const spawnPos = this.getSpawnPosition();
    enemy.sprite.x = spawnPos.x;
    enemy.sprite.y = spawnPos.y;

    // Mark as boss if it's a boss event
    if (this.currentWave.event === FormationType.BOSS) {
      this.bossSpawned = true;
    }

    // Add to world and systems
    this.gameContainer.addChild(enemy.sprite);
    enemy.sprite.zIndex = 50;
    this.collisionManager.addEntity(enemy);
    this.enemies.push(enemy);

    // Reduced logging - only log every 10th enemy
    if (this.enemies.length % 10 === 0) {
      console.warn(
        'WaveSpawner: Enemy added to world! ' + enemyName + ' #' + this.enemies.length + ' at (' + enemy.sprite.x.toFixed(0) + ', ' + enemy.sprite.y.toFixed(0) + ')'
      );
    }

    // Log spawning occasionally
    if (this.enemies.length % 20 === 0) {
      console.warn(
        'WaveSpawner: Spawned ' + enemyName + ' #' + this.enemies.length + ' (Wave ' + (this.currentWaveIndex + 1) + ')'
      );
    }
  }

  /**
   * Get spawn position based on current event type
   */
  private getSpawnPosition(): { x: number; y: number } {
    const bounds = this.camera.getVisibleBounds(100);

    if (this.currentWave?.event === FormationType.CIRCLE) {
      // Circle formation around player
      const playerPos = this.player.position;
      const angle = this.circleFormationAngle + Math.random() * Math.PI * 0.5; // Some randomness
      const radius = this.circleFormationRadius + Math.random() * 100;

      return {
        x: playerPos.x + Math.cos(angle) * radius,
        y: playerPos.y + Math.sin(angle) * radius,
      };
    } else if (this.currentWave?.event === FormationType.BOSS) {
      // Boss spawns at a dramatic distance
      const playerPos = this.player.position;
      const angle = Math.random() * Math.PI * 2;
      const distance = 400 + Math.random() * 200;

      return {
        x: playerPos.x + Math.cos(angle) * distance,
        y: playerPos.y + Math.sin(angle) * distance,
      };
    } else {
      // Standard edge spawning
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
  }

  /**
   * Update all enemies
   */
  private updateEnemies(deltaTime: number): void {
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.update(deltaTime, this.player as any);
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
    if (removedCount > 0) {
      console.warn(
        'WaveSpawner: Cleaned up ' + removedCount + ' dead enemies. Total alive: ' + aliveEnemies.length
      );
    }

    this.enemies = aliveEnemies;
  }

  /**
   * Get current enemy stats (compatible with old EnemySpawner interface)
   */
  getStats(): {
    count: number;
    spawnRate: number;
    maxEnemies: number;
    phaseSpawnRate: number;
    globalDifficulty: number;
    phaseProgress: number;
  } {
    const phaseProgress = this.currentWave
      ? (this.gameTime - this.currentWave.start_time) /
        (this.currentWave.end_time - this.currentWave.start_time)
      : 0;

    return {
      count: this.enemies.length,
      spawnRate: this.currentWave?.spawn_rate || 0,
      maxEnemies: this.currentWave?.max_count || 0,
      phaseSpawnRate: this.currentWave?.spawn_rate || 0,
      globalDifficulty: this.gameTime / 30, // Difficulty scales with time
      phaseProgress: Math.min(1, phaseProgress),
    };
  }

  /**
   * Get current wave progression info
   */
  getProgressionInfo(): {
    currentWave: number;
    currentWaveName: string;
    gameTime: number;
    waveProgress: number;
    enemies: string[];
    event: string;
    spawnRate: number;
    maxCount: number;
  } {
    const waveProgress = this.currentWave
      ? (this.gameTime - this.currentWave.start_time) /
        (this.currentWave.end_time - this.currentWave.start_time)
      : 0;

    return {
      currentWave: this.currentWaveIndex + 1,
      currentWaveName: this.currentWave?.enemies.join(', ') || 'Unknown',
      gameTime: this.gameTime,
      waveProgress: Math.min(1, waveProgress),
      enemies: this.currentWave?.enemies || [],
      event: this.currentWave?.event || 'Normal',
      spawnRate: this.currentWave?.spawn_rate || 0,
      maxCount: this.currentWave?.max_count || 0,
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
    this.gameTime = 0;
    this.currentWaveIndex = 0;
    this.resetEventState();
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
    event: string;
    timeRemaining: number;
  } {
    const waveProgress = this.currentWave
      ? (this.gameTime - this.currentWave.start_time) /
        (this.currentWave.end_time - this.currentWave.start_time)
      : 0;

    const timeRemaining = this.currentWave
      ? Math.max(0, this.currentWave.end_time - this.gameTime)
      : 0;

    return {
      currentWave: this.currentWaveIndex + 1,
      waveName: this.currentWave?.enemies.join(', ') || 'Unknown',
      waveProgress: Math.min(1, waveProgress),
      spawnRate: this.currentWave?.spawn_rate || 0,
      difficulty: this.gameTime / 30,
      event: this.currentWave?.event || 'Normal',
      timeRemaining,
    };
  }

  /**
   * Get current game time in minutes
   */
  getGameTime(): number {
    return this.gameTime;
  }

  /**
   * Get total number of waves
   */
  getTotalWaves(): number {
    return this.waveConfigs.length;
  }
}
