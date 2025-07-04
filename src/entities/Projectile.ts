import { Graphics, Sprite, Container, Rectangle, Texture } from 'pixi.js';
import { Collidable, CollisionGroup } from '../core/CollisionManager';

export class Projectile implements Collidable {
  public sprite: Container;
  public collisionRadius: number = 16;
  public collisionGroup: CollisionGroup = CollisionGroup.PROJECTILE;

  private visualSprite: Sprite | Graphics | null = null;
  private animationFrames: Sprite[] = [];
  private currentFrame: number = 0;
  private frameTimer: number = 0;
  private frameInterval: number = 6; // frames between animation updates (100ms at 60fps)

  private velocity: { x: number; y: number };
  private _speed: number;
  private damage: number;
  private lifetime: number;
  private maxLifetime: number;
  private isActive: boolean = true;
  private pierceCount: number = 0;
  private maxPierce: number = 0;
  private weaponType: string = 'fireball'; // Default weapon type

  // Rotation for spinning weapons
  private rotationSpeed: number = 0; // Radians per second
  private currentRotation: number = 0;

  // Callbacks
  public onHitTarget?: (target: Collidable) => void;
  public onExpired?: () => void;

  constructor(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    speed: number = 300,
    damage: number = 10,
    pierce: number = 0,
    weaponType: string = 'fireball'
  ) {
    this.sprite = new Container();
    this._speed = speed;
    this.damage = damage;
    this.lifetime = 0;
    this.maxLifetime = 3; // 3 seconds max flight time
    this.maxPierce = pierce;
    this.weaponType = weaponType;

    // Set initial position
    this.sprite.x = x;
    this.sprite.y = y;

    // Calculate direction vector toward target
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.velocity = {
        x: (dx / distance) * this._speed,
        y: (dy / distance) * this._speed,
      };
    } else {
      // If no distance, shoot right
      this.velocity = { x: this._speed, y: 0 };
    }

    this.createSprite();

    // Set rotation speed for spinning weapons
    this.setRotationSpeed();

    // Set initial rotation based on velocity direction
    this.updateRotation();
  }

  private createSprite(): void {
    // Clear any existing children
    this.sprite.removeChildren();

    // Load sprite based on weapon type
    switch (this.weaponType) {
      case 'axe':
        this.loadAxeSprite();
        break;
      case 'knife':
        this.loadKnifeSprite();
        break;
      case 'rune_tracer':
        this.loadRuneTracerSprite();
        break;
      case 'fireball':
      default:
        this.loadFireballSprite();
        break;
    }
  }

  private async loadFireballSprite(): Promise<void> {
    try {
      // Try to load the fireball texture
      const texture = await import('pixi.js').then(pixi =>
        pixi.Assets.load(import.meta.env.BASE_URL + 'sprites/fireball.png')
      );

      // Create animation frames from the sprite sheet
      // 768x128 sheet with 6 frames of 128x128 each
      const frameWidth = 128;
      const frameHeight = 128;
      const numFrames = 6;

      for (let i = 0; i < numFrames; i++) {
        const frameTexture = new Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
        const frameSprite = new Sprite(new Texture(texture.baseTexture, frameTexture));

        // Scale and center the frame (2.025x larger)
        frameSprite.width = this.collisionRadius * 4.05;
        frameSprite.height = this.collisionRadius * 4.05;
        frameSprite.anchor.set(0.5, 0.5);

        // Hide all frames except the first one initially
        frameSprite.visible = i === 0;

        this.animationFrames.push(frameSprite);
        this.sprite.addChild(frameSprite);
      }

      this.visualSprite = this.animationFrames[0];

      console.log(`Created ${this.animationFrames.length} fireball animation frames`);
    } catch (error) {
      // Fallback to graphics if fireball sprite fails to load
      console.log('Fireball sprite not found, using fallback graphics:', error);
      this.createFallbackGraphics();
    }
  }

  private async loadAxeSprite(): Promise<void> {
    try {
      // Try to load the axe texture
      const texture = await import('pixi.js').then(pixi =>
        pixi.Assets.load(import.meta.env.BASE_URL + 'sprites/axe_1.png')
      );

      // Create single frame sprite for axe
      const sprite = new Sprite(texture);

      // Scale and center the sprite
      sprite.width = this.collisionRadius * 3;
      sprite.height = this.collisionRadius * 3;
      sprite.anchor.set(0.5, 0.5);

      this.visualSprite = sprite;
      this.sprite.addChild(sprite);

      console.log('Created axe sprite');
    } catch (error) {
      // Fallback to graphics if axe sprite fails to load
      console.log('Axe sprite not found, using fallback graphics:', error);
      this.createFallbackGraphics();
    }
  }

  private async loadKnifeSprite(): Promise<void> {
    try {
      // Try to load the knife texture
      const texture = await import('pixi.js').then(pixi =>
        pixi.Assets.load(import.meta.env.BASE_URL + 'sprites/knife_1.png')
      );

      // Create single frame sprite for knife
      const sprite = new Sprite(texture);

      // Scale and center the sprite - 50% smaller than before
      sprite.width = this.collisionRadius * 1.25;
      sprite.height = this.collisionRadius * 1.25;
      sprite.anchor.set(0.5, 0.5);

      this.visualSprite = sprite;
      this.sprite.addChild(sprite);

      console.log('Created knife sprite');
    } catch (error) {
      // Fallback to graphics if knife sprite fails to load
      console.log('Knife sprite not found, using fallback graphics:', error);
      this.createFallbackGraphics();
    }
  }

  private async loadRuneTracerSprite(): Promise<void> {
    try {
      // Try to load one of the beam sprites for the eye beam projectiles
      const texture = await import('pixi.js').then(pixi =>
        pixi.Assets.load(import.meta.env.BASE_URL + 'sprites/beam_01_origin.png')
      );

      // Create single frame sprite for rune tracer
      const sprite = new Sprite(texture);

      // Scale and center the sprite - make it smaller and more beam-like
      sprite.width = this.collisionRadius * 2;
      sprite.height = this.collisionRadius * 2;
      sprite.anchor.set(0.5, 0.5);

      // Give it a blue tint to differentiate from fireballs
      sprite.tint = 0x4488ff;

      this.visualSprite = sprite;
      this.sprite.addChild(sprite);

      console.log('Created rune tracer sprite');
    } catch (error) {
      // Fallback to custom graphics for rune tracer if beam sprite fails to load
      console.log('Beam sprite not found, using custom rune tracer graphics:', error);
      this.createRuneTracerFallbackGraphics();
    }
  }

  private createFallbackGraphics(): void {
    const graphics = new Graphics();

    // Create a simple projectile - small white circle with blue center
    graphics.beginFill(0xffffff); // White outer
    graphics.drawCircle(0, 0, this.collisionRadius);
    graphics.endFill();

    graphics.beginFill(0x00aaff); // Blue center
    graphics.drawCircle(0, 0, this.collisionRadius - 1);
    graphics.endFill();

    // Add a small trail effect
    graphics.beginFill(0xffffff, 0.3);
    graphics.drawCircle(-2, 0, 1);
    graphics.endFill();

    this.visualSprite = graphics;
    this.sprite.addChild(graphics);
  }

  private createRuneTracerFallbackGraphics(): void {
    const graphics = new Graphics();

    // Create a laser-like beam projectile - elongated blue shape
    graphics.beginFill(0x4488ff); // Blue color for eye beam
    graphics.drawEllipse(0, 0, this.collisionRadius * 1.5, this.collisionRadius * 0.5); // Elongated
    graphics.endFill();

    // Add bright white core
    graphics.beginFill(0xffffff); // White core
    graphics.drawEllipse(0, 0, this.collisionRadius * 1.2, this.collisionRadius * 0.3);
    graphics.endFill();

    // Add energy trail effect
    graphics.beginFill(0x4488ff, 0.3); // Semi-transparent blue trail
    graphics.drawEllipse(
      -this.collisionRadius,
      0,
      this.collisionRadius * 0.8,
      this.collisionRadius * 0.3
    );
    graphics.endFill();

    this.visualSprite = graphics;
    this.sprite.addChild(graphics);
  }

  private setRotationSpeed(): void {
    // Set rotation speed for spinning weapons (in radians per second)
    switch (this.weaponType) {
      case 'axe':
        this.rotationSpeed = Math.PI * 4; // 2 full rotations per second
        break;
      case 'knife':
        this.rotationSpeed = Math.PI * 6; // 3 full rotations per second
        break;
      default:
        this.rotationSpeed = 0; // No rotation for other weapons
        break;
    }
  }

  /**
   * Update projectile movement and lifetime
   */
  update(deltaTime: number): void {
    if (!this.isActive) return;

    // Update position based on velocity
    const frameVelocity = {
      x: this.velocity.x * (deltaTime / 60),
      y: this.velocity.y * (deltaTime / 60),
    };

    this.sprite.x += frameVelocity.x;
    this.sprite.y += frameVelocity.y;

    // Update rotation for spinning weapons
    if (this.rotationSpeed > 0) {
      this.currentRotation += this.rotationSpeed * (deltaTime / 60);
      if (this.visualSprite) {
        this.visualSprite.rotation = this.currentRotation;
      }
    }

    // Update lifetime
    this.lifetime += deltaTime / 60; // Convert to seconds

    // Check if projectile has expired
    if (this.lifetime >= this.maxLifetime) {
      this.expire();
    }

    // Update animation
    this.updateAnimation(deltaTime);

    // Update visual effects
    this.updateAppearance();
  }

  private updateAnimation(deltaTime: number): void {
    if (this.animationFrames.length === 0) return;

    // Update frame timer
    this.frameTimer += deltaTime;

    // Check if it's time to advance to the next frame
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;

      // Hide current frame
      this.animationFrames[this.currentFrame].visible = false;

      // Advance to next frame
      this.currentFrame = (this.currentFrame + 1) % this.animationFrames.length;

      // Show new frame
      this.animationFrames[this.currentFrame].visible = true;
      this.visualSprite = this.animationFrames[this.currentFrame];
    }

    // Update rotation to face the direction of travel
    this.updateRotation();
  }

  private updateRotation(): void {
    if (this.animationFrames.length === 0) return;

    // Only apply directional rotation for non-spinning weapons
    if (this.rotationSpeed === 0) {
      // Calculate the angle from the velocity vector
      const angle = Math.atan2(this.velocity.y, this.velocity.x);

      // Apply the rotation to all animation frames
      for (const frame of this.animationFrames) {
        frame.rotation = angle;
      }
    }
  }

  private updateAppearance(): void {
    // Fade out as projectile ages
    const agePercent = this.lifetime / this.maxLifetime;
    this.sprite.alpha = 1.0 - agePercent * 0.3; // Fade to 70% opacity

    // Update rotation for fallback graphics only if not spinning
    if (this.visualSprite && this.animationFrames.length === 0 && this.rotationSpeed === 0) {
      const angle = Math.atan2(this.velocity.y, this.velocity.x);
      this.visualSprite.rotation = angle;
    }
  }

  /**
   * Handle collision with other entities
   */
  onCollision(other: Collidable): void {
    if (!this.isActive) return;

    if (other.collisionGroup === CollisionGroup.ENEMY) {
      // Hit an enemy
      if (this.onHitTarget) {
        this.onHitTarget(other);
      }

      // Handle piercing
      this.pierceCount++;
      if (this.pierceCount > this.maxPierce) {
        // Destroy this projectile if it has pierced its maximum
        this.destroy();
      } else {
        // Continue flying through enemies
        // Add a small visual effect to show piercing
        this.sprite.alpha = 0.8;
        setTimeout(() => {
          this.sprite.alpha = 1.0;
        }, 50);
      }
    }
  }

  /**
   * Expire the projectile (reached max lifetime)
   */
  private expire(): void {
    this.isActive = false;
    if (this.onExpired) {
      this.onExpired();
    }
  }

  /**
   * Destroy the projectile immediately (hit target)
   */
  destroy(): void {
    this.isActive = false;
    // Add hit effect
    this.sprite.alpha = 0.5;
    if (this.visualSprite && 'tint' in this.visualSprite) {
      this.visualSprite.tint = 0xffff00; // Yellow flash
    }
  }

  /**
   * Check if projectile is still active
   */
  get active(): boolean {
    return this.isActive;
  }

  /**
   * Get projectile damage
   */
  get projectileDamage(): number {
    return this.damage;
  }

  /**
   * Get current position
   */
  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Get current velocity
   */
  get currentVelocity(): { x: number; y: number } {
    return { ...this.velocity };
  }
}
