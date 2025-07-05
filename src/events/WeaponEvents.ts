import { TypedGameEvent } from './interfaces';
import { EntityId } from '../types/core';
import { WeaponType } from '../ecs/components/WeaponComponents';

// Weapon lifecycle events
export interface WeaponCreatedEvent extends TypedGameEvent {
  type: 'weapon:created';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  level: number;
  damage: number;
  attackSpeed: number;
  range: number;
}

export interface WeaponDestroyedEvent extends TypedGameEvent {
  type: 'weapon:destroyed';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  reason: 'removed' | 'owner-destroyed' | 'upgrade';
}

export interface WeaponUnlockedEvent extends TypedGameEvent {
  type: 'weapon:unlocked';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  unlockedBy: 'level-up' | 'pickup' | 'upgrade' | 'evolution';
}

export interface WeaponActivatedEvent extends TypedGameEvent {
  type: 'weapon:activated';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  slotIndex: number;
}

export interface WeaponDeactivatedEvent extends TypedGameEvent {
  type: 'weapon:deactivated';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  reason: 'replaced' | 'manual' | 'full-slots';
}

// Weapon firing events
export interface WeaponFiredEvent extends TypedGameEvent {
  type: 'weapon:fired';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  projectileCount: number;
  damage: number;
  position: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  targetEntityId?: EntityId;
}

export interface WeaponTargetAcquiredEvent extends TypedGameEvent {
  type: 'weapon:target-acquired';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  targetEntityId: EntityId;
  targetPosition: { x: number; y: number };
  distance: number;
}

export interface WeaponTargetLostEvent extends TypedGameEvent {
  type: 'weapon:target-lost';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  lastTargetEntityId: EntityId;
  reason: 'out-of-range' | 'target-died' | 'line-of-sight' | 'cooldown';
}

export interface WeaponCooldownStartedEvent extends TypedGameEvent {
  type: 'weapon:cooldown-started';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  cooldownDuration: number;
}

export interface WeaponCooldownEndedEvent extends TypedGameEvent {
  type: 'weapon:cooldown-ended';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  actualDuration: number;
}

export interface WeaponReloadStartedEvent extends TypedGameEvent {
  type: 'weapon:reload-started';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  reloadDuration: number;
  shotsRemaining: number;
}

export interface WeaponReloadEndedEvent extends TypedGameEvent {
  type: 'weapon:reload-ended';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  newAmmoCount: number;
}

// Weapon upgrade events
export interface WeaponUpgradedEvent extends TypedGameEvent {
  type: 'weapon:upgraded';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  oldLevel: number;
  newLevel: number;
  upgradedStats: {
    damage?: number;
    attackSpeed?: number;
    range?: number;
    pierce?: number;
  };
  cost: number;
}

export interface WeaponEvolvedEvent extends TypedGameEvent {
  type: 'weapon:evolved';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  oldWeaponEntityId: EntityId;
  newWeaponEntityId: EntityId;
  newWeaponType: WeaponType;
  evolutionTrigger: string;
}

export interface WeaponStatsChangedEvent extends TypedGameEvent {
  type: 'weapon:stats-changed';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  statType: 'damage' | 'attack-speed' | 'range' | 'pierce' | 'projectile-count';
  oldValue: number;
  newValue: number;
  changeSource: 'upgrade' | 'buff' | 'debuff' | 'evolution';
}

// Projectile lifecycle events
export interface ProjectileCreatedEvent extends TypedGameEvent {
  type: 'projectile:created';
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  projectileEntityId: EntityId;
  damage: number;
  speed: number;
  pierce: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  targetEntityId?: EntityId;
}

export interface ProjectileDestroyedEvent extends TypedGameEvent {
  type: 'projectile:destroyed';
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  projectileEntityId: EntityId;
  reason: 'hit-target' | 'expired' | 'out-of-bounds' | 'pierce-exhausted';
  position: { x: number; y: number };
  targetsHit: number;
  damageDealt: number;
  travelDistance: number;
  lifespan: number;
}

export interface ProjectileHitEvent extends TypedGameEvent {
  type: 'projectile:hit';
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  projectileEntityId: EntityId;
  targetEntityId: EntityId;
  damage: number;
  position: { x: number; y: number };
  pierceRemaining: number;
  isCriticalHit: boolean;
  statusEffects?: string[];
}

export interface ProjectileMissEvent extends TypedGameEvent {
  type: 'projectile:miss';
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  projectileEntityId: EntityId;
  targetEntityId?: EntityId;
  position: { x: number; y: number };
  reason: 'target-moved' | 'accuracy' | 'blocked' | 'deflected';
}

export interface ProjectileExpiredEvent extends TypedGameEvent {
  type: 'projectile:expired';
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  projectileEntityId: EntityId;
  position: { x: number; y: number };
  targetsHit: number;
  damageDealt: number;
  maxLifetime: number;
  actualLifetime: number;
}

export interface ProjectilePiercedEvent extends TypedGameEvent {
  type: 'projectile:pierced';
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  projectileEntityId: EntityId;
  targetEntityId: EntityId;
  damage: number;
  position: { x: number; y: number };
  pierceCount: number;
  maxPierce: number;
}

export interface ProjectileBouncedEvent extends TypedGameEvent {
  type: 'projectile:bounced';
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  projectileEntityId: EntityId;
  position: { x: number; y: number };
  bounceCount: number;
  maxBounces: number;
  newVelocity: { x: number; y: number };
  surface: 'wall' | 'enemy' | 'terrain';
}

export interface ProjectileHomingEvent extends TypedGameEvent {
  type: 'projectile:homing';
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  projectileEntityId: EntityId;
  oldTargetEntityId?: EntityId;
  newTargetEntityId: EntityId;
  homingStrength: number;
  position: { x: number; y: number };
}

// Beam weapon events
export interface BeamCreatedEvent extends TypedGameEvent {
  type: 'beam:created';
  beamId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  beamEntityId: EntityId;
  damage: number;
  range: number;
  rotationDuration: number;
  position: { x: number; y: number };
}

export interface BeamDestroyedEvent extends TypedGameEvent {
  type: 'beam:destroyed';
  beamId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  beamEntityId: EntityId;
  reason: 'rotation-complete' | 'interrupted' | 'owner-destroyed';
  position: { x: number; y: number };
  targetsHit: number;
  damageDealt: number;
  rotationCompleted: number; // Percentage 0-100
}

export interface BeamHitEvent extends TypedGameEvent {
  type: 'beam:hit';
  beamId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  beamEntityId: EntityId;
  targetEntityId: EntityId;
  damage: number;
  position: { x: number; y: number };
  beamAngle: number;
  isContinuousHit: boolean;
}

export interface BeamRotationEvent extends TypedGameEvent {
  type: 'beam:rotation';
  beamId: number;
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  beamEntityId: EntityId;
  currentAngle: number;
  totalRotation: number;
  rotationSpeed: number;
  position: { x: number; y: number };
}

// Weapon effects events
export interface WeaponEffectTriggeredEvent extends TypedGameEvent {
  type: 'weapon:effect-triggered';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  effectType: 'chain' | 'explosion' | 'poison' | 'freeze' | 'burn' | 'stun' | 'knockback';
  effectStrength: number;
  targetEntityIds: EntityId[];
  position: { x: number; y: number };
  duration?: number;
}

export interface WeaponChainEvent extends TypedGameEvent {
  type: 'weapon:chain';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  sourceEntityId: EntityId;
  targetEntityId: EntityId;
  damage: number;
  chainCount: number;
  maxChains: number;
  chainRange: number;
}

export interface WeaponExplosionEvent extends TypedGameEvent {
  type: 'weapon:explosion';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  centerPosition: { x: number; y: number };
  radius: number;
  damage: number;
  affectedEntityIds: EntityId[];
  explosionType: 'impact' | 'delayed' | 'chain' | 'cluster';
}

export interface WeaponCriticalHitEvent extends TypedGameEvent {
  type: 'weapon:critical-hit';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  targetEntityId: EntityId;
  baseDamage: number;
  criticalDamage: number;
  criticalMultiplier: number;
  position: { x: number; y: number };
}

// Weapon combination/synergy events
export interface WeaponComboEvent extends TypedGameEvent {
  type: 'weapon:combo';
  comboId: string;
  comboName: string;
  ownerEntityId: EntityId;
  weaponTypes: WeaponType[];
  comboMultiplier: number;
  bonusEffects: string[];
  position: { x: number; y: number };
}

export interface WeaponSynergyEvent extends TypedGameEvent {
  type: 'weapon:synergy';
  synergyId: string;
  synergyName: string;
  ownerEntityId: EntityId;
  primaryWeaponType: WeaponType;
  secondaryWeaponType: WeaponType;
  synergyEffect: string;
  effectStrength: number;
}

// Weapon statistics events
export interface WeaponStatsUpdatedEvent extends TypedGameEvent {
  type: 'weapon:stats-updated';
  weaponType: WeaponType;
  ownerEntityId: EntityId;
  weaponEntityId: EntityId;
  stats: {
    shotsFired: number;
    hits: number;
    misses: number;
    accuracy: number;
    damageDealt: number;
    criticalHits: number;
    enemiesKilled: number;
  };
  timePlayed: number;
}

// Union type for all weapon events
export type WeaponEvent = 
  | WeaponCreatedEvent
  | WeaponDestroyedEvent
  | WeaponUnlockedEvent
  | WeaponActivatedEvent
  | WeaponDeactivatedEvent
  | WeaponFiredEvent
  | WeaponTargetAcquiredEvent
  | WeaponTargetLostEvent
  | WeaponCooldownStartedEvent
  | WeaponCooldownEndedEvent
  | WeaponReloadStartedEvent
  | WeaponReloadEndedEvent
  | WeaponUpgradedEvent
  | WeaponEvolvedEvent
  | WeaponStatsChangedEvent
  | ProjectileCreatedEvent
  | ProjectileDestroyedEvent
  | ProjectileHitEvent
  | ProjectileMissEvent
  | ProjectileExpiredEvent
  | ProjectilePiercedEvent
  | ProjectileBouncedEvent
  | ProjectileHomingEvent
  | BeamCreatedEvent
  | BeamDestroyedEvent
  | BeamHitEvent
  | BeamRotationEvent
  | WeaponEffectTriggeredEvent
  | WeaponChainEvent
  | WeaponExplosionEvent
  | WeaponCriticalHitEvent
  | WeaponComboEvent
  | WeaponSynergyEvent
  | WeaponStatsUpdatedEvent;

// Type guard functions
export const isWeaponEvent = (event: TypedGameEvent): event is WeaponEvent => {
  return event.type.startsWith('weapon:') || event.type.startsWith('projectile:') || event.type.startsWith('beam:');
};

export const isWeaponLifecycleEvent = (event: TypedGameEvent): event is WeaponCreatedEvent | WeaponDestroyedEvent | WeaponUnlockedEvent | WeaponActivatedEvent | WeaponDeactivatedEvent => {
  return ['weapon:created', 'weapon:destroyed', 'weapon:unlocked', 'weapon:activated', 'weapon:deactivated'].includes(event.type);
};

export const isWeaponFiringEvent = (event: TypedGameEvent): event is WeaponFiredEvent | WeaponTargetAcquiredEvent | WeaponTargetLostEvent | WeaponCooldownStartedEvent | WeaponCooldownEndedEvent => {
  return ['weapon:fired', 'weapon:target-acquired', 'weapon:target-lost', 'weapon:cooldown-started', 'weapon:cooldown-ended'].includes(event.type);
};

export const isProjectileEvent = (event: TypedGameEvent): event is ProjectileCreatedEvent | ProjectileDestroyedEvent | ProjectileHitEvent | ProjectileMissEvent | ProjectileExpiredEvent | ProjectilePiercedEvent | ProjectileBouncedEvent | ProjectileHomingEvent => {
  return event.type.startsWith('projectile:');
};

export const isBeamEvent = (event: TypedGameEvent): event is BeamCreatedEvent | BeamDestroyedEvent | BeamHitEvent | BeamRotationEvent => {
  return event.type.startsWith('beam:');
};

export const isWeaponUpgradeEvent = (event: TypedGameEvent): event is WeaponUpgradedEvent | WeaponEvolvedEvent | WeaponStatsChangedEvent => {
  return ['weapon:upgraded', 'weapon:evolved', 'weapon:stats-changed'].includes(event.type);
};

export const isWeaponEffectEvent = (event: TypedGameEvent): event is WeaponEffectTriggeredEvent | WeaponChainEvent | WeaponExplosionEvent | WeaponCriticalHitEvent => {
  return ['weapon:effect-triggered', 'weapon:chain', 'weapon:explosion', 'weapon:critical-hit'].includes(event.type);
};

export const isWeaponComboEvent = (event: TypedGameEvent): event is WeaponComboEvent | WeaponSynergyEvent => {
  return ['weapon:combo', 'weapon:synergy'].includes(event.type);
}; 