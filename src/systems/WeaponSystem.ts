import { Container } from 'pixi.js'
import { CollisionManager } from '../core/CollisionManager'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { Projectile } from '../entities/Projectile'
import { EnemySpawner } from './EnemySpawner'

export class WeaponSystem {
  private projectiles: Projectile[] = []
  private gameContainer: Container
  private collisionManager: CollisionManager
  private player: Player
  private enemySpawner: EnemySpawner
  
  // Weapon settings
  private fireRate: number = 1.5 // Shots per second
  private timeSinceLastShot: number = 0
  private range: number = 300 // Maximum targeting range
  private projectileSpeed: number = 400
  private projectileDamage: number = 25
  
  // Stats
  private totalShotsFired: number = 0
  private totalHits: number = 0

  constructor(gameContainer: Container, collisionManager: CollisionManager, player: Player, enemySpawner: EnemySpawner) {
    this.gameContainer = gameContainer
    this.collisionManager = collisionManager
    this.player = player
    this.enemySpawner = enemySpawner
  }

  /**
   * Update weapon system - handle auto-firing and projectile management
   */
  update(deltaTime: number): void {
    this.updateFiring(deltaTime)
    this.updateProjectiles(deltaTime)
    this.cleanupInactiveProjectiles()
  }

  /**
   * Handle automatic firing at nearest enemies
   */
  private updateFiring(deltaTime: number): void {
    this.timeSinceLastShot += deltaTime / 60 // Convert to seconds
    
    const shotInterval = 1 / this.fireRate
    if (this.timeSinceLastShot >= shotInterval) {
      const target = this.findNearestEnemy()
      if (target) {
        this.fireProjectile(target)
        this.timeSinceLastShot = 0
      }
    }
  }

  /**
   * Find the nearest enemy within range
   */
  private findNearestEnemy(): Enemy | null {
    const enemies = this.enemySpawner.getEnemies()
    if (enemies.length === 0) return null
    
    let nearestEnemy: Enemy | null = null
    let nearestDistance = this.range
    
    const playerPos = this.player.position
    
    for (const enemy of enemies) {
      const enemyPos = enemy.position
      const distance = Math.sqrt(
        Math.pow(enemyPos.x - playerPos.x, 2) + 
        Math.pow(enemyPos.y - playerPos.y, 2)
      )
      
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    }
    
    return nearestEnemy
  }

  /**
   * Fire a projectile at the target
   */
  private fireProjectile(target: Enemy): void {
    const playerPos = this.player.position
    const targetPos = target.position
    
    // Create projectile at player position, aimed at enemy
    const projectile = new Projectile(
      playerPos.x, 
      playerPos.y, 
      targetPos.x, 
      targetPos.y, 
      this.projectileSpeed, 
      this.projectileDamage
    )
    
    // Set up projectile callbacks
    projectile.onHitTarget = (hitTarget) => {
      this.handleProjectileHit(projectile, hitTarget)
    }
    
    projectile.onExpired = () => {
      this.handleProjectileExpired(projectile)
    }
    
    // Add to world and collision system
    this.gameContainer.addChild(projectile.sprite)
    this.collisionManager.addEntity(projectile)
    this.projectiles.push(projectile)
    
    this.totalShotsFired++
    
    // Debug logging (very minimal)
    if (this.totalShotsFired === 1) {
      console.log('Weapon system activated - auto-firing at enemies!')
    }
  }

  /**
   * Handle projectile hitting a target
   */
  private handleProjectileHit(projectile: Projectile, target: any): void {
    // Deal damage to the target
    if (target.takeDamage && typeof target.takeDamage === 'function') {
      const killed = target.takeDamage(projectile.projectileDamage)
      if (killed && this.totalHits % 10 === 0) {
        console.log(`Enemy eliminated! Total kills: ${Math.floor(this.totalHits / 1)}`)
      }
    }
    
    this.totalHits++
  }

  /**
   * Handle projectile expiring (reached max lifetime)
   */
  private handleProjectileExpired(_projectile: Projectile): void {
    // Projectile expired without hitting anything
    // Could add visual effect here if needed
  }

  /**
   * Update all active projectiles
   */
  private updateProjectiles(deltaTime: number): void {
    for (const projectile of this.projectiles) {
      if (projectile.active) {
        projectile.update(deltaTime)
      }
    }
  }

  /**
   * Remove inactive projectiles from the game
   */
  private cleanupInactiveProjectiles(): void {
    const activeProjectiles: Projectile[] = []
    
    for (const projectile of this.projectiles) {
      if (projectile.active) {
        activeProjectiles.push(projectile)
      } else {
        // Remove from collision system
        this.collisionManager.removeEntity(projectile)
        
        // Remove from display after a short delay (for hit effect)
        setTimeout(() => {
          if (projectile.sprite.parent) {
            projectile.sprite.parent.removeChild(projectile.sprite)
          }
        }, 100)
      }
    }
    
    const removedCount = this.projectiles.length - activeProjectiles.length
    if (removedCount > 0) {
      // Only log cleanup of large batches
      if (removedCount >= 5) {
        console.log(`Cleaned up ${removedCount} projectiles`)
      }
    }
    
    this.projectiles = activeProjectiles
  }

  /**
   * Get weapon statistics
   */
  getStats(): { shotsFired: number, hits: number, accuracy: number, activeProjectiles: number } {
    const accuracy = this.totalShotsFired > 0 ? (this.totalHits / this.totalShotsFired) * 100 : 0
    
    return {
      shotsFired: this.totalShotsFired,
      hits: this.totalHits,
      accuracy: Math.round(accuracy),
      activeProjectiles: this.projectiles.length
    }
  }

  /**
   * Upgrade weapon properties
   */
  upgrade(property: 'fireRate' | 'damage' | 'speed' | 'range', amount: number): void {
    switch (property) {
      case 'fireRate':
        this.fireRate = Math.min(10, this.fireRate + amount) // Max 10 shots/sec
        break
      case 'damage':
        this.projectileDamage += amount
        break
      case 'speed':
        this.projectileSpeed += amount
        break
      case 'range':
        this.range += amount
        break
    }
    
    console.log(`Weapon upgraded: ${property} +${amount}`)
  }

  /**
   * Apply upgrades from leveling system
   */
  applyUpgrades(upgrades: {
    damageMultiplier: number,
    fireRateMultiplier: number,
    rangeBonus: number,
    pierceBonus: number
  }): void {
    // Apply damage multiplier (base damage is 25)
    this.projectileDamage = Math.floor(25 * upgrades.damageMultiplier)
    
    // Apply fire rate multiplier (base rate is 1.5 shots/sec)
    this.fireRate = Math.min(10, 1.5 * upgrades.fireRateMultiplier)
    
    // Apply range bonus (base range is 300)
    this.range = 300 + upgrades.rangeBonus
    
    // Note: pierceBonus will be implemented when we add piercing projectiles
    // For now, we'll store it for future use
    if (upgrades.pierceBonus > 0) {
      // TODO: Implement piercing projectiles
      console.log(`Piercing bonus available: +${upgrades.pierceBonus} pierce`)
    }
  }

  /**
   * Get current weapon properties
   */
  getWeaponInfo(): { fireRate: number, damage: number, speed: number, range: number } {
    return {
      fireRate: this.fireRate,
      damage: this.projectileDamage,
      speed: this.projectileSpeed,
      range: this.range
    }
  }

  /**
   * Clear all projectiles (for game reset)
   */
  clear(): void {
    for (const projectile of this.projectiles) {
      this.collisionManager.removeEntity(projectile)
      if (projectile.sprite.parent) {
        projectile.sprite.parent.removeChild(projectile.sprite)
      }
    }
    this.projectiles = []
    this.totalShotsFired = 0
    this.totalHits = 0
  }
} 