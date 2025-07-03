import { Container } from 'pixi.js'
import { Camera } from '../core/Camera'
import { CollisionManager } from '../core/CollisionManager'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { BasicEnemy } from '../entities/enemies/BasicEnemy'

export class EnemySpawner {
  private enemies: Enemy[] = []
  private gameContainer: Container
  private camera: Camera
  private collisionManager: CollisionManager
  private player: Player
  
  // Spawn settings
  private baseSpawnRate: number = 2.0 // Enemies per second at start
  private currentSpawnRate: number = 2.0
  private timeSinceLastSpawn: number = 0
  private maxEnemies: number = 50 // Limit for performance
  
  // Difficulty scaling
  private difficultyTimer: number = 0
  private difficultyIncreaseInterval: number = 30 // Increase difficulty every 30 seconds
  
  // Callbacks
  public onEnemyKilled?: (enemy: Enemy, position: { x: number, y: number }) => void
  
  constructor(gameContainer: Container, camera: Camera, collisionManager: CollisionManager, player: Player) {
    this.gameContainer = gameContainer
    this.camera = camera
    this.collisionManager = collisionManager
    this.player = player
  }

  /**
   * Update the spawner - spawn new enemies and update existing ones
   */
  update(deltaTime: number): void {
    this.updateDifficulty(deltaTime)
    this.updateSpawning(deltaTime)
    this.updateEnemies(deltaTime)
    this.cleanupDeadEnemies()
  }

  /**
   * Update difficulty scaling over time
   */
  private updateDifficulty(deltaTime: number): void {
    this.difficultyTimer += deltaTime / 60 // Convert to seconds
    
    if (this.difficultyTimer >= this.difficultyIncreaseInterval) {
      this.difficultyTimer = 0
      this.currentSpawnRate = Math.min(this.baseSpawnRate * 2.5, this.currentSpawnRate * 1.2)
      this.maxEnemies = Math.min(100, this.maxEnemies + 5)
      
      console.log(`Difficulty increased! Spawn rate: ${this.currentSpawnRate.toFixed(1)}, Max enemies: ${this.maxEnemies}`)
    }
  }

  /**
   * Handle enemy spawning
   */
  private updateSpawning(deltaTime: number): void {
    if (this.enemies.length >= this.maxEnemies) return
    
    this.timeSinceLastSpawn += deltaTime / 60 // Convert to seconds
    
    const spawnInterval = 1 / this.currentSpawnRate
    if (this.timeSinceLastSpawn >= spawnInterval) {
      this.spawnEnemy()
      this.timeSinceLastSpawn = 0
    }
  }

  /**
   * Spawn a new enemy at the edge of the screen
   */
  private spawnEnemy(): void {
    const enemy = new BasicEnemy()
    
    // Get spawn position at screen edge
    const spawnPos = this.getSpawnPosition()
    enemy.sprite.x = spawnPos.x
    enemy.sprite.y = spawnPos.y
    
    // Add to world and systems
    this.gameContainer.addChild(enemy.sprite)
    enemy.sprite.zIndex = 50 // Ensure enemies render above terrain (which has zIndex = -10000) but below player (zIndex = 1500)
    this.collisionManager.addEntity(enemy)
    this.enemies.push(enemy)
    
    // Less verbose logging - only every 10th enemy
    if (this.enemies.length % 10 === 0) {
      console.log(`Spawned enemy #${this.enemies.length} at (${spawnPos.x.toFixed(0)}, ${spawnPos.y.toFixed(0)})`)
    }
  }

  /**
   * Get a random spawn position at the edge of the visible screen
   */
  private getSpawnPosition(): { x: number, y: number } {
    const bounds = this.camera.getVisibleBounds(100) // 100px margin outside screen
    const side = Math.floor(Math.random() * 4) // 0=top, 1=right, 2=bottom, 3=left
    
    let x: number, y: number
    
    switch (side) {
      case 0: // Top
        x = bounds.left + Math.random() * (bounds.right - bounds.left)
        y = bounds.top
        break
      case 1: // Right
        x = bounds.right
        y = bounds.top + Math.random() * (bounds.bottom - bounds.top)
        break
      case 2: // Bottom
        x = bounds.left + Math.random() * (bounds.right - bounds.left)
        y = bounds.bottom
        break
      case 3: // Left
        x = bounds.left
        y = bounds.top + Math.random() * (bounds.bottom - bounds.top)
        break
      default:
        x = bounds.left
        y = bounds.top
    }
    
    return { x, y }
  }

  /**
   * Update all enemies
   */
  private updateEnemies(deltaTime: number): void {
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.update(deltaTime, this.player)
      }
    }
  }

  /**
   * Remove dead enemies from the game
   */
  private cleanupDeadEnemies(): void {
    const aliveEnemies: Enemy[] = []
    
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        aliveEnemies.push(enemy)
      } else {
        // Call enemy killed callback before cleanup
        if (this.onEnemyKilled) {
          this.onEnemyKilled(enemy, { x: enemy.sprite.x, y: enemy.sprite.y })
        }
        
        // Remove from collision system
        this.collisionManager.removeEntity(enemy)
        
        // Remove from display if still present
        if (enemy.sprite.parent) {
          enemy.sprite.parent.removeChild(enemy.sprite)
        }
      }
    }
    
    const removedCount = this.enemies.length - aliveEnemies.length
    if (removedCount > 0 && removedCount >= 5) {
      console.log(`Cleaned up ${removedCount} dead enemies`)
    }
    
    this.enemies = aliveEnemies
  }

  /**
   * Get current enemy stats
   */
  getStats(): { count: number, spawnRate: number, maxEnemies: number } {
    return {
      count: this.enemies.length,
      spawnRate: this.currentSpawnRate,
      maxEnemies: this.maxEnemies
    }
  }

  /**
   * Get all active enemies
   */
  getEnemies(): Enemy[] {
    return this.enemies.filter(enemy => enemy.alive)
  }

  /**
   * Clear all enemies (for game reset)
   */
  clear(): void {
    for (const enemy of this.enemies) {
      this.collisionManager.removeEntity(enemy)
      if (enemy.sprite.parent) {
        enemy.sprite.parent.removeChild(enemy.sprite)
      }
    }
    this.enemies = []
  }

  /**
   * Set spawn rate manually (for testing or power-ups)
   */
  setSpawnRate(rate: number): void {
    this.currentSpawnRate = Math.max(0.1, rate)
  }
} 