import { ComponentType } from '../../types/core';
import { Container, Sprite, Graphics, Texture } from 'pixi.js';

// Weapon types from existing system
export enum WeaponType {
  FIREBALL = 'fireball',
  LIGHTNING = 'lightning',
  WHIP = 'whip',
  AXE = 'axe',
  KNIFE = 'knife',
  MAGIC_WAND = 'magic_wand',
  BIBLE = 'bible',
  GARLIC = 'garlic',
  HOLY_WATER = 'holy_water',
  RUNE_TRACER = 'rune_tracer',
  EYE_BEAM = 'eye_beam',
}

// Core weapon configuration and stats
export interface WeaponComponent {
  type: ComponentType;
  weaponType: WeaponType;
  name: string;
  description: string;
  icon: string;
  
  // Base stats
  baseDamage: number;
  baseAttackSpeed: number;
  baseRange: number;
  basePierce: number;
  projectileSpeed: number;
  
  // Level progression
  currentLevel: number;
  maxLevel: number;
  
  // Calculated stats (after upgrades)
  damage: number;
  attackSpeed: number;
  range: number;
  pierce: number;
  
  // Upgrade effects
  effects: {
    damageMultiplier?: number;
    fireRateMultiplier?: number;
    rangeBonus?: number;
    pierceBonus?: number;
    projectileCount?: number;
    areaRadius?: number;
    chainCount?: number;
  };
  
  // Weapon state
  isActive: boolean;
  isUnlocked: boolean;
}

// Entity that owns and can use weapons
export interface WeaponOwnerComponent {
  type: ComponentType;
  activeWeapons: WeaponType[];
  maxActiveWeapons: number;
  availableWeapons: WeaponType[];
  
  // Owner stats that affect weapons
  globalDamageMultiplier: number;
  globalAttackSpeedMultiplier: number;
  globalRangeMultiplier: number;
  globalPierceBonus: number;
  
  // Statistics
  totalShotsFired: number;
  totalHits: number;
  totalDamageDealt: number;
  accuracy: number;
}

// Individual weapon firing timers and state
export interface WeaponTimerComponent {
  type: ComponentType;
  weaponType: WeaponType;
  timeSinceLastFire: number;
  fireInterval: number;
  canFire: boolean;
  isFiring: boolean;
  burstCount: number;
  maxBurstCount: number;
  burstInterval: number;
  timeSinceLastBurst: number;
}

// Core projectile identity and behavior
export interface ProjectileComponent {
  type: ComponentType;
  projectileId: number;
  weaponType: WeaponType;
  ownerEntityId: string;
  
  // Projectile properties
  damage: number;
  pierceCount: number;
  maxPierce: number;
  lifetime: number;
  maxLifetime: number;
  
  // Projectile state
  isActive: boolean;
  hasHitTarget: boolean;
  targetsHit: string[];
  
  // Projectile behavior
  behaviorType: 'straight' | 'homing' | 'boomerang' | 'orbit' | 'spray';
  homingStrength?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  
  // Callbacks for events
  onHitCallback?: string; // Event to emit on hit
  onExpiredCallback?: string; // Event to emit on expiration
}

// Projectile movement and physics
export interface ProjectileMovementComponent {
  type: ComponentType;
  velocity: { x: number; y: number };
  speed: number;
  acceleration: { x: number; y: number };
  
  // Target tracking (for homing projectiles)
  targetEntityId?: string;
  targetPosition?: { x: number; y: number };
  lastKnownTargetPosition?: { x: number; y: number };
  
  // Movement modifiers
  gravityAffected: boolean;
  bounceCount: number;
  maxBounces: number;
  bounceDecay: number;
  
  // Rotation and spinning
  rotationSpeed: number; // Radians per second
  currentRotation: number;
  rotateTowardsVelocity: boolean;
  
  // Path tracking for boomerang behavior
  originPosition: { x: number; y: number };
  maxDistance: number;
  isReturning: boolean;
}

// Projectile visual representation and animation
export interface ProjectileVisualComponent {
  type: ComponentType;
  displayObject: Container;
  visualSprite: Sprite | Graphics | null;
  
  // Animation properties
  animationFrames: Sprite[];
  currentFrame: number;
  frameTimer: number;
  frameInterval: number;
  isAnimated: boolean;
  animationSpeed: number;
  
  // Visual effects
  scale: number;
  alpha: number;
  tint: number;
  visible: boolean;
  
  // Trail effect
  hasTrail: boolean;
  trailLength: number;
  trailPositions: Array<{ x: number; y: number; alpha: number }>;
  
  // Sprite loading
  spriteLoaded: boolean;
  fallbackCreated: boolean;
  textureAtlas?: Texture[];
}

// Beam-specific component (for continuous beam weapons)
export interface BeamComponent {
  type: ComponentType;
  beamId: number;
  weaponType: WeaponType;
  ownerEntityId: string;
  
  // Beam properties
  damage: number;
  range: number;
  width: number;
  maxPierce: number;
  
  // Beam behavior
  rotationDuration: number; // seconds for full rotation
  currentAngle: number; // current rotation angle in degrees
  totalRotation: number; // total degrees rotated
  rotationSpeed: number; // degrees per second
  
  // Beam state
  isActive: boolean;
  animationPhase: 'creation' | 'sustain' | 'destruction';
  lifetime: number;
  
  // Hit tracking to prevent multiple hits per second
  recentHits: Map<string, number>;
  hitCooldown: number;
  
  // Visual properties
  beamTextures: Texture[];
  currentFrame: number;
  animationTimer: number;
  frameInterval: number;
  pulsing: boolean;
  glowEffect: boolean;
}

// Beam visual representation
export interface BeamVisualComponent {
  type: ComponentType;
  displayObject: Container;
  beamSprite: Sprite | null;
  visualSprite: Sprite | Graphics | null;
  
  // Animation state
  animationFrames: Sprite[];
  currentFrame: number;
  animationTimer: number;
  
  // Visual effects
  alpha: number;
  pulseIntensity: number;
  scaleMultiplier: number;
  glowColor: number;
  
  // Sprite management
  spriteLoaded: boolean;
  fallbackCreated: boolean;
}

// Weapon upgrade system component
export interface WeaponUpgradeComponent {
  type: ComponentType;
  weaponType: WeaponType;
  
  // Available upgrades
  availableUpgrades: {
    damageLevel: number;
    attackSpeedLevel: number;
    rangeLevel: number;
    pierceLevel: number;
    specialLevel: number;
  };
  
  // Upgrade costs and effects
  upgradeCosts: {
    damageLevel: number[];
    attackSpeedLevel: number[];
    rangeLevel: number[];
    pierceLevel: number[];
    specialLevel: number[];
  };
  
  upgradeEffects: {
    damageMultipliers: number[];
    attackSpeedMultipliers: number[];
    rangeBonuses: number[];
    pierceBonuses: number[];
    specialEffects: Array<{
      type: string;
      value: number;
      description: string;
    }>;
  };
  
  // Upgrade resources
  availablePoints: number;
  totalPointsSpent: number;
}

// Weapon collision and targeting component
export interface WeaponTargetingComponent {
  type: ComponentType;
  weaponType: WeaponType;
  
  // Targeting behavior
  targetingType: 'nearest' | 'strongest' | 'weakest' | 'random' | 'manual';
  maxTargets: number;
  targetPriority: string[]; // Enemy types in priority order
  
  // Current targets
  currentTargets: string[]; // Entity IDs
  lastTargetPosition?: { x: number; y: number };
  targetLostTime?: number;
  
  // Targeting constraints
  targetRange: number;
  requireLineOfSight: boolean;
  canTargetSameEnemy: boolean;
  targetCooldown: number; // Time before can target same enemy again
  
  // Target tracking
  targetHistory: Array<{
    entityId: string;
    timestamp: number;
    damage: number;
  }>;
}

// Factory functions for weapon components
export const createWeaponComponent = (
  weaponType: WeaponType,
  config: {
    name: string;
    description: string;
    icon: string;
    baseDamage: number;
    baseAttackSpeed: number;
    baseRange: number;
    basePierce: number;
    projectileSpeed: number;
    maxLevel: number;
    effects?: any;
  }
): WeaponComponent => ({
  type: 'weapon' as ComponentType,
  weaponType,
  name: config.name,
  description: config.description,
  icon: config.icon,
  baseDamage: config.baseDamage,
  baseAttackSpeed: config.baseAttackSpeed,
  baseRange: config.baseRange,
  basePierce: config.basePierce,
  projectileSpeed: config.projectileSpeed,
  currentLevel: 1,
  maxLevel: config.maxLevel,
  damage: config.baseDamage,
  attackSpeed: config.baseAttackSpeed,
  range: config.baseRange,
  pierce: config.basePierce,
  effects: config.effects || {},
  isActive: false,
  isUnlocked: false,
});

export const createWeaponOwnerComponent = (): WeaponOwnerComponent => ({
  type: 'weapon-owner' as ComponentType,
  activeWeapons: [WeaponType.FIREBALL],
  maxActiveWeapons: 6,
  availableWeapons: [WeaponType.FIREBALL],
  globalDamageMultiplier: 1.0,
  globalAttackSpeedMultiplier: 1.0,
  globalRangeMultiplier: 1.0,
  globalPierceBonus: 0,
  totalShotsFired: 0,
  totalHits: 0,
  totalDamageDealt: 0,
  accuracy: 0,
});

export const createWeaponTimerComponent = (
  weaponType: WeaponType,
  fireInterval: number
): WeaponTimerComponent => ({
  type: 'weapon-timer' as ComponentType,
  weaponType,
  timeSinceLastFire: 0,
  fireInterval,
  canFire: true,
  isFiring: false,
  burstCount: 0,
  maxBurstCount: 1,
  burstInterval: 0.1,
  timeSinceLastBurst: 0,
});

export const createProjectileComponent = (
  weaponType: WeaponType,
  ownerEntityId: string,
  damage: number,
  maxPierce: number = 0,
  maxLifetime: number = 3
): ProjectileComponent => ({
  type: 'projectile' as ComponentType,
  projectileId: Math.random() * 1000000,
  weaponType,
  ownerEntityId,
  damage,
  pierceCount: 0,
  maxPierce,
  lifetime: 0,
  maxLifetime,
  isActive: true,
  hasHitTarget: false,
  targetsHit: [],
  behaviorType: 'straight',
});

export const createProjectileMovementComponent = (
  velocity: { x: number; y: number },
  speed: number
): ProjectileMovementComponent => ({
  type: 'projectile-movement' as ComponentType,
  velocity,
  speed,
  acceleration: { x: 0, y: 0 },
  gravityAffected: false,
  bounceCount: 0,
  maxBounces: 0,
  bounceDecay: 1.0,
  rotationSpeed: 0,
  currentRotation: 0,
  rotateTowardsVelocity: true,
  originPosition: { x: 0, y: 0 },
  maxDistance: 1000,
  isReturning: false,
});

export const createProjectileVisualComponent = (): ProjectileVisualComponent => ({
  type: 'projectile-visual' as ComponentType,
  displayObject: new Container(),
  visualSprite: null,
  animationFrames: [],
  currentFrame: 0,
  frameTimer: 0,
  frameInterval: 0.1,
  isAnimated: false,
  animationSpeed: 1.0,
  scale: 1.0,
  alpha: 1.0,
  tint: 0xffffff,
  visible: true,
  hasTrail: false,
  trailLength: 10,
  trailPositions: [],
  spriteLoaded: false,
  fallbackCreated: false,
});

export const createBeamComponent = (
  weaponType: WeaponType,
  ownerEntityId: string,
  damage: number,
  range: number,
  rotationDuration: number = 3
): BeamComponent => ({
  type: 'beam' as ComponentType,
  beamId: Math.random() * 1000000,
  weaponType,
  ownerEntityId,
  damage,
  range,
  width: 32,
  maxPierce: 0,
  rotationDuration,
  currentAngle: 0,
  totalRotation: 0,
  rotationSpeed: 360 / rotationDuration,
  isActive: true,
  animationPhase: 'creation',
  lifetime: 0,
  recentHits: new Map(),
  hitCooldown: 0.2,
  beamTextures: [],
  currentFrame: 0,
  animationTimer: 0,
  frameInterval: 0.1,
  pulsing: true,
  glowEffect: true,
});

export const createBeamVisualComponent = (): BeamVisualComponent => ({
  type: 'beam-visual' as ComponentType,
  displayObject: new Container(),
  beamSprite: null,
  visualSprite: null,
  animationFrames: [],
  currentFrame: 0,
  animationTimer: 0,
  alpha: 1.0,
  pulseIntensity: 0.2,
  scaleMultiplier: 1.0,
  glowColor: 0xff4444,
  spriteLoaded: false,
  fallbackCreated: false,
});

export const createWeaponUpgradeComponent = (weaponType: WeaponType): WeaponUpgradeComponent => ({
  type: 'weapon-upgrade' as ComponentType,
  weaponType,
  availableUpgrades: {
    damageLevel: 0,
    attackSpeedLevel: 0,
    rangeLevel: 0,
    pierceLevel: 0,
    specialLevel: 0,
  },
  upgradeCosts: {
    damageLevel: [1, 2, 3, 5, 8, 13, 21],
    attackSpeedLevel: [1, 2, 3, 5, 8, 13, 21],
    rangeLevel: [1, 2, 3, 5, 8, 13, 21],
    pierceLevel: [2, 4, 6, 10, 16, 26, 42],
    specialLevel: [3, 6, 9, 15, 24, 39, 63],
  },
  upgradeEffects: {
    damageMultipliers: [1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 3.0],
    attackSpeedMultipliers: [1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5],
    rangeBonuses: [25, 50, 75, 100, 125, 150, 200],
    pierceBonuses: [1, 2, 3, 4, 5, 6, 8],
    specialEffects: [],
  },
  availablePoints: 0,
  totalPointsSpent: 0,
});

export const createWeaponTargetingComponent = (weaponType: WeaponType): WeaponTargetingComponent => ({
  type: 'weapon-targeting' as ComponentType,
  weaponType,
  targetingType: 'nearest',
  maxTargets: 1,
  targetPriority: [],
  currentTargets: [],
  targetRange: 300,
  requireLineOfSight: false,
  canTargetSameEnemy: true,
  targetCooldown: 0,
  targetHistory: [],
}); 