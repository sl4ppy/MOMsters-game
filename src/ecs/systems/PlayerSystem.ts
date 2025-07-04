/* eslint-disable no-console */
import { SystemType, createSystemType } from '../../types/core';
import { System, EntityManager } from '../interfaces';
import { EventBus } from '../../events/interfaces';
import { InputManager } from '../../core/InputManager';
import {
  PLAYER_COMPONENT,
  HEALTH_COMPONENT,
  MOVEMENT_COMPONENT,
  SPRITE_COMPONENT,
  COLLISION_COMPONENT,
  INPUT_COMPONENT,
  ANIMATION_COMPONENT,
  UPGRADE_COMPONENT,
  PLAYER_EVENT_COMPONENT,
  PlayerComponent,
  HealthComponent,
  MovementComponent,
  SpriteComponent,
  CollisionComponent,
  InputComponent,
  AnimationComponent,
  UpgradeComponent,
  PlayerEventComponent,
  getPlayerPosition,
  setPlayerPosition,
  getHealthPercent,
  isPlayerAlive,
  applyHealthUpgrade,
  applySpeedUpgrade,
} from '../components/PlayerComponents';
import {
  POSITION_COMPONENT,
  VELOCITY_COMPONENT,
  PositionComponent,
  VelocityComponent,
} from '../components/BaseComponents';
import {
  PlayerEventFactory,
  PLAYER_EVENT_TYPES,
} from '../../events/PlayerEvents';
import { Graphics, Sprite, DisplayObject } from 'pixi.js';
import { Assets } from 'pixi.js';

/**
 * ECS PlayerSystem - Handles all player logic including movement, health, 
 * animation, input processing, and collision handling
 */
export class PlayerSystem implements System {
  public readonly type: SystemType = createSystemType('player');
  public readonly priority: number = 15; // After input, before rendering

  private entityManager: EntityManager;
  private eventBus: EventBus;
  private inputManager: InputManager | null = null;

  // Player entity tracking
  private playerEntities: Map<string, string> = new Map(); // playerId -> entityId

  // Sprite management
  private spriteCache: Map<string, DisplayObject> = new Map();
  private loadedTextures: Map<string, boolean> = new Map();

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;
  }

  public initialize(): void {
    console.log('🎮 Player system initialized');
    
    // Subscribe to relevant events
    this.setupEventListeners();
    
    // Preload textures
    this.preloadTextures();
  }

  public update(deltaTime: number): void {
    // Player update logic will be implemented here
  }

  public shutdown(): void {
    console.log('🎮 Player system shutdown');
    
    // Clear cached sprites
    this.spriteCache.clear();
    this.loadedTextures.clear();
    this.playerEntities.clear();
  }

  // Public API methods
  public setInputManager(inputManager: InputManager): void {
    this.inputManager = inputManager;
    console.log('🎮 Player system input manager set');
  }

  public createPlayer(
    playerId: string = 'player_1',
    playerType: 'main' | 'secondary' | 'ai' = 'main',
    position: { x: number; y: number } = { x: 0, y: 0 },
    characterDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man' = 'hexagon'
  ): string {
    // Create entity
    const entity = this.entityManager.createEntity();
    
    // Create display object for the player
    const displayObject = this.createPlayerSprite(characterDesign);
    displayObject.x = position.x;
    displayObject.y = position.y;
    
    // Add all player components
    this.entityManager.addComponent(entity.id, {
      type: PLAYER_COMPONENT,
      playerId,
      isAlive: true,
      level: 1,
      experience: 0,
      playerType,
      characterDesign,
      killCount: 0,
      survivalTime: 0,
    } as PlayerComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: HEALTH_COMPONENT,
      health: 100,
      maxHealth: 100,
      baseMaxHealth: 100,
      regenRate: 0.5,
      baseRegenRate: 0.5,
      regenDelay: 5,
      timeSinceLastDamage: 0,
      invulnerabilityTimer: 0,
      invulnerabilityDuration: 60,
      isInvulnerable: false,
      isDead: false,
      damageTaken: 0,
      damageDealt: 0,
    } as HealthComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: MOVEMENT_COMPONENT,
      speed: 200,
      baseSpeed: 200,
      worldBounds: { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000 },
      isMoving: false,
      lastMoveDirection: { x: 0, y: 0 },
      speedMultiplier: 1.0,
      isFrozen: false,
      friction: 0.8,
      acceleration: 1.0,
    } as MovementComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: SPRITE_COMPONENT,
      displayObject,
      currentDesign: characterDesign,
      availableDesigns: ['hexagon', 'circle', 'godzilla', 'shark_man'],
      animationTime: 0,
      animationSpeed: 1.0,
      glowIntensity: 0.5,
      pulseRate: 1.0,
      facingDirection: 0,
      flipX: false,
      isVisible: true,
      alpha: 1.0,
    } as SpriteComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: POSITION_COMPONENT,
      x: position.x,
      y: position.y,
    } as PositionComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: VELOCITY_COMPONENT,
      vx: 0,
      vy: 0,
    } as VelocityComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: INPUT_COMPONENT,
      inputEnabled: true,
      keyBindings: {
        moveUp: 'ArrowUp',
        moveDown: 'ArrowDown',
        moveLeft: 'ArrowLeft',
        moveRight: 'ArrowRight',
        switchDesign: ['KeyC', 'KeyH', 'KeyG'],
        debug: ['KeyT'],
      },
      processMovement: true,
      processActions: true,
      inputHistory: [],
    } as InputComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: ANIMATION_COMPONENT,
      currentAnimation: 'idle',
      animationTime: 0,
      animationSpeed: 1.0,
      animationQueue: [],
      isAnimating: false,
      repeatCount: 0,
      effectsEnabled: true,
      particleEffects: [],
    } as AnimationComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: UPGRADE_COMPONENT,
      healthBonus: 0,
      regenBonus: 0,
      speedBonus: 0,
      damageReduction: 0,
      invulnerabilityBonus: 0,
      damageBonus: 0,
      criticalChance: 0,
      experienceBonus: 0,
      dropRateBonus: 0,
      totalUpgrades: 0,
      upgradePoints: 0,
    } as UpgradeComponent);
    
    this.entityManager.addComponent(entity.id, {
      type: PLAYER_EVENT_COMPONENT,
      eventHistory: [],
      eventsEnabled: true,
      logEvents: false,
    } as PlayerEventComponent);
    
    // Track this player
    this.playerEntities.set(playerId, entity.id);
    
    // Emit player created event
    this.eventBus.emit(
      PlayerEventFactory.createPlayerCreated(playerId, playerType, entity.id, position)
    );
    
    console.log(`✅ Created player: ${playerId} (${entity.id})`);
    return entity.id;
  }

  public getPlayer(playerId: string): string | null {
    return this.playerEntities.get(playerId) || null;
  }

  public getAllPlayers(): Array<{ playerId: string; entityId: string }> {
    return Array.from(this.playerEntities.entries()).map(([playerId, entityId]) => ({
      playerId,
      entityId,
    }));
  }

  public damagePlayer(
    entityId: string,
    damage: number,
    damageSource: string | null = null,
    damageType: 'collision' | 'projectile' | 'environment' | 'other' = 'other'
  ): boolean {
    const health = this.entityManager.getComponent<HealthComponent>(entityId as any, HEALTH_COMPONENT);
    const player = this.entityManager.getComponent<PlayerComponent>(entityId as any, PLAYER_COMPONENT);
    
    if (!health || !player || health.isDead) return false;
    
    // Check invulnerability
    if (health.isInvulnerable || health.invulnerabilityTimer > 0) {
      console.log(`🛡️ Player ${player.playerId} is invulnerable, damage blocked`);
      return false;
    }
    
    // Apply damage
    const previousHealth = health.health;
    health.health = Math.max(0, health.health - damage);
    health.timeSinceLastDamage = 0;
    health.damageTaken += damage;
    
    // Start invulnerability
    health.invulnerabilityTimer = health.invulnerabilityDuration;
    health.isInvulnerable = true;
    
    // Check if player died
    if (health.health <= 0) {
      health.isDead = true;
      player.isAlive = false;
      
      // Emit death event
      const position = getPlayerPosition(
        this.entityManager.getComponent<SpriteComponent>(entityId as any, SPRITE_COMPONENT)!
      );
      
      this.eventBus.emit(
        PlayerEventFactory.createPlayerDied(
          player.playerId,
          entityId as any,
          damageType === 'collision' ? 'enemy' : damageType,
          position,
          player.survivalTime,
          player.killCount,
          player.experience
        )
      );
    } else {
      // Emit damage event
      this.eventBus.emit(
        PlayerEventFactory.createPlayerDamaged(
          player.playerId,
          entityId as any,
          damage,
          health.health,
          health.maxHealth,
          damageSource as any,
          damageType,
          health.isInvulnerable
        )
      );
      
      // Emit health changed event
      this.eventBus.emit(
        PlayerEventFactory.createPlayerHealthChanged(
          player.playerId,
          entityId as any,
          health.health,
          health.maxHealth,
          previousHealth,
          'damage'
        )
      );
    }
    
    return true;
  }

  public healPlayer(
    entityId: string,
    healAmount: number,
    healType: 'regen' | 'pickup' | 'ability' | 'other' = 'other'
  ): boolean {
    const health = this.entityManager.getComponent<HealthComponent>(entityId as any, HEALTH_COMPONENT);
    const player = this.entityManager.getComponent<PlayerComponent>(entityId as any, PLAYER_COMPONENT);
    
    if (!health || !player || health.isDead) return false;
    
    // Apply healing
    const previousHealth = health.health;
    health.health = Math.min(health.maxHealth, health.health + healAmount);
    
    const actualHeal = health.health - previousHealth;
    if (actualHeal > 0) {
      // Emit heal event
      this.eventBus.emit(
        PlayerEventFactory.createPlayerHealed(
          player.playerId,
          entityId as any,
          actualHeal,
          health.health,
          health.maxHealth,
          healType
        )
      );
      
      // Emit health changed event
      this.eventBus.emit(
        PlayerEventFactory.createPlayerHealthChanged(
          player.playerId,
          entityId as any,
          health.health,
          health.maxHealth,
          previousHealth,
          'heal'
        )
      );
      
      return true;
    }
    
    return false;
  }

  public switchPlayerDesign(
    entityId: string,
    newDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man'
  ): void {
    const sprite = this.entityManager.getComponent<SpriteComponent>(entityId as any, SPRITE_COMPONENT);
    const player = this.entityManager.getComponent<PlayerComponent>(entityId as any, PLAYER_COMPONENT);
    
    if (!sprite || !player) return;
    
    const previousDesign = sprite.currentDesign;
    if (previousDesign === newDesign) return;
    
    // Store current position
    const currentPosition = getPlayerPosition(sprite);
    
    // Create new sprite
    const newSprite = this.createPlayerSprite(newDesign);
    setPlayerPosition({ displayObject: newSprite } as SpriteComponent, currentPosition.x, currentPosition.y);
    
    // Replace the display object
    const parent = sprite.displayObject.parent;
    if (parent) {
      parent.removeChild(sprite.displayObject);
      parent.addChild(newSprite);
    }
    
    // Update component
    sprite.displayObject = newSprite;
    sprite.currentDesign = newDesign;
    player.characterDesign = newDesign;
    
    // Emit design changed event
    this.eventBus.emit(
      PlayerEventFactory.createPlayerDesignChanged(
        player.playerId,
        entityId as any,
        newDesign,
        previousDesign
      )
    );
    
    console.log(`🎨 Player ${player.playerId} switched design: ${previousDesign} → ${newDesign}`);
  }

  // Private methods
  private setupEventListeners(): void {
    // Listen for collision events
    this.eventBus.on('collision:player_enemy', (event: any) => {
      // Handle player-enemy collision
      const playerEntityId = event.data.playerEntityId;
      const enemyEntityId = event.data.enemyEntityId;
      
      // Apply damage to player
      this.damagePlayer(playerEntityId, 10, enemyEntityId, 'collision');
    });
    
    // Listen for experience pickup events
    this.eventBus.on('pickup:experience', (event: any) => {
      const playerEntityId = event.data.playerEntityId;
      const experienceAmount = event.data.amount;
      
      this.addExperience(playerEntityId, experienceAmount);
    });
  }

  private preloadTextures(): void {
    // Preload common textures
    this.loadTexture('godzilla', '/sprites/godzilla_small.png');
    this.loadTexture('shark_man', '/sprites/shark-man.png');
  }

  private async loadTexture(name: string, path: string): Promise<void> {
    try {
      const texture = await Assets.load(import.meta.env.BASE_URL + path);
      this.loadedTextures.set(name, true);
      console.log(`✅ Loaded texture: ${name}`);
    } catch (error) {
      console.warn(`⚠️ Failed to load texture ${name}:`, error);
      this.loadedTextures.set(name, false);
    }
  }

  private createPlayerSprite(design: 'hexagon' | 'circle' | 'godzilla' | 'shark_man'): DisplayObject {
    const cacheKey = `player_${design}`;
    
    // Check cache first
    if (this.spriteCache.has(cacheKey)) {
      const cached = this.spriteCache.get(cacheKey)!;
      // Create a new instance based on the cached one
      if (cached instanceof Sprite) {
        const newSprite = new Sprite(cached.texture);
        newSprite.width = cached.width;
        newSprite.height = cached.height;
        newSprite.anchor.set(0.5, 0.5);
        return newSprite;
      }
    }
    
    let sprite: DisplayObject;
    
    if ((design === 'godzilla' || design === 'shark_man') && this.loadedTextures.get(design)) {
      // Use bitmap sprite if texture is loaded
      const textureKey = design === 'godzilla' ? 'godzilla_small' : 'shark-man';
      sprite = this.createBitmapSprite(textureKey);
    } else {
      // Use graphics sprite
      sprite = this.createGraphicsSprite(design);
    }
    
    // Cache the sprite
    this.spriteCache.set(cacheKey, sprite);
    
    return sprite;
  }

  private createBitmapSprite(textureName: string): Sprite {
    // This would need the actual texture from Assets
    // For now, create a placeholder
    const sprite = new Sprite();
    sprite.width = 64;
    sprite.height = 64;
    sprite.anchor.set(0.5, 0.5);
    return sprite;
  }

  private createGraphicsSprite(design: 'hexagon' | 'circle' | 'godzilla' | 'shark_man'): Graphics {
    const graphics = new Graphics();
    
    switch (design) {
      case 'hexagon':
        this.createHexagonCharacter(graphics);
        break;
      case 'circle':
        this.createCircleCharacter(graphics);
        break;
      case 'godzilla':
      case 'shark_man':
        this.createSharkManCharacter(graphics);
        break;
    }
    
    return graphics;
  }

  private createHexagonCharacter(graphics: Graphics): void {
    graphics.clear();
    
    // Main body (hexagon shape)
    graphics.beginFill(0x4a90e2);
    graphics.drawPolygon([-24, -16, 24, -16, 30, 0, 24, 16, -24, 16, -30, 0]);
    graphics.endFill();
    
    // Inner body highlight
    graphics.beginFill(0x5ba0f2);
    graphics.drawPolygon([-16, -12, 16, -12, 20, 0, 16, 12, -16, 12, -20, 0]);
    graphics.endFill();
    
    // Core/energy center
    graphics.beginFill(0xffffff);
    graphics.drawCircle(0, 0, 8);
    graphics.endFill();
    
    // Core glow
    graphics.beginFill(0x7bb3ff, 0.6);
    graphics.drawCircle(0, 0, 12);
    graphics.endFill();
    
    // Direction indicator (eye)
    graphics.beginFill(0x2c3e50);
    graphics.drawCircle(12, -4, 4);
    graphics.endFill();
    
    // Eye highlight
    graphics.beginFill(0xffffff);
    graphics.drawCircle(14, -6, 2);
    graphics.endFill();
  }

  private createCircleCharacter(graphics: Graphics): void {
    graphics.clear();
    
    // Main body
    graphics.beginFill(0x00ff88);
    graphics.drawCircle(0, 0, 30);
    graphics.endFill();
    
    // Inner glow
    graphics.beginFill(0x00ffaa, 0.5);
    graphics.drawCircle(0, 0, 24);
    graphics.endFill();
    
    // Core
    graphics.beginFill(0xffffff);
    graphics.drawCircle(0, 0, 12);
    graphics.endFill();
    
    // Direction indicator
    graphics.beginFill(0x008844);
    graphics.drawCircle(16, 0, 6);
    graphics.endFill();
    
    // Highlight
    graphics.beginFill(0xffffff);
    graphics.drawCircle(18, -2, 2);
    graphics.endFill();
  }

  private createSharkManCharacter(graphics: Graphics): void {
    graphics.clear();
    
    // Shark body (blue-gray)
    graphics.beginFill(0x4a7c8a);
    graphics.drawEllipse(0, 0, 20, 28);
    graphics.endFill();
    
    // Shark fin
    graphics.beginFill(0x2c5a6a);
    graphics.drawPolygon([-8, -20, 0, -28, 8, -20]);
    graphics.endFill();
    
    // Eyes
    graphics.beginFill(0xffffff);
    graphics.drawCircle(-8, -8, 4);
    graphics.drawCircle(8, -8, 4);
    graphics.endFill();
    
    // Pupils
    graphics.beginFill(0x000000);
    graphics.drawCircle(-8, -8, 2);
    graphics.drawCircle(8, -8, 2);
    graphics.endFill();
  }

  private updatePlayers(deltaTime: number): void {
    // Get all player entities
    const playerEntities = this.entityManager.query({
      with: [PLAYER_COMPONENT, POSITION_COMPONENT, VELOCITY_COMPONENT, MOVEMENT_COMPONENT, SPRITE_COMPONENT],
    });

    for (const entity of playerEntities) {
      this.updatePlayerMovement(entity.id, deltaTime);
      this.updatePlayerInput(entity.id);
      this.updatePlayerPhysics(entity.id, deltaTime);
    }
  }

  private updatePlayerMovement(entityId: string, deltaTime: number): void {
    const movement = this.entityManager.getComponent<MovementComponent>(entityId as any, MOVEMENT_COMPONENT);
    const position = this.entityManager.getComponent<PositionComponent>(entityId as any, POSITION_COMPONENT);
    const velocity = this.entityManager.getComponent<VelocityComponent>(entityId as any, VELOCITY_COMPONENT);
    const sprite = this.entityManager.getComponent<SpriteComponent>(entityId as any, SPRITE_COMPONENT);
    
    if (!movement || !position || !velocity || !sprite) return;
    
    // Calculate movement based on velocity
    const moveSpeed = movement.speed * movement.speedMultiplier * (deltaTime / 1000);
    
    const previousPosition = { x: position.x, y: position.y };
    
    // Apply velocity
    position.x += velocity.vx * moveSpeed;
    position.y += velocity.vy * moveSpeed;
    
    // Apply world bounds
    position.x = Math.max(movement.worldBounds.minX, Math.min(movement.worldBounds.maxX, position.x));
    position.y = Math.max(movement.worldBounds.minY, Math.min(movement.worldBounds.maxY, position.y));
    
    // Update sprite position
    setPlayerPosition(sprite, position.x, position.y);
    
    // Check if player moved
    const moved = Math.abs(position.x - previousPosition.x) > 0.1 || Math.abs(position.y - previousPosition.y) > 0.1;
    
    if (moved) {
      movement.isMoving = true;
      movement.lastMoveDirection = { x: velocity.vx, y: velocity.vy };
      
      // Emit movement event
      const player = this.entityManager.getComponent<PlayerComponent>(entityId as any, PLAYER_COMPONENT);
      if (player) {
        this.eventBus.emit(
          PlayerEventFactory.createPlayerMoved(
            player.playerId,
            entityId as any,
            { x: position.x, y: position.y },
            previousPosition,
            { x: velocity.vx, y: velocity.vy },
            movement.speed
          )
        );
      }
    } else {
      movement.isMoving = false;
    }
  }

  private updatePlayerInput(entityId: string): void {
    if (!this.inputManager) return;
    
    const input = this.entityManager.getComponent<InputComponent>(entityId as any, INPUT_COMPONENT);
    const velocity = this.entityManager.getComponent<VelocityComponent>(entityId as any, VELOCITY_COMPONENT);
    const player = this.entityManager.getComponent<PlayerComponent>(entityId as any, PLAYER_COMPONENT);
    
    if (!input || !velocity || !player || !input.inputEnabled) return;
    
    const inputState = this.inputManager.getInputState();
    
    // Reset velocity
    velocity.vx = 0;
    velocity.vy = 0;
    
    // Process movement input
    if (input.processMovement) {
      if (inputState.left) velocity.vx -= 1;
      if (inputState.right) velocity.vx += 1;
      if (inputState.up) velocity.vy -= 1;
      if (inputState.down) velocity.vy += 1;
      
      // Normalize diagonal movement
      if (velocity.vx !== 0 && velocity.vy !== 0) {
        const normalizer = Math.sqrt(2) / 2;
        velocity.vx *= normalizer;
        velocity.vy *= normalizer;
      }
    }
    
    // Process action input
    if (input.processActions) {
      // Character design switching
      if (this.inputManager.isKeyJustPressed('KeyC')) {
        this.switchPlayerDesign(entityId, 'circle');
      } else if (this.inputManager.isKeyJustPressed('KeyH')) {
        this.switchPlayerDesign(entityId, 'hexagon');
      } else if (this.inputManager.isKeyJustPressed('KeyG')) {
        this.switchPlayerDesign(entityId, 'godzilla');
      }
    }
  }

  private updatePlayerPhysics(entityId: string, deltaTime: number): void {
    const sprite = this.entityManager.getComponent<SpriteComponent>(entityId as any, SPRITE_COMPONENT);
    const velocity = this.entityManager.getComponent<VelocityComponent>(entityId as any, VELOCITY_COMPONENT);
    
    if (!sprite || !velocity) return;
    
    // Update sprite orientation based on movement
    if (velocity.vx !== 0) {
      sprite.flipX = velocity.vx < 0;
      sprite.facingDirection = velocity.vx > 0 ? 0 : Math.PI;
    }
    
    // Update animation time
    sprite.animationTime += deltaTime;
  }

  private updateHealthRegeneration(deltaTime: number): void {
    const healthEntities = this.entityManager.query({
      with: [PLAYER_COMPONENT, HEALTH_COMPONENT],
    });

    for (const entity of healthEntities) {
      const health = this.entityManager.getComponent<HealthComponent>(entity.id, HEALTH_COMPONENT);
      const player = this.entityManager.getComponent<PlayerComponent>(entity.id, PLAYER_COMPONENT);
      
      if (!health || !player || health.isDead) continue;
      
      // Update time since last damage
      health.timeSinceLastDamage += deltaTime / 1000;
      
      // Check if regeneration should start
      if (health.timeSinceLastDamage >= health.regenDelay && health.health < health.maxHealth) {
        const regenAmount = health.regenRate * (deltaTime / 1000);
        const previousHealth = health.health;
        
        health.health = Math.min(health.maxHealth, health.health + regenAmount);
        
        if (health.health > previousHealth) {
          // Emit heal event
          this.eventBus.emit(
            PlayerEventFactory.createPlayerHealed(
              player.playerId,
              entity.id as any,
              health.health - previousHealth,
              health.health,
              health.maxHealth,
              'regen'
            )
          );
        }
      }
    }
  }

  private updateAnimations(deltaTime: number): void {
    const animationEntities = this.entityManager.query({
      with: [PLAYER_COMPONENT, ANIMATION_COMPONENT, SPRITE_COMPONENT],
    });

    for (const entity of animationEntities) {
      const animation = this.entityManager.getComponent<AnimationComponent>(entity.id, ANIMATION_COMPONENT);
      const sprite = this.entityManager.getComponent<SpriteComponent>(entity.id, SPRITE_COMPONENT);
      
      if (!animation || !sprite) continue;
      
      // Update animation time
      animation.animationTime += deltaTime;
      
      // Apply visual effects
      if (animation.effectsEnabled) {
        this.updateVisualEffects(sprite, animation, deltaTime);
      }
    }
  }

  private updateVisualEffects(sprite: SpriteComponent, animation: AnimationComponent, deltaTime: number): void {
    // Apply glow/pulse effect
    const pulseValue = Math.sin(animation.animationTime * 0.01 * sprite.pulseRate) * 0.5 + 0.5;
    const glowAlpha = sprite.glowIntensity * pulseValue;
    
    // Update sprite alpha for effects
    sprite.displayObject.alpha = sprite.alpha;
  }

  private updateInvulnerability(deltaTime: number): void {
    const healthEntities = this.entityManager.query({
      with: [PLAYER_COMPONENT, HEALTH_COMPONENT],
    });

    for (const entity of healthEntities) {
      const health = this.entityManager.getComponent<HealthComponent>(entity.id, HEALTH_COMPONENT);
      const player = this.entityManager.getComponent<PlayerComponent>(entity.id, PLAYER_COMPONENT);
      
      if (!health || !player) continue;
      
      // Update invulnerability timer
      if (health.invulnerabilityTimer > 0) {
        health.invulnerabilityTimer -= deltaTime;
        
        if (health.invulnerabilityTimer <= 0) {
          health.isInvulnerable = false;
          
          // Emit invulnerability ended event
          this.eventBus.emit({
            type: PLAYER_EVENT_TYPES.INVULNERABILITY_ENDED,
            timestamp: Date.now(),
            entityId: entity.id as any,
            data: {
              playerId: player.playerId,
              entityId: entity.id as any,
              timestamp: Date.now(),
            },
          });
        }
      }
    }
  }

  private updatePlayerStats(deltaTime: number): void {
    const playerEntities = this.entityManager.query({
      with: [PLAYER_COMPONENT],
    });

    for (const entity of playerEntities) {
      const player = this.entityManager.getComponent<PlayerComponent>(entity.id, PLAYER_COMPONENT);
      
      if (!player || !player.isAlive) continue;
      
      // Update survival time
      player.survivalTime += deltaTime / 1000;
    }
  }

  private addExperience(entityId: string, amount: number): void {
    const player = this.entityManager.getComponent<PlayerComponent>(entityId as any, PLAYER_COMPONENT);
    
    if (!player) return;
    
    const previousLevel = player.level;
    player.experience += amount;
    
    // Simple level calculation
    const newLevel = Math.floor(player.experience / 100) + 1;
    
    if (newLevel > previousLevel) {
      player.level = newLevel;
      
      // Emit level up event
      this.eventBus.emit(
        PlayerEventFactory.createPlayerLevelUp(
          player.playerId,
          entityId as any,
          newLevel,
          previousLevel,
          player.experience,
          1 // upgrade points gained
        )
      );
    }
  }
} 