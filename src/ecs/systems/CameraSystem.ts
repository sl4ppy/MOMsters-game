/* eslint-disable no-console */
import { SystemType, createSystemType } from '../../types/core';
import { System, EntityManager } from '../interfaces';
import { EventBus } from '../../events/interfaces';
import {
  CAMERA_COMPONENT,
  CAMERA_TARGET_COMPONENT,
  CAMERA_SHAKE_COMPONENT,
  CAMERA_CONSTRAINT_COMPONENT,
  CAMERA_VIEWPORT_COMPONENT,
  CameraComponent,
  CameraTargetComponent,
  CameraShakeComponent,
  CameraConstraintComponent,
  CameraViewportComponent,
} from '../components/CameraComponents';
import {
  POSITION_COMPONENT,
  VELOCITY_COMPONENT,
  PositionComponent,
  VelocityComponent,
} from '../components/BaseComponents';
import {
  CameraEventFactory,
  CAMERA_EVENT_TYPES,
} from '../../events/CameraEvents';
import { Container } from 'pixi.js';

/**
 * ECS CameraSystem - Handles camera logic, following, shake, and viewport management
 */
export class CameraSystem implements System {
  public readonly type: SystemType = createSystemType('camera');
  public readonly priority: number = 20; // After input, before render

  private entityManager: EntityManager;
  private eventBus: EventBus;

  // Active camera tracking
  private activeCameraId: string | null = null;
  private activeCameraComponent: CameraComponent | null = null;

  // PIXI.js container for camera transform (optional - can be set externally)
  private renderContainer: Container | null = null;

  // Performance tracking
  private lastUpdateTime = 0;
  private frameCount = 0;

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;
  }

  public initialize(): void {
    console.log('🎥 Camera system initialized');
    
    // Subscribe to relevant events
    this.setupEventListeners();
    
    // Find and activate initial camera
    this.findAndActivateCamera();
  }

  public update(deltaTime: number): void {
    this.frameCount++;
    const currentTime = Date.now();
    
    // Update all cameras
    this.updateCameras(deltaTime);
    
    // Update camera shake effects
    this.updateCameraShake(deltaTime);
    
    // Update viewport calculations
    this.updateViewports();
    
    // Apply camera transform to render container
    this.applyRenderTransform();
    
    // Performance tracking
    this.lastUpdateTime = currentTime;
  }

  public shutdown(): void {
    console.log('🎥 Camera system shutdown');
    
    // Clear references
    this.activeCameraId = null;
    this.activeCameraComponent = null;
    this.renderContainer = null;
  }

  // Public API methods
  public setRenderContainer(container: Container): void {
    this.renderContainer = container;
    console.log('🎥 Camera render container set');
  }

  public getActiveCamera(): { id: string; component: CameraComponent } | null {
    if (this.activeCameraId && this.activeCameraComponent) {
      return {
        id: this.activeCameraId,
        component: this.activeCameraComponent,
      };
    }
    return null;
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } | null {
    if (!this.activeCameraComponent) return null;

    const camera = this.activeCameraComponent;
    const screenX = (worldX - camera.position.x) * camera.zoom + camera.viewport.width / 2;
    const screenY = (worldY - camera.position.y) * camera.zoom + camera.viewport.height / 2;

    return { x: screenX, y: screenY };
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } | null {
    if (!this.activeCameraComponent) return null;

    const camera = this.activeCameraComponent;
    const worldX = (screenX - camera.viewport.width / 2) / camera.zoom + camera.position.x;
    const worldY = (screenY - camera.viewport.height / 2) / camera.zoom + camera.position.y;

    return { x: worldX, y: worldY };
  }

  public isVisible(worldX: number, worldY: number, margin: number = 100): boolean {
    if (!this.activeCameraComponent) return true;

    const screenPos = this.worldToScreen(worldX, worldY);
    if (!screenPos) return true;

    const camera = this.activeCameraComponent;
    return (
      screenPos.x >= -margin &&
      screenPos.x <= camera.viewport.width + margin &&
      screenPos.y >= -margin &&
      screenPos.y <= camera.viewport.height + margin
    );
  }

  public setCameraTarget(cameraId: string, targetX: number, targetY: number): void {
    const camera = this.entityManager.getComponent<CameraComponent>(
      cameraId as any,
      CAMERA_COMPONENT
    );

    if (camera) {
      camera.target.x = targetX;
      camera.target.y = targetY;

      // Emit target changed event
      this.eventBus.emit(
        CameraEventFactory.createCameraTargetChanged(
          cameraId as any,
          { x: targetX, y: targetY }
        )
      );
    }
  }

  public startCameraShake(
    cameraId: string,
    intensity: number,
    duration: number,
    shakeType: 'trauma' | 'perlin' | 'random' | 'directional' = 'trauma',
    direction?: { x: number; y: number }
  ): void {
    const shakeComponent = this.entityManager.getComponent<CameraShakeComponent>(
      cameraId as any,
      CAMERA_SHAKE_COMPONENT
    );

    if (shakeComponent) {
      shakeComponent.intensity = intensity;
      shakeComponent.duration = duration;
      shakeComponent.shakeType = shakeType;
      shakeComponent.direction = direction;
      shakeComponent.currentTime = 0;
      shakeComponent.isActive = true;

      // Emit shake start event
      this.eventBus.emit(
        CameraEventFactory.createCameraShakeStart(
          cameraId as any,
          intensity,
          duration,
          shakeType,
          direction
        )
      );
    }
  }

  public stopCameraShake(cameraId: string): void {
    const shakeComponent = this.entityManager.getComponent<CameraShakeComponent>(
      cameraId as any,
      CAMERA_SHAKE_COMPONENT
    );

    if (shakeComponent && shakeComponent.isActive) {
      shakeComponent.isActive = false;
      shakeComponent.currentOffset = { x: 0, y: 0 };

      // Emit shake stop event
      this.eventBus.emit(CameraEventFactory.createCameraShakeStop(cameraId as any));
    }
  }

  // Private methods
  private setupEventListeners(): void {
    // Listen for input events that might affect camera
    this.eventBus.on('input:movement', (_event: unknown) => {
      // Handle camera movement input if needed
    });

    // Listen for game events that might trigger camera shake
    this.eventBus.on('combat:projectile_hit', (_event: unknown) => {
      if (this.activeCameraId) {
        this.startCameraShake(this.activeCameraId, 0.3, 200, 'random');
      }
    });

    this.eventBus.on('player:damaged', (_event: unknown) => {
      if (this.activeCameraId) {
        this.startCameraShake(this.activeCameraId, 0.5, 300, 'trauma');
      }
    });
  }

  private findAndActivateCamera(): void {
    // Find cameras and activate the highest priority one
    const cameras = this.entityManager.query({
      with: [CAMERA_COMPONENT],
    });

    if (cameras.length === 0) {
      console.warn('⚠️ No cameras found in scene');
      return;
    }

    // Sort by priority (highest first)
    const sortedCameras = cameras
      .map(entity => ({
        id: entity.id,
        camera: this.entityManager.getComponent<CameraComponent>(
          entity.id,
          CAMERA_COMPONENT
        ),
      }))
      .filter(item => item.camera?.isActive)
      .sort((a, b) => (b.camera?.priority || 0) - (a.camera?.priority || 0));

    if (sortedCameras.length > 0) {
      const highestPriorityCamera = sortedCameras[0];
      this.activatCamera(highestPriorityCamera.id, highestPriorityCamera.camera!);
    }
  }

  private activatCamera(cameraId: string, camera: CameraComponent): void {
    const previousCameraId = this.activeCameraId;
    
    this.activeCameraId = cameraId;
    this.activeCameraComponent = camera;

    // Emit camera switched event
    this.eventBus.emit(
      CameraEventFactory.createCameraSwitched(
        cameraId as any,
        previousCameraId as any,
        'priority'
      )
    );

    console.log(`🎥 Activated camera: ${cameraId}`);
  }

  private updateCameras(deltaTime: number): void {
    // Get all active cameras
    const cameras = this.entityManager.query({
      with: [CAMERA_COMPONENT],
    });

    for (const entity of cameras) {
      const camera = this.entityManager.getComponent<CameraComponent>(
        entity.id,
        CAMERA_COMPONENT
      );

      if (!camera?.isActive) continue;

      // Update camera following
      this.updateCameraFollowing(entity.id, camera, deltaTime);

      // Update camera constraints
      this.updateCameraConstraints(entity.id, camera);

      // Check if this camera should become active
      this.checkCameraPriority(entity.id, camera);
    }
  }

  private updateCameraFollowing(cameraId: string, camera: CameraComponent, deltaTime: number): void {
    // Find camera targets
    const targets = this.entityManager.query({
      with: [CAMERA_TARGET_COMPONENT, POSITION_COMPONENT],
    });

    if (targets.length === 0) {
      // No targets, just move towards current target
      this.moveCameraToTarget(camera, deltaTime);
      return;
    }

    // Find highest priority active target
    const sortedTargets = targets
      .map(entity => ({
        id: entity.id,
        target: this.entityManager.getComponent<CameraTargetComponent>(
          entity.id,
          CAMERA_TARGET_COMPONENT
        ),
        position: this.entityManager.getComponent<PositionComponent>(
          entity.id,
          POSITION_COMPONENT
        ),
      }))
      .filter(item => item.target?.isActive && item.position)
      .sort((a, b) => (b.target?.priority || 0) - (a.target?.priority || 0));

    if (sortedTargets.length > 0) {
      const primaryTarget = sortedTargets[0];
      const targetPos = primaryTarget.position!;
      const targetComp = primaryTarget.target!;

      // Calculate target position with offset and lookahead
      let targetX = targetPos.x + targetComp.offset.x;
      let targetY = targetPos.y + targetComp.offset.y;

      // Add lookahead based on velocity
      const velocity = this.entityManager.getComponent<VelocityComponent>(
        primaryTarget.id,
        VELOCITY_COMPONENT
      );

      if (velocity && targetComp.followSettings?.lookahead) {
        const lookahead = targetComp.followSettings.lookahead;
        targetX += velocity.vx * lookahead;
        targetY += velocity.vy * lookahead;
      }

      // Update camera target
      const targetChanged = 
        Math.abs(camera.target.x - targetX) > 0.1 ||
        Math.abs(camera.target.y - targetY) > 0.1;

      if (targetChanged) {
        camera.target.x = targetX;
        camera.target.y = targetY;

        // Emit target changed event
        this.eventBus.emit(
          CameraEventFactory.createCameraTargetChanged(
            cameraId as any,
            { x: targetX, y: targetY },
            primaryTarget.id as any
          )
        );
      }
    }

    // Move camera towards target
    this.moveCameraToTarget(camera, deltaTime);
  }

  private moveCameraToTarget(camera: CameraComponent, deltaTime: number): void {
    const previousPosition = { ...camera.position };

    // Smooth camera movement
    const lerpFactor = Math.min(1, camera.followSpeed * deltaTime);
    
    camera.position.x += (camera.target.x - camera.position.x) * lerpFactor;
    camera.position.y += (camera.target.y - camera.position.y) * lerpFactor;

    // Check if position changed significantly
    const positionChanged = 
      Math.abs(camera.position.x - previousPosition.x) > 0.1 ||
      Math.abs(camera.position.y - previousPosition.y) > 0.1;

    if (positionChanged && this.activeCameraComponent === camera) {
      // Emit camera moved event
      this.eventBus.emit(
        CameraEventFactory.createCameraMoved(
          this.activeCameraId as any,
          camera.position,
          previousPosition
        )
      );
    }
  }

  private updateCameraConstraints(cameraId: string, camera: CameraComponent): void {
    const constraints = this.entityManager.getComponent<CameraConstraintComponent>(
      cameraId as any,
      CAMERA_CONSTRAINT_COMPONENT
    );

    if (!constraints) return;

    // Apply world bounds constraints
    if (constraints.worldBounds) {
      const bounds = constraints.worldBounds;
      const halfWidth = camera.viewport.width / (2 * camera.zoom);
      const halfHeight = camera.viewport.height / (2 * camera.zoom);

      const originalX = camera.position.x;
      const originalY = camera.position.y;

      camera.position.x = Math.max(bounds.minX + halfWidth, 
                                   Math.min(bounds.maxX - halfWidth, camera.position.x));
      camera.position.y = Math.max(bounds.minY + halfHeight,
                                   Math.min(bounds.maxY - halfHeight, camera.position.y));

      // Emit constraint applied event if position was constrained
      if (originalX !== camera.position.x || originalY !== camera.position.y) {
        this.eventBus.emitEvent(CAMERA_EVENT_TYPES.CONSTRAINT_APPLIED, {
          cameraId: cameraId as any,
          constraintType: 'world_bounds',
          originalValue: { x: originalX, y: originalY },
          constrainedValue: { x: camera.position.x, y: camera.position.y },
          timestamp: Date.now(),
        });
      }
    }

    // Apply zoom constraints
    const originalZoom = camera.zoom;
    camera.zoom = Math.max(constraints.zoomConstraints.min,
                          Math.min(constraints.zoomConstraints.max, camera.zoom));

    if (originalZoom !== camera.zoom) {
      this.eventBus.emitEvent(CAMERA_EVENT_TYPES.CONSTRAINT_APPLIED, {
        cameraId: cameraId as any,
        constraintType: 'zoom_limits',
        originalValue: { zoom: originalZoom },
        constrainedValue: { zoom: camera.zoom },
        timestamp: Date.now(),
      });
    }
  }

  private updateCameraShake(deltaTime: number): void {
    const shakeEntities = this.entityManager.query({
      with: [CAMERA_COMPONENT, CAMERA_SHAKE_COMPONENT],
    });

    for (const entity of shakeEntities) {
      const camera = this.entityManager.getComponent<CameraComponent>(
        entity.id,
        CAMERA_COMPONENT
      );
      const shake = this.entityManager.getComponent<CameraShakeComponent>(
        entity.id,
        CAMERA_SHAKE_COMPONENT
      );

      if (!camera || !shake?.isActive) continue;

      // Update shake time
      shake.currentTime += deltaTime;

      // Check if shake is finished
      if (shake.currentTime >= shake.duration) {
        shake.isActive = false;
        shake.currentOffset = { x: 0, y: 0 };
        
        this.eventBus.emit(CameraEventFactory.createCameraShakeStop(entity.id as any));
        continue;
      }

      // Calculate shake offset based on type
      const progress = shake.currentTime / shake.duration;
      const intensity = shake.intensity * (1 - progress * shake.decay);

      switch (shake.shakeType) {
        case 'trauma':
          shake.currentOffset = this.calculateTraumaShake(intensity, shake.currentTime);
          break;
        case 'random':
          shake.currentOffset = this.calculateRandomShake(intensity);
          break;
        case 'directional':
          shake.currentOffset = this.calculateDirectionalShake(intensity, shake.direction);
          break;
        default:
          shake.currentOffset = this.calculateTraumaShake(intensity, shake.currentTime);
      }

      // Emit shake update event
      this.eventBus.emitEvent(CAMERA_EVENT_TYPES.SHAKE_UPDATE, {
        cameraId: entity.id as any,
        offset: shake.currentOffset,
        intensity,
        remainingTime: shake.duration - shake.currentTime,
        timestamp: Date.now(),
      });
    }
  }

  private calculateTraumaShake(intensity: number, time: number): { x: number; y: number } {
    // Trauma-based shake with pseudo-random movement
    const trauma = intensity * intensity; // Square for more dramatic effect
    const angle1 = time * 0.1;
    const angle2 = time * 0.13;
    
    return {
      x: Math.sin(angle1) * trauma * 50,
      y: Math.sin(angle2) * trauma * 50,
    };
  }

  private calculateRandomShake(intensity: number): { x: number; y: number } {
    return {
      x: (Math.random() - 0.5) * intensity * 100,
      y: (Math.random() - 0.5) * intensity * 100,
    };
  }

  private calculateDirectionalShake(
    intensity: number,
    direction?: { x: number; y: number }
  ): { x: number; y: number } {
    if (!direction) return { x: 0, y: 0 };
    
    return {
      x: direction.x * intensity * 50,
      y: direction.y * intensity * 50,
    };
  }

  private updateViewports(): void {
    const viewportEntities = this.entityManager.query({
      with: [CAMERA_COMPONENT, CAMERA_VIEWPORT_COMPONENT],
    });

    for (const entity of viewportEntities) {
      const camera = this.entityManager.getComponent<CameraComponent>(
        entity.id,
        CAMERA_COMPONENT
      );
      const viewport = this.entityManager.getComponent<CameraViewportComponent>(
        entity.id,
        CAMERA_VIEWPORT_COMPONENT
      );

      if (!camera || !viewport) continue;

      // Update visible bounds
      const halfWidth = camera.viewport.width / (2 * camera.zoom);
      const halfHeight = camera.viewport.height / (2 * camera.zoom);

      viewport.visibleBounds = {
        left: camera.position.x - halfWidth,
        right: camera.position.x + halfWidth,
        top: camera.position.y - halfHeight,
        bottom: camera.position.y + halfHeight,
      };

      // Mark viewport as updated
      viewport.isDirty = false;

      // Emit viewport changed event if this is the active camera
      if (this.activeCameraId === entity.id) {
        this.eventBus.emit(
          CameraEventFactory.createCameraViewportChanged(
            entity.id as any,
            camera.viewport,
            viewport.visibleBounds
          )
        );
      }
    }
  }

  private checkCameraPriority(cameraId: string, camera: CameraComponent): void {
    // Check if this camera should become the active camera
    if (!this.activeCameraComponent || camera.priority > this.activeCameraComponent.priority) {
      this.activatCamera(cameraId, camera);
    }
  }

  private applyRenderTransform(): void {
    if (!this.renderContainer || !this.activeCameraComponent) return;

    const camera = this.activeCameraComponent;
    
    // Get shake offset if available
    let shakeOffset = { x: 0, y: 0 };
    if (this.activeCameraId) {
      const shake = this.entityManager.getComponent<CameraShakeComponent>(
        this.activeCameraId as any,
        CAMERA_SHAKE_COMPONENT
      );
      if (shake?.isActive) {
        shakeOffset = shake.currentOffset;
      }
    }

    // Apply camera transform to render container
    const centerX = camera.viewport.width / 2;
    const centerY = camera.viewport.height / 2;

    this.renderContainer.scale.set(camera.zoom);
    this.renderContainer.rotation = camera.rotation;
    this.renderContainer.x = -camera.position.x * camera.zoom + centerX + shakeOffset.x;
    this.renderContainer.y = -camera.position.y * camera.zoom + centerY + shakeOffset.y;
  }
} 