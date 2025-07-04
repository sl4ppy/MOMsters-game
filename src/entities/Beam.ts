import { Graphics, Sprite, Container, Rectangle, Texture } from 'pixi.js';
import { Collidable, CollisionGroup } from '../core/CollisionManager';

export class Beam implements Collidable {
  public sprite: Container;
  public collisionRadius: number = 8; // Will be dynamically updated based on range
  public collisionGroup: CollisionGroup = CollisionGroup.PROJECTILE;

  private beamSprite: Sprite | null = null;
  private visualSprite: Sprite | Graphics | null = null;

  // Animation properties
  private beamTextures: Texture[] = [];
  private animationPhase: 'creation' | 'sustain' | 'destruction' = 'creation';
  private currentFrame: number = 0;
  private animationTimer: number = 0;
  private frameInterval: number = 0.1; // 100ms between frames

  private damage: number;
  private lifetime: number;
  private maxPierce: number;
  public range: number; // Made public for collision detection in WeaponSystem
  private beamWidth: number = 32;

  // Rotation properties
  private rotationDuration: number = 3; // seconds for a full rotation
  private currentAngle: number = 0; // current rotation angle in degrees
  private totalRotation: number = 0; // degrees rotated so far
  private playerX: number = 0;
  private playerY: number = 0;

  // Callbacks
  public onHitTarget?: (target: Collidable) => void;
  public onExpired?: () => void;

  private _active: boolean = true;
  private pierceCount: number = 0;

  private flipTimer: number = 0;
  private flipInterval: number = 0.1; // seconds (10 times a second)

  constructor(
    playerX: number,
    playerY: number,
    damage: number = 10,
    pierce: number = 0,
    range: number = 350,
    rotationDuration: number = 3
  ) {
    this.sprite = new Container();
    this.damage = damage;
    this.lifetime = 0;
    this.maxPierce = pierce;
    this.range = range;
    this.rotationDuration = rotationDuration;
    this.playerX = playerX;
    this.playerY = playerY;
    this.currentAngle = 0;
    this.totalRotation = 0;

    // Set a minimal collision radius - we'll do manual collision checking
    // The collision system needs this but we'll override with precise checking
    this.collisionRadius = 20;

    // Set initial position at player
    this.sprite.x = playerX;
    this.sprite.y = playerY;
    this.createBeam();
  }

  private async createBeam(): Promise<void> {
    // Clear any existing children
    this.sprite.removeChildren();

    try {
      // Load beam animation textures (Beam_full_01 through Beam_full_04)
      for (let i = 1; i <= 4; i++) {
        const paddedNum = i.toString().padStart(2, '0');
        const texture = await import('pixi.js').then(pixi =>
          pixi.Assets.load(import.meta.env.BASE_URL + `sprites/Beam_full_${paddedNum}.png`)
        );
        this.beamTextures.push(texture);
      }

      // Create beam sprite using the first frame
      this.beamSprite = new Sprite(this.beamTextures[0]);
      this.beamSprite.anchor.set(0, 0.5); // Anchor to left center

      // Scale beam to fit desired range (256px is max length)
      const scaleX = this.range / 256; // Scale to desired range
      this.beamSprite.scale.set(scaleX, 1); // Scale X to range, keep Y at native 32px
      this.beamSprite.x = 16; // Start 16 pixels from player center (offset for eyes/mouth)
      this.beamSprite.y = 0;
      this.sprite.addChild(this.beamSprite);

      this.visualSprite = this.beamSprite;
      console.log(
        `Created rotating beam with animation frames, range: ${this.range}, collision radius: ${this.collisionRadius}, rotation speed: ${this.rotationDuration} seconds, offset: 16px`
      );
    } catch (error) {
      // Fallback to graphics if sprites fail to load
      console.log('Beam sprites not found, using fallback graphics:', error);
      this.createFallbackGraphics();
    }
  }

  private createFallbackGraphics(): void {
    const graphics = new Graphics();

    // Adjust range to be exact multiple of body segment width (same logic as sprite version)
    const originalRange = this.range;
    const desiredSegmentWidth = 128; // Match the sprite version
    const desiredSegments = Math.round(this.range / desiredSegmentWidth);
    const actualRange = desiredSegments * desiredSegmentWidth;
    this.range = actualRange;

    console.log(
      `Created fallback beam graphics, adjusted range: ${this.range} (was ${originalRange}), collision radius: ${this.collisionRadius}`
    );

    // Create beam body using adjusted range (offset by 16px)
    graphics.beginFill(0xff4444, 0.8); // Semi-transparent red body
    graphics.drawRect(16, -16, actualRange, 32);
    graphics.endFill();

    // Add glow effect
    graphics.beginFill(0xff8888, 0.3);
    graphics.drawRect(16, -20, actualRange, 40);
    graphics.endFill();

    this.visualSprite = graphics;
    this.sprite.addChild(graphics);
  }

  /**
   * Update beam rotation and lifetime
   */
  update(deltaTime: number): void {
    if (!this._active) return;

    // Check if sprite is valid before updating
    if (!this.sprite || (this.sprite as any).destroyed) {
      this._active = false;
      return;
    }

    // Calculate rotation speed for this frame
    const degreesPerSecond = 360 / this.rotationDuration;
    const deltaDegrees = degreesPerSecond * (deltaTime / 60);
    this.currentAngle += deltaDegrees;
    this.totalRotation += deltaDegrees;
    if (this.currentAngle >= 360) this.currentAngle -= 360;

    // Update beam rotation - rotate the entire container
    this.sprite.rotation = (this.currentAngle * Math.PI) / 180;

    // Expire after a full 360° rotation
    if (this.totalRotation >= 360) {
      this.expire();
      return;
    }
    // Update beam animation
    this.updateAnimation(deltaTime);
    // Update visual effects
    this.updateAppearance();

    // Collision detection is now handled in WeaponSystem for precise control

    // Update lifetime
    this.lifetime += deltaTime / 60;
  }

  private updateAppearance(): void {
    // Check if sprite is valid before accessing properties
    if (!this.sprite || (this.sprite as any).destroyed) return;

    // Add pulsing effect to the beam
    const pulse = 0.8 + Math.sin(this.lifetime * 8) * 0.2;
    this.sprite.alpha = pulse;

    // Add slight scale pulsing
    const scalePulse = 1 + Math.sin(this.lifetime * 6) * 0.05;
    this.sprite.scale.set(scalePulse);
  }

  private updateAnimation(deltaTime: number): void {
    if (!this.beamSprite || this.beamTextures.length === 0) return;

    this.animationTimer += deltaTime / 60; // Convert to seconds

    if (this.animationTimer >= this.frameInterval) {
      this.animationTimer = 0;

      switch (this.animationPhase) {
        case 'creation':
          // Play frames 0→1→2→3 (01→02→03→04)
          this.currentFrame++;
          if (this.currentFrame >= 4) {
            this.currentFrame = 2; // Start sustain phase at frame 3 (index 2)
            this.animationPhase = 'sustain';
          }
          break;

        case 'sustain':
          // Alternate between frames 2 and 3 (03↔04)
          this.currentFrame = this.currentFrame === 2 ? 3 : 2;

          // Check if we should start destruction phase
          // Start destruction when 90% of rotation is complete
          const rotationProgress = this.totalRotation / 360;
          if (rotationProgress >= 0.9) {
            this.animationPhase = 'destruction';
            this.currentFrame = 3; // Start destruction from frame 4 (index 3)
          }
          break;

        case 'destruction':
          // Play frames 3→2→1→0 (04→03→02→01)
          this.currentFrame--;
          if (this.currentFrame < 0) {
            // Animation complete, beam should disappear
            this.expire();
            return;
          }
          break;
      }

      // Update the sprite texture
      this.beamSprite.texture = this.beamTextures[this.currentFrame];
    }
  }

  /**
   * Handle collision with other objects
   * NOTE: Currently unused as we do manual collision detection in WeaponSystem
   */
  onCollision(other: Collidable): void {
    // This method is currently unused because we handle collision detection
    // manually in the WeaponSystem for more precise control
  }

  private expire(): void {
    // If we're not in destruction phase yet, start it
    if (this.animationPhase !== 'destruction') {
      this.animationPhase = 'destruction';
      this.currentFrame = 3; // Start from frame 4 (index 3)
      return;
    }

    // If we're already in destruction phase, actually expire the beam
    this._active = false;

    // Add expiration visual effect only if sprite is valid
    if (this.sprite && !(this.sprite as any).destroyed) {
      this.sprite.alpha = 0.5;
      this.sprite.scale.set(1.2);
    }

    if (this.onExpired) {
      this.onExpired();
    }
  }

  destroy(): void {
    this._active = false;

    // Clean up sprites safely

    if (this.beamSprite && !(this.beamSprite as any).destroyed) {
      try {
        this.beamSprite.destroy();
      } catch (error) {
        console.log('Error destroying beam sprite:', error);
      }
      this.beamSprite = null;
    }

    if (this.visualSprite && !(this.visualSprite as any).destroyed) {
      try {
        this.visualSprite.destroy();
      } catch (error) {
        console.log('Error destroying visual sprite:', error);
      }
      this.visualSprite = null;
    }

    // Only destroy the container if it has a parent and is not destroyed
    if (this.sprite && this.sprite.parent && !(this.sprite as any).destroyed) {
      this.sprite.parent.removeChild(this.sprite);
    }

    if (this.sprite && !(this.sprite as any).destroyed) {
      try {
        this.sprite.destroy();
      } catch (error) {
        console.log('Error destroying beam sprite container:', error);
      }
    }
  }

  get projectileDamage(): number {
    return Math.floor(this.damage);
  }

  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  get currentVelocity(): { x: number; y: number } {
    return { x: 0, y: 0 }; // Beam doesn't move, it rotates
  }

  get active(): boolean {
    return this._active;
  }

  /**
   * Update beam position to follow player
   */
  updatePosition(playerX: number, playerY: number): void {
    this.playerX = playerX;
    this.playerY = playerY;
    if (this.sprite && !(this.sprite as any).destroyed) {
      this.sprite.x = playerX;
      this.sprite.y = playerY;
    }
  }
}
