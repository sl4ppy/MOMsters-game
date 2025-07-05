import { ComponentType, createComponentType } from '../../types/core';
import { CollisionGroup } from '../../core/CollisionManager';
import { DisplayObject } from 'pixi.js';

/**
 * Player-specific components for the ECS system
 */

// Core player identity component
export interface PlayerComponent {
  type: ComponentType;
  // Player identification
  playerId: string;
  isAlive: boolean;
  // Player state
  level: number;
  experience: number;
  // Player type (for multiple player support)
  playerType: 'main' | 'secondary' | 'ai';
  // Player preferences
  characterDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man';
  // Player stats
  killCount: number;
  survivalTime: number;
}

// Health and damage system
export interface PlayerHealthComponent {
  type: ComponentType;
  // Current health values
  health: number;
  maxHealth: number;
  // Base values (for upgrades)
  baseMaxHealth: number;
  // Regeneration system
  regenRate: number; // HP per second
  baseRegenRate: number; // Base rate for upgrades
  regenDelay: number; // Seconds before regen starts after damage
  timeSinceLastDamage: number;
  // Invulnerability system
  invulnerabilityTimer: number;
  invulnerabilityDuration: number;
  // State flags
  isInvulnerable: boolean;
  isDead: boolean;
  // Damage tracking
  damageTaken: number;
  damageDealt: number;
}

// Movement and physics
export interface PlayerMovementComponent {
  type: ComponentType;
  // Speed values
  speed: number; // pixels per second
  baseSpeed: number; // Base speed for upgrades
  // Bounds constraints
  worldBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  // Movement state
  isMoving: boolean;
  lastMoveDirection: { x: number; y: number };
  // Movement modifiers
  speedMultiplier: number;
  isFrozen: boolean;
  // Physics
  friction: number;
  acceleration: number;
}

// Visual representation and animation
export interface PlayerSpriteComponent {
  type: ComponentType;
  // Display object
  displayObject: DisplayObject;
  // Sprite management
  currentDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man';
  availableDesigns: string[];
  // Animation state
  animationTime: number;
  animationSpeed: number;
  // Visual effects
  glowIntensity: number;
  pulseRate: number;
  // Orientation
  facingDirection: number; // radians
  flipX: boolean;
  // Visibility
  isVisible: boolean;
  alpha: number;
}

// Collision system
export interface PlayerCollisionComponent {
  type: ComponentType;
  // Collision properties
  radius: number;
  group: CollisionGroup;
  // Collision state
  isCollidable: boolean;
  collisionMask: CollisionGroup[]; // What this can collide with
  // Collision tracking
  lastCollisionTime: number;
  collisionCount: number;
  // Collision callbacks
  onCollisionEnter?: (other: any) => void;
  onCollisionExit?: (other: any) => void;
}

// Input handling
export interface PlayerInputComponent {
  type: ComponentType;
  // Input state
  inputEnabled: boolean;
  // Key bindings
  keyBindings: {
    moveUp: string;
    moveDown: string;
    moveLeft: string;
    moveRight: string;
    switchDesign: string[];
    debug: string[];
  };
  // Input processing
  processMovement: boolean;
  processActions: boolean;
  // Input history (for combos, etc.)
  inputHistory: Array<{
    key: string;
    timestamp: number;
    action: 'press' | 'release';
  }>;
}

// Animation and effects
export interface PlayerAnimationComponent {
  type: ComponentType;
  // Animation state
  currentAnimation: string;
  animationTime: number;
  animationSpeed: number;
  // Animation queue
  animationQueue: Array<{
    name: string;
    duration: number;
    loop: boolean;
    priority: number;
  }>;
  // Animation effects
  isAnimating: boolean;
  repeatCount: number;
  // Visual effects
  effectsEnabled: boolean;
  particleEffects: string[];
}

// Upgrade system
export interface PlayerUpgradeComponent {
  type: ComponentType;
  // Health upgrades
  healthBonus: number;
  regenBonus: number;
  // Speed upgrades
  speedBonus: number;
  // Defensive upgrades
  damageReduction: number;
  invulnerabilityBonus: number;
  // Offensive upgrades
  damageBonus: number;
  criticalChance: number;
  // Utility upgrades
  experienceBonus: number;
  dropRateBonus: number;
  // Upgrade tracking
  totalUpgrades: number;
  upgradePoints: number;
}

// Player-specific events component
export interface PlayerEventComponent {
  type: ComponentType;
  // Event callbacks
  onDamageTaken?: (damage: number) => void;
  onPlayerDied?: () => void;
  onLevelUp?: (newLevel: number) => void;
  onHealthRegenerated?: (amount: number) => void;
  onUpgradeApplied?: (upgradeType: string) => void;
  // Event history
  eventHistory: Array<{
    type: string;
    timestamp: number;
    data: any;
  }>;
  // Event flags
  eventsEnabled: boolean;
  logEvents: boolean;
}

// Component type constants
export const PLAYER_COMPONENT = createComponentType('player');
export const PLAYER_HEALTH_COMPONENT = createComponentType('player_health');
export const PLAYER_MOVEMENT_COMPONENT = createComponentType('player_movement');
export const PLAYER_SPRITE_COMPONENT = createComponentType('player_sprite');
export const PLAYER_COLLISION_COMPONENT = createComponentType('player_collision');
export const PLAYER_INPUT_COMPONENT = createComponentType('player_input');
export const PLAYER_ANIMATION_COMPONENT = createComponentType('player_animation');
export const PLAYER_UPGRADE_COMPONENT = createComponentType('player_upgrade');
export const PLAYER_EVENT_COMPONENT = createComponentType('player_event');

// Factory functions for creating components
export function createPlayerComponent(
  playerId: string = 'player_1',
  playerType: 'main' | 'secondary' | 'ai' = 'main',
  characterDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man' = 'hexagon'
): PlayerComponent {
  return {
    type: PLAYER_COMPONENT,
    playerId,
    isAlive: true,
    level: 1,
    experience: 0,
    playerType,
    characterDesign,
    killCount: 0,
    survivalTime: 0,
  };
}

export function createPlayerHealthComponent(
  health: number = 100,
  maxHealth: number = 100,
  regenRate: number = 0.5,
  regenDelay: number = 5,
  invulnerabilityDuration: number = 60
): PlayerHealthComponent {
  return {
    type: PLAYER_HEALTH_COMPONENT,
    health,
    maxHealth,
    baseMaxHealth: maxHealth,
    regenRate,
    baseRegenRate: regenRate,
    regenDelay,
    timeSinceLastDamage: 0,
    invulnerabilityTimer: 0,
    invulnerabilityDuration,
    isInvulnerable: false,
    isDead: false,
    damageTaken: 0,
    damageDealt: 0,
  };
}

export function createPlayerMovementComponent(
  speed: number = 200,
  worldBounds: { minX: number; maxX: number; minY: number; maxY: number } = {
    minX: -1000,
    maxX: 1000,
    minY: -1000,
    maxY: 1000,
  }
): PlayerMovementComponent {
  return {
    type: PLAYER_MOVEMENT_COMPONENT,
    speed,
    baseSpeed: speed,
    worldBounds,
    isMoving: false,
    lastMoveDirection: { x: 0, y: 0 },
    speedMultiplier: 1.0,
    isFrozen: false,
    friction: 0.8,
    acceleration: 1.0,
  };
}

export function createPlayerSpriteComponent(
  displayObject: DisplayObject,
  currentDesign: 'hexagon' | 'circle' | 'godzilla' | 'shark_man' = 'hexagon'
): PlayerSpriteComponent {
  return {
    type: PLAYER_SPRITE_COMPONENT,
    displayObject,
    currentDesign,
    availableDesigns: ['hexagon', 'circle', 'godzilla', 'shark_man'],
    animationTime: 0,
    animationSpeed: 1.0,
    glowIntensity: 0.5,
    pulseRate: 1.0,
    facingDirection: 0,
    flipX: false,
    isVisible: true,
    alpha: 1.0,
  };
}

export function createPlayerCollisionComponent(
  radius: number = 25,
  group: CollisionGroup = CollisionGroup.PLAYER
): PlayerCollisionComponent {
  return {
    type: PLAYER_COLLISION_COMPONENT,
    radius,
    group,
    isCollidable: true,
    collisionMask: [CollisionGroup.ENEMY, CollisionGroup.PROJECTILE],
    lastCollisionTime: 0,
    collisionCount: 0,
  };
}

export function createPlayerInputComponent(
  inputEnabled: boolean = true
): PlayerInputComponent {
  return {
    type: PLAYER_INPUT_COMPONENT,
    inputEnabled,
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
  };
}

export function createPlayerAnimationComponent(
  currentAnimation: string = 'idle',
  animationSpeed: number = 1.0
): PlayerAnimationComponent {
  return {
    type: PLAYER_ANIMATION_COMPONENT,
    currentAnimation,
    animationTime: 0,
    animationSpeed,
    animationQueue: [],
    isAnimating: false,
    repeatCount: 0,
    effectsEnabled: true,
    particleEffects: [],
  };
}

export function createPlayerUpgradeComponent(): PlayerUpgradeComponent {
  return {
    type: PLAYER_UPGRADE_COMPONENT,
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
  };
}

export function createPlayerEventComponent(): PlayerEventComponent {
  return {
    type: PLAYER_EVENT_COMPONENT,
    eventHistory: [],
    eventsEnabled: true,
    logEvents: false,
  };
}

// Helper functions
export function getPlayerPosition(sprite: PlayerSpriteComponent): { x: number; y: number } {
  return {
    x: sprite.displayObject.x,
    y: sprite.displayObject.y,
  };
}

export function setPlayerPosition(sprite: PlayerSpriteComponent, x: number, y: number): void {
  sprite.displayObject.x = x;
  sprite.displayObject.y = y;
}

export function getPlayerHealthPercent(health: PlayerHealthComponent): number {
  return health.maxHealth > 0 ? (health.health / health.maxHealth) * 100 : 0;
}

export function isPlayerAlive(health: PlayerHealthComponent): boolean {
  return health.health > 0 && !health.isDead;
}

export function applyPlayerHealthUpgrade(
  health: PlayerHealthComponent,
  upgrade: PlayerUpgradeComponent,
  healthBonus: number,
  regenBonus: number
): void {
  upgrade.healthBonus += healthBonus;
  upgrade.regenBonus += regenBonus;
  
  // Apply upgrades to health component
  health.maxHealth = health.baseMaxHealth + upgrade.healthBonus;
  health.regenRate = health.baseRegenRate + upgrade.regenBonus;
  
  // Heal player to new max if needed
  if (health.health > health.maxHealth) {
    health.health = health.maxHealth;
  }
}

export function applyPlayerSpeedUpgrade(
  movement: PlayerMovementComponent,
  upgrade: PlayerUpgradeComponent,
  speedBonus: number
): void {
  upgrade.speedBonus += speedBonus;
  movement.speed = movement.baseSpeed + upgrade.speedBonus;
} 