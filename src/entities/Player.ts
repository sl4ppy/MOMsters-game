import { Graphics, Sprite, DisplayObject } from 'pixi.js';
import { Collidable, CollisionGroup } from '../types/CollisionTypes';
import { InputManager } from '../core/InputManager';
import { SpriteManager } from '../core/SpriteManager';
import { Entity } from '../types/EntityTypes';
import { Enemy } from '../entities/Enemy';

export class Player implements Collidable {
  public sprite: DisplayObject;
  public collisionRadius: number = 25; // Increased for larger sprite
  public collisionGroup: CollisionGroup = CollisionGroup.PLAYER;
  private speed: number = 200; // pixels per second
  private baseSpeed: number = 200; // Base speed for upgrades
  private health: number = 100;
  private maxHealth: number = 100;
  private baseMaxHealth: number = 100; // Base max health for upgrades
  private invulnerabilityTimer: number = 0;
  private invulnerabilityDuration: number = 60; // 1 second at 60fps

  // Health regeneration
  private healthRegenRate: number = 0.5; // HP per second
  private baseRegenRate: number = 0.5; // Base regen rate for upgrades
  private healthRegenDelay: number = 5; // Seconds before regen starts after taking damage
  private timeSinceLastDamage: number = 0;

  // Animation
  private animationTime: number = 0;

  // Sprite management
  private spriteManager?: SpriteManager;
  private useSprites: boolean = false;
  private graphicsSprite: Graphics;
  private bitmapSprite?: Sprite;
  private sharkManSprite?: Sprite;

  // Callbacks
  public onDamageTaken?: (damage: number) => void;
  public onPlayerDied?: () => void;

  constructor(spriteManager?: SpriteManager) {
    this.spriteManager = spriteManager;
    this.useSprites = !!spriteManager;

    if (this.useSprites && spriteManager?.isLoaded) {
      this.createSpriteFromTexture();
    } else {
      this.sprite = new Graphics();
      this.createSprite();
    }
  }

  async init(): Promise<void> {
    // console.log('Player initialized');
    await this.loadSharkManSprite();
  }

  private async loadSharkManSprite(): Promise<void> {
    try {
      const { Assets } = await import('pixi.js');
      const texture = await Assets.load('/sprites/shark-man.png');
      this.sharkManSprite = new Sprite(texture);
      this.sharkManSprite.width = 64;
      this.sharkManSprite.height = 64;
      this.sharkManSprite.anchor.set(0.5, 0.5);
      // console.log('✅ Shark-man sprite loaded for player!');
    } catch {
      // Handle error silently
    }
  }

  private createSprite(): void {
    this.createHexagonCharacter();
  }

  /**
   * Create a hexagon-based character design
   */
  private createHexagonCharacter(): void {
    if (this.graphicsSprite) {
      this.graphicsSprite.clear();

      // Main body (hexagon shape for a more interesting look) - scaled up for 64x64
      this.graphicsSprite.beginFill(0x4a90e2); // Blue color
      this.graphicsSprite.drawPolygon([
        -24,
        -16, // Top left
        24,
        -16, // Top right
        30,
        0, // Right
        24,
        16, // Bottom right
        -24,
        16, // Bottom left
        -30,
        0, // Left
      ]);
      this.graphicsSprite.endFill();

      // Inner body highlight
      this.graphicsSprite.beginFill(0x5ba0f2); // Lighter blue
      this.graphicsSprite.drawPolygon([
        -16,
        -12, // Top left
        16,
        -12, // Top right
        20,
        0, // Right
        16,
        12, // Bottom right
        -16,
        12, // Bottom left
        -20,
        0, // Left
      ]);
      this.graphicsSprite.endFill();

      // Core/energy center
      this.graphicsSprite.beginFill(0xffffff); // White core
      this.graphicsSprite.drawCircle(0, 0, 8);
      this.graphicsSprite.endFill();

      // Core glow
      this.graphicsSprite.beginFill(0x7bb3ff, 0.6); // Light blue glow
      this.graphicsSprite.drawCircle(0, 0, 12);
      this.graphicsSprite.endFill();

      // Direction indicator (eye)
      this.graphicsSprite.beginFill(0x2c3e50); // Dark blue eye
      this.graphicsSprite.drawCircle(12, -4, 4);
      this.graphicsSprite.endFill();

      // Eye highlight
      this.graphicsSprite.beginFill(0xffffff);
      this.graphicsSprite.drawCircle(14, -6, 2);
      this.graphicsSprite.endFill();

      // Energy particles around the character
      this.graphicsSprite.beginFill(0x7bb3ff, 0.4);
      this.graphicsSprite.drawCircle(-16, -20, 4);
      this.graphicsSprite.drawCircle(16, -20, 4);
      this.graphicsSprite.drawCircle(-16, 20, 4);
      this.graphicsSprite.drawCircle(16, 20, 4);
      this.graphicsSprite.endFill();
    }
  }

  /**
   * Create a simple circle-based character design (alternative)
   */
  private createCircleCharacter(): void {
    if (this.graphicsSprite) {
      this.graphicsSprite.clear();

      // Main body - scaled up for 64x64
      this.graphicsSprite.beginFill(0x00ff88); // Green color
      this.graphicsSprite.drawCircle(0, 0, 30);
      this.graphicsSprite.endFill();

      // Inner glow
      this.graphicsSprite.beginFill(0x00ffaa, 0.5);
      this.graphicsSprite.drawCircle(0, 0, 24);
      this.graphicsSprite.endFill();

      // Core
      this.graphicsSprite.beginFill(0xffffff);
      this.graphicsSprite.drawCircle(0, 0, 12);
      this.graphicsSprite.endFill();

      // Direction indicator
      this.graphicsSprite.beginFill(0x008844);
      this.graphicsSprite.drawCircle(16, 0, 6);
      this.graphicsSprite.endFill();

      // Highlight
      this.graphicsSprite.beginFill(0xffffff);
      this.graphicsSprite.drawCircle(18, -2, 2);
      this.graphicsSprite.endFill();
    }
  }

  /**
   * Create a shark-man character design (placeholder until sprite is loaded)
   */
  private createSharkManCharacter(): void {
    if (this.graphicsSprite) {
      this.graphicsSprite.clear();

      // Shark body (blue-gray)
      this.graphicsSprite.beginFill(0x4a7c8a);
      this.graphicsSprite.drawEllipse(0, 0, 20, 28);
      this.graphicsSprite.endFill();

      // Shark fin
      this.graphicsSprite.beginFill(0x2c5a6a);
      this.graphicsSprite.drawPolygon([
        -8,
        -20, // Top
        0,
        -28, // Peak
        8,
        -20, // Bottom
      ]);
      this.graphicsSprite.endFill();

      // Eye
      this.graphicsSprite.beginFill(0xffffff);
      this.graphicsSprite.drawCircle(8, -4, 4);
      this.graphicsSprite.endFill();

      // Pupil
      this.graphicsSprite.beginFill(0x000000);
      this.graphicsSprite.drawCircle(9, -4, 2);
      this.graphicsSprite.endFill();

      // Teeth
      this.graphicsSprite.beginFill(0xffffff);
      this.graphicsSprite.drawPolygon([
        -4,
        8, // Left
        0,
        12, // Bottom
        4,
        8, // Right
      ]);
      this.graphicsSprite.endFill();
    }
  }

  update(
    deltaTime: number,
    inputManager: InputManager,
    screenWidth: number = 1024,
    _screenHeight: number = 768
  ): void {
    const input = inputManager.getInputState();
    const moveSpeed = this.speed * (deltaTime / 60); // Convert to pixels per frame

    // Update animation time
    this.animationTime += deltaTime;

    // Update invulnerability timer
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= deltaTime;
    }

    // Update regeneration
    if (this.health < this.maxHealth) {
      this.health += this.healthRegenRate * deltaTime;
      if (this.health > this.maxHealth) {
        this.health = this.maxHealth;
      }
    }

    // Update visual appearance based on health and invulnerability
    this.updateAppearance();

    // Update character animation
    this.updateAnimation();

    // Debug: Switch character design with keyboard shortcuts
    if (inputManager.isKeyJustPressed('KeyC')) {
      // console.log('Switching to circle design...');
      this.switchCharacterDesign('circle');
    } else if (inputManager.isKeyJustPressed('KeyH')) {
      // console.log('Switching to hexagon design...');
      this.switchCharacterDesign('hexagon');
    } else if (inputManager.isKeyJustPressed('KeyS')) {
      // console.log('Switching to shark-man design...');
      this.switchCharacterDesign('shark_man');
    }

    // Debug input state (minimal) - commented out for cleaner gameplay
    // if (input.left || input.right || input.up || input.down) {
    //   console.log(`Player moving: (${this.sprite.x.toFixed(1)}, ${this.sprite.y.toFixed(1)})`)
    // }

    // Calculate movement
    let deltaX = 0;
    let deltaY = 0;

    if (input.left) deltaX -= moveSpeed;
    if (input.right) deltaX += moveSpeed;
    if (input.up) deltaY -= moveSpeed;
    if (input.down) deltaY += moveSpeed;

    // Normalize diagonal movement
    if (deltaX !== 0 && deltaY !== 0) {
      const normalizer = Math.sqrt(2) / 2;
      deltaX *= normalizer;
      deltaY *= normalizer;
    }

    // Apply movement
    this.sprite.x += deltaX;
    this.sprite.y += deltaY;

    // Position changed (minimal debug)

    // Keep player within world bounds (centered around origin)
    const halfWorld = screenWidth / 2; // Using screenWidth as worldSize (2000/2 = 1000)
    this.sprite.x = Math.max(-halfWorld + 15, Math.min(halfWorld - 15, this.sprite.x));
    this.sprite.y = Math.max(-halfWorld + 15, Math.min(halfWorld - 15, this.sprite.y));
  }

  takeDamage(amount: number): boolean {
    this.health = Math.floor(this.health - amount);
    this.timeSinceLastDamage = 0; // Reset regen timer

    if (this.health <= 0) {
      this.health = 0;
      return true; // Player is dead
    }
    return false;
  }

  /**
   * Handle collision with other entities
   */
  public onCollision(other: Entity): void {
    if (other instanceof Enemy) {
      const enemy = other as Enemy; // Cast to access enemy properties
      this.takeDamage(enemy.damage);
    }
  }

  /**
   * Update health regeneration system
   */
  private updateHealthRegeneration(deltaTime: number): void {
    this.timeSinceLastDamage += deltaTime / 60; // Convert to seconds

    // Only regenerate if enough time has passed and not at full health
    if (this.timeSinceLastDamage >= this.healthRegenDelay && this.health < this.maxHealth) {
      const regenAmount = this.healthRegenRate * (deltaTime / 60);
      const oldHealth = this.health;
      this.health = Math.min(this.maxHealth, Math.floor(this.health + regenAmount));

      // Log regeneration every 2 seconds to avoid spam
      if (Math.floor(this.timeSinceLastDamage) % 2 === 0 && this.health > oldHealth) {
        // console.log(
        //   `Health regenerating: ${oldHealth} -> ${this.health} (rate: ${this.healthRegenRate.toFixed(2)} HP/sec, time since damage: ${this.timeSinceLastDamage.toFixed(1)}s)`
        // );
      }
    }
  }

  /**
   * Update visual appearance based on health and status
   */
  private updateAppearance(): void {
    // Flash during invulnerability frames
    if (this.invulnerabilityTimer > 0) {
      // Flash effect - alternate between visible and semi-transparent
      const flashSpeed = 8; // How fast to flash
      const alpha = Math.sin(this.invulnerabilityTimer * flashSpeed) > 0 ? 1.0 : 0.5;
      this.sprite.alpha = alpha;
    } else {
      this.sprite.alpha = 1.0;
    }

    // Change color based on health - use more subtle effects for the detailed sprite
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent < 0.3) {
      // Red tint when critically low health - more subtle
      this.sprite.tint = 0xffcccc;
    } else if (healthPercent < 0.6) {
      // Orange tint when moderately damaged - more subtle
      this.sprite.tint = 0xffddcc;
    } else {
      // Normal color when healthy
      this.sprite.tint = 0xffffff;
    }
  }

  /**
   * Update character animation effects
   */
  private updateAnimation(): void {
    // Add subtle pulsing effect to the character
    const pulseSpeed = 0.1;
    const pulseAmount = 0.05;
    const scale = 1.0 + Math.sin(this.animationTime * pulseSpeed) * pulseAmount;

    this.sprite.scale.set(scale, scale);
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, Math.floor(this.health + amount));
  }

  /**
   * Apply health upgrades from leveling system
   */
  applyHealthUpgrades(healthBonus: number, regenBonus: number): void {
    const newMaxHealth = this.baseMaxHealth + healthBonus;
    if (newMaxHealth !== this.maxHealth) {
      this.maxHealth = newMaxHealth;
      // Give some immediate health when max health increases
      this.health = Math.min(this.health + healthBonus * 0.5, this.maxHealth);
    }

    this.healthRegenRate = this.baseRegenRate + regenBonus;

    if (regenBonus > 0) {
      // console.log(
      //   `Health regen upgraded: ${oldRegenRate.toFixed(2)} -> ${this.healthRegenRate.toFixed(2)} HP/sec`
      // );
    }
  }

  /**
   * Apply speed upgrades from leveling system
   */
  applySpeedUpgrade(speedBonus: number): void {
    this.speed = this.baseSpeed + (this.baseSpeed * speedBonus) / 100;
  }

  /**
   * Switch character design (for testing different looks)
   */
  switchCharacterDesign(design: 'hexagon' | 'circle' | 'shark_man'): void {
    if (design === 'hexagon') {
      this.createHexagonCharacter();
    } else if (design === 'circle') {
      this.createCircleCharacter();
    } else if (design === 'shark_man') {
      if (this.sharkManSprite) {
        // Use the loaded shark-man sprite
        this.sprite = this.sharkManSprite;
        // console.log('🎉 Using shark-man bitmap sprite!');
      } else {
        // Fallback to graphics
        this.createSharkManCharacter();
        // console.log('⚠️ Using shark-man graphics fallback');
      }
    }
  }

  // Getters
  get currentHealth(): number {
    return this.health;
  }
  get maximumHealth(): number {
    return this.maxHealth;
  }
  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }
  get isInvulnerable(): boolean {
    return this.invulnerabilityTimer > 0;
  }
  get isDead(): boolean {
    return this.health <= 0;
  }
  get healthPercent(): number {
    return this.health / this.maxHealth;
  }

  public setHealthRegenRate(newRate: number): void {
    this.healthRegenRate = newRate;
    this.eventBus.emit('player:regenRateChanged', { playerId: this.id, newRate });
  }
}
