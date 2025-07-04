export interface PerformanceMetrics {
  fps: number;
  averageFPS: number;
  memoryUsage: number;
  drawCalls: number;
  entityCount: number;
  systemUpdateTime: number;
  renderTime: number;
  frameTime: number;
}

export interface PerformanceWarning {
  type: 'fps' | 'memory' | 'entities' | 'frametime';
  severity: 'low' | 'medium' | 'high';
  message: string;
  value: number;
  threshold: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private updateCallbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private warningCallbacks: ((warnings: PerformanceWarning[]) => void)[] = [];
  private isEnabled: boolean = false;
  private updateInterval: number = 1000; // Update metrics every second
  private lastUpdateTime: number = 0;

  // Performance thresholds
  private readonly thresholds = {
    minFPS: 30,
    maxMemoryMB: 100,
    maxEntities: 1000,
    maxFrameTime: 33.33, // ~30 FPS
  };

  private constructor() {
    this.metrics = {
      fps: 0,
      averageFPS: 0,
      memoryUsage: 0,
      drawCalls: 0,
      entityCount: 0,
      systemUpdateTime: 0,
      renderTime: 0,
      frameTime: 0,
    };
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public enable(): void {
    this.isEnabled = true;
    this.lastFrameTime = performance.now();
    this.lastUpdateTime = performance.now();
    console.log('📊 PerformanceMonitor enabled');
  }

  public disable(): void {
    this.isEnabled = false;
    console.log('📊 PerformanceMonitor disabled');
  }

  public update(_deltaTime: number): void {
    if (!this.isEnabled) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    // Calculate instantaneous FPS
    this.metrics.fps = frameTime > 0 ? 1000 / frameTime : 0;
    this.metrics.frameTime = frameTime;

    // Update FPS history
    this.fpsHistory.push(this.metrics.fps);
    this.frameTimeHistory.push(frameTime);

    // Keep history manageable (last 60 frames)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
    }

    // Calculate average FPS
    this.metrics.averageFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    // Update memory usage if available
    this.updateMemoryUsage();

    this.lastFrameTime = currentTime;
    this.frameCount++;

    // Check if it's time to update callbacks (not every frame for performance)
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.notifyCallbacks();
      this.checkPerformanceWarnings();
      this.lastUpdateTime = currentTime;
    }
  }

  private updateMemoryUsage(): void {
    // Check if Performance API memory is available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
  }

  private notifyCallbacks(): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(this.getMetrics());
      } catch (error) {
        console.error('Error in PerformanceMonitor callback:', error);
      }
    });
  }

  private checkPerformanceWarnings(): void {
    const warnings: PerformanceWarning[] = [];

    // Check FPS
    if (this.metrics.averageFPS < this.thresholds.minFPS) {
      warnings.push({
        type: 'fps',
        severity:
          this.metrics.averageFPS < 15 ? 'high' : this.metrics.averageFPS < 25 ? 'medium' : 'low',
        message: `Low FPS detected: ${this.metrics.averageFPS.toFixed(1)} FPS`,
        value: this.metrics.averageFPS,
        threshold: this.thresholds.minFPS,
      });
    }

    // Check memory usage
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
      warnings.push({
        type: 'memory',
        severity:
          this.metrics.memoryUsage > 200
            ? 'high'
            : this.metrics.memoryUsage > 150
              ? 'medium'
              : 'low',
        message: `High memory usage: ${this.metrics.memoryUsage.toFixed(1)} MB`,
        value: this.metrics.memoryUsage,
        threshold: this.thresholds.maxMemoryMB,
      });
    }

    // Check entity count
    if (this.metrics.entityCount > this.thresholds.maxEntities) {
      warnings.push({
        type: 'entities',
        severity:
          this.metrics.entityCount > 2000
            ? 'high'
            : this.metrics.entityCount > 1500
              ? 'medium'
              : 'low',
        message: `High entity count: ${this.metrics.entityCount} entities`,
        value: this.metrics.entityCount,
        threshold: this.thresholds.maxEntities,
      });
    }

    // Check frame time
    if (this.metrics.frameTime > this.thresholds.maxFrameTime) {
      warnings.push({
        type: 'frametime',
        severity:
          this.metrics.frameTime > 50 ? 'high' : this.metrics.frameTime > 40 ? 'medium' : 'low',
        message: `High frame time: ${this.metrics.frameTime.toFixed(1)}ms`,
        value: this.metrics.frameTime,
        threshold: this.thresholds.maxFrameTime,
      });
    }

    if (warnings.length > 0) {
      this.warningCallbacks.forEach(callback => {
        try {
          callback(warnings);
        } catch (error) {
          console.error('Error in PerformanceMonitor warning callback:', error);
        }
      });
    }
  }

  // Setters for external systems to report metrics
  public setEntityCount(count: number): void {
    this.metrics.entityCount = count;
  }

  public setDrawCalls(count: number): void {
    this.metrics.drawCalls = count;
  }

  public setSystemUpdateTime(time: number): void {
    this.metrics.systemUpdateTime = time;
  }

  public setRenderTime(time: number): void {
    this.metrics.renderTime = time;
  }

  // Getters
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getFPSHistory(): number[] {
    return [...this.fpsHistory];
  }

  public getFrameTimeHistory(): number[] {
    return [...this.frameTimeHistory];
  }

  // Callback management
  public onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    this.updateCallbacks.push(callback);
  }

  public removeMetricsCallback(callback: (metrics: PerformanceMetrics) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  public onPerformanceWarning(callback: (warnings: PerformanceWarning[]) => void): void {
    this.warningCallbacks.push(callback);
  }

  public removeWarningCallback(callback: (warnings: PerformanceWarning[]) => void): void {
    const index = this.warningCallbacks.indexOf(callback);
    if (index > -1) {
      this.warningCallbacks.splice(index, 1);
    }
  }

  // Performance profiling utilities
  public startProfile(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`⏱️ Profile [${name}]: ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  public measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    return fn().then(result => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`⏱️ Async Profile [${name}]: ${duration.toFixed(2)}ms`);
      return result;
    });
  }

  // Reset and clear data
  public reset(): void {
    this.fpsHistory = [];
    this.frameTimeHistory = [];
    this.frameCount = 0;
    this.metrics = {
      fps: 0,
      averageFPS: 0,
      memoryUsage: 0,
      drawCalls: 0,
      entityCount: 0,
      systemUpdateTime: 0,
      renderTime: 0,
      frameTime: 0,
    };
    console.log('📊 PerformanceMonitor reset');
  }

  // Generate performance report
  public generateReport(): string {
    const report = [
      '📊 Performance Report',
      '==================',
      `Current FPS: ${this.metrics.fps.toFixed(1)}`,
      `Average FPS: ${this.metrics.averageFPS.toFixed(1)}`,
      `Memory Usage: ${this.metrics.memoryUsage.toFixed(1)} MB`,
      `Entity Count: ${this.metrics.entityCount}`,
      `Draw Calls: ${this.metrics.drawCalls}`,
      `System Update Time: ${this.metrics.systemUpdateTime.toFixed(2)}ms`,
      `Render Time: ${this.metrics.renderTime.toFixed(2)}ms`,
      `Frame Time: ${this.metrics.frameTime.toFixed(2)}ms`,
      '',
      `Frame Count: ${this.frameCount}`,
      `FPS History Length: ${this.fpsHistory.length}`,
      '',
    ];

    const warnings = this.getWarningsSummary();
    if (warnings.length > 0) {
      report.push('⚠️ Performance Warnings:');
      warnings.forEach(warning => report.push(`  - ${warning}`));
    } else {
      report.push('✅ No performance warnings');
    }

    return report.join('\n');
  }

  private getWarningsSummary(): string[] {
    const warnings: string[] = [];

    if (this.metrics.averageFPS < this.thresholds.minFPS) {
      warnings.push(`Low FPS: ${this.metrics.averageFPS.toFixed(1)} < ${this.thresholds.minFPS}`);
    }

    if (this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
      warnings.push(
        `High memory: ${this.metrics.memoryUsage.toFixed(1)}MB > ${this.thresholds.maxMemoryMB}MB`
      );
    }

    if (this.metrics.entityCount > this.thresholds.maxEntities) {
      warnings.push(`High entities: ${this.metrics.entityCount} > ${this.thresholds.maxEntities}`);
    }

    return warnings;
  }
}
