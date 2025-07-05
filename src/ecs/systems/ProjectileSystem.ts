import { System, Query, SystemType } from '../interfaces';
import { EntityId, Vector2D } from '../../types/core';
import { EventBus } from '../../events/EventBus';
import { 
  ProjectileComponent, 
  ProjectileMovementComponent, 
  ProjectileVisualComponent,
  BeamComponent,
  BeamVisualComponent
} from '../components/WeaponComponents';
import { PositionComponent } from '../components/BaseComponents';
import { Container } from 'pixi.js';
import { CollisionManager } from '../../core/CollisionManager';

interface ProjectileSystemState {
  gameContainer: Container;
  collisionManager: CollisionManager;
  deltaTime: number;
  gameTime: number;
}

export class ProjectileSystem implements System {
  public readonly type: SystemType = 'projectile-system' as SystemType;
  public readonly priority: number = 500;
  
  private eventBus: EventBus;
  private state: ProjectileSystemState;
  
  // Component queries
  private projectileQuery: Query;
  private beamQuery: Query;
  
  // System state
  private isActive: boolean = true;
  private isInitialized: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.state = {
      gameContainer: new Container(),
      collisionManager: new CollisionManager(),
      deltaTime: 0,
      gameTime: 0
    };
    
    // Initialize component queries
    this.projectileQuery = {
      all: ['projectile', 'projectile-movement', 'position'],
      any: [],
      none: []
    };
    
    this.beamQuery = {
      all: ['beam', 'beam-visual', 'position'],
      any: [],
      none: []
    };
  }

  public init(): void {
    if (this.isInitialized) return;
    
    console.warn('ProjectileSystem: Initializing...');
    this.isInitialized = true;
    
    // Subscribe to relevant events
    this.eventBus.on('projectile:created', this.handleProjectileCreated.bind(this));
    this.eventBus.on('projectile:destroyed', this.handleProjectileDestroyed.bind(this));
    this.eventBus.on('beam:created', this.handleBeamCreated.bind(this));
    this.eventBus.on('beam:destroyed', this.handleBeamDestroyed.bind(this));
    
    console.warn('ProjectileSystem: Initialized successfully');
  }

  public update(entities: Map<EntityId, Map<string, unknown>>, deltaTime: number): void {
    if (!this.isActive || !this.isInitialized) return;
    
    this.state.deltaTime = deltaTime;
    this.state.gameTime += deltaTime;
    
    // Update projectile movement
    this.updateProjectileMovement(entities, deltaTime);
    
    // Update beam visuals
    this.updateBeamVisuals(entities, deltaTime);
    
    // Process projectile collisions
    this.processProjectileCollisions(entities, deltaTime);
    
    // Process beam collisions
    this.processBeamCollisions(entities, deltaTime);
    
    console.warn('ProjectileSystem: Projectiles processed');
  }

  public shutdown(): void {
    if (!this.isInitialized) return;
    
    console.warn('ProjectileSystem: Shutting down...');
    this.isActive = false;
    this.isInitialized = false;
    
    // Unsubscribe from events
    this.eventBus.off('projectile:created', this.handleProjectileCreated.bind(this));
    this.eventBus.off('projectile:destroyed', this.handleProjectileDestroyed.bind(this));
    this.eventBus.off('beam:created', this.handleBeamCreated.bind(this));
    this.eventBus.off('beam:destroyed', this.handleBeamDestroyed.bind(this));
    
    console.warn('ProjectileSystem: Shutdown complete');
  }

  public setGameContainer(container: Container): void {
    this.state.gameContainer = container;
  }

  public setCollisionManager(collisionManager: CollisionManager): void {
    this.state.collisionManager = collisionManager;
  }

  private updateProjectileMovement(entities: Map<EntityId, Map<string, unknown>>, deltaTime: number): void {
    for (const [, components] of entities) {
      if (!this.matchesQuery(components, this.projectileQuery)) continue;
      
      const projectile = components.get('projectile') as ProjectileComponent;
      const movement = components.get('projectile-movement') as ProjectileMovementComponent;
      const position = components.get('position') as PositionComponent;
      
      if (!projectile || !movement || !position) continue;
      
      // Update position based on velocity
      position.x += movement.velocity.x * deltaTime;
      position.y += movement.velocity.y * deltaTime;
      
      // Update lifetime
      movement.lifetime -= deltaTime;
      if (movement.lifetime <= 0) {
        // Projectile expired
        this.destroyProjectile(0, 'lifetime-expired');
      }
      
      // Update visual rotation
      const visual = components.get('projectile-visual') as ProjectileVisualComponent;
      if (visual) {
        visual.rotation = Math.atan2(movement.velocity.y, movement.velocity.x);
      }
    }
  }

  private updateBeamVisuals(entities: Map<EntityId, Map<string, unknown>>, _deltaTime: number): void {
    for (const [, components] of entities) {
      if (!this.matchesQuery(components, this.beamQuery)) continue;
      
      const beam = components.get('beam') as BeamComponent;
      const visual = components.get('beam-visual') as BeamVisualComponent;
      const position = components.get('position') as PositionComponent;
      
      if (!beam || !visual || !position) continue;
      
      // Update beam visual effects
      visual.intensity = Math.sin(this.state.gameTime * beam.pulseRate) * 0.5 + 0.5;
      visual.width = beam.baseWidth * (1 + Math.sin(this.state.gameTime * beam.pulseRate) * 0.2);
      
      // Update beam lifetime
      beam.lifetime -= this.state.deltaTime;
      if (beam.lifetime <= 0) {
        // Beam expired
        this.destroyBeam(0, 'lifetime-expired');
      }
    }
  }

  private processProjectileCollisions(entities: Map<EntityId, Map<string, unknown>>, _deltaTime: number): void {
    for (const [, components] of entities) {
      if (!this.matchesQuery(components, this.projectileQuery)) continue;
      
      const projectile = components.get('projectile') as ProjectileComponent;
      const position = components.get('position') as PositionComponent;
      
      if (!projectile || !position) continue;
      
      // Check for collisions with enemies
      // TODO: Implement collision detection
    }
  }

  private processBeamCollisions(entities: Map<EntityId, Map<string, unknown>>, _deltaTime: number): void {
    for (const [, components] of entities) {
      if (!this.matchesQuery(components, this.beamQuery)) continue;
      
      const beam = components.get('beam') as BeamComponent;
      const position = components.get('position') as PositionComponent;
      
      if (!beam || !position) continue;
      
      // Check for collisions with enemies
      // TODO: Implement collision detection
    }
  }

  private destroyProjectile(_projectileId: EntityId, _reason: string): void {
    // TODO: Implement projectile destruction
  }

  private destroyBeam(_beamId: EntityId, _reason: string): void {
    // TODO: Implement beam destruction
  }

  private getEntityPosition(entities: Map<EntityId, Map<string, unknown>>, entityId: EntityId): Vector2D | null {
    const components = entities.get(entityId);
    if (!components) return null;
    
    const position = components.get('position') as PositionComponent;
    if (!position) return null;
    
    return { x: position.x, y: position.y };
  }

  private matchesQuery(components: Map<string, unknown>, query: Query): boolean {
    // Check all required components
    for (const componentType of query.all) {
      if (!components.has(componentType)) {
        return false;
      }
    }
    
    // Check any components (if specified)
    if (query.any.length > 0) {
      let hasAny = false;
      for (const componentType of query.any) {
        if (components.has(componentType)) {
          hasAny = true;
          break;
        }
      }
      if (!hasAny) return false;
    }
    
    // Check none components (exclusions)
    for (const componentType of query.none) {
      if (components.has(componentType)) {
        return false;
      }
    }
    
    return true;
  }

  private handleProjectileCreated(_event: unknown): void {
    // Handle projectile created event
  }

  private handleProjectileDestroyed(_event: unknown): void {
    // Handle projectile destroyed event
  }

  private handleBeamCreated(_event: unknown): void {
    // Handle beam created event
  }

  private handleBeamDestroyed(_event: unknown): void {
    // Handle beam destroyed event
  }

  private updateProjectileVisual(_visual: unknown, _position: unknown, _deltaTime: number): void {
    // TODO: Implement projectile visual updates
  }
} 