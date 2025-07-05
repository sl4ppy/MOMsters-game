import { EntityId } from '../types/core';
import { TypedGameEvent } from './interfaces';

/**
 * Common game event types for gameplay systems
 */

// Player events
export interface PlayerSpawnedEvent
  extends TypedGameEvent<{
    playerId: EntityId;
    position: { x: number; y: number };
    health: number;
  }> {
  type: 'player:spawned';
}

export interface PlayerMovedEvent
  extends TypedGameEvent<{
    playerId: EntityId;
    from: { x: number; y: number };
    to: { x: number; y: number };
    velocity: { vx: number; vy: number };
  }> {
  type: 'player:moved';
}

export interface PlayerDamagedEvent
  extends TypedGameEvent<{
    playerId: EntityId;
    damage: number;
    source?: EntityId;
    damageType?: string;
    currentHealth: number;
    maxHealth: number;
  }> {
  type: 'player:damaged';
}

export interface PlayerHealedEvent
  extends TypedGameEvent<{
    playerId: EntityId;
    healing: number;
    currentHealth: number;
    maxHealth: number;
  }> {
  type: 'player:healed';
}

export interface PlayerDeathEvent
  extends TypedGameEvent<{
    playerId: EntityId;
    killer?: EntityId;
    deathCause: string;
  }> {
  type: 'player:death';
}

export interface PlayerLevelUpEvent
  extends TypedGameEvent<{
    playerId: EntityId;
    newLevel: number;
    experienceGained: number;
    totalExperience: number;
  }> {
  type: 'player:levelup';
}

// Enemy events
export interface EnemySpawnedEvent
  extends TypedGameEvent<{
    enemyId: EntityId;
    enemyType: string;
    position: { x: number; y: number };
    health: number;
    waveNumber?: number;
  }> {
  type: 'enemy:spawned';
}

export interface EnemyDamagedEvent
  extends TypedGameEvent<{
    enemyId: EntityId;
    damage: number;
    source?: EntityId;
    damageType?: string;
    currentHealth: number;
    maxHealth: number;
  }> {
  type: 'enemy:damaged';
}

export interface EnemyDeathEvent
  extends TypedGameEvent<{
    enemyId: EntityId;
    killer?: EntityId;
    enemyType: string;
    position: { x: number; y: number };
    experienceReward: number;
    lootDropped?: string[];
  }> {
  type: 'enemy:death';
}

// Combat events
export interface ProjectileFiredEvent
  extends TypedGameEvent<{
    projectileId: EntityId;
    weaponType: string;
    shooterId: EntityId;
    targetPosition?: { x: number; y: number };
    damage: number;
    speed: number;
  }> {
  type: 'combat:projectile_fired';
}

export interface ProjectileHitEvent
  extends TypedGameEvent<{
    projectileId: EntityId;
    targetId: EntityId;
    hitPosition: { x: number; y: number };
    damage: number;
    damageType: string;
  }> {
  type: 'combat:projectile_hit';
}

export interface WeaponEquippedEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    weaponType: string;
    weaponLevel: number;
  }> {
  type: 'combat:weapon_equipped';
}

export interface WeaponUpgradedEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    weaponType: string;
    oldLevel: number;
    newLevel: number;
    upgradeName: string;
  }> {
  type: 'combat:weapon_upgraded';
}

// Collision events
export interface CollisionStartEvent
  extends TypedGameEvent<{
    entityA: EntityId;
    entityB: EntityId;
    collisionPoint: { x: number; y: number };
    collisionNormal: { x: number; y: number };
  }> {
  type: 'collision:start';
}

export interface CollisionEndEvent
  extends TypedGameEvent<{
    entityA: EntityId;
    entityB: EntityId;
  }> {
  type: 'collision:end';
}

// UI events
export interface UIClickEvent
  extends TypedGameEvent<{
    elementId: string;
    clickPosition: { x: number; y: number };
    button: number;
  }> {
  type: 'ui:click';
}

export interface UIHoverEvent
  extends TypedGameEvent<{
    elementId: string;
    hoverPosition: { x: number; y: number };
  }> {
  type: 'ui:hover';
}

export interface UIToggleEvent
  extends TypedGameEvent<{
    elementId: string;
    isVisible: boolean;
  }> {
  type: 'ui:toggle';
}

// Game state events
export interface GameStartedEvent
  extends TypedGameEvent<{
    gameMode: string;
    difficulty: string;
    timestamp: number;
  }> {
  type: 'game:started';
}

export interface GamePausedEvent
  extends TypedGameEvent<{
    reason: string;
  }> {
  type: 'game:paused';
}

export interface GameResumedEvent
  extends TypedGameEvent<{
    pausedDuration: number;
  }> {
  type: 'game:resumed';
}

export interface GameOverEvent
  extends TypedGameEvent<{
    reason: string;
    score: number;
    survivalTime: number;
    enemiesKilled: number;
    level: number;
  }> {
  type: 'game:over';
}

export interface WaveStartedEvent
  extends TypedGameEvent<{
    waveNumber: number;
    enemyCount: number;
    waveDuration: number;
    specialEvent?: string;
  }> {
  type: 'wave:started';
}

export interface WaveCompletedEvent
  extends TypedGameEvent<{
    waveNumber: number;
    enemiesKilled: number;
    completionTime: number;
    bonusScore: number;
  }> {
  type: 'wave:completed';
}

// Experience and progression events
export interface ExperienceGainedEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    amount: number;
    source: string; // 'enemy_kill', 'wave_bonus', etc.
    totalExperience: number;
  }> {
  type: 'progression:experience_gained';
}

export interface UpgradeSelectedEvent
  extends TypedGameEvent<{
    playerId: EntityId;
    upgradeId: string;
    upgradeName: string;
    upgradeType: string;
  }> {
  type: 'progression:upgrade_selected';
}

// Audio events
export interface AudioPlayEvent
  extends TypedGameEvent<{
    soundId: string;
    volume: number;
    loop: boolean;
    position?: { x: number; y: number };
  }> {
  type: 'audio:play';
}

export interface AudioStopEvent
  extends TypedGameEvent<{
    soundId: string;
  }> {
  type: 'audio:stop';
}

// Event factory functions for convenience
export class GameEventFactory {
  public static createPlayerSpawned(
    playerId: EntityId,
    position: { x: number; y: number },
    health: number
  ): PlayerSpawnedEvent {
    return {
      type: 'player:spawned',
      timestamp: Date.now(),
      entityId: playerId,
      data: { playerId, position, health },
    };
  }

  public static createEnemyDeath(
    enemyId: EntityId,
    killer: EntityId | undefined,
    enemyType: string,
    position: { x: number; y: number },
    experienceReward: number,
    lootDropped?: string[]
  ): EnemyDeathEvent {
    return {
      type: 'enemy:death',
      timestamp: Date.now(),
      entityId: enemyId,
      data: {
        enemyId,
        killer,
        enemyType,
        position,
        experienceReward,
        lootDropped,
      },
    };
  }

  public static createCollisionStart(
    entityA: EntityId,
    entityB: EntityId,
    collisionPoint: { x: number; y: number },
    collisionNormal: { x: number; y: number }
  ): CollisionStartEvent {
    return {
      type: 'collision:start',
      timestamp: Date.now(),
      data: {
        entityA,
        entityB,
        collisionPoint,
        collisionNormal,
      },
    };
  }

  public static createGameOver(
    reason: string,
    score: number,
    survivalTime: number,
    enemiesKilled: number,
    level: number
  ): GameOverEvent {
    return {
      type: 'game:over',
      timestamp: Date.now(),
      data: {
        reason,
        score,
        survivalTime,
        enemiesKilled,
        level,
      },
    };
  }
}

// Event type constants for easy reference
export const EVENT_TYPES = {
  // Player
  PLAYER_SPAWNED: 'player:spawned',
  PLAYER_MOVED: 'player:moved',
  PLAYER_DAMAGED: 'player:damaged',
  PLAYER_HEALED: 'player:healed',
  PLAYER_DEATH: 'player:death',
  PLAYER_LEVELUP: 'player:levelup',

  // Enemy
  ENEMY_SPAWNED: 'enemy:spawned',
  ENEMY_DAMAGED: 'enemy:damaged',
  ENEMY_DEATH: 'enemy:death',

  // Combat
  PROJECTILE_FIRED: 'combat:projectile_fired',
  PROJECTILE_HIT: 'combat:projectile_hit',
  WEAPON_EQUIPPED: 'combat:weapon_equipped',
  WEAPON_UPGRADED: 'combat:weapon_upgraded',

  // Collision
  COLLISION_START: 'collision:start',
  COLLISION_END: 'collision:end',

  // UI
  UI_CLICK: 'ui:click',
  UI_HOVER: 'ui:hover',
  UI_TOGGLE: 'ui:toggle',

  // Game state
  GAME_STARTED: 'game:started',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
  GAME_OVER: 'game:over',
  WAVE_STARTED: 'wave:started',
  WAVE_COMPLETED: 'wave:completed',

  // Progression
  EXPERIENCE_GAINED: 'progression:experience_gained',
  UPGRADE_SELECTED: 'progression:upgrade_selected',

  // Audio
  AUDIO_PLAY: 'audio:play',
  AUDIO_STOP: 'audio:stop',
} as const;
