import { ComponentType, createComponentType } from '../../types/core';

/**
 * Camera-related components for the ECS system
 */

// Component for entities that can be cameras
export interface CameraComponent {
  type: ComponentType;
  // Viewport dimensions
  viewport: {
    width: number;
    height: number;
  };
  // Current camera position in world space
  position: {
    x: number;
    y: number;
  };
  // Target position for smooth following
  target: {
    x: number;
    y: number;
  };
  // Camera behavior settings
  followSpeed: number; // 0.01 to 1.0 (0.1 = smooth, 1.0 = instant)
  zoom: number; // 1.0 = normal, 0.5 = zoomed out, 2.0 = zoomed in
  rotation: number; // Camera rotation in radians
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  // Camera state
  isActive: boolean;
  priority: number; // Higher priority cameras take precedence
}

export const CAMERA_COMPONENT: ComponentType = createComponentType('camera');

export function createCameraComponent(
  viewportWidth: number,
  viewportHeight: number,
  initialX: number = 0,
  initialY: number = 0,
  followSpeed: number = 0.1,
  zoom: number = 1.0,
  isActive: boolean = true,
  priority: number = 0
): CameraComponent {
  return {
    type: CAMERA_COMPONENT,
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
    },
    position: {
      x: initialX,
      y: initialY,
    },
    target: {
      x: initialX,
      y: initialY,
    },
    followSpeed: Math.max(0.01, Math.min(1.0, followSpeed)),
    zoom,
    rotation: 0,
    isActive,
    priority,
  };
}

// Component for entities that can be followed by cameras
export interface CameraTargetComponent {
  type: ComponentType;
  // Target priority (higher = more important to follow)
  priority: number;
  // Offset from entity position where camera should focus
  offset: {
    x: number;
    y: number;
  };
  // Whether this target is currently active
  isActive: boolean;
  // Smooth follow settings specific to this target
  followSettings?: {
    speed: number;
    deadzone: number; // Minimum distance before camera starts following
    lookahead: number; // How far ahead to look based on velocity
  };
}

export const CAMERA_TARGET_COMPONENT: ComponentType = createComponentType('camera_target');

export function createCameraTargetComponent(
  priority: number = 1,
  offsetX: number = 0,
  offsetY: number = 0,
  isActive: boolean = true,
  followSettings?: {
    speed: number;
    deadzone: number;
    lookahead: number;
  }
): CameraTargetComponent {
  return {
    type: CAMERA_TARGET_COMPONENT,
    priority,
    offset: {
      x: offsetX,
      y: offsetY,
    },
    isActive,
    followSettings,
  };
}

// Component for camera shake effects
export interface CameraShakeComponent {
  type: ComponentType;
  // Current shake parameters
  intensity: number;
  duration: number;
  frequency: number;
  // Shake type and behavior
  shakeType: 'trauma' | 'perlin' | 'random' | 'directional';
  direction?: {
    x: number;
    y: number;
  };
  // Decay settings
  decay: number; // How quickly shake reduces over time
  // Current shake state
  currentTime: number;
  currentOffset: {
    x: number;
    y: number;
  };
  isActive: boolean;
}

export const CAMERA_SHAKE_COMPONENT: ComponentType = createComponentType('camera_shake');

export function createCameraShakeComponent(
  intensity: number = 1.0,
  duration: number = 1000, // milliseconds
  frequency: number = 30, // Hz
  shakeType: 'trauma' | 'perlin' | 'random' | 'directional' = 'trauma',
  direction?: { x: number; y: number },
  decay: number = 0.8
): CameraShakeComponent {
  return {
    type: CAMERA_SHAKE_COMPONENT,
    intensity,
    duration,
    frequency,
    shakeType,
    direction,
    decay,
    currentTime: 0,
    currentOffset: { x: 0, y: 0 },
    isActive: false,
  };
}

// Component for camera constraints and behavior
export interface CameraConstraintComponent {
  type: ComponentType;
  // World bounds the camera cannot go outside
  worldBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  // Zoom constraints
  zoomConstraints: {
    min: number;
    max: number;
    speed: number; // Zoom change speed
  };
  // Follow constraints
  followConstraints: {
    deadzone: {
      width: number;
      height: number;
    };
    maxDistance: number; // Maximum distance before instant snap
    lookAhead: number; // How far to look ahead based on target velocity
  };
  // Smoothing and interpolation
  smoothing: {
    position: number; // Position smoothing factor
    zoom: number; // Zoom smoothing factor
    rotation: number; // Rotation smoothing factor
  };
}

export const CAMERA_CONSTRAINT_COMPONENT: ComponentType = createComponentType('camera_constraint');

export function createCameraConstraintComponent(
  worldBounds?: { minX: number; maxX: number; minY: number; maxY: number },
  zoomMin: number = 0.1,
  zoomMax: number = 10.0,
  zoomSpeed: number = 0.1,
  deadzoneWidth: number = 100,
  deadzoneHeight: number = 100,
  maxDistance: number = 1000,
  lookAhead: number = 0.2
): CameraConstraintComponent {
  return {
    type: CAMERA_CONSTRAINT_COMPONENT,
    worldBounds,
    zoomConstraints: {
      min: zoomMin,
      max: zoomMax,
      speed: zoomSpeed,
    },
    followConstraints: {
      deadzone: {
        width: deadzoneWidth,
        height: deadzoneHeight,
      },
      maxDistance,
      lookAhead,
    },
    smoothing: {
      position: 0.1,
      zoom: 0.05,
      rotation: 0.1,
    },
  };
}

// Component for viewport and culling information
export interface CameraViewportComponent {
  type: ComponentType;
  // Cached viewport bounds in world space
  visibleBounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  // Culling margin for off-screen objects
  cullingMargin: number;
  // Transformation matrices (cached for performance)
  worldToScreen: {
    a: number; b: number; c: number; d: number; tx: number; ty: number;
  };
  screenToWorld: {
    a: number; b: number; c: number; d: number; tx: number; ty: number;
  };
  // Whether transformations need to be recalculated
  isDirty: boolean;
}

export const CAMERA_VIEWPORT_COMPONENT: ComponentType = createComponentType('camera_viewport');

export function createCameraViewportComponent(
  cullingMargin: number = 100
): CameraViewportComponent {
  return {
    type: CAMERA_VIEWPORT_COMPONENT,
    visibleBounds: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    cullingMargin,
    worldToScreen: {
      a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0,
    },
    screenToWorld: {
      a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0,
    },
    isDirty: true,
  };
} 