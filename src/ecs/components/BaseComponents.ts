import { ComponentType, createComponentType } from '../../types/core';
import { Component } from '../interfaces';

/**
 * Base component types for common game functionality
 */

// Position component
export interface PositionComponent extends Component {
  type: ComponentType;
  x: number;
  y: number;
  z?: number;
}

export const POSITION_COMPONENT = createComponentType('position');

export function createPositionComponent(x: number, y: number, z?: number): PositionComponent {
  return {
    type: POSITION_COMPONENT,
    x,
    y,
    z,
  };
}

// Velocity component
export interface VelocityComponent extends Component {
  type: ComponentType;
  vx: number;
  vy: number;
  vz?: number;
}

export const VELOCITY_COMPONENT = createComponentType('velocity');

export function createVelocityComponent(vx: number, vy: number, vz?: number): VelocityComponent {
  return {
    type: VELOCITY_COMPONENT,
    vx,
    vy,
    vz,
  };
}

// Render component
export interface RenderComponent extends Component {
  type: ComponentType;
  sprite?: any; // PIXI.Sprite or similar
  visible: boolean;
  scale: number;
  rotation: number;
  tint?: number;
}

export const RENDER_COMPONENT = createComponentType('render');

export function createRenderComponent(
  sprite?: any,
  visible: boolean = true,
  scale: number = 1,
  rotation: number = 0,
  tint?: number
): RenderComponent {
  return {
    type: RENDER_COMPONENT,
    sprite,
    visible,
    scale,
    rotation,
    tint,
  };
}

// Health component
export interface HealthComponent extends Component {
  type: ComponentType;
  current: number;
  max: number;
  regeneration?: number;
}

export const HEALTH_COMPONENT = createComponentType('health');

export function createHealthComponent(
  max: number,
  current?: number,
  regeneration?: number
): HealthComponent {
  return {
    type: HEALTH_COMPONENT,
    current: current ?? max,
    max,
    regeneration,
  };
}

// Transform component (combines position, rotation, scale)
export interface TransformComponent extends Component {
  type: ComponentType;
  position: { x: number; y: number; z?: number };
  rotation: number;
  scale: { x: number; y: number };
}

export const TRANSFORM_COMPONENT = createComponentType('transform');

export function createTransformComponent(
  x: number = 0,
  y: number = 0,
  rotation: number = 0,
  scaleX: number = 1,
  scaleY: number = 1,
  z?: number
): TransformComponent {
  return {
    type: TRANSFORM_COMPONENT,
    position: { x, y, z },
    rotation,
    scale: { x: scaleX, y: scaleY },
  };
}

// Movement component
export interface MovementComponent extends Component {
  type: ComponentType;
  speed: number;
  direction: { x: number; y: number };
  acceleration?: number;
  drag?: number;
}

export const MOVEMENT_COMPONENT = createComponentType('movement');

export function createMovementComponent(
  speed: number,
  directionX: number = 0,
  directionY: number = 0,
  acceleration?: number,
  drag?: number
): MovementComponent {
  return {
    type: MOVEMENT_COMPONENT,
    speed,
    direction: { x: directionX, y: directionY },
    acceleration,
    drag,
  };
}

// Collision component
export interface CollisionComponent extends Component {
  type: ComponentType;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  layer: string;
  mask: string[];
  isTrigger: boolean;
}

export const COLLISION_COMPONENT = createComponentType('collision');

export function createCollisionComponent(
  x: number,
  y: number,
  width: number,
  height: number,
  layer: string = 'default',
  mask: string[] = ['default'],
  isTrigger: boolean = false
): CollisionComponent {
  return {
    type: COLLISION_COMPONENT,
    bounds: { x, y, width, height },
    layer,
    mask,
    isTrigger,
  };
} 