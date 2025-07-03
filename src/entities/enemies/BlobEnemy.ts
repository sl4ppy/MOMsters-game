import { Enemy } from '../Enemy'
import { EnemySpriteManager } from '../../core/EnemySpriteManager'
import { Graphics } from 'pixi.js'
import { Player } from '../Player'

export class BlobEnemy extends Enemy {
  private enemySpriteManager: EnemySpriteManager
  private visualSprite: any // Will be Sprite or Graphics
  
  // Hopping state
  private isHopping: boolean = false
  private hopCooldown: number = 0
  private hopDuration: number = 0.6 // How long a hop takes (in seconds)
  private hopCooldownTime: number = 1.0 // Time between hops (in seconds)
  private hopHeight: number = 30 // How high the blob hops
  
  // Hop animation
  private hopTimer: number = 0
  private hopStartX: number = 0
  private hopStartY: number = 0
  private hopTargetX: number = 0
  private hopTargetY: number = 0
  private originalY: number = 0

  constructor(enemySpriteManager: EnemySpriteManager) {
    // Use blob config from the sprite manager (enemy type 0)
    const config = enemySpriteManager.getEnemyConfig(0) || {
      health: 20, speed: 75, damage: 6, collisionRadius: 10, xpValue: 4
    }
    
    super(config.health, config.speed, config.damage, config.collisionRadius, config.xpValue)
    
    this.enemySpriteManager = enemySpriteManager
    
    // Now that we're fully initialized, create the sprite
    this.createSprite()
  }

  /**
   * Create the visual appearance of the blob enemy
   */
  protected createSprite(): void {
    // Clear any existing children
    this.sprite.removeChildren()
    
    // Try to create sprite from atlas using enemy type 0 (blob)
    const atlasSprite = this.enemySpriteManager.createEnemySprite(0)
    
    if (atlasSprite) {
      // Use the atlas sprite
      this.visualSprite = atlasSprite
      this.sprite.addChild(atlasSprite)
    } else {
      // Fallback to graphics if atlas not loaded - make it look more blob-like
      const graphics = new Graphics()
      
      // Draw main body (green blob-like shape)
      graphics.beginFill(0x44ff44) // Green color for blob
      graphics.drawEllipse(0, 0, this.collisionRadius, this.collisionRadius * 0.8) // Slightly flattened circle
      graphics.endFill()
      
      // Draw inner highlight for blobby effect
      graphics.beginFill(0x88ff88) // Lighter green
      graphics.drawEllipse(-3, -4, this.collisionRadius * 0.6, this.collisionRadius * 0.5)
      graphics.endFill()
      
      // Draw simple "eyes"
      graphics.beginFill(0x000000) // Black
      graphics.drawCircle(-4, -2, 2)
      graphics.drawCircle(4, -2, 2)
      graphics.endFill()
      
      this.visualSprite = graphics
      this.sprite.addChild(graphics)
    }
  }

  /**
   * Override the movement behavior to implement hopping
   */
  protected moveTowardPlayer(deltaTime: number, player: Player): void {
    const deltaSeconds = deltaTime / 60 // Convert to seconds

    // Update hop cooldown
    if (this.hopCooldown > 0) {
      this.hopCooldown -= deltaSeconds
    }

    // If currently hopping, continue the hop animation
    if (this.isHopping) {
      this.updateHopAnimation(deltaSeconds)
      return
    }

    // If cooldown is over, start a new hop
    if (this.hopCooldown <= 0) {
      this.startHop(player)
    }
  }

  /**
   * Start a hop toward the player
   */
  private startHop(player: Player): void {
    // Calculate direction to player
    const dx = player.sprite.x - this.sprite.x
    const dy = player.sprite.y - this.sprite.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) return

    // Set hop parameters
    this.isHopping = true
    this.hopTimer = 0
    this.hopStartX = this.sprite.x
    this.hopStartY = this.sprite.y
    this.originalY = this.sprite.y

    // Calculate hop distance (reduced from full speed to make it more manageable)
    const hopDistance = this.speed * 0.6 // Hop covers 60% of normal speed distance per hop
    
    // Normalize direction and apply hop distance
    this.hopTargetX = this.sprite.x + (dx / distance) * hopDistance
    this.hopTargetY = this.sprite.y + (dy / distance) * hopDistance

    // Update rotation to face hop direction
    this.updateRotation(dx, dy)
  }

  /**
   * Update the hop animation
   */
  private updateHopAnimation(deltaSeconds: number): void {
    this.hopTimer += deltaSeconds

    // Calculate hop progress (0 to 1)
    const progress = Math.min(this.hopTimer / this.hopDuration, 1)

    if (progress >= 1) {
      // Hop completed
      this.sprite.x = this.hopTargetX
      this.sprite.y = this.hopTargetY
      this.isHopping = false
      this.hopCooldown = this.hopCooldownTime
      
      // Add a little bounce effect when landing
      this.addLandingEffect()
    } else {
      // Interpolate position
      this.sprite.x = this.hopStartX + (this.hopTargetX - this.hopStartX) * progress
      this.sprite.y = this.hopStartY + (this.hopTargetY - this.hopStartY) * progress

      // Add parabolic height for the hop effect
      // Use sine wave for smooth arc - peaks at 50% progress
      const heightOffset = Math.sin(progress * Math.PI) * this.hopHeight
      this.sprite.y = this.originalY + (this.hopTargetY - this.originalY) * progress - heightOffset
    }
  }

  /**
   * Add a visual effect when the blob lands from a hop
   */
  private addLandingEffect(): void {
    if (this.visualSprite) {
      // Slight squash effect on landing
      const originalScaleY = this.visualSprite.scale.y
      this.visualSprite.scale.y = 0.7 // Squash down
      this.visualSprite.scale.x = 1.2 // Stretch wider
      
      // Restore normal scale after a short time
      setTimeout(() => {
        if (this.visualSprite) {
          this.visualSprite.scale.y = originalScaleY
          this.visualSprite.scale.x = 1.0
        }
      }, 100)
    }
  }

  /**
   * Update appearance based on damage taken and hop state
   */
  protected updateAppearance(): void {
    super.updateAppearance()
    
    if (this.visualSprite) {
      // Add different effects for hopping vs on ground
      if (this.hopCooldown > 0) {
        // Slightly dimmed while on cooldown
        const cooldownProgress = 1 - (this.hopCooldown / this.hopCooldownTime)
        this.visualSprite.alpha = Math.max(0.6, 0.6 + cooldownProgress * 0.4)
      }
    }
  }
} 