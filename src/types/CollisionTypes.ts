// Collision groups for different entity types
export enum CollisionGroup {
  PLAYER = 'player',
  ENEMY = 'enemy',
  PROJECTILE = 'projectile',
  PICKUP = 'pickup',
}

// Interface for objects that can collide
export interface Collidable {
  sprite: any; // Using any to avoid PIXI.js import issues
  collisionRadius: number;
  collisionGroup: CollisionGroup;
  onCollision?: (other: Collidable) => void;
}

export interface CollisionObject {
  id: string;
  type: 'player' | 'enemy' | 'projectile' | 'beam' | 'item' | 'terrain';
  position: Vector2D;
  bounds: Bounds;
  sprite: { x: number; y: number; width: number; height: number }; // Using specific type to avoid PIXI.js import issues
} 