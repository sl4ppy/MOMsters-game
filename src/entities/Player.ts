import { Graphics } from 'pixi.js'
import { InputManager } from '../core/InputManager'
import { Collidable, CollisionGroup } from '../core/CollisionManager'

export class Player implements Collidable {
  public sprite: Graphics
  public collisionRadius: number = 15
  public collisionGroup: CollisionGroup = CollisionGroup.PLAYER
  private speed: number = 200 // pixels per second
  private baseSpeed: number = 200 // Base speed for upgrades
  private health: number = 100
  private maxHealth: number = 100
  private baseMaxHealth: number = 100 // Base max health for upgrades
  private invulnerabilityTimer: number = 0
  private invulnerabilityDuration: number = 60 // 1 second at 60fps
  
  // Health regeneration
  private healthRegenRate: number = 0.5 // HP per second
  private baseRegenRate: number = 0.5 // Base regen rate for upgrades
  private healthRegenDelay: number = 5 // Seconds before regen starts after taking damage
  private timeSinceLastDamage: number = 0
  
  // Callbacks
  public onDamageTaken?: (damage: number) => void
  public onPlayerDied?: () => void

  constructor() {
    this.sprite = new Graphics()
    this.createSprite()
  }

  init(): void {
    console.log('Player initialized')
  }

  private createSprite(): void {
    // Create a simple colored circle for the player
    this.sprite.clear()
    this.sprite.beginFill(0x00ff00) // Green color
    this.sprite.drawCircle(0, 0, 15) // Circle with radius 15
    this.sprite.endFill()
    
    // Add a simple direction indicator
    this.sprite.beginFill(0xffffff)
    this.sprite.drawCircle(5, 0, 3)
    this.sprite.endFill()
  }

  update(deltaTime: number, inputManager: InputManager, screenWidth: number = 1024, _screenHeight: number = 768): void {
    const input = inputManager.getInputState()
    const moveSpeed = this.speed * (deltaTime / 60) // Convert to pixels per frame
    
    // Update invulnerability timer
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= deltaTime
    }
    
    // Update health regeneration
    this.updateHealthRegeneration(deltaTime)
    
    // Update visual appearance based on health and invulnerability
    this.updateAppearance()
    
    // Debug input state (minimal) - commented out for cleaner gameplay
    // if (input.left || input.right || input.up || input.down) {
    //   console.log(`Player moving: (${this.sprite.x.toFixed(1)}, ${this.sprite.y.toFixed(1)})`)
    // }
    
    // Calculate movement
    let deltaX = 0
    let deltaY = 0
    
    if (input.left) deltaX -= moveSpeed
    if (input.right) deltaX += moveSpeed
    if (input.up) deltaY -= moveSpeed
    if (input.down) deltaY += moveSpeed
    
    // Normalize diagonal movement
    if (deltaX !== 0 && deltaY !== 0) {
      const normalizer = Math.sqrt(2) / 2
      deltaX *= normalizer
      deltaY *= normalizer
    }
    
    // Apply movement
    this.sprite.x += deltaX
    this.sprite.y += deltaY
    
    // Position changed (minimal debug)
    
    // Keep player within world bounds (centered around origin)
    const halfWorld = screenWidth / 2 // Using screenWidth as worldSize (2000/2 = 1000)
    this.sprite.x = Math.max(-halfWorld + 15, Math.min(halfWorld - 15, this.sprite.x))
    this.sprite.y = Math.max(-halfWorld + 15, Math.min(halfWorld - 15, this.sprite.y))
  }

  takeDamage(amount: number): boolean {
    this.health -= amount
    this.timeSinceLastDamage = 0 // Reset regen timer
    
    if (this.health <= 0) {
      this.health = 0
      return true // Player is dead
    }
    return false
  }

  /**
   * Handle collision with other entities
   */
  onCollision(other: Collidable): void {
    switch (other.collisionGroup) {
      case CollisionGroup.ENEMY:
        // Only take damage if not invulnerable
        if (this.invulnerabilityTimer <= 0) {
          const enemy = other as any // Cast to access enemy properties
          const damage = enemy.attackDamage || 10 // Default damage if not specified
          
          if (this.takeDamage(damage)) {
            console.log('Player died!')
            if (this.onPlayerDied) this.onPlayerDied()
          } else {
            console.log(`Player took ${damage} damage! Health: ${this.health}/${this.maxHealth}`)
            if (this.onDamageTaken) this.onDamageTaken(damage)
          }
          
          // Start invulnerability frames
          this.invulnerabilityTimer = this.invulnerabilityDuration
        }
        break
      case CollisionGroup.PICKUP:
        // Collect pickup (will implement pickup system later)
        console.log('Player collected pickup!')
        break
    }
  }

  /**
   * Update health regeneration system
   */
  private updateHealthRegeneration(deltaTime: number): void {
    this.timeSinceLastDamage += deltaTime / 60 // Convert to seconds
    
    // Only regenerate if enough time has passed and not at full health
    if (this.timeSinceLastDamage >= this.healthRegenDelay && this.health < this.maxHealth) {
      const regenAmount = this.healthRegenRate * (deltaTime / 60)
      this.health = Math.min(this.maxHealth, this.health + regenAmount)
    }
  }

  /**
   * Update visual appearance based on health and status
   */
  private updateAppearance(): void {
    // Flash during invulnerability frames
    if (this.invulnerabilityTimer > 0) {
      // Flash effect - alternate between visible and semi-transparent
      const flashSpeed = 8 // How fast to flash
      const alpha = Math.sin(this.invulnerabilityTimer * flashSpeed) > 0 ? 1.0 : 0.5
      this.sprite.alpha = alpha
    } else {
      this.sprite.alpha = 1.0
    }
    
    // Change color based on health
    const healthPercent = this.health / this.maxHealth
    if (healthPercent < 0.3) {
      // Red tint when critically low health
      this.sprite.tint = 0xff8888
    } else if (healthPercent < 0.6) {
      // Yellow tint when moderately damaged
      this.sprite.tint = 0xffff88
    } else {
      // Normal color when healthy
      this.sprite.tint = 0xffffff
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  /**
   * Apply health upgrades from leveling system
   */
  applyHealthUpgrades(healthBonus: number, regenBonus: number): void {
    const newMaxHealth = this.baseMaxHealth + healthBonus
    if (newMaxHealth !== this.maxHealth) {
      this.maxHealth = newMaxHealth
      // Give some immediate health when max health increases
      this.health = Math.min(this.health + (healthBonus * 0.5), this.maxHealth)
    }
    
    this.healthRegenRate = this.baseRegenRate + regenBonus
  }

  /**
   * Apply speed upgrades from leveling system
   */
  applySpeedUpgrade(speedBonus: number): void {
    this.speed = this.baseSpeed + (this.baseSpeed * speedBonus / 100)
  }

  // Getters
  get currentHealth(): number { return this.health }
  get maximumHealth(): number { return this.maxHealth }
  get position(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }
  get isInvulnerable(): boolean { return this.invulnerabilityTimer > 0 }
  get isDead(): boolean { return this.health <= 0 }
  get healthPercent(): number { return this.health / this.maxHealth }
} 