import { EntityId } from '../types/core';
import { TypedGameEvent } from './interfaces';

/**
 * Player-related events for the EventBus system
 */

// Player lifecycle events
export interface PlayerCreatedEvent extends TypedGameEvent<{
  playerId: string;
  playerType: 'main' | 'secondary' | 'ai';
  entityId: EntityId;
  position: { x: number; y: number };
  timestamp: number;
}> {
  type: 'player:created';
}

export interface PlayerDestroyedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  reason: 'death' | 'manual' | 'cleanup';
  survivalTime: number;
  killCount: number;
  timestamp: number;
}> {
  type: 'player:destroyed';
}

export interface PlayerSpawnedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  position: { x: number; y: number };
  respawnCount: number;
  timestamp: number;
}> {
  type: 'player:spawned';
}

// Player movement events
export interface PlayerMovedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  position: { x: number; y: number };
  previousPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  speed: number;
  timestamp: number;
}> {
  type: 'player:moved';
}

export interface PlayerMovementStartedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  direction: { x: number; y: number };
  timestamp: number;
}> {
  type: 'player:movement_started';
}

export interface PlayerMovementStoppedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  finalPosition: { x: number; y: number };
  timestamp: number;
}> {
  type: 'player:movement_stopped';
}

// Player health events
export interface PlayerHealthChangedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  health: number;
  maxHealth: number;
  previousHealth: number;
  changeAmount: number;
  changeType: 'damage' | 'heal' | 'regen';
  timestamp: number;
}> {
  type: 'player:health_changed';
}

export interface PlayerDamagedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  damage: number;
  health: number;
  maxHealth: number;
  damageSource: EntityId | null;
  damageType: 'collision' | 'projectile' | 'environment' | 'other';
  isInvulnerable: boolean;
  timestamp: number;
}> {
  type: 'player:damaged';
}

export interface PlayerHealedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  healAmount: number;
  health: number;
  maxHealth: number;
  healType: 'regen' | 'pickup' | 'ability' | 'other';
  timestamp: number;
}> {
  type: 'player:healed';
}

export interface PlayerDiedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  deathCause: 'enemy' | 'projectile' | 'environment' | 'other';
  finalPosition: { x: number; y: number };
  survivalTime: number;
  killCount: number;
  experienceGained: number;
  timestamp: number;
}> {
  type: 'player:died';
}

export interface PlayerRevivedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  position: { x: number; y: number };
  health: number;
  timestamp: number;
}> {
  type: 'player:revived';
}

// Player invulnerability events
export interface PlayerInvulnerabilityStartedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  duration: number;
  reason: 'damage' | 'ability' | 'upgrade' | 'other';
  timestamp: number;
}> {
  type: 'player:invulnerability_started';
}

export interface PlayerInvulnerabilityEndedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  timestamp: number;
}> {
  type: 'player:invulnerability_ended';
}

// Player experience and leveling events
export interface PlayerExperienceGainedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  experienceGained: number;
  totalExperience: number;
  experienceSource: EntityId | null;
  sourceType: 'enemy_kill' | 'bonus' | 'quest' | 'other';
  timestamp: number;
}> {
  type: 'player:experience_gained';
}

export interface PlayerLevelUpEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  newLevel: number;
  previousLevel: number;
  totalExperience: number;
  upgradePointsGained: number;
  timestamp: number;
}> {
  type: 'player:level_up';
}

export interface PlayerUpgradeAppliedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  upgradeType: 'health' | 'regen' | 'speed' | 'damage' | 'other';
  upgradeValue: number;
  upgradeDescription: string;
  totalUpgrades: number;
  timestamp: number;
}> {
  type: 'player:upgrade_applied';
}

// Player appearance and animation events
export interface PlayerDesignChangedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  newDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man';
  previousDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man';
  timestamp: number;
}> {
  type: 'player:design_changed';
}

export interface PlayerAnimationStartedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  animationName: string;
  duration: number;
  loop: boolean;
  timestamp: number;
}> {
  type: 'player:animation_started';
}

export interface PlayerAnimationEndedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  animationName: string;
  timestamp: number;
}> {
  type: 'player:animation_ended';
}

// Player collision events
export interface PlayerCollisionEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  otherEntityId: EntityId;
  collisionType: 'enemy' | 'projectile' | 'pickup' | 'environment' | 'other';
  collisionPosition: { x: number; y: number };
  timestamp: number;
}> {
  type: 'player:collision';
}

// Player input events
export interface PlayerInputEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  inputType: 'movement' | 'action' | 'debug';
  inputData: {
    key?: string;
    direction?: { x: number; y: number };
    action?: string;
  };
  timestamp: number;
}> {
  type: 'player:input';
}

// Player stats events
export interface PlayerStatsUpdatedEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  stats: {
    killCount: number;
    survivalTime: number;
    damageDealt: number;
    damageTaken: number;
    experienceGained: number;
    level: number;
  };
  timestamp: number;
}> {
  type: 'player:stats_updated';
}

export interface PlayerKillEvent extends TypedGameEvent<{
  playerId: string;
  entityId: EntityId;
  killedEntityId: EntityId;
  killType: 'enemy' | 'boss' | 'other';
  killCount: number;
  experienceGained: number;
  timestamp: number;
}> {
  type: 'player:kill';
}

// Event factory functions
export class PlayerEventFactory {
  public static createPlayerCreated(
    playerId: string,
    playerType: 'main' | 'secondary' | 'ai',
    entityId: EntityId,
    position: { x: number; y: number }
  ): PlayerCreatedEvent {
    return {
      type: 'player:created',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        playerType,
        entityId,
        position,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerDestroyed(
    playerId: string,
    entityId: EntityId,
    reason: 'death' | 'manual' | 'cleanup',
    survivalTime: number,
    killCount: number
  ): PlayerDestroyedEvent {
    return {
      type: 'player:destroyed',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        reason,
        survivalTime,
        killCount,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerMoved(
    playerId: string,
    entityId: EntityId,
    position: { x: number; y: number },
    previousPosition: { x: number; y: number },
    velocity: { x: number; y: number },
    speed: number
  ): PlayerMovedEvent {
    return {
      type: 'player:moved',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        position,
        previousPosition,
        velocity,
        speed,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerHealthChanged(
    playerId: string,
    entityId: EntityId,
    health: number,
    maxHealth: number,
    previousHealth: number,
    changeType: 'damage' | 'heal' | 'regen'
  ): PlayerHealthChangedEvent {
    return {
      type: 'player:health_changed',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        health,
        maxHealth,
        previousHealth,
        changeAmount: health - previousHealth,
        changeType,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerDamaged(
    playerId: string,
    entityId: EntityId,
    damage: number,
    health: number,
    maxHealth: number,
    damageSource: EntityId | null,
    damageType: 'collision' | 'projectile' | 'environment' | 'other',
    isInvulnerable: boolean
  ): PlayerDamagedEvent {
    return {
      type: 'player:damaged',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        damage,
        health,
        maxHealth,
        damageSource,
        damageType,
        isInvulnerable,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerHealed(
    playerId: string,
    entityId: EntityId,
    healAmount: number,
    health: number,
    maxHealth: number,
    healType: 'regen' | 'pickup' | 'ability' | 'other'
  ): PlayerHealedEvent {
    return {
      type: 'player:healed',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        healAmount,
        health,
        maxHealth,
        healType,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerDied(
    playerId: string,
    entityId: EntityId,
    deathCause: 'enemy' | 'projectile' | 'environment' | 'other',
    finalPosition: { x: number; y: number },
    survivalTime: number,
    killCount: number,
    experienceGained: number
  ): PlayerDiedEvent {
    return {
      type: 'player:died',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        deathCause,
        finalPosition,
        survivalTime,
        killCount,
        experienceGained,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerLevelUp(
    playerId: string,
    entityId: EntityId,
    newLevel: number,
    previousLevel: number,
    totalExperience: number,
    upgradePointsGained: number
  ): PlayerLevelUpEvent {
    return {
      type: 'player:level_up',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        newLevel,
        previousLevel,
        totalExperience,
        upgradePointsGained,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerDesignChanged(
    playerId: string,
    entityId: EntityId,
    newDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man',
    previousDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man'
  ): PlayerDesignChangedEvent {
    return {
      type: 'player:design_changed',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        newDesign,
        previousDesign,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerCollision(
    playerId: string,
    entityId: EntityId,
    otherEntityId: EntityId,
    collisionType: 'enemy' | 'projectile' | 'pickup' | 'environment' | 'other',
    collisionPosition: { x: number; y: number }
  ): PlayerCollisionEvent {
    return {
      type: 'player:collision',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        otherEntityId,
        collisionType,
        collisionPosition,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerKill(
    playerId: string,
    entityId: EntityId,
    killedEntityId: EntityId,
    killType: 'enemy' | 'boss' | 'other',
    killCount: number,
    experienceGained: number
  ): PlayerKillEvent {
    return {
      type: 'player:kill',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        killedEntityId,
        killType,
        killCount,
        experienceGained,
        timestamp: Date.now(),
      },
    };
  }

  public static createPlayerUpgradeApplied(
    playerId: string,
    entityId: EntityId,
    upgradeType: 'health' | 'regen' | 'speed' | 'damage' | 'other',
    upgradeValue: number,
    upgradeDescription: string,
    totalUpgrades: number
  ): PlayerUpgradeAppliedEvent {
    return {
      type: 'player:upgrade_applied',
      timestamp: Date.now(),
      entityId,
      data: {
        playerId,
        entityId,
        upgradeType,
        upgradeValue,
        upgradeDescription,
        totalUpgrades,
        timestamp: Date.now(),
      },
    };
  }
}

// Player event type constants
export const PLAYER_EVENT_TYPES = {
  // Lifecycle
  CREATED: 'player:created',
  DESTROYED: 'player:destroyed',
  SPAWNED: 'player:spawned',

  // Movement
  MOVED: 'player:moved',
  MOVEMENT_STARTED: 'player:movement_started',
  MOVEMENT_STOPPED: 'player:movement_stopped',

  // Health
  HEALTH_CHANGED: 'player:health_changed',
  DAMAGED: 'player:damaged',
  HEALED: 'player:healed',
  DIED: 'player:died',
  REVIVED: 'player:revived',

  // Invulnerability
  INVULNERABILITY_STARTED: 'player:invulnerability_started',
  INVULNERABILITY_ENDED: 'player:invulnerability_ended',

  // Progression
  EXPERIENCE_GAINED: 'player:experience_gained',
  LEVEL_UP: 'player:level_up',
  UPGRADE_APPLIED: 'player:upgrade_applied',

  // Appearance
  DESIGN_CHANGED: 'player:design_changed',
  ANIMATION_STARTED: 'player:animation_started',
  ANIMATION_ENDED: 'player:animation_ended',

  // Interaction
  COLLISION: 'player:collision',
  INPUT: 'player:input',
  KILL: 'player:kill',

  // Stats
  STATS_UPDATED: 'player:stats_updated',
} as const; 