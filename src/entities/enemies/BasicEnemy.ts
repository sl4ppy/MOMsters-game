import { Enemy } from '../Enemy'
import { EnemySpriteManager } from '../../core/EnemySpriteManager'
import { Graphics } from 'pixi.js'

export class BasicEnemy extends Enemy {
  private enemySpriteManager: EnemySpriteManager
  private visualSprite: any // Will be Sprite or Graphics
  private enemyType: number

  constructor(enemySpriteManager: EnemySpriteManager, enemyType: number = 0) {
    // Use the specified enemy type from the atlas
    const config = enemySpriteManager.getEnemyConfig(enemyType) || {
      health: 30, speed: 80, damage: 10, collisionRadius: 12, xpValue: 2
    }
    
    super(config.health, config.speed, config.damage, config.collisionRadius, config.xpValue)
    
    this.enemySpriteManager = enemySpriteManager
    this.enemyType = enemyType
    
    // Now that we're fully initialized, create the sprite
    this.createSprite()
  }

  /**
   * Create the visual appearance of the basic enemy
   */
  protected createSprite(): void {
    // Clear any existing children
    this.sprite.removeChildren()
    
    // Try to create sprite from atlas using the specified enemy type
    const atlasSprite = this.enemySpriteManager.createEnemySprite(this.enemyType)
    
    if (atlasSprite) {
      // Use the atlas sprite
      this.visualSprite = atlasSprite
      this.sprite.addChild(atlasSprite)
    } else {
      // Fallback to graphics if atlas not loaded
      const graphics = new Graphics()
      
      // Draw main body (red circle)
      graphics.beginFill(0xff4444) // Red color
      graphics.drawCircle(0, 0, this.collisionRadius)
      graphics.endFill()
      
      // Draw inner circle for depth
      graphics.beginFill(0xff0000) // Darker red
      graphics.drawCircle(0, 0, this.collisionRadius - 4)
      graphics.endFill()
      
      // Draw simple "eye" or direction indicator
      graphics.beginFill(0x000000) // Black
      graphics.drawCircle(3, -3, 2)
      graphics.endFill()
      
      graphics.beginFill(0x000000) // Black
      graphics.drawCircle(-3, -3, 2)
      graphics.endFill()
      
      this.visualSprite = graphics
      this.sprite.addChild(graphics)
    }
  }

  /**
   * Update appearance based on damage taken
   */
  protected updateAppearance(): void {
    super.updateAppearance()
    
    if (this.visualSprite) {
      // Add flashing effect when damaged
      if (this.healthPercent < 0.5) {
        // Flash when heavily damaged
        const flash = Math.sin(Date.now() / 100) * 0.3 + 0.7
        this.visualSprite.alpha = flash
      } else {
        // Normal opacity based on health
        this.visualSprite.alpha = 0.5 + (this.healthPercent * 0.5)
      }
    }
  }
} 