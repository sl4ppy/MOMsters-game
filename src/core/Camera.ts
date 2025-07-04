import { Container } from 'pixi.js';

export class Camera {
  private container: Container;
  private targetX: number = 0;
  private targetY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private followSpeed: number = 0.1; // How quickly camera follows target (0.1 = smooth, 1.0 = instant)
  private screenWidth: number;
  private screenHeight: number;

  constructor(container: Container, screenWidth: number, screenHeight: number) {
    this.container = container;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /**
   * Set the target position for the camera to follow
   */
  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Update camera position with smooth following
   */
  update(deltaTime: number): void {
    // Smooth camera movement toward target
    const lerpFactor = Math.min(1, this.followSpeed * deltaTime);

    this.currentX += (this.targetX - this.currentX) * lerpFactor;
    this.currentY += (this.targetY - this.currentY) * lerpFactor;

    // Apply camera transform to container
    // Center the camera on screen by offsetting by half screen size
    this.container.x = -this.currentX + this.screenWidth / 2;
    this.container.y = -this.currentY + this.screenHeight / 2;
  }

  /**
   * Get current camera position in world space
   */
  getPosition(): { x: number; y: number } {
    return { x: this.currentX, y: this.currentY };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX - this.currentX + this.screenWidth / 2,
      y: worldY - this.currentY + this.screenHeight / 2,
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.currentX - this.screenWidth / 2,
      y: screenY + this.currentY - this.screenHeight / 2,
    };
  }

  /**
   * Check if a world position is visible on screen (with margin)
   */
  isVisible(worldX: number, worldY: number, margin: number = 100): boolean {
    const screenPos = this.worldToScreen(worldX, worldY);
    return (
      screenPos.x >= -margin &&
      screenPos.x <= this.screenWidth + margin &&
      screenPos.y >= -margin &&
      screenPos.y <= this.screenHeight + margin
    );
  }

  /**
   * Get the world bounds of what's currently visible on screen
   */
  getVisibleBounds(margin: number = 0): {
    left: number;
    right: number;
    top: number;
    bottom: number;
  } {
    const topLeft = this.screenToWorld(-margin, -margin);
    const bottomRight = this.screenToWorld(this.screenWidth + margin, this.screenHeight + margin);

    return {
      left: topLeft.x,
      right: bottomRight.x,
      top: topLeft.y,
      bottom: bottomRight.y,
    };
  }

  /**
   * Set camera follow speed (0.1 = smooth, 1.0 = instant)
   */
  setFollowSpeed(speed: number): void {
    this.followSpeed = Math.max(0.01, Math.min(1.0, speed));
  }
}
