import { Enemy } from '../Enemy'

export class BasicEnemy extends Enemy {
  constructor() {
    // health, speed, damage, collisionRadius, xpValue
    super(30, 80, 10, 12, 2)
  }

  /**
   * Create the visual appearance of the basic enemy
   */
  protected createSprite(): void {
    this.sprite.clear()
    
    // Draw main body (red circle)
    this.sprite.beginFill(0xff4444) // Red color
    this.sprite.drawCircle(0, 0, this.collisionRadius)
    this.sprite.endFill()
    
    // Draw inner circle for depth
    this.sprite.beginFill(0xff0000) // Darker red
    this.sprite.drawCircle(0, 0, this.collisionRadius - 4)
    this.sprite.endFill()
    
    // Draw simple "eye" or direction indicator
    this.sprite.beginFill(0x000000) // Black
    this.sprite.drawCircle(3, -3, 2)
    this.sprite.endFill()
    
    this.sprite.beginFill(0x000000) // Black
    this.sprite.drawCircle(-3, -3, 2)
    this.sprite.endFill()
  }

  /**
   * Update appearance based on damage taken
   */
  protected updateAppearance(): void {
    super.updateAppearance()
    
    // Add flashing effect when damaged
    if (this.healthPercent < 0.5) {
      // Flash red when heavily damaged
      const flash = Math.sin(Date.now() / 100) * 0.3 + 0.7
      this.sprite.alpha = flash
    }
  }
} 