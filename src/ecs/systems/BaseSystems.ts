import { SystemType, createSystemType } from '../../types/core';
import { System, EntityManager } from '../interfaces';
import { 
  POSITION_COMPONENT, 
  VELOCITY_COMPONENT, 
  RENDER_COMPONENT, 
  MOVEMENT_COMPONENT,
  TRANSFORM_COMPONENT,
  PositionComponent,
  VelocityComponent,
  RenderComponent,
  MovementComponent,
  TransformComponent,
} from '../components/BaseComponents';

/**
 * Base system types for common game functionality
 */

// Movement system - handles entities with position and velocity
export class MovementSystem implements System {
  public readonly type: SystemType = createSystemType('movement');
  public readonly priority: number = 10;
  
  private entityManager: EntityManager;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public initialize(): void {
    console.log('🚀 Movement system initialized');
  }

  public update(deltaTime: number): void {
    // Query entities with position and velocity components
    const entities = this.entityManager.query({
      with: [POSITION_COMPONENT, VELOCITY_COMPONENT],
    });

    for (const entity of entities) {
      const position = this.entityManager.getComponent<PositionComponent>(
        entity.id,
        POSITION_COMPONENT
      );
      const velocity = this.entityManager.getComponent<VelocityComponent>(
        entity.id,
        VELOCITY_COMPONENT
      );

      if (position && velocity) {
        // Update position based on velocity
        position.x += velocity.vx * deltaTime * 0.001; // Convert to seconds
        position.y += velocity.vy * deltaTime * 0.001;
        if (position.z !== undefined && velocity.vz !== undefined) {
          position.z += velocity.vz * deltaTime * 0.001;
        }
      }
    }
  }

  public shutdown(): void {
    console.log('🛑 Movement system shutdown');
  }
}

// Render system - handles entities with transform and render components
export class RenderSystem implements System {
  public readonly type: SystemType = createSystemType('render');
  public readonly priority: number = 100; // Render last
  
  private entityManager: EntityManager;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public initialize(): void {
    console.log('🚀 Render system initialized');
  }

  public update(_deltaTime: number): void {
    // Query entities with transform and render components
    const entities = this.entityManager.query({
      with: [TRANSFORM_COMPONENT, RENDER_COMPONENT],
    });

    for (const entity of entities) {
      const transform = this.entityManager.getComponent<TransformComponent>(
        entity.id,
        TRANSFORM_COMPONENT
      );
      const render = this.entityManager.getComponent<RenderComponent>(
        entity.id,
        RENDER_COMPONENT
      );

      if (transform && render && render.sprite) {
        // Update sprite properties from transform
        render.sprite.x = transform.position.x;
        render.sprite.y = transform.position.y;
        render.sprite.rotation = transform.rotation;
        render.sprite.scale.x = transform.scale.x;
        render.sprite.scale.y = transform.scale.y;
        render.sprite.visible = render.visible;
        
        if (render.tint !== undefined) {
          render.sprite.tint = render.tint;
        }
      }
    }
  }

  public shutdown(): void {
    console.log('🛑 Render system shutdown');
  }
}

// Physics system - handles entities with movement components
export class PhysicsSystem implements System {
  public readonly type: SystemType = createSystemType('physics');
  public readonly priority: number = 5; // Update before movement
  
  private entityManager: EntityManager;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public initialize(): void {
    console.log('🚀 Physics system initialized');
  }

  public update(deltaTime: number): void {
    // Query entities with movement components
    const entities = this.entityManager.query({
      with: [MOVEMENT_COMPONENT, VELOCITY_COMPONENT],
    });

    const deltaSeconds = deltaTime * 0.001;

    for (const entity of entities) {
      const movement = this.entityManager.getComponent<MovementComponent>(
        entity.id,
        MOVEMENT_COMPONENT
      );
      const velocity = this.entityManager.getComponent<VelocityComponent>(
        entity.id,
        VELOCITY_COMPONENT
      );

      if (movement && velocity) {
        // Apply movement direction to velocity
        velocity.vx = movement.direction.x * movement.speed;
        velocity.vy = movement.direction.y * movement.speed;

        // Apply acceleration if present
        if (movement.acceleration) {
          const accel = movement.acceleration * deltaSeconds;
          velocity.vx += movement.direction.x * accel;
          velocity.vy += movement.direction.y * accel;
        }

        // Apply drag if present
        if (movement.drag) {
          const drag = movement.drag * deltaSeconds;
          velocity.vx *= (1 - drag);
          velocity.vy *= (1 - drag);
        }
      }
    }
  }

  public shutdown(): void {
    console.log('🛑 Physics system shutdown');
  }
}

// Transform synchronization system - syncs position component with transform component
export class TransformSyncSystem implements System {
  public readonly type: SystemType = createSystemType('transform_sync');
  public readonly priority: number = 15; // After movement, before render
  
  private entityManager: EntityManager;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public initialize(): void {
    console.log('🚀 Transform sync system initialized');
  }

  public update(_deltaTime: number): void {
    // Query entities with both position and transform components
    const entities = this.entityManager.query({
      with: [POSITION_COMPONENT, TRANSFORM_COMPONENT],
    });

    for (const entity of entities) {
      const position = this.entityManager.getComponent<PositionComponent>(
        entity.id,
        POSITION_COMPONENT
      );
      const transform = this.entityManager.getComponent<TransformComponent>(
        entity.id,
        TRANSFORM_COMPONENT
      );

      if (position && transform) {
        // Sync position component to transform
        transform.position.x = position.x;
        transform.position.y = position.y;
        if (position.z !== undefined) {
          transform.position.z = position.z;
        }
      }
    }
  }

  public shutdown(): void {
    console.log('🛑 Transform sync system shutdown');
  }
} 