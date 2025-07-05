import { SystemType } from '../types/core';
import { System, SystemManager } from './interfaces';

/**
 * SystemManager implementation
 * Manages system registration, execution order, and lifecycle
 */
export class SystemManagerImpl implements SystemManager {
  private systems: Map<SystemType, System> = new Map();
  private systemsArray: System[] = [];
  private isInitialized = false;
  private isShutdown = false;

  public registerSystem(system: System): void {
    if (this.isShutdown) {
      throw new Error('Cannot register system after shutdown');
    }

    if (this.systems.has(system.type)) {
      throw new Error(`System ${system.type} is already registered`);
    }

    this.systems.set(system.type, system);
    this.rebuildSystemsArray();

    // Initialize system if the manager is already initialized
    if (this.isInitialized) {
      system.initialize();
    }
  }

  public unregisterSystem(systemType: SystemType): void {
    const system = this.systems.get(systemType);
    if (!system) {
      return;
    }

    // Shutdown system if still running
    if (this.isInitialized && !this.isShutdown) {
      system.shutdown();
    }

    this.systems.delete(systemType);
    this.rebuildSystemsArray();
  }

  public getSystem<T extends System>(systemType: SystemType): T | null {
    return (this.systems.get(systemType) as T) || null;
  }

  public updateSystems(deltaTime: number): void {
    if (!this.isInitialized || this.isShutdown) {
      return;
    }

    // Update systems in priority order
    for (const system of this.systemsArray) {
      try {
        system.update(deltaTime);
      } catch (error) {
        console.error(`Error updating system ${system.type}:`, error);
      }
    }
  }

  public initializeSystems(): void {
    if (this.isInitialized) {
      return;
    }

    for (const system of this.systemsArray) {
      try {
        system.initialize();
      } catch (error) {
        console.error(`Error initializing system ${system.type}:`, error);
      }
    }

    this.isInitialized = true;
  }

  public shutdownSystems(): void {
    if (!this.isInitialized || this.isShutdown) {
      return;
    }

    // Shutdown in reverse order
    for (let i = this.systemsArray.length - 1; i >= 0; i--) {
      const system = this.systemsArray[i];
      try {
        system.shutdown();
      } catch (error) {
        console.error(`Error shutting down system ${system.type}:`, error);
      }
    }

    this.isShutdown = true;
  }

  public getSystemCount(): number {
    return this.systems.size;
  }

  // Rebuild the systems array sorted by priority
  private rebuildSystemsArray(): void {
    this.systemsArray = Array.from(this.systems.values()).sort((a, b) => a.priority - b.priority);
  }

  // Additional utility methods
  public getAllSystems(): System[] {
    return [...this.systemsArray];
  }

  public getSystemTypes(): SystemType[] {
    return Array.from(this.systems.keys());
  }

  public hasSystem(systemType: SystemType): boolean {
    return this.systems.has(systemType);
  }

  public isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  public isSystemShutdown(): boolean {
    return this.isShutdown;
  }

  public clear(): void {
    if (this.isInitialized && !this.isShutdown) {
      this.shutdownSystems();
    }
    
    this.systems.clear();
    this.systemsArray = [];
    this.isInitialized = false;
    this.isShutdown = false;
  }

  // Get systems by priority range
  public getSystemsByPriority(minPriority: number, maxPriority: number): System[] {
    return this.systemsArray.filter(
      system => system.priority >= minPriority && system.priority <= maxPriority
    );
  }
} 