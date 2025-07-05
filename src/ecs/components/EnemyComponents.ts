import { ComponentType } from '../../types/core';
import { Container, Sprite, Graphics } from 'pixi.js';
import { EnemySpriteConfig } from '../../core/EnemySpriteManager';

// Enemy identity and core stats
export interface EnemyComponent {
  type: ComponentType;
  enemyId: number;
  enemyType: number; // 0-29 for the 30 enemy types
  name: string;
  level: number;
  xpValue: number;
  attackDamage: number;
  isAlive: boolean;
  createdAt: number;
  killCount?: number; // Track kills for dynamic scaling
}

// Enemy health management
export interface EnemyHealthComponent {
  type: ComponentType;
  health: number;
  maxHealth: number;
  healthPercent: number;
  lastDamageTime: number;
  lastDamageAmount: number;
  isInvulnerable: boolean;
  invulnerabilityDuration: number;
  deathTime?: number;
  damageHistory: Array<{
    amount: number;
    time: number;
    source?: string;
  }>;
}

// Enemy movement patterns and behaviors
export interface EnemyMovementComponent {
  type: ComponentType;
  speed: number;
  baseSpeed: number;
  movementType: 'basic' | 'hopping' | 'circling' | 'teleporting' | 'charging';
  
  // Basic movement
  targetX: number;
  targetY: number;
  
  // Hopping movement (for Blob and ChompChest)
  isHopping: boolean;
  hopCooldown: number;
  hopDuration: number;
  hopCooldownTime: number;
  hopHeight: number;
  hopTimer: number;
  hopStartX: number;
  hopStartY: number;
  hopTargetX: number;
  hopTargetY: number;
  originalY: number;
  
  // Movement constraints
  canMoveOutsideScreen: boolean;
  movementBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// Enemy AI behavior and state
export interface EnemyAIComponent {
  type: ComponentType;
  behaviorType: 'aggressive' | 'defensive' | 'neutral' | 'smart' | 'pack';
  state: 'idle' | 'chasing' | 'attacking' | 'fleeing' | 'patrolling' | 'stunned';
  
  // Target tracking
  targetEntityId?: string;
  lastTargetPosition?: { x: number; y: number };
  lostTargetTime?: number;
  
  // Behavior parameters
  detectionRange: number;
  attackRange: number;
  fleeHealthThreshold: number;
  
  // State timers
  stateTimer: number;
  lastStateChange: number;
  
  // AI decision making
  decisionCooldown: number;
  lastDecisionTime: number;
  
  // Pack behavior (for pack AI)
  packId?: string;
  packRole?: 'leader' | 'follower' | 'scout';
}

// Enemy sprite and visual representation
export interface EnemySpriteComponent {
  type: ComponentType;
  displayObject: Container;
  visualSprite: Sprite | Graphics | null;
  config: EnemySpriteConfig;
  
  // Sprite properties
  scale: number;
  rotation: number;
  alpha: number;
  visible: boolean;
  
  // Visual effects
  flashColor?: number;
  flashDuration: number;
  flashTimer: number;
  
  // Animation state
  isAnimating: boolean;
  animationSpeed: number;
  
  // Sprite management
  spriteLoaded: boolean;
  fallbackCreated: boolean;
  customSpritePath?: string;
}

// Enemy collision properties
export interface EnemyCollisionComponent {
  type: ComponentType;
  collisionRadius: number;
  collisionMask: number;
  collisionGroup: number;
  
  // Collision tracking
  lastCollisionTime: number;
  collisionHistory: Array<{
    entityId: string;
    time: number;
    position: { x: number; y: number };
    damage?: number;
  }>;
  
  // Damage dealing
  canDealDamage: boolean;
  damageDealt: number;
  damageCooldown: number;
  lastDamageDealtTime: number;
  
  // Collision behavior
  bounceOnCollision: boolean;
  pushBackForce: number;
  canPushOthers: boolean;
}

// Enemy animation and visual effects
export interface EnemyAnimationComponent {
  type: ComponentType;
  currentAnimation: string;
  animationQueue: Array<{
    name: string;
    duration: number;
    loop: boolean;
    onComplete?: () => void;
  }>;
  
  // Animation timers
  animationTimer: number;
  animationDuration: number;
  animationLoop: boolean;
  
  // Visual effects
  effects: Array<{
    type: 'flash' | 'shake' | 'bounce' | 'fade' | 'pulse';
    duration: number;
    intensity: number;
    startTime: number;
    parameters?: Record<string, any>;
  }>;
  
  // Facing direction
  facing: 'left' | 'right' | 'up' | 'down';
  lastFacingChange: number;
  
  // Death animation
  deathAnimation: {
    started: boolean;
    duration: number;
    timer: number;
    fadeOut: boolean;
    shrink: boolean;
    rotate: boolean;
  };
}

// Enemy event tracking
export interface EnemyEventComponent {
  type: ComponentType;
  eventCallbacks: Map<string, Array<(data: any) => void>>;
  eventHistory: Array<{
    event: string;
    data: any;
    timestamp: number;
  }>;
  
  // Event emission
  lastEventTime: number;
  eventCooldowns: Map<string, number>;
  
  // Lifecycle events
  onCreated?: (enemy: any) => void;
  onDamaged?: (damage: number, source?: string) => void;
  onDeath?: (killer?: string) => void;
  onDestroyed?: () => void;
}

// Factory functions for enemy components
export const createEnemyComponent = (
  enemyId: number,
  enemyType: number,
  config: EnemySpriteConfig
): EnemyComponent => ({
  type: 'enemy' as ComponentType,
  enemyId,
  enemyType,
  name: config.name,
  level: 1,
  xpValue: config.xpValue,
  attackDamage: config.damage,
  isAlive: true,
  createdAt: Date.now(),
});

export const createEnemyHealthComponent = (
  health: number
): EnemyHealthComponent => ({
  type: 'enemy-health' as ComponentType,
  health,
  maxHealth: health,
  healthPercent: 1.0,
  lastDamageTime: 0,
  lastDamageAmount: 0,
  isInvulnerable: false,
  invulnerabilityDuration: 0,
  damageHistory: [],
});

export const createEnemyMovementComponent = (
  speed: number,
  movementType: EnemyMovementComponent['movementType'] = 'basic'
): EnemyMovementComponent => ({
  type: 'enemy-movement' as ComponentType,
  speed,
  baseSpeed: speed,
  movementType,
  targetX: 0,
  targetY: 0,
  isHopping: false,
  hopCooldown: 0,
  hopDuration: 0.6,
  hopCooldownTime: 1.0,
  hopHeight: 30,
  hopTimer: 0,
  hopStartX: 0,
  hopStartY: 0,
  hopTargetX: 0,
  hopTargetY: 0,
  originalY: 0,
  canMoveOutsideScreen: false,
});

export const createEnemyAIComponent = (
  behaviorType: EnemyAIComponent['behaviorType'] = 'aggressive'
): EnemyAIComponent => ({
  type: 'enemy-ai' as ComponentType,
  behaviorType,
  state: 'idle',
  detectionRange: 200,
  attackRange: 30,
  fleeHealthThreshold: 0.2,
  stateTimer: 0,
  lastStateChange: 0,
  decisionCooldown: 0.5,
  lastDecisionTime: 0,
});

export const createEnemySpriteComponent = (
  config: EnemySpriteConfig
): EnemySpriteComponent => ({
  type: 'enemy-sprite' as ComponentType,
  displayObject: new Container(),
  visualSprite: null,
  config,
  scale: config.scale || 1.0,
  rotation: 0,
  alpha: 1.0,
  visible: true,
  flashDuration: 0,
  flashTimer: 0,
  isAnimating: false,
  animationSpeed: 1.0,
  spriteLoaded: false,
  fallbackCreated: false,
  customSpritePath: config.customSprite,
});

export const createEnemyCollisionComponent = (
  collisionRadius: number,
  damage: number
): EnemyCollisionComponent => ({
  type: 'enemy-collision' as ComponentType,
  collisionRadius,
  collisionMask: 0b0011, // Can collide with player and projectiles
  collisionGroup: 0b0010, // Enemy collision group
  lastCollisionTime: 0,
  collisionHistory: [],
  canDealDamage: true,
  damageDealt: damage,
  damageCooldown: 1000, // 1 second cooldown between damage
  lastDamageDealtTime: 0,
  bounceOnCollision: false,
  pushBackForce: 0,
  canPushOthers: false,
});

export const createEnemyAnimationComponent = (): EnemyAnimationComponent => ({
  type: 'enemy-animation' as ComponentType,
  currentAnimation: 'idle',
  animationQueue: [],
  animationTimer: 0,
  animationDuration: 0,
  animationLoop: true,
  effects: [],
  facing: 'right',
  lastFacingChange: 0,
  deathAnimation: {
    started: false,
    duration: 1000,
    timer: 0,
    fadeOut: true,
    shrink: true,
    rotate: false,
  },
});

export const createEnemyEventComponent = (): EnemyEventComponent => ({
  type: 'enemy-event' as ComponentType,
  eventCallbacks: new Map(),
  eventHistory: [],
  lastEventTime: 0,
  eventCooldowns: new Map(),
}); 