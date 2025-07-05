import { System, Query } from '../interfaces';
import { EntityId, SystemType, createSystemType, createComponentType } from '../../types/core';
import { ECSWorldImpl } from '../ECSWorld';
import { EventBusImpl } from '../../events/EventBus';
import { PositionComponent, VelocityComponent } from '../components/BaseComponents';
import { EnemyComponent, EnemyAIComponent } from '../components/EnemyComponents';
import { EnemyCollisionComponent, EnemyMovementComponent, EnemySpriteComponent } from '../components/EnemyComponents';
import { EnemySpriteManager, EnemySpriteConfig } from '../../core/EnemySpriteManager';
import { Container, Graphics } from 'pixi.js';

export class EnemySystem implements System {
  public readonly type: SystemType = createSystemType('enemy-system');
  public readonly priority: number = 5;

  private world: ECSWorldImpl;
  private eventBus: EventBusImpl;
  private spriteManager: EnemySpriteManager;
  private gameContainer: Container;
  
  // Query for different types of enemy entities
  private enemyQuery: Query = {
    with: [createComponentType('enemy'), createComponentType('position')],
    without: [],
  };

  private enemyWithHealthQuery: Query = {
    with: [createComponentType('enemy'), createComponentType('enemy-health'), createComponentType('position')],
    without: [],
  };

  private enemyWithMovementQuery: Query = {
    with: [createComponentType('enemy'), createComponentType('enemy-movement'), createComponentType('position'), createComponentType('velocity')],
    without: [],
  };

  private enemyWithAIQuery: Query = {
    with: [createComponentType('enemy'), createComponentType('enemy-ai'), createComponentType('position')],
    without: [],
  };

  private enemyWithSpriteQuery: Query = {
    with: [createComponentType('enemy'), createComponentType('enemy-sprite'), createComponentType('position')],
    without: [],
  };

  private enemyWithAnimationQuery: Query = {
    with: [createComponentType('enemy'), createComponentType('enemy-animation'), createComponentType('enemy-sprite')],
    without: [],
  };

  // System state
  private initialized: boolean = false;
  private enemyIdCounter: number = 0;
  private lastUpdate: number = 0;
  private performanceMetrics = {
    entitiesProcessed: 0,
    updateTime: 0,
    averageUpdateTime: 0,
  };

  constructor(
    world: ECSWorldImpl,
    eventBus: EventBusImpl,
    spriteManager: EnemySpriteManager,
    gameContainer: Container
  ) {
    this.world = world;
    this.eventBus = eventBus;
    this.spriteManager = spriteManager;
    this.gameContainer = gameContainer;
  }

  initialize(): void {
    if (this.initialized) return;

    console.warn('EnemySystem: Initializing...');
    this.initialized = true;
    this.lastUpdate = Date.now();

    // Register event listeners
    this.eventBus.on('enemy:create-request', this.handleCreateEnemyRequest.bind(this));
    this.eventBus.on('enemy:destroy-request', this.handleDestroyEnemyRequest.bind(this));
    this.eventBus.on('player:moved', this.handlePlayerMovement.bind(this));
    this.eventBus.on('collision:enemy-player', this.handleEnemyPlayerCollision.bind(this));
    this.eventBus.on('collision:enemy-projectile', this.handleEnemyProjectileCollision.bind(this));

    console.warn('EnemySystem: Initialized successfully');
  }

  update(deltaTime: number): void {
    if (!this.initialized) return;

    const updateStart = performance.now();
    const currentTime = Date.now();

    // Update all enemy subsystems
    this.updateEnemyHealth(deltaTime);
    this.updateEnemyMovement(deltaTime);
    this.updateEnemyAI(deltaTime, currentTime);
    this.updateEnemySprites(deltaTime);
    this.updateEnemyAnimations(deltaTime);
    this.updateEnemyCollision(deltaTime);
    this.cleanupDeadEnemies();

    // Update performance metrics
    const updateEnd = performance.now();
    this.performanceMetrics.updateTime = updateEnd - updateStart;
    this.performanceMetrics.averageUpdateTime = 
      (this.performanceMetrics.averageUpdateTime * 0.9) + 
      (this.performanceMetrics.updateTime * 0.1);

    this.lastUpdate = currentTime;
  }

  shutdown(): void {
    if (!this.initialized) return;

    console.log('EnemySystem: Shutting down...');
    
    // Remove all enemy entities
    const enemies = this.world.entityManager.query(this.enemyQuery);
    for (const enemy of enemies) {
      this.destroyEnemy(enemy.id);
    }

    // Remove event listeners
    this.eventBus.off('enemy:create-request', this.handleCreateEnemyRequest.bind(this));
    this.eventBus.off('enemy:destroy-request', this.handleDestroyEnemyRequest.bind(this));
    this.eventBus.off('player:moved', this.handlePlayerMovement.bind(this));
    this.eventBus.off('collision:enemy-player', this.handleEnemyPlayerCollision.bind(this));
    this.eventBus.off('collision:enemy-projectile', this.handleEnemyProjectileCollision.bind(this));

    this.initialized = false;
    console.log('EnemySystem: Shutdown complete');
  }

  // Public API methods
  createEnemy(
    enemyType: number,
    position: { x: number; y: number },
    customConfig?: Partial<EnemySpriteConfig>
  ): EntityId {
    const config = this.spriteManager.getEnemyConfig(enemyType);
    if (!config) {
      throw new Error(`Invalid enemy type: ${enemyType}`);
    }

    // Merge custom config if provided
    const finalConfig = { ...config, ...customConfig };

    // Create entity
    const entity = this.world.entityManager.createEntity();
    const enemyId = this.generateEnemyId();

    // Create and add components
    const enemyComponent = createEnemyComponent(enemyId, enemyType, finalConfig);
    const healthComponent = createEnemyHealthComponent(finalConfig.health);
    const movementComponent = createEnemyMovementComponent(
      finalConfig.speed,
      this.getMovementTypeForEnemy(enemyType)
    );
    const aiComponent = createEnemyAIComponent(this.getBehaviorTypeForEnemy(enemyType));
    const spriteComponent = createEnemySpriteComponent(finalConfig);
    const collisionComponent = createEnemyCollisionComponent(
      finalConfig.collisionRadius,
      finalConfig.damage
    );
    const animationComponent = createEnemyAnimationComponent();
    const eventComponent = createEnemyEventComponent();

    // Add base components
    const positionComponent: PositionComponent = {
      type: createComponentType('position'),
      x: position.x,
      y: position.y,
    };
    const velocityComponent: VelocityComponent = {
      type: createComponentType('velocity'),
      vx: 0,
      vy: 0,
    };
    const transformComponent: TransformComponent = {
      type: createComponentType('transform'),
      position: { x: position.x, y: position.y },
      scale: { x: 1, y: 1 },
      rotation: 0,
    };

    // Add all components to entity
    this.world.entityManager.addComponent(entity.id, enemyComponent);
    this.world.entityManager.addComponent(entity.id, healthComponent);
    this.world.entityManager.addComponent(entity.id, movementComponent);
    this.world.entityManager.addComponent(entity.id, aiComponent);
    this.world.entityManager.addComponent(entity.id, spriteComponent);
    this.world.entityManager.addComponent(entity.id, collisionComponent);
    this.world.entityManager.addComponent(entity.id, animationComponent);
    this.world.entityManager.addComponent(entity.id, eventComponent);
    this.world.entityManager.addComponent(entity.id, positionComponent);
    this.world.entityManager.addComponent(entity.id, velocityComponent);
    this.world.entityManager.addComponent(entity.id, transformComponent);

    // Initialize sprite
    this.initializeEnemySprite(entity.id, spriteComponent, finalConfig);

    // Add to game container
    if (spriteComponent.displayObject) {
      this.gameContainer.addChild(spriteComponent.displayObject);
    }

    // Emit creation event
    this.eventBus.emit({
      type: 'enemy:created',
      timestamp: Date.now(),
      data: {
        enemyId: entity.id,
        enemyType,
        position,
        config: finalConfig,
      }
    });

    console.log(`EnemySystem: Created enemy ${enemyId} (type ${enemyType}) at ${position.x}, ${position.y}`);

    return entity.id;
  }

  destroyEnemy(entityId: EntityId): void {
    const entity = this.world.entityManager.getEntity(entityId);
    if (!entity) return;

    // Get sprite component for cleanup
    const sprite = this.world.entityManager.getComponent<EnemySpriteComponent>(entityId, createComponentType('enemy-sprite'));

    // Remove sprite from container
    if (sprite && sprite.displayObject.parent) {
      sprite.displayObject.parent.removeChild(sprite.displayObject);
    }

    // Emit destruction event
    this.eventBus.emit({
      type: 'enemy:destroyed',
      timestamp: Date.now(),
      data: {
        enemyId: entityId,
        position: this.world.entityManager.getComponent<PositionComponent>(entityId, createComponentType('position')),
      }
    });

    // Destroy entity
    this.world.entityManager.destroyEntity(entityId);

    console.log(`EnemySystem: Destroyed enemy ${entityId}`);
  }

  // Helper methods
  private generateEnemyId(): number {
    return ++this.enemyIdCounter;
  }

  private getMovementTypeForEnemy(_enemyType: number): EnemyMovementComponent['movementType'] {
    // Based on the enemy types we saw in the code
    switch (_enemyType) {
      case 0: // Blob
      case 6: // ChompChest
        return 'hopping';
      default:
        return 'basic';
    }
  }

  private getBehaviorTypeForEnemy(_enemyType: number): EnemyAIComponent['behaviorType'] {
    // Most enemies are aggressive, but could be customized
    return 'aggressive';
  }

  private initializeEnemySprite(
    entityId: EntityId,
    spriteComponent: EnemySpriteComponent,
    config: EnemySpriteConfig
  ): void {
    try {
      // Try to load sprite from atlas
      const atlasSprite = this.spriteManager.getEnemySprite(config.spriteKey);
      
      if (atlasSprite) {
        spriteComponent.visualSprite = atlasSprite;
        spriteComponent.spriteLoaded = true;
        spriteComponent.displayObject.addChild(atlasSprite);

        this.eventBus.emit({
          type: 'enemy:sprite-loaded',
          timestamp: Date.now(),
          data: {
            enemyId: entityId,
            spriteKey: config.spriteKey,
            success: true,
          }
        });
      } else {
        // Create fallback sprite if atlas sprite not found
        this.createFallbackSprite(entityId, spriteComponent, config);
      }
    } catch (error) {
      console.warn(`EnemySystem: Failed to load sprite for enemy ${entityId}:`, error);
      this.createFallbackSprite(entityId, spriteComponent, config);
    }
  }

  private createFallbackSprite(
    entityId: EntityId,
    spriteComponent: EnemySpriteComponent,
    config: EnemySpriteConfig
  ): void {
    // Create a simple colored rectangle as fallback
    const graphics = new Graphics();
    const color = config.color || 0xff0000;
    const size = config.size || 32;

    graphics.beginFill(color);
    graphics.drawRect(-size / 2, -size / 2, size, size);
    graphics.endFill();
    
    spriteComponent.visualSprite = graphics;
    spriteComponent.fallbackCreated = true;
    spriteComponent.displayObject.addChild(graphics);

    this.eventBus.emit({
      type: 'enemy:fallback-sprite-created',
      timestamp: Date.now(),
      data: {
        enemyId: entityId,
        config,
        fallbackType: 'rectangle',
      }
    });
  }

  // Update methods - simplified for now
  private updateEnemyHealth(deltaTime: number): void {
    const enemies = this.world.entityManager.query(this.enemyWithHealthQuery);
    
    for (const enemy of enemies) {
      const health = this.world.entityManager.getComponent<EnemyHealthComponent>(
        enemy.id,
        'enemy-health' as any
      );
      const enemyComp = this.world.entityManager.getComponent<EnemyComponent>(
        enemy.id,
        'enemy' as any
      );
      
      if (!health || !enemyComp) continue;

      // Update health percentage
      health.healthPercent = health.health / health.maxHealth;

      // Handle invulnerability
      if (health.isInvulnerable) {
        health.invulnerabilityDuration -= deltaTime;
        if (health.invulnerabilityDuration <= 0) {
          health.isInvulnerable = false;
          health.invulnerabilityDuration = 0;
        }
      }

      // Check for death
      if (health.health <= 0 && enemyComp.isAlive) {
        this.handleEnemyDeath(enemy.id);
      }
    }
  }

  private updateEnemyMovement(deltaTime: number): void {
    const enemies = this.world.entityManager.query(this.enemyWithMovementQuery);
    
    for (const enemy of enemies) {
      const movement = this.world.entityManager.getComponent<EnemyMovementComponent>(
        enemy.id,
        'enemy-movement' as any
      );
      const position = this.world.entityManager.getComponent<PositionComponent>(
        enemy.id,
        'position' as any
      );
      const velocity = this.world.entityManager.getComponent<VelocityComponent>(
        enemy.id,
        'velocity' as any
      );
      
      if (!movement || !position || !velocity) continue;

      // Basic movement toward target
      const dx = movement.targetX - position.x;
      const dy = movement.targetY - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const speed = movement.speed * (deltaTime / 1000);
        velocity.vx = (dx / distance) * speed;
        velocity.vy = (dy / distance) * speed;
        
        // Update position
        position.x += velocity.vx;
        position.y += velocity.vy;
      }
    }
  }

  private updateEnemyAI(deltaTime: number, currentTime: number): void {
    const enemies = this.world.entityManager.query(this.enemyWithAIQuery);
    
    for (const enemy of enemies) {
      const ai = this.world.entityManager.getComponent<EnemyAIComponent>(
        enemy.id,
        'enemy-ai' as any
      );
      const position = this.world.entityManager.getComponent<PositionComponent>(
        enemy.id,
        'position' as any
      );
      
      if (!ai || !position) continue;

      // Update AI timers
      ai.stateTimer += deltaTime;
      
      // Check if it's time to make a decision
      if (currentTime - ai.lastDecisionTime > ai.decisionCooldown * 1000) {
        this.updateEnemyAIDecision(enemy.id, ai, position);
        ai.lastDecisionTime = currentTime;
      }
    }
  }

  private updateEnemySprites(deltaTime: number): void {
    const enemies = this.world.entityManager.query(this.enemyWithSpriteQuery);
    this.performanceMetrics.entitiesProcessed = enemies.length;

    for (const enemy of enemies) {
      const sprite = this.world.entityManager.getComponent<EnemySpriteComponent>(enemy.id, createComponentType('enemy-sprite'));
      const position = this.world.entityManager.getComponent<PositionComponent>(enemy.id, createComponentType('position'));
      
      if (!sprite || !position) continue;

      // Update sprite position
      sprite.displayObject.x = position.x;
      sprite.displayObject.y = position.y;
      sprite.displayObject.alpha = sprite.alpha;
      sprite.displayObject.visible = sprite.visible;

      // Handle flash effect
      if (sprite.flashTimer > 0) {
        sprite.flashTimer -= deltaTime;
        if (sprite.flashTimer <= 0) {
          sprite.flashTimer = 0;
          // Reset to normal appearance
          if (sprite.visualSprite) {
            sprite.visualSprite.tint = 0xffffff;
          }
        }
      }
    }
  }

  private updateEnemyAnimations(deltaTime: number): void {
    const enemies = this.world.entityManager.query(this.enemyWithAnimationQuery);
    
    for (const enemy of enemies) {
      const animation = this.world.entityManager.getComponent<EnemyAnimationComponent>(
        enemy.id,
        'enemy-animation' as any
      );
      
      if (!animation) continue;

      // Update animation timer
      if (animation.animationDuration > 0) {
        animation.animationTimer += deltaTime;
        
        if (animation.animationTimer >= animation.animationDuration) {
          if (animation.animationLoop) {
            animation.animationTimer = 0;
          }
        }
      }
    }
  }

  private updateEnemyCollision(deltaTime: number): void {
    // Basic collision update - main collision handled by collision system
    const enemies = this.world.entityManager.query({
      with: ['enemy' as any, 'enemy-collision' as any],
      without: [],
    });

    for (const enemy of enemies) {
      const collision = this.world.entityManager.getComponent<EnemyCollisionComponent>(
        enemy.id,
        'enemy-collision' as any
      );
      
      if (!collision) continue;

      // Update damage cooldown
      if (collision.damageCooldown > 0) {
        collision.damageCooldown -= deltaTime;
      }
    }
  }

  private cleanupDeadEnemies(): void {
    const enemies = this.world.entityManager.query(this.enemyQuery);
    const toDestroy: EntityId[] = [];

    for (const enemy of enemies) {
      const enemyComp = this.world.entityManager.getComponent<EnemyComponent>(
        enemy.id,
        'enemy' as any
      );
      
      if (!enemyComp || !enemyComp.isAlive) {
        const health = this.world.entityManager.getComponent<EnemyHealthComponent>(
          enemy.id,
          'enemy-health' as any
        );
        
        if (health && health.deathTime && Date.now() - health.deathTime > 1000) {
          toDestroy.push(enemy.id);
        }
      }
    }

    // Destroy dead enemies
    for (const entityId of toDestroy) {
      this.destroyEnemy(entityId);
    }
  }

  private updateEnemyAIDecision(
    entityId: EntityId,
    ai: EnemyAIComponent,
    _position: PositionComponent
  ): void {
    // Simple AI: always chase the player
    const playerQuery = this.world.entityManager.query({
      with: ['player' as any, 'position' as any],
      without: [],
    });
    
    if (playerQuery.length > 0) {
      const player = playerQuery[0];
      const playerPos = this.world.entityManager.getComponent<PositionComponent>(
        player.id,
        'position' as any
      );
      
      if (playerPos) {
        const movement = this.world.entityManager.getComponent<EnemyMovementComponent>(
          entityId,
          'enemy-movement' as any
        );
        
        if (movement) {
          movement.targetX = playerPos.x;
          movement.targetY = playerPos.y;
        }
        
        // Update AI state
        if (ai.state !== 'chasing') {
          ai.state = 'chasing';
          ai.lastStateChange = Date.now();
          ai.stateTimer = 0;
        }
      }
    }
  }

  private handleEnemyDeath(entityId: EntityId): void {
    const enemy = this.world.entityManager.getComponent<EnemyComponent>(entityId, 'enemy' as any);
    const health = this.world.entityManager.getComponent<EnemyHealthComponent>(entityId, 'enemy-health' as any);
    const position = this.world.entityManager.getComponent<PositionComponent>(entityId, 'position' as any);
    
    if (!enemy || !health || !position) return;
    
    // Mark as dead
    enemy.isAlive = false;
    health.deathTime = Date.now();
    
    // Emit death event
    this.eventBus.emit({
      type: 'enemy:died',
      timestamp: Date.now(),
      enemyId: entityId,
      enemyType: enemy.enemyType,
      name: enemy.name,
      xpAwarded: enemy.xpValue,
      position: { x: position.x, y: position.y },
      finalDamage: health.lastDamageAmount,
      totalDamageDealt: 0,
      survivalTime: Date.now() - enemy.createdAt,
    });
  }

  // Event handlers
  private handleCreateEnemyRequest(data: any): void {
    this.createEnemy(data.enemyType, data.position, data.customConfig);
  }

  private handleDestroyEnemyRequest(data: any): void {
    this.destroyEnemy(data.enemyId);
  }

  private handlePlayerMovement(data: any): void {
    // Update all enemy AI targets when player moves
    const enemies = this.world.entityManager.query(this.enemyWithAIQuery);
    
    for (const enemy of enemies) {
      const movement = this.world.entityManager.getComponent<EnemyMovementComponent>(
        enemy.id,
        'enemy-movement' as any
      );
      
      if (movement) {
        movement.targetX = data.newPosition.x;
        movement.targetY = data.newPosition.y;
      }
    }
  }

  private handleEnemyPlayerCollision(data: any): void {
    // Handle collision between enemy and player
    const enemy = this.world.entityManager.getComponent<EnemyComponent>(data.enemyId, 'enemy' as any);
    const collision = this.world.entityManager.getComponent<EnemyCollisionComponent>(data.enemyId, 'enemy-collision' as any);
    
    if (enemy && collision && collision.canDealDamage) {
      const now = Date.now();
      if (now - collision.lastDamageDealtTime > collision.damageCooldown) {
        collision.lastDamageDealtTime = now;
        
        this.eventBus.emit({
          type: 'enemy:player-collision',
          timestamp: now,
          enemyId: data.enemyId,
          enemyType: enemy.enemyType,
          playerId: data.playerId,
          damageDealt: collision.damageDealt,
          position: data.position,
        });
      }
    }
  }

  private handleEnemyProjectileCollision(data: any): void {
    // Handle collision between enemy and projectile
    const health = this.world.entityManager.getComponent<EnemyHealthComponent>(data.enemyId, 'enemy-health' as any);
    const enemy = this.world.entityManager.getComponent<EnemyComponent>(data.enemyId, 'enemy' as any);
    
    if (health && enemy) {
      const damage = data.damage || 10;
      health.health -= damage;
      health.lastDamageTime = Date.now();
      health.lastDamageAmount = damage;
      
      // Add to damage history
      health.damageHistory.push({
        amount: damage,
        time: Date.now(),
        source: 'projectile',
      });
      
      // Emit damage event
      this.eventBus.emit({
        type: 'enemy:damaged',
        timestamp: Date.now(),
        enemyId: data.enemyId,
        enemyType: enemy.enemyType,
        damage,
        remainingHealth: health.health,
        healthPercent: health.health / health.maxHealth,
        damageSource: 'projectile',
        position: data.position,
      });
      
      // Flash effect
      const sprite = this.world.entityManager.getComponent<EnemySpriteComponent>(data.enemyId, 'enemy-sprite' as any);
      if (sprite) {
        sprite.flashColor = 0xff0000; // Red flash
        sprite.flashDuration = 200; // 200ms flash
        sprite.flashTimer = sprite.flashDuration;
      }
    }
  }

  // Public getters
  getEnemyCount(): number {
    return this.world.entityManager.query(this.enemyQuery).length;
  }

  getEnemiesInRange(center: { x: number; y: number }, range: number): EntityId[] {
    const enemies = this.world.entityManager.query(this.enemyQuery);
    const result: EntityId[] = [];
    
    for (const enemy of enemies) {
      const position = this.world.entityManager.getComponent<PositionComponent>(enemy.id, 'position' as any);
      if (position) {
        const distance = Math.sqrt(
          Math.pow(position.x - center.x, 2) + Math.pow(position.y - center.y, 2)
        );
        if (distance <= range) {
          result.push(enemy.id);
        }
      }
    }
    
    return result;
  }
} 