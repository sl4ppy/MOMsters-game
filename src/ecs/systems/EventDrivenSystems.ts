/* eslint-disable no-console */
import { SystemType, createSystemType } from '../../types/core';
import { System, EntityManager } from '../interfaces';
import { EventBus, EventSubscription, EventPriority } from '../../events/interfaces';
import {
  PlayerDamagedEvent,
  PlayerDeathEvent,
  EnemyDeathEvent,
  ExperienceGainedEvent,
  CollisionStartEvent,
  EVENT_TYPES,
  GameEventFactory,
} from '../../events/GameEvents';
import {
  HEALTH_COMPONENT,
  POSITION_COMPONENT,
  HealthComponent,
  PositionComponent,
} from '../components/BaseComponents';

/**
 * Event-driven systems that integrate ECS with EventBus
 */

// Health system that responds to damage and healing events
export class HealthSystem implements System {
  public readonly type: SystemType = createSystemType('health');
  public readonly priority: number = 20;

  private entityManager: EntityManager;
  private eventBus: EventBus;
  private subscriptions: EventSubscription[] = [];

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;
  }

  public initialize(): void {
    console.log('🚀 Health system initialized');

    // Subscribe to damage events
    this.subscriptions.push(
      this.eventBus.on<PlayerDamagedEvent>(
        EVENT_TYPES.PLAYER_DAMAGED,
        this.handlePlayerDamaged.bind(this),
        EventPriority.HIGH
      )
    );

    // Subscribe to enemy damage events
    this.subscriptions.push(
      this.eventBus.on(
        EVENT_TYPES.ENEMY_DAMAGED,
        this.handleEnemyDamaged.bind(this),
        EventPriority.HIGH
      )
    );
  }

  public update(_deltaTime: number): void {
    // Handle health regeneration
    const entitiesWithHealth = this.entityManager.query({
      with: [HEALTH_COMPONENT],
    });

    for (const entity of entitiesWithHealth) {
      const health = this.entityManager.getComponent<HealthComponent>(entity.id, HEALTH_COMPONENT);

      if (health && health.regeneration && health.current < health.max) {
        health.current = Math.min(health.max, health.current + health.regeneration);
      }
    }
  }

  public shutdown(): void {
    console.log('🛑 Health system shutdown');

    // Unsubscribe from all events
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];
  }

  private handlePlayerDamaged(event: PlayerDamagedEvent): void {
    const health = this.entityManager.getComponent<HealthComponent>(
      event.data.playerId,
      HEALTH_COMPONENT
    );

    if (health) {
      health.current = Math.max(0, health.current - event.data.damage);

      // Check if player died
      if (health.current <= 0) {
        this.eventBus.emitEvent(
          EVENT_TYPES.PLAYER_DEATH,
          {
            playerId: event.data.playerId,
            killer: event.data.source,
            deathCause: event.data.damageType || 'unknown',
          },
          event.data.playerId
        );
      }
    }
  }

  private handleEnemyDamaged(event: any): void {
    const health = this.entityManager.getComponent<HealthComponent>(
      event.data.enemyId as any,
      HEALTH_COMPONENT
    );

    if (health) {
      health.current = Math.max(0, health.current - event.data.damage);

      // Check if enemy died
      if (health.current <= 0) {
        // Create enemy death event with dummy data
        const position = this.entityManager.getComponent<PositionComponent>(
          event.data.enemyId as any,
          POSITION_COMPONENT
        );

        this.eventBus.emit(
          GameEventFactory.createEnemyDeath(
            event.data.enemyId as any,
            undefined,
            'unknown',
            position ? { x: position.x, y: position.y } : { x: 0, y: 0 },
            10
          )
        );
      }
    }
  }
}

// Experience system that handles XP gain and leveling
export class ExperienceSystem implements System {
  public readonly type: SystemType = createSystemType('experience');
  public readonly priority: number = 30;

  private entityManager: EntityManager;
  private eventBus: EventBus;
  private subscriptions: EventSubscription[] = [];
  private playerExperience: Map<string, { current: number; level: number }> = new Map();

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;
  }

  public initialize(): void {
    console.log('🚀 Experience system initialized');

    // Subscribe to enemy death events for XP rewards
    this.subscriptions.push(
      this.eventBus.on<EnemyDeathEvent>(
        EVENT_TYPES.ENEMY_DEATH,
        this.handleEnemyDeath.bind(this),
        EventPriority.NORMAL
      )
    );

    // Subscribe to experience gained events
    this.subscriptions.push(
      this.eventBus.on<ExperienceGainedEvent>(
        EVENT_TYPES.EXPERIENCE_GAINED,
        this.handleExperienceGained.bind(this),
        EventPriority.NORMAL
      )
    );
  }

  public update(_deltaTime: number): void {
    // Experience system doesn't need constant updates
    // It responds to events instead
  }

  public shutdown(): void {
    console.log('🛑 Experience system shutdown');

    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];
  }

  private handleEnemyDeath(event: EnemyDeathEvent): void {
    // Award experience to killer (assumed to be player for now)
    if (event.data.killer) {
      this.eventBus.emitEvent(
        EVENT_TYPES.EXPERIENCE_GAINED,
        {
          entityId: event.data.killer,
          amount: event.data.experienceReward,
          source: 'enemy_kill',
          totalExperience: 0, // Will be calculated in handler
        },
        event.data.killer
      );
    }
  }

  private handleExperienceGained(event: ExperienceGainedEvent): void {
    const playerId = event.data.entityId.toString();

    // Get or create player experience data
    let playerXP = this.playerExperience.get(playerId);
    if (!playerXP) {
      playerXP = { current: 0, level: 1 };
      this.playerExperience.set(playerId, playerXP);
    }

    // Add experience
    playerXP.current += event.data.amount;

    // Check for level up (simple formula: level * 100 XP needed)
    const xpNeededForNextLevel = playerXP.level * 100;
    if (playerXP.current >= xpNeededForNextLevel) {
      playerXP.level++;
      playerXP.current -= xpNeededForNextLevel;

      // Emit level up event
      this.eventBus.emitEvent(
        EVENT_TYPES.PLAYER_LEVELUP,
        {
          playerId: event.data.entityId,
          newLevel: playerXP.level,
          experienceGained: event.data.amount,
          totalExperience: playerXP.current,
        },
        event.data.entityId
      );
    }
  }
}

// Collision system that handles collision events and responses
export class CollisionEventSystem implements System {
  public readonly type: SystemType = createSystemType('collision_events');
  public readonly priority: number = 15;

  private entityManager: EntityManager;
  private eventBus: EventBus;
  private subscriptions: EventSubscription[] = [];

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;
  }

  public initialize(): void {
    console.log('🚀 Collision event system initialized');

    // Subscribe to collision start events
    this.subscriptions.push(
      this.eventBus.on<CollisionStartEvent>(
        EVENT_TYPES.COLLISION_START,
        this.handleCollisionStart.bind(this),
        EventPriority.HIGH
      )
    );
  }

  public update(_deltaTime: number): void {
    // This system is purely event-driven
    // Collision detection would be handled by a separate physics system
  }

  public shutdown(): void {
    console.log('🛑 Collision event system shutdown');

    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];
  }

  private handleCollisionStart(event: CollisionStartEvent): void {
    const { entityA, entityB } = event.data;

    // Example: Handle player-enemy collision
    // In a real game, you'd check entity types/components
    console.log(`Collision between ${entityA} and ${entityB} at`, event.data.collisionPoint);

    // Example collision response: damage player if hitting enemy
    // This would be more sophisticated in a real game
    this.eventBus.emitEvent(
      EVENT_TYPES.PLAYER_DAMAGED,
      {
        playerId: entityA,
        damage: 10,
        source: entityB,
        damageType: 'collision',
        currentHealth: 90,
        maxHealth: 100,
      },
      entityA
    );
  }
}

// Game state system that manages overall game flow
export class GameStateSystem implements System {
  public readonly type: SystemType = createSystemType('game_state');
  public readonly priority: number = 50;

  private entityManager: EntityManager;
  private eventBus: EventBus;
  private subscriptions: EventSubscription[] = [];
  private gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    enemiesKilled: 0,
    survivalTime: 0,
    startTime: 0,
  };

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;
  }

  public initialize(): void {
    console.log('🚀 Game state system initialized');

    // Subscribe to various game events
    this.subscriptions.push(
      this.eventBus.on(
        EVENT_TYPES.GAME_STARTED,
        this.handleGameStarted.bind(this),
        EventPriority.HIGHEST
      )
    );

    this.subscriptions.push(
      this.eventBus.on<PlayerDeathEvent>(
        EVENT_TYPES.PLAYER_DEATH,
        this.handlePlayerDeath.bind(this),
        EventPriority.HIGHEST
      )
    );

    this.subscriptions.push(
      this.eventBus.on<EnemyDeathEvent>(
        EVENT_TYPES.ENEMY_DEATH,
        this.handleEnemyDeath.bind(this),
        EventPriority.LOW
      )
    );
  }

  public update(deltaTime: number): void {
    if (this.gameState.isRunning && !this.gameState.isPaused) {
      this.gameState.survivalTime += deltaTime;
    }
  }

  public shutdown(): void {
    console.log('🛑 Game state system shutdown');

    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];
  }

  private handleGameStarted(event: any): void {
    this.gameState.isRunning = true;
    this.gameState.startTime = Date.now();
    this.gameState.score = 0;
    this.gameState.enemiesKilled = 0;
    this.gameState.survivalTime = 0;

    console.log('Game started:', event.data);
  }

  private handlePlayerDeath(event: PlayerDeathEvent): void {
    // Game over when player dies
    this.gameState.isRunning = false;

    this.eventBus.emit(
      GameEventFactory.createGameOver(
        event.data.deathCause,
        this.gameState.score,
        this.gameState.survivalTime,
        this.gameState.enemiesKilled,
        1 // Player level would come from experience system
      )
    );
  }

  private handleEnemyDeath(event: EnemyDeathEvent): void {
    this.gameState.enemiesKilled++;
    this.gameState.score += event.data.experienceReward * 10; // Simple scoring
  }

  public getGameState(): typeof this.gameState {
    return { ...this.gameState };
  }
}

// Audio event system that responds to audio events
export class AudioEventSystem implements System {
  public readonly type: SystemType = createSystemType('audio_events');
  public readonly priority: number = 90; // Low priority, runs after other systems

  private entityManager: EntityManager;
  private eventBus: EventBus;
  private subscriptions: EventSubscription[] = [];

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;
  }

  public initialize(): void {
    console.log('🚀 Audio event system initialized');

    // Subscribe to audio events
    this.subscriptions.push(
      this.eventBus.on(EVENT_TYPES.AUDIO_PLAY, this.handleAudioPlay.bind(this), EventPriority.LOW)
    );

    // Subscribe to game events that should trigger audio
    this.subscriptions.push(
      this.eventBus.on<EnemyDeathEvent>(
        EVENT_TYPES.ENEMY_DEATH,
        this.handleEnemyDeath.bind(this),
        EventPriority.LOW
      )
    );

    this.subscriptions.push(
      this.eventBus.on<PlayerDamagedEvent>(
        EVENT_TYPES.PLAYER_DAMAGED,
        this.handlePlayerDamaged.bind(this),
        EventPriority.LOW
      )
    );
  }

  public update(_deltaTime: number): void {
    // Audio system is purely event-driven
  }

  public shutdown(): void {
    console.log('🛑 Audio event system shutdown');

    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];
  }

  private handleAudioPlay(event: any): void {
    console.log(`Playing audio: ${event.data.soundId} at volume ${event.data.volume}`);
    // In a real implementation, this would interface with an audio manager
  }

  private handleEnemyDeath(event: EnemyDeathEvent): void {
    // Play enemy death sound
    this.eventBus.emitEvent(EVENT_TYPES.AUDIO_PLAY, {
      soundId: 'enemy_death',
      volume: 0.7,
      loop: false,
      position: event.data.position,
    });
  }

  private handlePlayerDamaged(_event: PlayerDamagedEvent): void {
    // Play damage sound
    this.eventBus.emitEvent(EVENT_TYPES.AUDIO_PLAY, {
      soundId: 'player_hurt',
      volume: 0.8,
      loop: false,
    });
  }
}
