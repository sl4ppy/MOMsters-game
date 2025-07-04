import { Graphics, Sprite, Container } from 'pixi.js';
import { Collidable, CollisionGroup } from '../core/CollisionManager';
import { GemSpriteManager } from '../core/GemSpriteManager';

// Interface for player objects that ExperienceOrb needs
interface PlayerLike {
  position: { x: number; y: number };
}

export class ExperienceOrb implements Collidable {
  public sprite: Container;
  public collisionRadius: number = 8;
  public collisionGroup: CollisionGroup = CollisionGroup.PICKUP;

  private gemSpriteManager: GemSpriteManager;
  private visualSprite: Sprite | Graphics | null = null;

  private xpValue: number;
  private magnetSpeed: number = 400; // Speed when being attracted (doubled for faster collection)
  private getMagnetRange: () => number; // Function to get current magnet range
  private floatTime: number = 0; // For floating animation
  private isBeingAttracted: boolean = false;

  // Arc/flow motion properties
  private arcTime: number = 0; // Time for arc animation
  private arcRadius: number = 0; // Current arc radius
  private arcAngle: number = 0; // Current angle in the arc
  private arcDirection: number = 1; // Direction of arc rotation (1 or -1)
  private initialDistance: number = 0; // Distance when attraction started
  private attractionStartTime: number = 0; // When attraction began

  // Easing curve properties
  private originX: number = 0; // Original spawn position
  private originY: number = 0; // Original spawn position
  private easingTime: number = 0; // Time for easing animation
  private easingDuration: number = 0.8; // How long the easing takes (seconds)

  // Callbacks
  public onCollected?: (xpValue: number) => void;

  constructor(
    x: number,
    y: number,
    xpValue: number = 1,
    gemSpriteManager: GemSpriteManager,
    getMagnetRange: () => number
  ) {
    this.sprite = new Container();
    this.xpValue = xpValue;
    this.gemSpriteManager = gemSpriteManager;
    this.getMagnetRange = getMagnetRange;

    // Set initial position and store origin
    this.sprite.x = x;
    this.sprite.y = y;
    this.originX = x;
    this.originY = y;

    this.createSprite();
  }

  private createSprite(): void {
    // Clear any existing children
    this.sprite.removeChildren();

    // Try to create gem sprite from atlas
    const gemSprite = this.gemSpriteManager.createGemSprite(this.xpValue);

    if (gemSprite) {
      // Use the gem sprite from atlas
      this.visualSprite = gemSprite;
      this.sprite.addChild(gemSprite);
    } else {
      // Fallback to graphics if atlas not loaded
      const graphics = new Graphics();

      // Create XP orb appearance based on value
      let outerColor = 0x00ff00; // Green for small XP
      let innerColor = 0x88ff88;
      let size = this.collisionRadius;

      if (this.xpValue >= 5) {
        outerColor = 0x0088ff; // Blue for medium XP
        innerColor = 0x88ccff;
        size = this.collisionRadius + 2;
      }

      if (this.xpValue >= 10) {
        outerColor = 0xff8800; // Orange for large XP
        innerColor = 0xffcc88;
        size = this.collisionRadius + 4;
      }

      // Outer glow effect
      graphics.beginFill(outerColor, 0.3);
      graphics.drawCircle(0, 0, size + 3);
      graphics.endFill();

      // Main orb body
      graphics.beginFill(outerColor, 0.8);
      graphics.drawCircle(0, 0, size);
      graphics.endFill();

      // Inner highlight
      graphics.beginFill(innerColor, 0.6);
      graphics.drawCircle(0, 0, size - 2);
      graphics.endFill();

      // Center sparkle
      graphics.beginFill(0xffffff, 0.8);
      graphics.drawCircle(0, 0, 2);
      graphics.endFill();

      this.visualSprite = graphics;
      this.sprite.addChild(graphics);
    }
  }

  /**
   * Update orb behavior - floating animation and magnetic attraction
   */
  update(deltaTime: number, player: PlayerLike): void {
    this.updateFloatingAnimation(deltaTime);
    this.updateMagneticAttraction(deltaTime, player);
  }

  private updateFloatingAnimation(deltaTime: number): void {
    this.floatTime += deltaTime / 60; // Convert to seconds

    // Gentle floating movement and pulsing effect
    const floatOffset = Math.sin(this.floatTime * 3) * 2;
    const pulseScale = 1 + Math.sin(this.floatTime * 4) * 0.1;

    // Only apply floating animation if not being attracted to player
    if (!this.isBeingAttracted) {
      this.sprite.y += floatOffset * 0.1;
    }

    // Always apply pulsing and rotation effects
    this.sprite.scale.set(pulseScale);
    this.sprite.rotation += 0.02;
  }

  private updateMagneticAttraction(deltaTime: number, player: PlayerLike): void {
    const playerPos = player.position;
    const dx = playerPos.x - this.sprite.x;
    const dy = playerPos.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const magnetRange = this.getMagnetRange();

    // Check if player is within magnet range
    if (distance <= magnetRange) {
      if (!this.isBeingAttracted) {
        // Just started being attracted - initialize arc properties
        this.isBeingAttracted = true;
        this.attractionStartTime = this.floatTime;
        this.initialDistance = distance;
        this.arcTime = 0;
        this.easingTime = 0; // Reset easing time
        // Arc radius scales with distance - longer distances get more pronounced arcs
        this.arcRadius = Math.min(distance * 0.15, 30); // Reduced from 0.3 to 0.15, max 30px
        this.arcAngle = Math.atan2(dy, dx); // Start angle toward player
        this.arcDirection = Math.random() > 0.5 ? 1 : -1; // Random arc direction
      }
    } else {
      // Stop being attracted if outside magnet range
      this.isBeingAttracted = false;
      this.arcTime = 0;
      this.easingTime = 0;
    }

    if (this.isBeingAttracted && distance > 0) {
      // If very close to player, snap directly to player position
      if (distance < 20) {
        this.sprite.x = playerPos.x;
        this.sprite.y = playerPos.y;
        return;
      }

      // Update arc time and easing time
      this.arcTime += deltaTime / 60;
      this.easingTime += deltaTime / 60;

      // Calculate easing curve (ease-out cubic: t * (2 - t))
      const easingProgress = Math.min(this.easingTime / this.easingDuration, 1);
      const easingCurve = easingProgress * (2 - easingProgress); // Ease-out cubic

      // Calculate arc motion
      const arcProgress = Math.min(this.arcTime * 2, 1); // Complete arc in 0.5 seconds
      const arcCurve = Math.sin(arcProgress * Math.PI); // Smooth curve

      // Calculate the direct path to player
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;

      // Calculate arc offset perpendicular to movement direction
      const perpendicularX = -normalizedDy * this.arcDirection;
      const perpendicularY = normalizedDx * this.arcDirection;

      // Combine direct movement with arc motion
      const arcOffsetX = perpendicularX * this.arcRadius * arcCurve;
      const arcOffsetY = perpendicularY * this.arcRadius * arcCurve;

      // Calculate base movement speed with easing acceleration
      const baseMoveSpeed = this.magnetSpeed * 2.5;
      const moveSpeed = baseMoveSpeed * (deltaTime / 60);

      // Apply easing curve to speed - starts slow and accelerates
      const easedSpeed = moveSpeed * (0.3 + easingCurve * 0.7); // Start at 30% speed, ramp to 100%

      // Attraction strength - stronger when closer to player
      const attractionStrength = Math.max(0.6, 1.0 - distance / magnetRange);

      // Apply arc-based movement with easing - reduced arc intensity
      const moveX = normalizedDx * easedSpeed * attractionStrength + arcOffsetX * 0.25; // Reduced from 0.5 to 0.25
      const moveY = normalizedDy * easedSpeed * attractionStrength + arcOffsetY * 0.25; // Reduced from 0.5 to 0.25

      // Apply movement
      this.sprite.x += moveX;
      this.sprite.y += moveY;

      // Add visual effects for flowing motion with easing
      const flowPulse = 0.8 + Math.sin(this.floatTime * 12) * 0.2;
      this.sprite.alpha = flowPulse;

      // Slight rotation during arc motion
      this.sprite.rotation += this.arcDirection * 0.05;

      // Safety check: if gem is moving away, force it back
      const newDx = playerPos.x - this.sprite.x;
      const newDy = playerPos.y - this.sprite.y;
      const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);

      if (newDistance > distance + 10) {
        // Gem moved away from player, correct course
        this.sprite.x = playerPos.x - normalizedDx * (distance * 0.9);
        this.sprite.y = playerPos.y - normalizedDy * (distance * 0.9);
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
        this.onCollected(this.xpValue);
      }

      // Add collection visual effect
      this.sprite.alpha = 0.5;
      this.sprite.scale.set(1.5);
      if (this.visualSprite) {
        this.visualSprite.tint = 0xffff00; // Yellow flash
      }
    }
  }

  /**
   * Get XP value of this orb
   */
  get experienceValue(): number {
    return this.xpValue;
  }

  /**
   * Get current position
   */
  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Check if orb is being attracted to player
   */
  get attracted(): boolean {
    return this.isBeingAttracted;
  }
}
