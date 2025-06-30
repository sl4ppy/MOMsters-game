import { Graphics } from 'pixi.js'
import { Collidable, CollisionGroup } from '../core/CollisionManager'
import { Player } from './Player'

export abstract class Enemy implements Collidable {
  public sprite: Graphics
  public collisionRadius: number
  public collisionGroup: CollisionGroup = CollisionGroup.ENEMY
  
  protected health: number
  protected maxHealth: number
  protected speed: number
  protected damage: number
  protected xpValue: number = 1 // Default XP value
  protected isAlive: boolean = true
  
  constructor(health: number, speed: number, damage: number, collisionRadius: number, xpValue: number = 1) {
    this.sprite = new Graphics()
    this.health = health
    this.maxHealth = health
    this.speed = speed
    this.damage = damage
    this.collisionRadius = collisionRadius
    this.xpValue = xpValue
    
    this.createSprite()
  }

  /**
   * Abstract method - each enemy type must implement its own visual appearance
   */
  protected abstract createSprite(): void

  /**
   * Update enemy behavior - movement, AI, etc.
   */
  update(deltaTime: number, player: Player): void {
    if (!this.isAlive) return
    
    // Basic AI: move toward player
    this.moveTowardPlayer(deltaTime, player)
    
    // Update sprite appearance based on health
    this.updateAppearance()
  }

  /**
   * Basic AI: move toward the player
   */
  protected moveTowardPlayer(deltaTime: number, player: Player): void {
    const dx = player.sprite.x - this.sprite.x
    const dy = player.sprite.y - this.sprite.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 0) {
      // Normalize direction and apply speed
      const moveSpeed = this.speed * (deltaTime / 60)
      this.sprite.x += (dx / distance) * moveSpeed
      this.sprite.y += (dy / distance) * moveSpeed
    }
  }

  /**
   * Handle collision with other entities
   */
  onCollision(other: Collidable): void {
    if (other.collisionGroup === CollisionGroup.PLAYER) {
      // Deal damage to player (will be handled by player's collision response)
      // Less verbose logging for combat
    }
    
    if (other.collisionGroup === CollisionGroup.PROJECTILE) {
      // Take damage from projectile
      const projectile = other as any
      const damage = projectile.projectileDamage || 10 // Use projectile's damage or default
      
      const killed = this.takeDamage(damage)
      // Less verbose logging for better gameplay experience
    }
  }

  /**
   * Take damage and handle death
   */
  takeDamage(amount: number): boolean {
    if (!this.isAlive) return false
    
    this.health -= amount
    
    if (this.health <= 0) {
      this.health = 0
      this.die()
      return true // Enemy died
    }
    
    return false // Enemy still alive
  }

  /**
   * Handle enemy death
   */
  protected die(): void {
    this.isAlive = false
    this.sprite.alpha = 0.3 // Make semi-transparent to show it's dead
    
    // Remove from collision after a short delay (for visual feedback)
    setTimeout(() => {
      if (this.sprite.parent) {
        this.sprite.parent.removeChild(this.sprite)
      }
    }, 500)
  }

  /**
   * Update visual appearance based on health
   */
  protected updateAppearance(): void {
    if (!this.isAlive) return
    
    // Change opacity based on health
    const healthPercent = this.health / this.maxHealth
    this.sprite.alpha = 0.5 + (healthPercent * 0.5) // Range from 0.5 to 1.0
  }

  /**
   * Get current health percentage
   */
  get healthPercent(): number {
    return this.health / this.maxHealth
  }

  /**
   * Check if enemy is alive
   */
  get alive(): boolean {
    return this.isAlive
  }

  /**
   * Get damage dealt by this enemy
   */
  get attackDamage(): number {
    return this.damage
  }

  /**
   * Get enemy position
   */
  get position(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  /**
   * Get experience value for killing this enemy
   */
  get experienceValue(): number {
    return this.xpValue
  }
} 