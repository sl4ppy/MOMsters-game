import { Graphics } from 'pixi.js'
import { Collidable, CollisionGroup } from '../core/CollisionManager'
import { Player } from './Player'

export class ExperienceOrb implements Collidable {
  public sprite: Graphics
  public collisionRadius: number = 8
  public collisionGroup: CollisionGroup = CollisionGroup.PICKUP
  
  private xpValue: number
  private magnetRange: number = 80 // Distance at which orb is attracted to player
  private magnetSpeed: number = 200 // Speed when being attracted
  private floatTime: number = 0 // For floating animation
  private isBeingAttracted: boolean = false
  
  // Callbacks
  public onCollected?: (xpValue: number) => void

  constructor(x: number, y: number, xpValue: number = 1) {
    this.sprite = new Graphics()
    this.xpValue = xpValue
    
    // Set initial position
    this.sprite.x = x
    this.sprite.y = y
    
    this.createSprite()
  }

  private createSprite(): void {
    this.sprite.clear()
    
    // Create XP orb appearance based on value
    let outerColor = 0x00ff00 // Green for small XP
    let innerColor = 0x88ff88
    let size = this.collisionRadius
    
    if (this.xpValue >= 5) {
      outerColor = 0x0088ff // Blue for medium XP
      innerColor = 0x88ccff
      size = this.collisionRadius + 2
    }
    
    if (this.xpValue >= 10) {
      outerColor = 0xff8800 // Orange for large XP
      innerColor = 0xffcc88
      size = this.collisionRadius + 4
    }
    
    // Outer glow effect
    this.sprite.beginFill(outerColor, 0.3)
    this.sprite.drawCircle(0, 0, size + 3)
    this.sprite.endFill()
    
    // Main orb body
    this.sprite.beginFill(outerColor, 0.8)
    this.sprite.drawCircle(0, 0, size)
    this.sprite.endFill()
    
    // Inner highlight
    this.sprite.beginFill(innerColor, 0.6)
    this.sprite.drawCircle(0, 0, size - 2)
    this.sprite.endFill()
    
    // Center sparkle
    this.sprite.beginFill(0xffffff, 0.8)
    this.sprite.drawCircle(0, 0, 2)
    this.sprite.endFill()
  }

  /**
   * Update orb behavior - floating animation and magnetic attraction
   */
  update(deltaTime: number, player: Player): void {
    this.updateFloatingAnimation(deltaTime)
    this.updateMagneticAttraction(deltaTime, player)
  }

  private updateFloatingAnimation(deltaTime: number): void {
    this.floatTime += deltaTime / 60 // Convert to seconds
    
    // Gentle floating movement and pulsing effect
    const floatOffset = Math.sin(this.floatTime * 3) * 2
    const pulseScale = 1 + Math.sin(this.floatTime * 4) * 0.1
    
    this.sprite.y += floatOffset * 0.1
    this.sprite.scale.set(pulseScale)
    
    // Gentle rotation
    this.sprite.rotation += 0.02
  }

  private updateMagneticAttraction(deltaTime: number, player: Player): void {
    const playerPos = player.position
    const dx = playerPos.x - this.sprite.x
    const dy = playerPos.y - this.sprite.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Check if player is within magnet range
    if (distance <= this.magnetRange) {
      this.isBeingAttracted = true
    }
    
    if (this.isBeingAttracted && distance > 0) {
      // Move toward player with increasing speed as it gets closer
      const moveSpeed = this.magnetSpeed * (deltaTime / 60)
      const attractionStrength = Math.min(1, (this.magnetRange - distance) / this.magnetRange + 0.5)
      
      const moveX = (dx / distance) * moveSpeed * attractionStrength
      const moveY = (dy / distance) * moveSpeed * attractionStrength
      
      this.sprite.x += moveX
      this.sprite.y += moveY
      
      // Add visual effect when being attracted
      this.sprite.alpha = 0.8 + Math.sin(this.floatTime * 8) * 0.2
    }
  }

  /**
   * Handle collision with player
   */
  onCollision(other: Collidable): void {
    if (other.collisionGroup === CollisionGroup.PLAYER) {
      // Player collected this orb
      if (this.onCollected) {
        this.onCollected(this.xpValue)
      }
      
      // Add collection visual effect
      this.sprite.alpha = 0.5
      this.sprite.scale.set(1.5)
      this.sprite.tint = 0xffff00 // Yellow flash
    }
  }

  /**
   * Get XP value of this orb
   */
  get experienceValue(): number {
    return this.xpValue
  }

  /**
   * Get current position
   */
  get position(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  /**
   * Check if orb is being attracted to player
   */
  get attracted(): boolean {
    return this.isBeingAttracted
  }
} 