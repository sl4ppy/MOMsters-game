import { Enemy } from '../Enemy';
import { EnemySpriteManager } from '../../core/EnemySpriteManager';
import { Graphics } from 'pixi.js';
import { Player } from '../Player';

export class ChompChestEnemy extends Enemy {
  private enemySpriteManager: EnemySpriteManager;
  private visualSprite: any; // Will be Sprite or Graphics

  // Hopping state
  private isHopping: boolean = false;
  private hopCooldown: number = 0;
  private hopDuration: number = 0.6; // How long a hop takes (in seconds)
  private hopCooldownTime: number = 1.0; // Time between hops (in seconds)
  private hopHeight: number = 30; // How high the chest hops

  // Hop animation
  private hopTimer: number = 0;
  private hopStartX: number = 0;
  private hopStartY: number = 0;
  private hopTargetX: number = 0;
  private hopTargetY: number = 0;
  private originalY: number = 0;

  constructor(enemySpriteManager: EnemySpriteManager) {
    // Use ChompChest config from the sprite manager (enemy type 6)
    const baseConfig = enemySpriteManager.getEnemyConfig(6) || {
      health: 60,
      speed: 50,
      damage: 15,
      collisionRadius: 16,
      xpValue: 12,
    };

    // Override speed to be 2x faster than blob (75 * 2 = 150)
    const config = {
      ...baseConfig,
      speed: 150, // 2x faster than blob (75 * 2)
    };

    super(config.health, config.speed, config.damage, config.collisionRadius, config.xpValue);

    this.enemySpriteManager = enemySpriteManager;

    // Now that we're fully initialized, create the sprite
    this.createSprite();

    console.warn('ChompChestEnemy: Creating enemy...');
  }

  /**
   * Create the visual sprite for this enemy
   */
  protected createSprite(): void {
    // Try to get the ChompChest sprite from the atlas
    const chompChestSprite = this.enemySpriteManager.createEnemySprite(6);

    if (chompChestSprite) {
      // Successfully loaded sprite from atlas
      this.visualSprite = chompChestSprite;
      this.sprite.addChild(this.visualSprite);

      // Center the sprite
      this.visualSprite.anchor.set(0.5);

      console.warn('ChompChest enemy created with atlas sprite');
    } else {
      // Fallback to graphics if sprite loading fails
      console.warn('ChompChest sprite not found in atlas, using fallback graphics');
      this.createFallbackSprite();
    }

    console.warn('ChompChestEnemy: Enemy created successfully');
  }

  /**
   * Create a fallback sprite using graphics
   */
  private createFallbackSprite(): void {
    const graphics = new Graphics();

    // Draw a chest-like shape
    graphics.beginFill(0x8b4513); // Brown color for chest
    graphics.drawRoundedRect(
      -this.collisionRadius,
      -this.collisionRadius,
      this.collisionRadius * 2,
      this.collisionRadius * 2,
      4
    );
    graphics.endFill();

    // Add some chest details
    graphics.beginFill(0x654321); // Darker brown for outline
    graphics.drawRoundedRect(
      -this.collisionRadius,
      -this.collisionRadius,
      this.collisionRadius * 2,
      this.collisionRadius * 2,
      4
    );
    graphics.endFill();

    // Add a golden latch
    graphics.beginFill(0xffd700); // Gold color
    graphics.drawRect(-2, -this.collisionRadius / 2, 4, this.collisionRadius);
    graphics.endFill();

    this.visualSprite = graphics;
    this.sprite.addChild(this.visualSprite);
  }

  /**
   * Override update to implement hopping movement
   */
  public update(_deltaTime: number): void {
    // Update enemy behavior
    // TODO: Implement enemy update logic
  }

  /**
   * Update hopping state machine
   */
  private updateHopState(_deltaTime: number, player?: Player): void {
    if (this.isHopping) {
      // Currently hopping - update hop timer
      this.hopTimer += _deltaTime / 60; // Convert to seconds

      if (this.hopTimer >= this.hopDuration) {
        // Hop finished
        this.isHopping = false;
        this.hopTimer = 0;
        this.hopCooldown = this.hopCooldownTime;

        // Ensure we're at the target position
        this.sprite.x = this.hopTargetX;
        this.sprite.y = this.hopTargetY;

        // Add landing effects (squash and stretch)
        this.addLandingEffects();
      }
    } else {
      // Not hopping - update cooldown
      if (this.hopCooldown > 0) {
        this.hopCooldown -= _deltaTime / 60;

        if (this.hopCooldown <= 0) {
          // Ready to hop again
          if (player) {
            this.startHopTowardPlayer(player);
          } else {
            this.startHop();
          }
        }
      }
    }
  }

  /**
   * Start a new hop toward the player
   */
  private startHop(): void {
    // We'll use the player reference from the update method
    // For now, default to screen center if no player reference available
    const currentX = this.sprite.x;
    const currentY = this.sprite.y;

    // Calculate hop distance based on speed (faster enemy hops further)
    const hopDistance = this.speed * 0.6; // 60% of speed as hop distance (like blob)

    // The actual player position will be set by the update method
    // This is a fallback for initialization
    const centerX = 400; // Approximate screen center
    const centerY = 300; // Approximate screen center

    const directionX = centerX - currentX;
    const directionY = centerY - currentY;
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);

    if (distance > 0) {
      // Normalize direction and apply hop distance
      const normalizedX = directionX / distance;
      const normalizedY = directionY / distance;

      this.hopStartX = currentX;
      this.hopStartY = currentY;
      this.hopTargetX = currentX + normalizedX * hopDistance;
      this.hopTargetY = currentY + normalizedY * hopDistance;
      this.originalY = currentY;

      this.isHopping = true;
      this.hopTimer = 0;
    }
  }

  /**
   * Start a new hop toward the player with specific target
   */
  private startHopTowardPlayer(player: Player): void {
    const currentX = this.sprite.x;
    const currentY = this.sprite.y;

    // Calculate hop distance based on speed (faster enemy hops further)
    const hopDistance = this.speed * 0.6; // 60% of speed as hop distance (like blob)

    // Direction toward player
    const directionX = player.position.x - currentX;
    const directionY = player.position.y - currentY;
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);

    if (distance > 0) {
      // Normalize direction and apply hop distance
      const normalizedX = directionX / distance;
      const normalizedY = directionY / distance;

      this.hopStartX = currentX;
      this.hopStartY = currentY;
      this.hopTargetX = currentX + normalizedX * hopDistance;
      this.hopTargetY = currentY + normalizedY * hopDistance;
      this.originalY = currentY;

      this.isHopping = true;
      this.hopTimer = 0;
    }
  }

  /**
   * Perform the hopping movement with parabolic arc
   */
  private performHop(_deltaTime: number): void {
    if (!this.isHopping) return;

    // Calculate hop progress (0 to 1)
    const hopProgress = Math.min(1, this.hopTimer / this.hopDuration);

    // Linear interpolation for X and Y position
    const currentX = this.hopStartX + (this.hopTargetX - this.hopStartX) * hopProgress;
    const currentY = this.hopStartY + (this.hopTargetY - this.hopStartY) * hopProgress;

    // Add parabolic height using sine wave
    const heightOffset = Math.sin(hopProgress * Math.PI) * this.hopHeight;

    this.sprite.x = currentX;
    this.sprite.y = currentY - heightOffset; // Subtract to go up
  }

  /**
   * Add landing effects when hop finishes
   */
  private addLandingEffects(): void {
    if (!this.visualSprite) return;

    // Simple squash effect
    this.visualSprite.scale.set(1.2, 0.8); // Squash down

    // Animate back to normal scale
    const duration = 0.15; // 150ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(1, elapsed / duration);

      // Ease out the squash effect
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const scaleX = 1.2 - 0.2 * easeProgress;
      const scaleY = 0.8 + 0.2 * easeProgress;

      this.visualSprite.scale.set(scaleX, scaleY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.visualSprite.scale.set(1, 1); // Ensure final scale is normal
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Override moveTowardPlayer to work with hopping mechanics
   */
  protected moveTowardPlayer(deltaTime: number, player: Player): void {
    if (this.isHopping) return; // Don't move normally while hopping

    // Call parent's movement method
    super.moveTowardPlayer(deltaTime, player);
  }

  /**
   * Update appearance based on damage taken and hop state
   */
  protected updateAppearance(): void {
    super.updateAppearance();

    if (this.visualSprite) {
      // Add different effects for hopping vs on ground
      if (this.hopCooldown > 0) {
        // Slightly dimmed while on cooldown
        const cooldownProgress = 1 - this.hopCooldown / this.hopCooldownTime;
        this.visualSprite.alpha = Math.max(0.6, 0.6 + cooldownProgress * 0.4);
      }
    }
  }

  private getRandomTreasure(): string {
    const treasures = ['gold', 'gems', 'weapons', 'health'];
    return treasures[Math.floor(Math.random() * treasures.length)];
  }

  public getEnemyType(): string {
    return 'chomp-chest';
  }
}
