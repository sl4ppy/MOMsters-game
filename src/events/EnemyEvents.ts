import { TypedGameEvent } from './interfaces';
import { EntityId } from '../types/core';

// Enemy lifecycle events
export interface EnemyCreatedEvent extends TypedGameEvent {
  type: 'enemy:created';
  enemyId: EntityId;
  enemyType: number;
  name: string;
  health: number;
  speed: number;
  damage: number;
  xpValue: number;
  position: { x: number; y: number };
}

export interface EnemyDestroyedEvent extends TypedGameEvent {
  type: 'enemy:destroyed';
  enemyId: EntityId;
  enemyType: number;
  name: string;
  reason: 'killed' | 'despawned' | 'cleanup';
  position: { x: number; y: number };
}

export interface EnemySpawnedEvent extends TypedGameEvent {
  type: 'enemy:spawned';
  enemyId: EntityId;
  enemyType: number;
  name: string;
  position: { x: number; y: number };
  waveNumber?: number;
  spawnSource?: string;
}

export interface EnemyDespawnedEvent extends TypedGameEvent {
  type: 'enemy:despawned';
  enemyId: EntityId;
  enemyType: number;
  reason: 'off-screen' | 'timeout' | 'manual';
  position: { x: number; y: number };
}

// Enemy health events
export interface EnemyDamagedEvent extends TypedGameEvent {
  type: 'enemy:damaged';
  enemyId: EntityId;
  enemyType: number;
  damage: number;
  remainingHealth: number;
  healthPercent: number;
  damageSource?: string;
  damageType?: string;
  position: { x: number; y: number };
}

export interface EnemyHealedEvent extends TypedGameEvent {
  type: 'enemy:healed';
  enemyId: EntityId;
  enemyType: number;
  healAmount: number;
  newHealth: number;
  healthPercent: number;
  healSource?: string;
  position: { x: number; y: number };
}

export interface EnemyDiedEvent extends TypedGameEvent {
  type: 'enemy:died';
  enemyId: EntityId;
  enemyType: number;
  name: string;
  killer?: string;
  killerType?: string;
  xpAwarded: number;
  position: { x: number; y: number };
  finalDamage: number;
  totalDamageDealt: number;
  survivalTime: number;
}

export interface EnemyRevivedEvent extends TypedGameEvent {
  type: 'enemy:revived';
  enemyId: EntityId;
  enemyType: number;
  newHealth: number;
  reviveSource?: string;
  position: { x: number; y: number };
}

// Enemy movement events
export interface EnemyMovedEvent extends TypedGameEvent {
  type: 'enemy:moved';
  enemyId: EntityId;
  enemyType: number;
  oldPosition: { x: number; y: number };
  newPosition: { x: number; y: number };
  movementType: 'basic' | 'hopping' | 'circling' | 'teleporting' | 'charging';
  distance: number;
  speed: number;
}

export interface EnemyHopStartedEvent extends TypedGameEvent {
  type: 'enemy:hop-started';
  enemyId: EntityId;
  enemyType: number;
  startPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  hopDuration: number;
  hopHeight: number;
}

export interface EnemyHopEndedEvent extends TypedGameEvent {
  type: 'enemy:hop-ended';
  enemyId: EntityId;
  enemyType: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  hopDuration: number;
  actualDuration: number;
}

export interface EnemyTeleportedEvent extends TypedGameEvent {
  type: 'enemy:teleported';
  enemyId: EntityId;
  enemyType: number;
  oldPosition: { x: number; y: number };
  newPosition: { x: number; y: number };
  teleportType: 'random' | 'behind-player' | 'escape';
}

// Enemy AI and behavior events
export interface EnemyStateChangedEvent extends TypedGameEvent {
  type: 'enemy:state-changed';
  enemyId: EntityId;
  enemyType: number;
  oldState: 'idle' | 'chasing' | 'attacking' | 'fleeing' | 'patrolling' | 'stunned';
  newState: 'idle' | 'chasing' | 'attacking' | 'fleeing' | 'patrolling' | 'stunned';
  reason?: string;
  position: { x: number; y: number };
}

export interface EnemyTargetAcquiredEvent extends TypedGameEvent {
  type: 'enemy:target-acquired';
  enemyId: EntityId;
  enemyType: number;
  targetId: EntityId;
  targetType: string;
  distance: number;
  position: { x: number; y: number };
}

export interface EnemyTargetLostEvent extends TypedGameEvent {
  type: 'enemy:target-lost';
  enemyId: EntityId;
  enemyType: number;
  lastTargetId: EntityId;
  lastTargetType: string;
  reason: 'out-of-range' | 'target-died' | 'lost-line-of-sight' | 'behavior-change';
  position: { x: number; y: number };
}

export interface EnemyAttackStartedEvent extends TypedGameEvent {
  type: 'enemy:attack-started';
  enemyId: EntityId;
  enemyType: number;
  targetId: EntityId;
  attackType: string;
  damage: number;
  position: { x: number; y: number };
}

export interface EnemyAttackEndedEvent extends TypedGameEvent {
  type: 'enemy:attack-ended';
  enemyId: EntityId;
  enemyType: number;
  targetId: EntityId;
  attackType: string;
  hit: boolean;
  damageDealt: number;
  position: { x: number; y: number };
}

export interface EnemyFleeingEvent extends TypedGameEvent {
  type: 'enemy:fleeing';
  enemyId: EntityId;
  enemyType: number;
  reason: 'low-health' | 'overwhelmed' | 'fear-effect';
  fleeTarget?: { x: number; y: number };
  position: { x: number; y: number };
}

export interface EnemyStunnedEvent extends TypedGameEvent {
  type: 'enemy:stunned';
  enemyId: EntityId;
  enemyType: number;
  stunDuration: number;
  stunSource?: string;
  position: { x: number; y: number };
}

export interface EnemyStunEndedEvent extends TypedGameEvent {
  type: 'enemy:stun-ended';
  enemyId: EntityId;
  enemyType: number;
  stunDuration: number;
  actualDuration: number;
  position: { x: number; y: number };
}

// Enemy collision events
export interface EnemyCollisionEvent extends TypedGameEvent {
  type: 'enemy:collision';
  enemyId: EntityId;
  enemyType: number;
  otherId: EntityId;
  otherType: string;
  collisionPoint: { x: number; y: number };
  damage?: number;
  knockback?: number;
}

export interface EnemyPlayerCollisionEvent extends TypedGameEvent {
  type: 'enemy:player-collision';
  enemyId: EntityId;
  enemyType: number;
  playerId: EntityId;
  damageDealt: number;
  position: { x: number; y: number };
}

export interface EnemyProjectileCollisionEvent extends TypedGameEvent {
  type: 'enemy:projectile-collision';
  enemyId: EntityId;
  enemyType: number;
  projectileId: EntityId;
  projectileType: string;
  damage: number;
  position: { x: number; y: number };
}

export interface EnemyEnemyCollisionEvent extends TypedGameEvent {
  type: 'enemy:enemy-collision';
  enemyId: EntityId;
  enemyType: number;
  otherEnemyId: EntityId;
  otherEnemyType: number;
  pushback: boolean;
  position: { x: number; y: number };
}

// Enemy visual and animation events
export interface EnemySpriteLoadedEvent extends TypedGameEvent {
  type: 'enemy:sprite-loaded';
  enemyId: EntityId;
  enemyType: number;
  spriteSource: 'atlas' | 'custom' | 'fallback';
  spriteSize: { width: number; height: number };
}

export interface EnemyAnimationStartedEvent extends TypedGameEvent {
  type: 'enemy:animation-started';
  enemyId: EntityId;
  enemyType: number;
  animationName: string;
  duration: number;
  loop: boolean;
}

export interface EnemyAnimationEndedEvent extends TypedGameEvent {
  type: 'enemy:animation-ended';
  enemyId: EntityId;
  enemyType: number;
  animationName: string;
  completed: boolean;
}

export interface EnemyEffectStartedEvent extends TypedGameEvent {
  type: 'enemy:effect-started';
  enemyId: EntityId;
  enemyType: number;
  effectType: 'flash' | 'shake' | 'bounce' | 'fade' | 'pulse';
  duration: number;
  intensity: number;
  position: { x: number; y: number };
}

export interface EnemyEffectEndedEvent extends TypedGameEvent {
  type: 'enemy:effect-ended';
  enemyId: EntityId;
  enemyType: number;
  effectType: 'flash' | 'shake' | 'bounce' | 'fade' | 'pulse';
  duration: number;
  completed: boolean;
  position: { x: number; y: number };
}

export interface EnemyFacingChangedEvent extends TypedGameEvent {
  type: 'enemy:facing-changed';
  enemyId: EntityId;
  enemyType: number;
  oldFacing: 'left' | 'right' | 'up' | 'down';
  newFacing: 'left' | 'right' | 'up' | 'down';
  position: { x: number; y: number };
}

// Enemy pack behavior events
export interface EnemyPackFormedEvent extends TypedGameEvent {
  type: 'enemy:pack-formed';
  packId: string;
  leaderId: EntityId;
  memberIds: EntityId[];
  packSize: number;
  position: { x: number; y: number };
}

export interface EnemyPackDisbandedEvent extends TypedGameEvent {
  type: 'enemy:pack-disbanded';
  packId: string;
  reason: 'leader-died' | 'members-scattered' | 'timeout';
  remainingMembers: EntityId[];
  position: { x: number; y: number };
}

export interface EnemyJoinedPackEvent extends TypedGameEvent {
  type: 'enemy:joined-pack';
  enemyId: EntityId;
  enemyType: number;
  packId: string;
  role: 'leader' | 'follower' | 'scout';
  packSize: number;
  position: { x: number; y: number };
}

export interface EnemyLeftPackEvent extends TypedGameEvent {
  type: 'enemy:left-pack';
  enemyId: EntityId;
  enemyType: number;
  packId: string;
  reason: 'died' | 'scattered' | 'promoted' | 'reassigned';
  remainingPackSize: number;
  position: { x: number; y: number };
}

// Enemy statistics events
export interface EnemyStatsUpdatedEvent extends TypedGameEvent {
  type: 'enemy:stats-updated';
  enemyId: EntityId;
  enemyType: number;
  statType: 'health' | 'speed' | 'damage' | 'xp-value';
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface EnemyLevelUpEvent extends TypedGameEvent {
  type: 'enemy:level-up';
  enemyId: EntityId;
  enemyType: number;
  oldLevel: number;
  newLevel: number;
  statBoosts: {
    health?: number;
    speed?: number;
    damage?: number;
    xpValue?: number;
  };
  position: { x: number; y: number };
}

// Union type for all enemy events
export type EnemyEvent = 
  | EnemyCreatedEvent
  | EnemyDestroyedEvent
  | EnemySpawnedEvent
  | EnemyDespawnedEvent
  | EnemyDamagedEvent
  | EnemyHealedEvent
  | EnemyDiedEvent
  | EnemyRevivedEvent
  | EnemyMovedEvent
  | EnemyHopStartedEvent
  | EnemyHopEndedEvent
  | EnemyTeleportedEvent
  | EnemyStateChangedEvent
  | EnemyTargetAcquiredEvent
  | EnemyTargetLostEvent
  | EnemyAttackStartedEvent
  | EnemyAttackEndedEvent
  | EnemyFleeingEvent
  | EnemyStunnedEvent
  | EnemyStunEndedEvent
  | EnemyCollisionEvent
  | EnemyPlayerCollisionEvent
  | EnemyProjectileCollisionEvent
  | EnemyEnemyCollisionEvent
  | EnemySpriteLoadedEvent
  | EnemyAnimationStartedEvent
  | EnemyAnimationEndedEvent
  | EnemyEffectStartedEvent
  | EnemyEffectEndedEvent
  | EnemyFacingChangedEvent
  | EnemyPackFormedEvent
  | EnemyPackDisbandedEvent
  | EnemyJoinedPackEvent
  | EnemyLeftPackEvent
  | EnemyStatsUpdatedEvent
  | EnemyLevelUpEvent;

// Type guard functions
export const isEnemyEvent = (event: TypedGameEvent): event is EnemyEvent => {
  return event.type.startsWith('enemy:');
};

export const isEnemyLifecycleEvent = (event: TypedGameEvent): event is EnemyCreatedEvent | EnemyDestroyedEvent | EnemySpawnedEvent | EnemyDespawnedEvent => {
  return ['enemy:created', 'enemy:destroyed', 'enemy:spawned', 'enemy:despawned'].includes(event.type);
};

export const isEnemyHealthEvent = (event: TypedGameEvent): event is EnemyDamagedEvent | EnemyHealedEvent | EnemyDiedEvent | EnemyRevivedEvent => {
  return ['enemy:damaged', 'enemy:healed', 'enemy:died', 'enemy:revived'].includes(event.type);
};

export const isEnemyMovementEvent = (event: TypedGameEvent): event is EnemyMovedEvent | EnemyHopStartedEvent | EnemyHopEndedEvent | EnemyTeleportedEvent => {
  return ['enemy:moved', 'enemy:hop-started', 'enemy:hop-ended', 'enemy:teleported'].includes(event.type);
};

export const isEnemyAIEvent = (event: TypedGameEvent): event is EnemyStateChangedEvent | EnemyTargetAcquiredEvent | EnemyTargetLostEvent | EnemyAttackStartedEvent | EnemyAttackEndedEvent | EnemyFleeingEvent | EnemyStunnedEvent | EnemyStunEndedEvent => {
  return ['enemy:state-changed', 'enemy:target-acquired', 'enemy:target-lost', 'enemy:attack-started', 'enemy:attack-ended', 'enemy:fleeing', 'enemy:stunned', 'enemy:stun-ended'].includes(event.type);
};

export const isEnemyCollisionEvent = (event: TypedGameEvent): event is EnemyCollisionEvent | EnemyPlayerCollisionEvent | EnemyProjectileCollisionEvent | EnemyEnemyCollisionEvent => {
  return ['enemy:collision', 'enemy:player-collision', 'enemy:projectile-collision', 'enemy:enemy-collision'].includes(event.type);
};

export const isEnemyVisualEvent = (event: TypedGameEvent): event is EnemySpriteLoadedEvent | EnemyAnimationStartedEvent | EnemyAnimationEndedEvent | EnemyEffectStartedEvent | EnemyEffectEndedEvent | EnemyFacingChangedEvent => {
  return ['enemy:sprite-loaded', 'enemy:animation-started', 'enemy:animation-ended', 'enemy:effect-started', 'enemy:effect-ended', 'enemy:facing-changed'].includes(event.type);
};

export const isEnemyPackEvent = (event: TypedGameEvent): event is EnemyPackFormedEvent | EnemyPackDisbandedEvent | EnemyJoinedPackEvent | EnemyLeftPackEvent => {
  return ['enemy:pack-formed', 'enemy:pack-disbanded', 'enemy:joined-pack', 'enemy:left-pack'].includes(event.type);
}; 