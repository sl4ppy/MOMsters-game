import { Graphics, Sprite, Container } from 'pixi.js'
import { Collidable, CollisionGroup } from '../core/CollisionManager'
import { Player } from './Player'
import { GemSpriteManager } from '../core/GemSpriteManager'

export class ExperienceOrb implements Collidable {
  public sprite: Container
  public collisionRadius: number = 8
  public collisionGroup: CollisionGroup = CollisionGroup.PICKUP
  
  private gemSpriteManager: GemSpriteManager
  private visualSprite: Sprite | Graphics | null = null
  
  private xpValue: number
  private magnetSpeed: number = 200 // Speed when being attracted
  private getMagnetRange: () => number // Function to get current magnet range
  private floatTime: number = 0 // For floating animation
  private isBeingAttracted: boolean = false
  
  // Callbacks
  public onCollected?: (xpValue: number) => void

  constructor(x: number, y: number, xpValue: number = 1, gemSpriteManager: GemSpriteManager, getMagnetRange: () => number) {
    this.sprite = new Container()
    this.xpValue = xpValue
    this.gemSpriteManager = gemSpriteManager
    this.getMagnetRange = getMagnetRange
    
    // Set initial position
    this.sprite.x = x
    this.sprite.y = y
    
    this.createSprite()
  }

  private createSprite(): void {
    // Clear any existing children
    this.sprite.removeChildren()
    
    // Try to create gem sprite from atlas
    const gemSprite = this.gemSpriteManager.createGemSprite(this.xpValue)
    
    if (gemSprite) {
      // Use the gem sprite from atlas
      this.visualSprite = gemSprite
      this.sprite.addChild(gemSprite)
    } else {
      // Fallback to graphics if atlas not loaded
      const graphics = new Graphics()
      
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
      graphics.beginFill(outerColor, 0.3)
      graphics.drawCircle(0, 0, size + 3)
      graphics.endFill()
      
      // Main orb body
      graphics.beginFill(outerColor, 0.8)
      graphics.drawCircle(0, 0, size)
      graphics.endFill()
      
      // Inner highlight
      graphics.beginFill(innerColor, 0.6)
      graphics.drawCircle(0, 0, size - 2)
      graphics.endFill()
      
      // Center sparkle
      graphics.beginFill(0xffffff, 0.8)
      graphics.drawCircle(0, 0, 2)
      graphics.endFill()
      
      this.visualSprite = graphics
      this.sprite.addChild(graphics)
    }
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
    
    // Only apply floating animation if not being attracted to player
    if (!this.isBeingAttracted) {
      this.sprite.y += floatOffset * 0.1
    }
    
    this.sprite.scale.set(pulseScale)
    
    // Gentle rotation
    this.sprite.rotation += 0.02
  }

  private updateMagneticAttraction(deltaTime: number, player: Player): void {
    const playerPos = player.position
    const dx = playerPos.x - this.sprite.x
    const dy = playerPos.y - this.sprite.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const magnetRange = this.getMagnetRange()
    
    // Check if player is within magnet range
    if (distance <= magnetRange) {
      this.isBeingAttracted = true
    }
    
    if (this.isBeingAttracted && distance > 0) {
      // Move toward player with increasing speed as it gets closer
      const moveSpeed = this.magnetSpeed * (deltaTime / 60)
      const attractionStrength = Math.min(1, (magnetRange - distance) / magnetRange + 0.5)
      
      const moveX = (dx / distance) * moveSpeed * attractionStrength
      const moveY = (dy / distance) * moveSpeed * attractionStrength
      
      this.sprite.x += moveX
      this.sprite.y += moveY
      
      // Add visual effect when being attracted
      this.sprite.alpha = 0.8 + Math.sin(this.floatTime * 8) * 0.2
      
      // Debug: log if gem is moving away from player
      if (Math.abs(dx) > 100 || Math.abs(dy) > 100) {
        console.log(`XP gem moving away! Distance: ${distance.toFixed(1)}, Magnet range: ${magnetRange}, DX: ${dx.toFixed(1)}, DY: ${dy.toFixed(1)}`)
      }
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
      if (this.visualSprite) {
        this.visualSprite.tint = 0xffff00 // Yellow flash
      }
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