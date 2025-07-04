import { Graphics, Sprite, DisplayObject } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Collidable, CollisionGroup } from '../core/CollisionManager';
import { Assets } from 'pixi.js';

export class PlayerWithSprites implements Collidable {
  public sprite: DisplayObject;
  public collisionRadius: number = 25;
  public collisionGroup: CollisionGroup = CollisionGroup.PLAYER;

  private speed: number = 200;
  private health: number = 100;
  private maxHealth: number = 100;
  private invulnerabilityTimer: number = 0;
  private invulnerabilityDuration: number = 60;

  // Health regeneration
  private healthRegenRate: number = 0.5;
  private healthRegenDelay: number = 5;
  private timeSinceLastDamage: number = 0;

  // Animation
  private animationTime: number = 0;

  // Sprite management
  private graphicsSprite: Graphics;
  private bitmapSprite?: Sprite;
  private currentDesign: 'hexagon' | 'circle' | 'shark_man' = 'hexagon';

  // Callbacks
  public onDamageTaken?: (damage: number) => void;
  public onPlayerDied?: () => void;

  constructor() {
    this.graphicsSprite = new Graphics();
    this.sprite = this.graphicsSprite;
    this.createHexagonCharacter();
  }

  async init(): Promise<void> {
    console.log('PlayerWithSprites initialized');
    await this.loadSharkManSprite();
  }

  private async loadSharkManSprite(): Promise<void> {
    try {
      const texture = await Assets.load('/sprites/shark-man.png');
      this.bitmapSprite = new Sprite(texture);
      this.bitmapSprite.width = 64;
      this.bitmapSprite.height = 64;
      this.bitmapSprite.anchor.set(0.5, 0.5);
      console.log('✅ Shark-man sprite loaded and ready!');
    } catch (error) {
      console.warn('⚠️ Failed to load shark-man sprite, using graphics fallback:', error);
    }
  }

  update(
    deltaTime: number,
    inputManager: InputManager,
    screenWidth: number = 1024,
    _screenHeight: number = 768
  ): void {
    const input = inputManager.getInputState();
    const moveSpeed = this.speed * (deltaTime / 60);

    // Update animation time
    this.animationTime += deltaTime;

    // Update invulnerability timer
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= deltaTime;
    }

    // Update health regeneration
    this.updateHealthRegeneration(deltaTime);

    // Update visual appearance
    this.updateAppearance();

    // Update animation
    this.updateAnimation();

    // Handle character switching
    if (inputManager.isKeyJustPressed('KeyC')) {
      console.log('Switching to circle design...');
      this.switchCharacterDesign('circle');
    } else if (inputManager.isKeyJustPressed('KeyH')) {
      console.log('Switching to hexagon design...');
      this.switchCharacterDesign('hexagon');
    } else if (inputManager.isKeyJustPressed('KeyS')) {
      console.log('Switching to shark-man design...');
      this.switchCharacterDesign('shark_man');
    }

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

    // Keep player within world bounds
    const halfWorld = screenWidth / 2;
    this.sprite.x = Math.max(-halfWorld + 25, Math.min(halfWorld - 25, this.sprite.x));
    this.sprite.y = Math.max(-halfWorld + 25, Math.min(halfWorld - 25, this.sprite.y));
  }

  private switchCharacterDesign(design: 'hexagon' | 'circle' | 'shark_man'): void {
    this.currentDesign = design;

    if (design === 'shark_man' && this.bitmapSprite) {
      // Use the bitmap sprite
      this.sprite = this.bitmapSprite;
      console.log('🎉 Using shark-man bitmap sprite!');
    } else {
      // Use graphics sprite
      this.sprite = this.graphicsSprite;
      if (design === 'hexagon') {
        this.createHexagonCharacter();
      } else if (design === 'circle') {
        this.createCircleCharacter();
      }
    }
  }

  private createHexagonCharacter(): void {
    this.graphicsSprite.clear();

    // Main body (hexagon shape) - scaled up for 64x64
    this.graphicsSprite.beginFill(0x4a90e2);
    this.graphicsSprite.drawPolygon([-24, -16, 24, -16, 30, 0, 24, 16, -24, 16, -30, 0]);
    this.graphicsSprite.endFill();

    // Inner body highlight
    this.graphicsSprite.beginFill(0x5ba0f2);
    this.graphicsSprite.drawPolygon([-16, -12, 16, -12, 20, 0, 16, 12, -16, 12, -20, 0]);
    this.graphicsSprite.endFill();

    // Core/energy center
    this.graphicsSprite.beginFill(0xffffff);
    this.graphicsSprite.drawCircle(0, 0, 8);
    this.graphicsSprite.endFill();

    // Core glow
    this.graphicsSprite.beginFill(0x7bb3ff, 0.6);
    this.graphicsSprite.drawCircle(0, 0, 12);
    this.graphicsSprite.endFill();

    // Direction indicator (eye)
    this.graphicsSprite.beginFill(0x2c3e50);
    this.graphicsSprite.drawCircle(12, -4, 4);
    this.graphicsSprite.endFill();

    // Eye highlight
    this.graphicsSprite.beginFill(0xffffff);
    this.graphicsSprite.drawCircle(14, -6, 2);
    this.graphicsSprite.endFill();

    // Energy particles
    this.graphicsSprite.beginFill(0x7bb3ff, 0.4);
    this.graphicsSprite.drawCircle(-16, -20, 4);
    this.graphicsSprite.drawCircle(16, -20, 4);
    this.graphicsSprite.drawCircle(-16, 20, 4);
    this.graphicsSprite.drawCircle(16, 20, 4);
    this.graphicsSprite.endFill();
  }

  private createCircleCharacter(): void {
    this.graphicsSprite.clear();

    // Main body - scaled up for 64x64
    this.graphicsSprite.beginFill(0x00ff88);
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

  private updateHealthRegeneration(deltaTime: number): void {
    this.timeSinceLastDamage += deltaTime / 60;

    if (this.timeSinceLastDamage >= this.healthRegenDelay && this.health < this.maxHealth) {
      const regenAmount = this.healthRegenRate * (deltaTime / 60);
      this.health = Math.min(this.maxHealth, Math.floor(this.health + regenAmount));
    }
  }

  private updateAppearance(): void {
    // Flash during invulnerability frames
    if (this.invulnerabilityTimer > 0) {
      const flashSpeed = 8;
      const alpha = Math.sin(this.invulnerabilityTimer * flashSpeed) > 0 ? 1.0 : 0.5;
      this.sprite.alpha = alpha;
    } else {
      this.sprite.alpha = 1.0;
    }

    // Change color based on health - only for graphics sprites
    if (this.sprite === this.graphicsSprite) {
      const healthPercent = this.health / this.maxHealth;
      if (healthPercent < 0.3) {
        (this.sprite as Graphics).tint = 0xffcccc;
      } else if (healthPercent < 0.6) {
        (this.sprite as Graphics).tint = 0xffddcc;
      } else {
        (this.sprite as Graphics).tint = 0xffffff;
      }
    }
  }

  private updateAnimation(): void {
    // Add subtle pulsing effect
    const pulseSpeed = 0.1;
    const pulseAmount = 0.05;
    const scale = 1.0 + Math.sin(this.animationTime * pulseSpeed) * pulseAmount;

    this.sprite.scale.set(scale, scale);
  }

  takeDamage(amount: number): boolean {
    this.health = Math.floor(this.health - amount);
    this.timeSinceLastDamage = 0;

    if (this.health <= 0) {
      this.health = 0;
      return true;
    }
    return false;
  }

  onCollision(other: Collidable): void {
    switch (other.collisionGroup) {
      case CollisionGroup.ENEMY:
        if (this.invulnerabilityTimer <= 0) {
          const enemy = other as any;
          const damage = enemy.attackDamage || 10;

          if (this.takeDamage(damage)) {
            console.log('Player died!');
            if (this.onPlayerDied) this.onPlayerDied();
          } else {
            console.log(`Player took ${damage} damage! Health: ${this.health}/${this.maxHealth}`);
            if (this.onDamageTaken) this.onDamageTaken(damage);
          }

          this.invulnerabilityTimer = this.invulnerabilityDuration;
        }
        break;
      case CollisionGroup.PICKUP:
        console.log('Player collected pickup!');
        break;
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, Math.floor(this.health + amount));
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
}
