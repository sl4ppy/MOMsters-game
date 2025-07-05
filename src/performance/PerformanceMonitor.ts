import { EventBusImpl } from '../events/EventBus';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  updateTime: number;
  entities: number;
  drawCalls: number;
  triangles: number;
  textures: number;
}

export interface PerformanceThresholds {
  fps: { warning: number; critical: number };
  frameTime: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  cpuUsage: { warning: number; critical: number };
}

export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

export interface PerformanceConfig {
  enabled: boolean;
  sampleSize: number;
  updateInterval: number;
  autoOptimize: boolean;
  thresholds: PerformanceThresholds;
}

export class PerformanceMonitor {
  private eventBus: EventBusImpl;
  private config: PerformanceConfig;
  
  // Performance tracking
  private frameCount = 0;
  private lastFrameTime = 0;
  private frameTimes: number[] = [];
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];
  
  // Timing
  private renderStartTime = 0;
  private updateStartTime = 0;
  private renderTime = 0;
  private updateTime = 0;
  
  // Statistics
  private minFps = Infinity;
  private maxFps = 0;
  private avgFps = 0;
  private minFrameTime = Infinity;
  private maxFrameTime = 0;
  private avgFrameTime = 0;
  
  // Performance issues tracking
  private issues: string[] = [];
  private recommendations: string[] = [];
  
  // Animation frame
  private animationId: number | null = null;
  private isMonitoring = false;

  constructor(eventBus: EventBusImpl) {
    this.eventBus = eventBus;
    this.config = {
      enabled: true,
      sampleSize: 60, // 1 second at 60fps
      updateInterval: 1000, // 1 second
      autoOptimize: false,
      thresholds: {
        fps: { warning: 45, critical: 30 },
        frameTime: { warning: 22, critical: 33 }, // ms
        memoryUsage: { warning: 100, critical: 200 }, // MB
        cpuUsage: { warning: 80, critical: 95 }, // %
      },
    };
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Performance-related events
    this.eventBus.on('performance:start_monitoring', () => this.start());
    this.eventBus.on('performance:stop_monitoring', () => this.stop());
    this.eventBus.on('performance:get_report', () => this.generateReport());
    
    // Game events that affect performance
    this.eventBus.on('game:entity_created', () => this.onEntityCountChanged());
    this.eventBus.on('game:entity_destroyed', () => this.onEntityCountChanged());
    this.eventBus.on('render:draw_call', () => this.onDrawCall());
  }

  start(): void {
    if (this.isMonitoring || !this.config.enabled) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this.update.bind(this));
  }

  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private update(currentTime: number): void {
    if (!this.isMonitoring) return;

    // Calculate frame time
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update frame time history
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.config.sampleSize) {
      this.frameTimes.shift();
    }

    // Calculate FPS
    const fps = 1000 / frameTime;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.config.sampleSize) {
      this.fpsHistory.shift();
    }

    // Update statistics
    this.updateStatistics();

    // Check for performance issues
    this.checkPerformanceIssues();

    // Auto-optimize if enabled
    if (this.config.autoOptimize) {
      this.autoOptimize();
    }

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.update.bind(this));
  }

  private updateStatistics(): void {
    if (this.fpsHistory.length === 0) return;

    // FPS statistics
    this.minFps = Math.min(this.minFps, ...this.fpsHistory);
    this.maxFps = Math.max(this.maxFps, ...this.fpsHistory);
    this.avgFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;

    // Frame time statistics
    if (this.frameTimes.length > 0) {
      this.minFrameTime = Math.min(this.minFrameTime, ...this.frameTimes);
      this.maxFrameTime = Math.max(this.maxFrameTime, ...this.frameTimes);
      this.avgFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    }
  }

  private checkPerformanceIssues(): void {
    this.issues = [];
    this.recommendations = [];

    // Check FPS
    if (this.avgFps < this.config.thresholds.fps.critical) {
      this.issues.push(`Critical: FPS is ${this.avgFps.toFixed(1)} (below ${this.config.thresholds.fps.critical})`);
      this.recommendations.push('Reduce graphics quality or entity count');
    } else if (this.avgFps < this.config.thresholds.fps.warning) {
      this.issues.push(`Warning: FPS is ${this.avgFps.toFixed(1)} (below ${this.config.thresholds.fps.warning})`);
      this.recommendations.push('Consider reducing graphics settings');
    }

    // Check frame time
    if (this.avgFrameTime > this.config.thresholds.frameTime.critical) {
      this.issues.push(`Critical: Frame time is ${this.avgFrameTime.toFixed(1)}ms (above ${this.config.thresholds.frameTime.critical}ms)`);
      this.recommendations.push('Optimize rendering pipeline');
    } else if (this.avgFrameTime > this.config.thresholds.frameTime.warning) {
      this.issues.push(`Warning: Frame time is ${this.avgFrameTime.toFixed(1)}ms (above ${this.config.thresholds.frameTime.warning}ms)`);
      this.recommendations.push('Check for expensive operations in render loop');
    }

    // Check memory usage
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > this.config.thresholds.memoryUsage.critical) {
      this.issues.push(`Critical: Memory usage is ${memoryUsage.toFixed(1)}MB (above ${this.config.thresholds.memoryUsage.critical}MB)`);
      this.recommendations.push('Clear unused assets and textures');
    } else if (memoryUsage > this.config.thresholds.memoryUsage.warning) {
      this.issues.push(`Warning: Memory usage is ${memoryUsage.toFixed(1)}MB (above ${this.config.thresholds.memoryUsage.warning}MB)`);
      this.recommendations.push('Monitor memory usage and clean up resources');
    }

    // Emit performance events if issues found
    if (this.issues.length > 0) {
      this.eventBus.emitEvent('performance:issues_detected', { issues: this.issues });
    }
  }

  private autoOptimize(): void {
    // Automatic performance optimizations
    if (this.avgFps < this.config.thresholds.fps.critical) {
      // Reduce graphics quality
      this.eventBus.emitEvent('performance:reduce_graphics_quality');
      
      // Reduce entity count
      this.eventBus.emitEvent('performance:reduce_entity_count');
      
      // Reduce draw distance
      this.eventBus.emitEvent('performance:reduce_draw_distance');
    }
  }

  // Performance measurement methods
  startRenderTimer(): void {
    this.renderStartTime = performance.now();
  }

  endRenderTimer(): void {
    this.renderTime = performance.now() - this.renderStartTime;
  }

  startUpdateTimer(): void {
    this.updateStartTime = performance.now();
  }

  endUpdateTimer(): void {
    this.updateTime = performance.now() - this.updateStartTime;
  }

  private onEntityCountChanged(): void {
    // This would be called when entities are created/destroyed
    // For now, we'll track it via events
  }

  private onDrawCall(): void {
    // This would be called for each draw call
    // For now, we'll track it via events
  }

  // Memory monitoring
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0; // Not available in all browsers
  }

  private getCpuUsage(): number {
    // This would require more sophisticated monitoring
    // For now, we'll estimate based on frame time
    const targetFrameTime = 1000 / 60; // 60 FPS target
    return Math.min(100, (this.avgFrameTime / targetFrameTime) * 100);
  }

  // Metrics collection
  getCurrentMetrics(): PerformanceMetrics {
    return {
      fps: this.avgFps,
      frameTime: this.avgFrameTime,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      renderTime: this.renderTime,
      updateTime: this.updateTime,
      entities: 0, // Would be set by game systems
      drawCalls: 0, // Would be set by renderer
      triangles: 0, // Would be set by renderer
      textures: 0, // Would be set by asset manager
    };
  }

  generateReport(): PerformanceReport {
    const metrics = this.getCurrentMetrics();
    const score = this.calculatePerformanceScore(metrics);
    
    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics,
      issues: [...this.issues],
      recommendations: [...this.recommendations],
      score,
    };

    this.eventBus.emitEvent('performance:report_generated', { report });
    
    return report;
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // FPS score (40% weight)
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100);
    score -= (100 - fpsScore) * 0.4;

    // Frame time score (30% weight)
    const frameTimeScore = Math.max(0, 100 - (metrics.frameTime / 16.67) * 100);
    score -= (100 - frameTimeScore) * 0.3;

    // Memory score (20% weight)
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 100) * 100);
    score -= (100 - memoryScore) * 0.2;

    // CPU score (10% weight)
    const cpuScore = Math.max(0, 100 - metrics.cpuUsage);
    score -= (100 - cpuScore) * 0.1;

    return Math.max(0, Math.min(100, score));
  }

  // Configuration methods
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Statistics methods
  getStatistics(): {
    minFps: number;
    maxFps: number;
    avgFps: number;
    minFrameTime: number;
    maxFrameTime: number;
    avgFrameTime: number;
    frameCount: number;
    sampleSize: number;
  } {
    return {
      minFps: this.minFps,
      maxFps: this.maxFps,
      avgFps: this.avgFps,
      minFrameTime: this.minFrameTime,
      maxFrameTime: this.maxFrameTime,
      avgFrameTime: this.avgFrameTime,
      frameCount: this.frameCount,
      sampleSize: this.config.sampleSize,
    };
  }

  // Reset methods
  resetStatistics(): void {
    this.frameCount = 0;
    this.frameTimes = [];
    this.fpsHistory = [];
    this.memoryHistory = [];
    this.minFps = Infinity;
    this.maxFps = 0;
    this.avgFps = 0;
    this.minFrameTime = Infinity;
    this.maxFrameTime = 0;
    this.avgFrameTime = 0;
    this.issues = [];
    this.recommendations = [];
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.resetStatistics();
  }
} 