import { Graphics, Sprite, DisplayObject } from 'pixi.js'
import { InputManager } from '../core/InputManager'
import { Collidable, CollisionGroup } from '../core/CollisionManager'
import { Assets } from 'pixi.js'

export class SimplePlayer implements Collidable {
  public sprite: DisplayObject
  public collisionRadius: number = 25
  public collisionGroup: CollisionGroup = CollisionGroup.PLAYER
  
  private speed: number = 200
  private health: number = 100
  private maxHealth: number = 100
  private invulnerabilityTimer: number = 0
  private invulnerabilityDuration: number = 60
  
  // Health regeneration
  private healthRegenRate: number = 0.5
  private healthRegenDelay: number = 5
  private timeSinceLastDamage: number = 0
  
  // Animation
  private animationTime: number = 0
  
  // Sprite management
  private graphicsSprite: Graphics
  private godzillaSprite?: Sprite
  private currentDesign: 'hexagon' | 'circle' | 'godzilla' = 'godzilla'
  
  // Callbacks
  public onDamageTaken?: (damage: number) => void
  public onPlayerDied?: () => void

  constructor() {
    this.graphicsSprite = new Graphics()
    this.sprite = this.graphicsSprite
    // Don't create hexagon by default - wait for godzilla to load
    this.createHexagonCharacter() // Keep this as fallback
  }

  async init(): Promise<void> {
    console.log('SimplePlayer initialized')
    console.log('🔄 Starting godzilla sprite loading...')
    await this.loadGodzillaSprite()
    console.log('✅ SimplePlayer init complete. Godzilla sprite loaded:', !!this.godzillaSprite)
    
    // Switch to godzilla as default if it loaded successfully
    if (this.godzillaSprite) {
      console.log('🎮 Switching to godzilla as default character...')
      this.switchCharacterDesign('godzilla')
    } else {
      console.log('⚠️ Godzilla sprite failed to load, keeping hexagon as fallback')
    }
  }

  private async loadGodzillaSprite(): Promise<void> {
    try {
      console.log('🔄 Loading godzilla sprite...')
      const texture = await Assets.load('/sprites/godzilla_small.png')
      this.godzillaSprite = new Sprite(texture)
      this.godzillaSprite.width = 64
      this.godzillaSprite.height = 64
      this.godzillaSprite.anchor.set(0.5, 0.5)
      console.log('✅ Godzilla sprite loaded for player!')
      console.log('🔍 Godzilla sprite dimensions:', this.godzillaSprite.width, 'x', this.godzillaSprite.height)
    } catch (error) {
      console.error('❌ Failed to load godzilla sprite:', error)
      console.error('Error details:', error)
    }
  }

  update(deltaTime: number, inputManager: InputManager, screenWidth: number = 1024, _screenHeight: number = 768): void {
    const input = inputManager.getInputState()
    const moveSpeed = this.speed * (deltaTime / 60)
    
    // Update animation time
    this.animationTime += deltaTime
    
    // Update invulnerability timer
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= deltaTime
    }
    
    // Update health regeneration
    this.updateHealthRegeneration(deltaTime)
    
    // Update visual appearance
    this.updateAppearance()
    
    // Update animation
    this.updateAnimation()
    
    // Handle character switching
    if (inputManager.isKeyJustPressed('KeyC')) {
      console.log('Switching to circle design...')
      this.switchCharacterDesign('circle')
    } else if (inputManager.isKeyJustPressed('KeyH')) {
      console.log('Switching to hexagon design...')
      this.switchCharacterDesign('hexagon')
    } else if (inputManager.isKeyJustPressed('KeyG')) {
      console.log('🎮 Switching to godzilla design...')
      console.log('🔍 Godzilla sprite exists:', !!this.godzillaSprite)
      this.switchCharacterDesign('godzilla')
    } else if (inputManager.isKeyJustPressed('KeyT')) {
      console.log('🧪 Test key pressed - checking godzilla sprite...')
      this.testGodzillaSprite()
    }
    
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
    
    // Update sprite orientation based on movement direction
    this.updateSpriteOrientation(deltaX)
    
    // Keep player within world bounds
    const halfWorld = screenWidth / 2
    this.sprite.x = Math.max(-halfWorld + 25, Math.min(halfWorld - 25, this.sprite.x))
    this.sprite.y = Math.max(-halfWorld + 25, Math.min(halfWorld - 25, this.sprite.y))
  }

  private switchCharacterDesign(design: 'hexagon' | 'circle' | 'godzilla'): void {
    this.currentDesign = design
    
    // Store the current position and parent
    const currentX = this.sprite.x
    const currentY = this.sprite.y
    const parent = this.sprite.parent
    
    // Remove current sprite from display list
    if (parent) {
      parent.removeChild(this.sprite)
    }
    
    if (design === 'godzilla' && this.godzillaSprite) {
      // Use the bitmap sprite
      this.sprite = this.godzillaSprite
      console.log('🎉 Using godzilla bitmap sprite!')
      console.log('🔍 Godzilla sprite position:', this.godzillaSprite.x, this.godzillaSprite.y)
      console.log('🔍 Godzilla sprite visible:', this.godzillaSprite.visible)
    } else if (design === 'godzilla' && !this.godzillaSprite) {
      console.log('❌ Godzilla sprite not loaded yet!')
      // Fall back to hexagon
      this.sprite = this.graphicsSprite
      this.createHexagonCharacter()
    } else {
      // Use graphics sprite
      this.sprite = this.graphicsSprite
      if (design === 'hexagon') {
        this.createHexagonCharacter()
      } else if (design === 'circle') {
        this.createCircleCharacter()
      }
    }
    
    // Restore position
    this.sprite.x = currentX
    this.sprite.y = currentY
    
    // Add new sprite to display list
    if (parent) {
      parent.addChild(this.sprite)
    }
  }

  private createHexagonCharacter(): void {
    this.graphicsSprite.clear()
    
    // Main body (hexagon shape) - scaled up for 64x64
    this.graphicsSprite.beginFill(0x4a90e2)
    this.graphicsSprite.drawPolygon([
      -24, -16, 24, -16, 30, 0, 24, 16, -24, 16, -30, 0
    ])
    this.graphicsSprite.endFill()
    
    // Inner body highlight
    this.graphicsSprite.beginFill(0x5ba0f2)
    this.graphicsSprite.drawPolygon([
      -16, -12, 16, -12, 20, 0, 16, 12, -16, 12, -20, 0
    ])
    this.graphicsSprite.endFill()
    
    // Core/energy center
    this.graphicsSprite.beginFill(0xffffff)
    this.graphicsSprite.drawCircle(0, 0, 8)
    this.graphicsSprite.endFill()
    
    // Core glow
    this.graphicsSprite.beginFill(0x7bb3ff, 0.6)
    this.graphicsSprite.drawCircle(0, 0, 12)
    this.graphicsSprite.endFill()
    
    // Direction indicator (eye)
    this.graphicsSprite.beginFill(0x2c3e50)
    this.graphicsSprite.drawCircle(12, -4, 4)
    this.graphicsSprite.endFill()
    
    // Eye highlight
    this.graphicsSprite.beginFill(0xffffff)
    this.graphicsSprite.drawCircle(14, -6, 2)
    this.graphicsSprite.endFill()
    
    // Energy particles
    this.graphicsSprite.beginFill(0x7bb3ff, 0.4)
    this.graphicsSprite.drawCircle(-16, -20, 4)
    this.graphicsSprite.drawCircle(16, -20, 4)
    this.graphicsSprite.drawCircle(-16, 20, 4)
    this.graphicsSprite.drawCircle(16, 20, 4)
    this.graphicsSprite.endFill()
  }

  private createCircleCharacter(): void {
    this.graphicsSprite.clear()
    
    // Main body - scaled up for 64x64
    this.graphicsSprite.beginFill(0x00ff88)
    this.graphicsSprite.drawCircle(0, 0, 30)
    this.graphicsSprite.endFill()
    
    // Inner glow
    this.graphicsSprite.beginFill(0x00ffaa, 0.5)
    this.graphicsSprite.drawCircle(0, 0, 24)
    this.graphicsSprite.endFill()
    
    // Core
    this.graphicsSprite.beginFill(0xffffff)
    this.graphicsSprite.drawCircle(0, 0, 12)
    this.graphicsSprite.endFill()
    
    // Direction indicator
    this.graphicsSprite.beginFill(0x008844)
    this.graphicsSprite.drawCircle(16, 0, 6)
    this.graphicsSprite.endFill()
    
    // Highlight
    this.graphicsSprite.beginFill(0xffffff)
    this.graphicsSprite.drawCircle(18, -2, 2)
    this.graphicsSprite.endFill()
  }

  private updateHealthRegeneration(deltaTime: number): void {
    this.timeSinceLastDamage += deltaTime / 60
    
    if (this.timeSinceLastDamage >= this.healthRegenDelay && this.health < this.maxHealth) {
      const regenAmount = this.healthRegenRate * (deltaTime / 60)
      this.health = Math.min(this.maxHealth, this.health + regenAmount)
    }
  }

  private updateAppearance(): void {
    // Flash during invulnerability frames
    if (this.invulnerabilityTimer > 0) {
      const flashSpeed = 8
      const alpha = Math.sin(this.invulnerabilityTimer * flashSpeed) > 0 ? 1.0 : 0.5
      this.sprite.alpha = alpha
    } else {
      this.sprite.alpha = 1.0
    }
    
    // Change color based on health - only for graphics sprites
    if (this.sprite === this.graphicsSprite) {
      const healthPercent = this.health / this.maxHealth
      if (healthPercent < 0.3) {
        (this.sprite as Graphics).tint = 0xffcccc
      } else if (healthPercent < 0.6) {
        (this.sprite as Graphics).tint = 0xffddcc
      } else {
        (this.sprite as Graphics).tint = 0xffffff
      }
    }
  }

  private updateAnimation(): void {
    // Add subtle pulsing effect
    const pulseSpeed = 0.1
    const pulseAmount = 0.05
    const scale = 1.0 + Math.sin(this.animationTime * pulseSpeed) * pulseAmount
    
    this.sprite.scale.set(scale, scale)
  }

  private updateSpriteOrientation(deltaX: number): void {
    // Only apply orientation changes to the godzilla sprite
    if (this.currentDesign === 'godzilla' && this.godzillaSprite) {
      if (deltaX < 0) {
        // Moving left - flip horizontally
        this.godzillaSprite.scale.x = -1
      } else if (deltaX > 0) {
        // Moving right - normal orientation
        this.godzillaSprite.scale.x = 1
      }
      // If deltaX is 0, keep current orientation
    }
  }

  // Debug method to test godzilla sprite loading
  public testGodzillaSprite(): void {
    console.log('🧪 Testing godzilla sprite...')
    console.log('Current design:', this.currentDesign)
    console.log('Godzilla sprite exists:', !!this.godzillaSprite)
    if (this.godzillaSprite) {
      console.log('Godzilla sprite properties:', {
        width: this.godzillaSprite.width,
        height: this.godzillaSprite.height,
        visible: this.godzillaSprite.visible,
        alpha: this.godzillaSprite.alpha,
        x: this.godzillaSprite.x,
        y: this.godzillaSprite.y
      })
    }
  }

  takeDamage(amount: number): boolean {
    this.health -= amount
    this.timeSinceLastDamage = 0
    
    if (this.health <= 0) {
      this.health = 0
      return true
    }
    return false
  }

  onCollision(other: Collidable): void {
    switch (other.collisionGroup) {
      case CollisionGroup.ENEMY:
        if (this.invulnerabilityTimer <= 0) {
          const enemy = other as any
          const damage = enemy.attackDamage || 10
          
          if (this.takeDamage(damage)) {
            console.log('Player died!')
            if (this.onPlayerDied) this.onPlayerDied()
          } else {
            console.log(`Player took ${damage} damage! Health: ${this.health}/${this.maxHealth}`)
            if (this.onDamageTaken) this.onDamageTaken(damage)
          }
          
          this.invulnerabilityTimer = this.invulnerabilityDuration
        }
        break
      case CollisionGroup.PICKUP:
        console.log('Player collected pickup!')
        break
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount)
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