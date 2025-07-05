import { EntityId } from '../types/core';
import { TypedGameEvent } from './interfaces';

/**
 * Camera-related events for the EventBus system
 */

// Camera position and target events
export interface CameraMovedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  position: {
    x: number;
    y: number;
  };
  previousPosition: {
    x: number;
    y: number;
  };
  timestamp: number;
}> {
  type: 'camera:moved';
}

export interface CameraTargetChangedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  targetId?: EntityId;
  targetPosition: {
    x: number;
    y: number;
  };
  timestamp: number;
}> {
  type: 'camera:target_changed';
}

export interface CameraFollowEvent extends TypedGameEvent<{
  cameraId: EntityId;
  targetId: EntityId;
  followSpeed: number;
  timestamp: number;
}> {
  type: 'camera:follow';
}

export interface CameraStopFollowEvent extends TypedGameEvent<{
  cameraId: EntityId;
  targetId?: EntityId;
  timestamp: number;
}> {
  type: 'camera:stop_follow';
}

// Camera zoom and transformation events
export interface CameraZoomedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  zoom: number;
  previousZoom: number;
  timestamp: number;
}> {
  type: 'camera:zoomed';
}

export interface CameraRotatedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  rotation: number;
  previousRotation: number;
  timestamp: number;
}> {
  type: 'camera:rotated';
}

export interface CameraTransformEvent extends TypedGameEvent<{
  cameraId: EntityId;
  position: { x: number; y: number };
  zoom: number;
  rotation: number;
  timestamp: number;
}> {
  type: 'camera:transform';
}

// Camera shake events
export interface CameraShakeStartEvent extends TypedGameEvent<{
  cameraId: EntityId;
  intensity: number;
  duration: number;
  shakeType: 'trauma' | 'perlin' | 'random' | 'directional';
  direction?: { x: number; y: number };
  timestamp: number;
}> {
  type: 'camera:shake_start';
}

export interface CameraShakeStopEvent extends TypedGameEvent<{
  cameraId: EntityId;
  timestamp: number;
}> {
  type: 'camera:shake_stop';
}

export interface CameraShakeUpdateEvent extends TypedGameEvent<{
  cameraId: EntityId;
  offset: { x: number; y: number };
  intensity: number;
  remainingTime: number;
  timestamp: number;
}> {
  type: 'camera:shake_update';
}

// Camera viewport and bounds events
export interface CameraViewportChangedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  viewport: {
    width: number;
    height: number;
  };
  visibleBounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  timestamp: number;
}> {
  type: 'camera:viewport_changed';
}

export interface CameraBoundsChangedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  timestamp: number;
}> {
  type: 'camera:bounds_changed';
}

// Camera activation and switching events
export interface CameraActivatedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  priority: number;
  timestamp: number;
}> {
  type: 'camera:activated';
}

export interface CameraDeactivatedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  timestamp: number;
}> {
  type: 'camera:deactivated';
}

export interface CameraSwitchedEvent extends TypedGameEvent<{
  previousCameraId?: EntityId;
  newCameraId: EntityId;
  reason: 'priority' | 'manual' | 'target_changed' | 'camera_destroyed';
  timestamp: number;
}> {
  type: 'camera:switched';
}

// Camera constraint events
export interface CameraConstraintAppliedEvent extends TypedGameEvent<{
  cameraId: EntityId;
  constraintType: 'world_bounds' | 'zoom_limits' | 'follow_deadzone' | 'max_distance';
  originalValue: { x?: number; y?: number; zoom?: number };
  constrainedValue: { x?: number; y?: number; zoom?: number };
  timestamp: number;
}> {
  type: 'camera:constraint_applied';
}

// Camera culling events (for performance optimization)
export interface CameraCullingUpdateEvent extends TypedGameEvent<{
  cameraId: EntityId;
  visibleEntities: EntityId[];
  culledEntities: EntityId[];
  timestamp: number;
}> {
  type: 'camera:culling_update';
}

// Event factory functions
export class CameraEventFactory {
  public static createCameraMoved(
    cameraId: EntityId,
    position: { x: number; y: number },
    previousPosition: { x: number; y: number }
  ): CameraMovedEvent {
    return {
      type: 'camera:moved',
      timestamp: Date.now(),
      entityId: cameraId,
      data: {
        cameraId,
        position,
        previousPosition,
        timestamp: Date.now(),
      },
    };
  }

  public static createCameraTargetChanged(
    cameraId: EntityId,
    targetPosition: { x: number; y: number },
    targetId?: EntityId
  ): CameraTargetChangedEvent {
    return {
      type: 'camera:target_changed',
      timestamp: Date.now(),
      entityId: cameraId,
      data: {
        cameraId,
        targetId,
        targetPosition,
        timestamp: Date.now(),
      },
    };
  }

  public static createCameraZoomed(
    cameraId: EntityId,
    zoom: number,
    previousZoom: number
  ): CameraZoomedEvent {
    return {
      type: 'camera:zoomed',
      timestamp: Date.now(),
      entityId: cameraId,
      data: {
        cameraId,
        zoom,
        previousZoom,
        timestamp: Date.now(),
      },
    };
  }

  public static createCameraShakeStart(
    cameraId: EntityId,
    intensity: number,
    duration: number,
    shakeType: 'trauma' | 'perlin' | 'random' | 'directional',
    direction?: { x: number; y: number }
  ): CameraShakeStartEvent {
    return {
      type: 'camera:shake_start',
      timestamp: Date.now(),
      entityId: cameraId,
      data: {
        cameraId,
        intensity,
        duration,
        shakeType,
        direction,
        timestamp: Date.now(),
      },
    };
  }

  public static createCameraShakeStop(cameraId: EntityId): CameraShakeStopEvent {
    return {
      type: 'camera:shake_stop',
      timestamp: Date.now(),
      entityId: cameraId,
      data: {
        cameraId,
        timestamp: Date.now(),
      },
    };
  }

  public static createCameraViewportChanged(
    cameraId: EntityId,
    viewport: { width: number; height: number },
    visibleBounds: { left: number; right: number; top: number; bottom: number }
  ): CameraViewportChangedEvent {
    return {
      type: 'camera:viewport_changed',
      timestamp: Date.now(),
      entityId: cameraId,
      data: {
        cameraId,
        viewport,
        visibleBounds,
        timestamp: Date.now(),
      },
    };
  }

  public static createCameraSwitched(
    newCameraId: EntityId,
    previousCameraId?: EntityId,
    reason: 'priority' | 'manual' | 'target_changed' | 'camera_destroyed' = 'manual'
  ): CameraSwitchedEvent {
    return {
      type: 'camera:switched',
      timestamp: Date.now(),
      entityId: newCameraId,
      data: {
        previousCameraId,
        newCameraId,
        reason,
        timestamp: Date.now(),
      },
    };
  }

  public static createCameraFollow(
    cameraId: EntityId,
    targetId: EntityId,
    followSpeed: number
  ): CameraFollowEvent {
    return {
      type: 'camera:follow',
      timestamp: Date.now(),
      entityId: cameraId,
      data: {
        cameraId,
        targetId,
        followSpeed,
        timestamp: Date.now(),
      },
    };
  }
}

// Camera event type constants
export const CAMERA_EVENT_TYPES = {
  // Position and movement
  MOVED: 'camera:moved',
  TARGET_CHANGED: 'camera:target_changed',
  FOLLOW: 'camera:follow',
  STOP_FOLLOW: 'camera:stop_follow',

  // Transform
  ZOOMED: 'camera:zoomed',
  ROTATED: 'camera:rotated',
  TRANSFORM: 'camera:transform',

  // Shake
  SHAKE_START: 'camera:shake_start',
  SHAKE_STOP: 'camera:shake_stop',
  SHAKE_UPDATE: 'camera:shake_update',

  // Viewport
  VIEWPORT_CHANGED: 'camera:viewport_changed',
  BOUNDS_CHANGED: 'camera:bounds_changed',

  // Activation
  ACTIVATED: 'camera:activated',
  DEACTIVATED: 'camera:deactivated',
  SWITCHED: 'camera:switched',

  // Constraints
  CONSTRAINT_APPLIED: 'camera:constraint_applied',

  // Performance
  CULLING_UPDATE: 'camera:culling_update',
} as const; 