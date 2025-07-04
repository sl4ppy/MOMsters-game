import { Graphics, Sprite, DisplayObject } from 'pixi.js';

// Collision groups for different entity types
export enum CollisionGroup {
  PLAYER = 'player',
  ENEMY = 'enemy',
  PROJECTILE = 'projectile',
  PICKUP = 'pickup',
}

// Interface for objects that can collide
export interface Collidable {
  sprite: DisplayObject;
  collisionRadius: number;
  collisionGroup: CollisionGroup;
  onCollision?: (other: Collidable) => void;
}

// Collision pair - defines what can collide with what
interface CollisionPair {
  groupA: CollisionGroup;
  groupB: CollisionGroup;
  callback?: (entityA: Collidable, entityB: Collidable) => void;
}

export class CollisionManager {
  private entities: Collidable[] = [];
  private collisionPairs: CollisionPair[] = [];

  constructor() {
    // Define default collision pairs
    this.setupDefaultCollisions();
  }

  private setupDefaultCollisions(): void {
    // Player collides with enemies
    this.addCollisionPair(CollisionGroup.PLAYER, CollisionGroup.ENEMY);

    // Player collides with pickups
    this.addCollisionPair(CollisionGroup.PLAYER, CollisionGroup.PICKUP);

    // Projectiles collide with enemies
    this.addCollisionPair(CollisionGroup.PROJECTILE, CollisionGroup.ENEMY);
  }

  /**
   * Add an entity to collision checking
   */
  addEntity(entity: Collidable): void {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
  }

  /**
   * Remove an entity from collision checking
   */
  removeEntity(entity: Collidable): void {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }

  /**
   * Add a collision pair (what groups can collide with each other)
   */
  addCollisionPair(
    groupA: CollisionGroup,
    groupB: CollisionGroup,
    callback?: (entityA: Collidable, entityB: Collidable) => void
  ): void {
    this.collisionPairs.push({ groupA, groupB, callback });
  }

  /**
   * Check if two circles are colliding
   */
  private circleCollision(entity1: Collidable, entity2: Collidable): boolean {
    const dx = entity1.sprite.x - entity2.sprite.x;
    const dy = entity1.sprite.y - entity2.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = entity1.collisionRadius + entity2.collisionRadius;

    return distance < minDistance;
  }

  /**
   * Check if two collision groups should collide
   */
  private shouldCollide(groupA: CollisionGroup, groupB: CollisionGroup): CollisionPair | null {
    return (
      this.collisionPairs.find(
        pair =>
          (pair.groupA === groupA && pair.groupB === groupB) ||
          (pair.groupA === groupB && pair.groupB === groupA)
      ) || null
    );
  }

  /**
   * Update collision detection - call this every frame
   */
  update(): void {
    // Check all entity pairs for collisions
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const entityA = this.entities[i];
        const entityB = this.entities[j];

        // Check if these groups should collide
        const collisionPair = this.shouldCollide(entityA.collisionGroup, entityB.collisionGroup);
        if (!collisionPair) continue;

        // Check for actual collision
        if (this.circleCollision(entityA, entityB)) {
          // Call collision callbacks
          if (collisionPair.callback) {
            collisionPair.callback(entityA, entityB);
          }

          if (entityA.onCollision) {
            entityA.onCollision(entityB);
          }

          if (entityB.onCollision) {
            entityB.onCollision(entityA);
          }
        }
      }
    }
  }

  /**
   * Get all entities of a specific collision group
   */
  getEntitiesInGroup(group: CollisionGroup): Collidable[] {
    return this.entities.filter(entity => entity.collisionGroup === group);
  }

  /**
   * Check collision between a specific entity and all others
   */
  checkEntityCollisions(entity: Collidable): Collidable[] {
    const collisions: Collidable[] = [];

    for (const other of this.entities) {
      if (other === entity) continue;

      const collisionPair = this.shouldCollide(entity.collisionGroup, other.collisionGroup);
      if (!collisionPair) continue;

      if (this.circleCollision(entity, other)) {
        collisions.push(other);
      }
    }

    return collisions;
  }

  /**
   * Clear all entities (useful for level transitions)
   */
  clear(): void {
    this.entities = [];
  }

  /**
   * Get collision stats for debugging
   */
  getStats(): { totalEntities: number; entitiesByGroup: Record<string, number> } {
    const entitiesByGroup: Record<string, number> = {};

    for (const entity of this.entities) {
      entitiesByGroup[entity.collisionGroup] = (entitiesByGroup[entity.collisionGroup] || 0) + 1;
    }

    return {
      totalEntities: this.entities.length,
      entitiesByGroup,
    };
  }
}
