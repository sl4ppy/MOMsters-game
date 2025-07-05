import { System, Query, SystemType } from '../interfaces';
import { EntityId, Vector2D } from '../../types/core';
import { EventBus } from '../../events/EventBus';
import { 
  WeaponComponent, 
  WeaponTimerComponent, 
  WeaponTargetingComponent
} from '../components/WeaponComponents';
import { PositionComponent } from '../components/BaseComponents';
import { Container } from 'pixi.js';
import { CollisionManager } from '../../core/CollisionManager';

interface WeaponSystemState {
  gameContainer: Container;
  collisionManager: CollisionManager;
  deltaTime: number;
  gameTime: number;
}

export class WeaponSystem implements System {
  public readonly type: SystemType = 'weapon-system' as SystemType;
  public readonly priority: number = 400;
  
  private eventBus: EventBus;
  private state: WeaponSystemState;
  
  // Component queries
  private weaponOwnerQuery: Query;
  private weaponQuery: Query;
  private weaponTimerQuery: Query;
  private weaponTargetingQuery: Query;
  private enemyQuery: Query;
  
  // System state
  private isActive: boolean = true;
  private isInitialized: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.state = {
      gameContainer: new Container(),
      collisionManager: new CollisionManager(),
      deltaTime: 0,
      gameTime: 0
    };
    
    // Initialize component queries
    this.weaponOwnerQuery = {
      all: ['weapon-owner', 'position'],
      any: [],
      none: []
    };
    
    this.weaponQuery = {
      all: ['weapon', 'weapon-owner'],
      any: [],
      none: []
    };
    
    this.weaponTimerQuery = {
      all: ['weapon-timer', 'weapon-owner'],
      any: [],
      none: []
    };
    
    this.weaponTargetingQuery = {
      all: ['weapon-targeting', 'weapon-owner', 'position'],
      any: [],
      none: []
    };
    
    this.enemyQuery = {
      all: ['enemy', 'position', 'health'],
      any: [],
      none: []
    };
  }

  public init(): void {
    if (this.isInitialized) return;
    
    console.warn('WeaponSystem: Initializing...');
    this.isInitialized = true;
    
    // Subscribe to relevant events
    this.eventBus.on('game:tick', this.handleGameTick.bind(this));
    this.eventBus.on('weapon:unlocked', this.handleWeaponUnlocked.bind(this));
    this.eventBus.on('weapon:activated', this.handleWeaponActivated.bind(this));
    this.eventBus.on('weapon:deactivated', this.handleWeaponDeactivated.bind(this));
    this.eventBus.on('enemy:died', this.handleEnemyDied.bind(this));
    
    console.warn('WeaponSystem: Initialized successfully');
  }

  public update(entities: Map<EntityId, Map<string, unknown>>, deltaTime: number): void {
    if (!this.isActive || !this.isInitialized) return;
    
    this.state.deltaTime = deltaTime;
    this.state.gameTime += deltaTime;
    
    // Update weapon timers
    this.updateWeaponTimers(entities, deltaTime);
    
    // Update weapon targeting
    this.updateWeaponTargeting(entities, deltaTime);
    
    // Process weapon firing
    this.processWeaponFiring(entities, deltaTime);
    
    // Update weapon statistics
    this.updateWeaponStatistics(entities, deltaTime);
    
    console.warn('WeaponSystem: Weapons processed');
  }

  public shutdown(): void {
    if (!this.isInitialized) return;
    
    console.warn('WeaponSystem: Shutting down...');
    this.isActive = false;
    this.isInitialized = false;
    
    // Unsubscribe from events
    this.eventBus.off('game:tick', this.handleGameTick.bind(this));
    this.eventBus.off('weapon:unlocked', this.handleWeaponUnlocked.bind(this));
    this.eventBus.off('weapon:activated', this.handleWeaponActivated.bind(this));
    this.eventBus.off('weapon:deactivated', this.handleWeaponDeactivated.bind(this));
    this.eventBus.off('enemy:died', this.handleEnemyDied.bind(this));
    
    console.warn('WeaponSystem: Shutdown complete');
  }

  public setGameContainer(container: Container): void {
    this.state.gameContainer = container;
  }

  public setCollisionManager(collisionManager: CollisionManager): void {
    this.state.collisionManager = collisionManager;
  }

  private updateWeaponTimers(entities: Map<EntityId, Map<string, unknown>>, deltaTime: number): void {
    for (const [, components] of entities) {
      if (!this.matchesQuery(components, this.weaponQuery)) continue;
      
      const weapon = components.get('weapon') as WeaponComponent;
      const timer = components.get('weapon-timer') as WeaponTimerComponent;
      
      if (!weapon || !timer) continue;
      
      // Update cooldown timer
      if (timer.cooldownRemaining > 0) {
        timer.cooldownRemaining -= deltaTime;
        if (timer.cooldownRemaining <= 0) {
          timer.cooldownRemaining = 0;
          timer.isReady = true;
        }
      }
      
      // Update reload timer
      if (timer.reloadRemaining > 0) {
        timer.reloadRemaining -= deltaTime;
        if (timer.reloadRemaining <= 0) {
          timer.reloadRemaining = 0;
          timer.isReloading = false;
          timer.currentAmmo = weapon.maxAmmo;
        }
      }
    }
  }

  private updateWeaponTargeting(entities: Map<EntityId, Map<string, unknown>>, _deltaTime: number): void {
    for (const [, components] of entities) {
      if (!this.matchesQuery(components, this.weaponTargetingQuery)) continue;
      
      const weapon = components.get('weapon') as WeaponComponent;
      const targeting = components.get('weapon-targeting') as WeaponTargetingComponent;
      const position = components.get('position') as PositionComponent;
      
      if (!weapon || !targeting || !position) continue;
      
      // Update targeting logic
      // TODO: Implement weapon targeting updates
    }
  }

  private processWeaponFiring(entities: Map<EntityId, Map<string, unknown>>, _deltaTime: number): void {
    for (const [, components] of entities) {
      if (!this.matchesQuery(components, this.weaponFiringQuery)) continue;
      
      const weapon = components.get('weapon') as WeaponComponent;
      const timer = components.get('weapon-timer') as WeaponTimerComponent;
      const position = components.get('position') as PositionComponent;
      
      if (!weapon || !timer || !position) continue;
      
      // Check if weapon can fire
      if (!timer.isReady || timer.isReloading) continue;
      
      // Process firing logic
      // TODO: Implement weapon firing logic
    }
  }

  private updateWeaponStatistics(entities: Map<EntityId, Map<string, unknown>>, _deltaTime: number): void {
    for (const [, components] of entities) {
      if (!this.matchesQuery(components, this.weaponStatsQuery)) continue;
      
      const weapon = components.get('weapon') as WeaponComponent;
      const stats = components.get('weapon-statistics') as WeaponStatisticsComponent;
      
      if (!weapon || !stats) continue;
      
      // Update weapon statistics
      // TODO: Implement weapon statistics updates
    }
  }

  private getEntityPosition(entities: Map<EntityId, Map<string, unknown>>, entityId: EntityId): Vector2D | null {
    const components = entities.get(entityId);
    if (!components) return null;
    
    const position = components.get('position') as PositionComponent;
    if (!position) return null;
    
    return { x: position.x, y: position.y };
  }

  private matchesQuery(components: Map<string, unknown>, query: Query): boolean {
    // Check all required components
    for (const componentType of query.all) {
      if (!components.has(componentType)) {
        return false;
      }
    }
    
    // Check any components (if specified)
    if (query.any.length > 0) {
      let hasAny = false;
      for (const componentType of query.any) {
        if (components.has(componentType)) {
          hasAny = true;
          break;
        }
      }
      if (!hasAny) return false;
    }
    
    // Check none components (exclusions)
    for (const componentType of query.none) {
      if (components.has(componentType)) {
        return false;
      }
    }
    
    return true;
  }

  private handleGameTick(_event: unknown): void {
    // Handle per-tick operations
  }

  private handleWeaponUnlocked(_event: unknown): void {
    // Handle weapon unlocked event
  }

  private handleWeaponActivated(_event: unknown): void {
    // Handle weapon activated event
  }

  private handleWeaponDeactivated(_event: unknown): void {
    // Handle weapon deactivated event
  }

  private handleEnemyDied(_event: unknown): void {
    // Handle enemy death for targeting cleanup
  }

  private createFireballWeapon(_weapon: unknown, _playerPosition: unknown): void {
    // TODO: Implement fireball weapon creation
  }

  private createBeamWeapon(_weapon: unknown, _playerPosition: unknown): void {
    // TODO: Implement beam weapon creation
  }

  private createKnifeWeapon(_weapon: unknown, _playerPosition: unknown): void {
    // TODO: Implement knife weapon creation
  }

  private createAxeWeapon(_weapon: unknown, _playerPosition: unknown): void {
    // TODO: Implement axe weapon creation
  }

  private handleWeaponFired(_event: unknown): void {
    // TODO: Implement weapon fired handling
  }

  private handleWeaponReloaded(_event: unknown): void {
    // TODO: Implement weapon reloaded handling
  }

  private handleWeaponUpgraded(_event: unknown): void {
    // TODO: Implement weapon upgraded handling
  }

  private handleWeaponDestroyed(_event: unknown): void {
    // TODO: Implement weapon destroyed handling
  }
} 