import { Collidable, CollisionGroup } from '../types/CollisionTypes';
import { Container } from 'pixi.js';
import { Player } from './Player';
import { Projectile } from './Projectile';

export abstract class Enemy implements Collidable {
  public sprite: Container;
  public collisionRadius: number;
  public collisionGroup: CollisionGroup = CollisionGroup.ENEMY;

  // AI properties
  public target?: Player;
  public formationIndex?: number;
  public formationSize?: number;

  protected health: number;
  protected maxHealth: number;
  protected speed: number;
  protected damage: number;
  protected xpValue: number = 1; // Default XP value
  protected isAlive: boolean = true;

  constructor(
    health: number,
    speed: number,
    damage: number,
    collisionRadius: number,
    xpValue: number = 1
  ) {
    this.sprite = new Container();
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.damage = damage;
    this.collisionRadius = collisionRadius;
    this.xpValue = xpValue;

    // Don't call createSprite here - let derived classes call it after initialization
  }

  /**
   * Abstract method - each enemy type must implement its own visual appearance
   */
  protected abstract createSprite(): void;

  /**
   * Set the target for AI behavior
   */
  setTarget(target: Player): void {
    this.target = target;
  }

  /**
   * Attack the target (called by AI system)
   */
  attack(): void {
    if (this.target && this.isAlive) {
      // This will trigger collision with player
      // The actual damage is handled in the collision system
    }
  }

  /**
   * Check if enemy is active (alive and has target)
   */
  isActive(): boolean {
    return this.isAlive && this.target !== undefined;
  }

  /**
   * Get current health
   */
  get currentHealth(): number {
    return this.health;
  }

  /**
   * Get maximum health
   */
  get maximumHealth(): number {
    return this.maxHealth;
  }

  /**
   * Update enemy behavior - movement, AI, etc.
   */
  update(deltaTime: number, player: Player): void {
    if (!this.isAlive) return;

    // Basic AI: move toward player
    this.moveTowardPlayer(deltaTime, player);

    // Update sprite appearance based on health
    this.updateAppearance();
  }

  /**
   * Basic AI: move toward the player
   */
  protected moveTowardPlayer(deltaTime: number, player: Player): void {
    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Normalize direction and apply speed
      const moveSpeed = this.speed * (deltaTime / 60);
      this.sprite.x += (dx / distance) * moveSpeed;
      this.sprite.y += (dy / distance) * moveSpeed;

      // Update enemy orientation to face direction of travel
      this.updateRotation(dx, dy);
    }
  }

  /**
   * Update enemy orientation to face direction of travel (horizontal flip)
   */
  protected updateRotation(dx: number, _dy: number): void {
    // Keep sprite upright, only flip horizontally based on movement direction
    if (dx < 0) {
      // Moving left - flip horizontally
      this.sprite.scale.x = -1;
    } else if (dx > 0) {
      // Moving right - normal orientation
      this.sprite.scale.x = 1;
    }
    // If dx is 0, keep current orientation
  }

  /**
   * Handle collision with other entities
   */
  onCollision(other: Entity): void {
    if (other instanceof Projectile) {
      const projectile = other as Projectile; // Cast to access projectile properties
      this.takeDamage(projectile.damage);
    }
  }

  /**
   * Take damage and handle death
   */
  takeDamage(amount: number): boolean {
    if (!this.isAlive) return false;

    this.health = Math.floor(this.health - amount);

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true; // Enemy died
    }

    return false; // Enemy still alive
  }

  /**
   * Handle enemy death
   */
  protected die(): void {
    this.isAlive = false;
    this.sprite.alpha = 0.3; // Make semi-transparent to show it's dead

    // Remove from collision after a short delay (for visual feedback)
    setTimeout(() => {
      if (this.sprite.parent) {
        this.sprite.parent.removeChild(this.sprite);
      }
    }, 500);
  }

  /**
   * Update visual appearance based on health
   */
  protected updateAppearance(): void {
    if (!this.isAlive) return;

    // Change opacity based on health
    const healthPercent = this.health / this.maxHealth;
    this.sprite.alpha = 0.5 + healthPercent * 0.5; // Range from 0.5 to 1.0
  }

  /**
   * Get current health percentage
   */
  get healthPercent(): number {
    return this.health / this.maxHealth;
  }

  /**
   * Check if enemy is alive
   */
  get alive(): boolean {
    return this.isAlive;
  }

  /**
   * Get damage dealt by this enemy
   */
  get attackDamage(): number {
    return this.damage;
  }

  /**
   * Get enemy position
   */
  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Get experience value for killing this enemy
   */
  get experienceValue(): number {
    return this.xpValue;
  }
}
