import { System, Query } from '../interfaces';
import { EntityId, SystemType, createSystemType, createComponentType } from '../../types/core';
import { ECSWorldImpl } from '../ECSWorld';
import { EventBusImpl } from '../../events/EventBus';
import { PositionComponent, CollisionComponent } from '../components/BaseComponents';
import { EnemyCollisionComponent } from '../components/EnemyComponents';

export interface CollisionPair {
  entityA: EntityId;
  entityB: EntityId;
  distance: number;
  overlap: number;
  normal: { x: number; y: number };
}

export interface CollisionResult {
  collided: boolean;
  pairs: CollisionPair[];
  events: Array<{
    type: string;
    entityA: EntityId;
    entityB: EntityId;
    data?: any;
  }>;
}

export interface DebugCollisionInfo {
  entityId: EntityId;
  position: { x: number; y: number };
  radius: number;
  layer: string | null;
  gridCell: string;
}

export class CollisionSystem implements System {
  public readonly type: SystemType = createSystemType('collision-system');
  public readonly priority: number = 10; // High priority for collision detection

  private world: ECSWorldImpl;
  private eventBus: EventBusImpl;
  
  // Collision layers
  private readonly LAYERS = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    PROJECTILE: 'projectile',
    EXPERIENCE_ORB: 'experience-orb',
    TERRAIN: 'terrain',
  };

  // Collision masks (what each layer can collide with)
  private readonly COLLISION_MASKS = {
    [this.LAYERS.PLAYER]: [this.LAYERS.ENEMY, this.LAYERS.EXPERIENCE_ORB, this.LAYERS.TERRAIN],
    [this.LAYERS.ENEMY]: [this.LAYERS.PLAYER, this.LAYERS.PROJECTILE, this.LAYERS.TERRAIN],
    [this.LAYERS.PROJECTILE]: [this.LAYERS.ENEMY, this.LAYERS.TERRAIN],
    [this.LAYERS.EXPERIENCE_ORB]: [this.LAYERS.PLAYER],
    [this.LAYERS.TERRAIN]: [this.LAYERS.PLAYER, this.LAYERS.ENEMY, this.LAYERS.PROJECTILE],
  };

  // Queries for different entity types
  private playerQuery: Query = {
    with: [createComponentType('player'), createComponentType('position'), createComponentType('collision')],
    without: [],
  };

  private enemyQuery: Query = {
    with: [createComponentType('enemy'), createComponentType('position'), createComponentType('enemy-collision')],
    without: [],
  };

  private projectileQuery: Query = {
    with: [createComponentType('projectile'), createComponentType('position'), createComponentType('collision')],
    without: [],
  };

  private experienceOrbQuery: Query = {
    with: [createComponentType('experience-orb'), createComponentType('position'), createComponentType('collision')],
    without: [],
  };

  // Spatial partitioning for performance
  private spatialGrid: Map<string, EntityId[]> = new Map();
  private gridSize: number = 64; // Size of each grid cell
  private gridBounds = {
    minX: -1000,
    maxX: 1000,
    minY: -1000,
    maxY: 1000,
  };

  // Performance metrics
  private performanceMetrics = {
    entitiesProcessed: 0,
    collisionChecks: 0,
    collisionsDetected: 0,
    updateTime: 0,
    averageUpdateTime: 0,
  };

  // System state
  private initialized: boolean = false;
  private lastUpdate: number = 0;

  constructor(world: ECSWorldImpl, eventBus: EventBusImpl) {
    this.world = world;
    this.eventBus = eventBus;
  }

  initialize(): void {
    if (this.initialized) return;

    console.warn('CollisionSystem: Initializing...');
    this.initialized = true;
    this.lastUpdate = Date.now();

    // Register event listeners
    this.eventBus.on('entity:created', this.handleEntityCreated.bind(this));
    this.eventBus.on('entity:destroyed', this.handleEntityDestroyed.bind(this));
    this.eventBus.on('entity:moved', this.handleEntityMoved.bind(this));

    console.warn('CollisionSystem: Initialized successfully');
  }

  update(_deltaTime: number): void {
    if (!this.initialized) return;

    const updateStart = performance.now();

    // Update spatial grid
    this.updateSpatialGrid();

    // Perform collision detection
    const collisionResult = this.detectCollisions();

    // Resolve collisions
    this.resolveCollisions(collisionResult);

    // Emit collision events
    this.emitCollisionEvents(collisionResult);

    // Update performance metrics
    const updateEnd = performance.now();
    this.performanceMetrics.updateTime = updateEnd - updateStart;
    this.performanceMetrics.averageUpdateTime = 
      (this.performanceMetrics.averageUpdateTime * 0.9) + 
      (this.performanceMetrics.updateTime * 0.1);

    this.lastUpdate = Date.now();

    console.warn('CollisionSystem: Collisions processed');
  }

  shutdown(): void {
    if (!this.initialized) return;

    console.warn('CollisionSystem: Shutting down...');
    
    // Clear spatial grid
    this.spatialGrid.clear();

    // Remove event listeners
    this.eventBus.off('entity:created', this.handleEntityCreated.bind(this));
    this.eventBus.off('entity:destroyed', this.handleEntityDestroyed.bind(this));
    this.eventBus.off('entity:moved', this.handleEntityMoved.bind(this));

    this.initialized = false;
    console.warn('CollisionSystem: Shutdown complete');
  }

  // Public API methods
  checkCollision(entityA: EntityId, entityB: EntityId): boolean {
    const posA = this.world.entityManager.getComponent<PositionComponent>(entityA, createComponentType('position'));
    const posB = this.world.entityManager.getComponent<PositionComponent>(entityB, createComponentType('position'));
    const collA = this.getCollisionComponent(entityA);
    const collB = this.getCollisionComponent(entityB);

    if (!posA || !posB || !collA || !collB) return false;

    return this.circleCircleCollision(posA, collA, posB, collB);
  }

  getCollisionComponent(entityId: EntityId): CollisionComponent | EnemyCollisionComponent | null {
    // Try different collision component types
    const baseCollision = this.world.entityManager.getComponent<CollisionComponent>(entityId, createComponentType('collision'));
    if (baseCollision) return baseCollision;

    const enemyCollision = this.world.entityManager.getComponent<EnemyCollisionComponent>(entityId, createComponentType('enemy-collision'));
    if (enemyCollision) return enemyCollision;

    return null;
  }

  // Private methods
  private updateSpatialGrid(): void {
    this.spatialGrid.clear();

    // Get all entities with position and collision components
    const allEntities = [
      ...this.world.entityManager.query(this.playerQuery),
      ...this.world.entityManager.query(this.enemyQuery),
      ...this.world.entityManager.query(this.projectileQuery),
      ...this.world.entityManager.query(this.experienceOrbQuery),
    ];

    for (const entity of allEntities) {
      const position = this.world.entityManager.getComponent<PositionComponent>(entity.id, createComponentType('position'));
      const collision = this.getCollisionComponent(entity.id);

      if (!position || !collision) continue;

      // Calculate grid cells this entity occupies
      const radius = this.getCollisionRadius(collision);
      const minX = Math.floor((position.x - radius) / this.gridSize);
      const maxX = Math.floor((position.x + radius) / this.gridSize);
      const minY = Math.floor((position.y - radius) / this.gridSize);
      const maxY = Math.floor((position.y + radius) / this.gridSize);

      // Add entity to all relevant grid cells
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${x},${y}`;
          if (!this.spatialGrid.has(key)) {
            this.spatialGrid.set(key, []);
          }
          this.spatialGrid.get(key)!.push(entity.id);
        }
      }
    }
  }

  private detectCollisions(): CollisionResult {
    const result: CollisionResult = {
      collided: false,
      pairs: [],
      events: [],
    };

    this.performanceMetrics.collisionChecks = 0;
    this.performanceMetrics.collisionsDetected = 0;

    // Check each grid cell for collisions
    for (const entities of this.spatialGrid.values()) {
      if (entities.length < 2) continue;

      // Check all pairs in this cell
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const entityA = entities[i];
          const entityB = entities[j];

          this.performanceMetrics.collisionChecks++;

          if (this.shouldCheckCollision(entityA, entityB)) {
            const collision = this.checkEntityCollision(entityA, entityB);
            if (collision) {
              result.pairs.push(collision);
              result.collided = true;
              this.performanceMetrics.collisionsDetected++;
            }
          }
        }
      }
    }

    return result;
  }

  private shouldCheckCollision(entityA: EntityId, entityB: EntityId): boolean {
    const layerA = this.getEntityLayer(entityA);
    const layerB = this.getEntityLayer(entityB);

    if (!layerA || !layerB) return false;

    // Check if these layers can collide
    const maskA = this.COLLISION_MASKS[layerA];
    const maskB = this.COLLISION_MASKS[layerB];

    return maskA.includes(layerB) || maskB.includes(layerA);
  }

  private getEntityLayer(entityId: EntityId): string | null {
    if (this.world.entityManager.hasComponent(entityId, createComponentType('player'))) {
      return this.LAYERS.PLAYER;
    }
    if (this.world.entityManager.hasComponent(entityId, createComponentType('enemy'))) {
      return this.LAYERS.ENEMY;
    }
    if (this.world.entityManager.hasComponent(entityId, createComponentType('projectile'))) {
      return this.LAYERS.PROJECTILE;
    }
    if (this.world.entityManager.hasComponent(entityId, createComponentType('experience-orb'))) {
      return this.LAYERS.EXPERIENCE_ORB;
    }
    return null;
  }

  private checkEntityCollision(entityA: EntityId, entityB: EntityId): CollisionPair | null {
    const posA = this.world.entityManager.getComponent<PositionComponent>(entityA, createComponentType('position'));
    const posB = this.world.entityManager.getComponent<PositionComponent>(entityB, createComponentType('position'));
    const collA = this.getCollisionComponent(entityA);
    const collB = this.getCollisionComponent(entityB);

    if (!posA || !posB || !collA || !collB) return null;

    const radiusA = this.getCollisionRadius(collA);
    const radiusB = this.getCollisionRadius(collB);

    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = radiusA + radiusB;

    if (distance < minDistance) {
      const overlap = minDistance - distance;
      const normal = distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };

      return {
        entityA,
        entityB,
        distance,
        overlap,
        normal,
      };
    }

    return null;
  }

  private getCollisionRadius(collision: CollisionComponent | EnemyCollisionComponent): number {
    if ('collisionRadius' in collision) {
      return collision.collisionRadius;
    }
    
    // For base CollisionComponent, calculate from bounds
    const bounds = (collision as CollisionComponent).bounds;
    return Math.max(bounds.width, bounds.height) / 2;
  }

  private circleCircleCollision(
    posA: PositionComponent,
    collA: CollisionComponent | EnemyCollisionComponent,
    posB: PositionComponent,
    collB: CollisionComponent | EnemyCollisionComponent
  ): boolean {
    const radiusA = this.getCollisionRadius(collA);
    const radiusB = this.getCollisionRadius(collB);

    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < (radiusA + radiusB);
  }

  private resolveCollisions(result: CollisionResult): void {
    for (const pair of result.pairs) {
      this.resolveCollisionPair(pair);
    }
  }

  private resolveCollisionPair(pair: CollisionPair): void {
    const posA = this.world.entityManager.getComponent<PositionComponent>(pair.entityA, createComponentType('position'));
    const posB = this.world.entityManager.getComponent<PositionComponent>(pair.entityB, createComponentType('position'));

    if (!posA || !posB) return;

    // Simple collision resolution - push entities apart
    const pushDistance = pair.overlap * 0.5;
    
    posA.x -= pair.normal.x * pushDistance;
    posA.y -= pair.normal.y * pushDistance;
    posB.x += pair.normal.x * pushDistance;
    posB.y += pair.normal.y * pushDistance;
  }

  private emitCollisionEvents(result: CollisionResult): void {
    for (const pair of result.pairs) {
      const layerA = this.getEntityLayer(pair.entityA);
      const layerB = this.getEntityLayer(pair.entityB);

      if (!layerA || !layerB) continue;

      // Determine collision type and emit appropriate event
      const eventType = this.getCollisionEventType(layerA, layerB);
      
      this.eventBus.emit({
        type: eventType,
        timestamp: Date.now(),
        data: {
          entityA: pair.entityA,
          entityB: pair.entityB,
          layerA,
          layerB,
          distance: pair.distance,
          overlap: pair.overlap,
          normal: pair.normal,
        }
      });
    }
  }

  private getCollisionEventType(layerA: string, layerB: string): string {
    const layers = [layerA, layerB].sort();
    
    if (layers.includes(this.LAYERS.PLAYER) && layers.includes(this.LAYERS.ENEMY)) {
      return 'collision:player-enemy';
    }
    if (layers.includes(this.LAYERS.PROJECTILE) && layers.includes(this.LAYERS.ENEMY)) {
      return 'collision:projectile-enemy';
    }
    if (layers.includes(this.LAYERS.PLAYER) && layers.includes(this.LAYERS.EXPERIENCE_ORB)) {
      return 'collision:player-experience-orb';
    }
    
    return 'collision:generic';
  }

  // Event handlers
  private handleEntityCreated(_data: unknown): void {
    // Entity will be added to spatial grid on next update
  }

  private handleEntityDestroyed(_data: unknown): void {
    // Entity will be removed from spatial grid on next update
  }

  private handleEntityMoved(_data: unknown): void {
    // Entity position will be updated in spatial grid on next update
  }

  // Performance and debugging methods
  getPerformanceMetrics(): { entitiesProcessed: number; collisionChecks: number; collisionsDetected: number; updateTime: number; averageUpdateTime: number } {
    return { ...this.performanceMetrics };
  }

  getSpatialGridStats(): { gridCells: number; totalEntities: number; averageEntitiesPerCell: number } {
    return {
      gridCells: this.spatialGrid.size,
      totalEntities: Array.from(this.spatialGrid.values()).flat().length,
      averageEntitiesPerCell: this.spatialGrid.size > 0 
        ? Array.from(this.spatialGrid.values()).flat().length / this.spatialGrid.size 
        : 0,
    };
  }

  debugCollision(entityId: EntityId): DebugCollisionInfo | null {
    const position = this.world.entityManager.getComponent<PositionComponent>(entityId, createComponentType('position'));
    const collision = this.getCollisionComponent(entityId);
    const layer = this.getEntityLayer(entityId);

    if (!position || !collision) return null;

    return {
      entityId,
      position: { x: position.x, y: position.y },
      radius: this.getCollisionRadius(collision),
      layer,
      gridCell: `${Math.floor(position.x / this.gridSize)},${Math.floor(position.y / this.gridSize)}`,
    };
  }
} 