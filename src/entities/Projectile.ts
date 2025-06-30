import { Graphics } from 'pixi.js'
import { Collidable, CollisionGroup } from '../core/CollisionManager'

export class Projectile implements Collidable {
  public sprite: Graphics
  public collisionRadius: number = 3
  public collisionGroup: CollisionGroup = CollisionGroup.PROJECTILE
  
  private velocity: { x: number, y: number }
  private _speed: number
  private damage: number
  private lifetime: number
  private maxLifetime: number
  private isActive: boolean = true
  
  // Callbacks
  public onHitTarget?: (target: Collidable) => void
  public onExpired?: () => void

  constructor(x: number, y: number, targetX: number, targetY: number, speed: number = 300, damage: number = 10) {
    this.sprite = new Graphics()
    this._speed = speed
    this.damage = damage
    this.lifetime = 0
    this.maxLifetime = 3 // 3 seconds max flight time
    
    // Set initial position
    this.sprite.x = x
    this.sprite.y = y
    
    // Calculate direction vector toward target
    const dx = targetX - x
    const dy = targetY - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 0) {
      this.velocity = {
        x: (dx / distance) * this._speed,
        y: (dy / distance) * this._speed
      }
    } else {
      // If no distance, shoot right
      this.velocity = { x: this._speed, y: 0 }
    }
    
    this.createSprite()
  }

  private createSprite(): void {
    this.sprite.clear()
    
    // Create a simple projectile - small white circle with blue center
    this.sprite.beginFill(0xffffff) // White outer
    this.sprite.drawCircle(0, 0, this.collisionRadius)
    this.sprite.endFill()
    
    this.sprite.beginFill(0x00aaff) // Blue center
    this.sprite.drawCircle(0, 0, this.collisionRadius - 1)
    this.sprite.endFill()
    
    // Add a small trail effect
    this.sprite.beginFill(0xffffff, 0.3)
    this.sprite.drawCircle(-2, 0, 1)
    this.sprite.endFill()
  }

  /**
   * Update projectile movement and lifetime
   */
  update(deltaTime: number): void {
    if (!this.isActive) return
    
    // Update position based on velocity
    const frameVelocity = {
      x: this.velocity.x * (deltaTime / 60),
      y: this.velocity.y * (deltaTime / 60)
    }
    
    this.sprite.x += frameVelocity.x
    this.sprite.y += frameVelocity.y
    
    // Update lifetime
    this.lifetime += deltaTime / 60 // Convert to seconds
    
    // Check if projectile has expired
    if (this.lifetime >= this.maxLifetime) {
      this.expire()
    }
    
    // Update visual effects
    this.updateAppearance()
  }

  private updateAppearance(): void {
    // Fade out as projectile ages
    const agePercent = this.lifetime / this.maxLifetime
    this.sprite.alpha = 1.0 - (agePercent * 0.3) // Fade to 70% opacity
    
    // Add slight rotation for visual interest
    this.sprite.rotation += 0.1
  }

  /**
   * Handle collision with other entities
   */
  onCollision(other: Collidable): void {
    if (!this.isActive) return
    
    if (other.collisionGroup === CollisionGroup.ENEMY) {
      // Hit an enemy
      if (this.onHitTarget) {
        this.onHitTarget(other)
      }
      
      // Destroy this projectile
      this.destroy()
    }
  }

  /**
   * Expire the projectile (reached max lifetime)
   */
  private expire(): void {
    this.isActive = false
    if (this.onExpired) {
      this.onExpired()
    }
  }

  /**
   * Destroy the projectile immediately (hit target)
   */
  destroy(): void {
    this.isActive = false
    // Add hit effect
    this.sprite.alpha = 0.5
    this.sprite.tint = 0xffff00 // Yellow flash
  }

  /**
   * Check if projectile is still active
   */
  get active(): boolean {
    return this.isActive
  }

  /**
   * Get projectile damage
   */
  get projectileDamage(): number {
    return this.damage
  }

  /**
   * Get current position
   */
  get position(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  /**
   * Get current velocity
   */
  get currentVelocity(): { x: number, y: number } {
    return { ...this.velocity }
  }
} 