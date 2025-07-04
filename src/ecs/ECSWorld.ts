import { ECSWorld } from './interfaces';
import { EntityManagerImpl } from './EntityManager';
import { SystemManagerImpl } from './SystemManager';

/**
 * ECS World implementation
 * The main ECS container that manages entities and systems
 */
export class ECSWorldImpl implements ECSWorld {
  public readonly entityManager: EntityManagerImpl;
  public readonly systemManager: SystemManagerImpl;

  private isInitialized = false;
  private isShutdown = false;

  constructor() {
    this.entityManager = new EntityManagerImpl();
    this.systemManager = new SystemManagerImpl();
  }

  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      this.systemManager.initializeSystems();
      this.isInitialized = true;
      console.log('🌍 ECS World initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ECS World:', error);
      throw error;
    }
  }

  public update(deltaTime: number): void {
    if (!this.isInitialized || this.isShutdown) {
      return;
    }

    try {
      this.systemManager.updateSystems(deltaTime);
    } catch (error) {
      console.error('❌ Error updating ECS World:', error);
    }
  }

  public shutdown(): void {
    if (!this.isInitialized || this.isShutdown) {
      return;
    }

    try {
      this.systemManager.shutdownSystems();
      this.entityManager.clear();
      this.isShutdown = true;
      console.log('🌍 ECS World shutdown successfully');
    } catch (error) {
      console.error('❌ Error shutting down ECS World:', error);
    }
  }

  public getStats(): { entities: number; systems: number; components: number } {
    return {
      entities: this.entityManager.getEntityCount(),
      systems: this.systemManager.getSystemCount(),
      components: this.entityManager.getComponentCount(),
    };
  }

  // Additional utility methods
  public isWorldInitialized(): boolean {
    return this.isInitialized;
  }

  public isWorldShutdown(): boolean {
    return this.isShutdown;
  }

  public reset(): void {
    if (this.isInitialized && !this.isShutdown) {
      this.shutdown();
    }

    this.entityManager.clear();
    this.systemManager.clear();
    this.isInitialized = false;
    this.isShutdown = false;
  }

  public getDetailedStats(): {
    entities: number;
    systems: number;
    components: number;
    systemTypes: string[];
    isInitialized: boolean;
    isShutdown: boolean;
  } {
    return {
      entities: this.entityManager.getEntityCount(),
      systems: this.systemManager.getSystemCount(),
      components: this.entityManager.getComponentCount(),
      systemTypes: this.systemManager.getSystemTypes(),
      isInitialized: this.isInitialized,
      isShutdown: this.isShutdown,
    };
  }
} 