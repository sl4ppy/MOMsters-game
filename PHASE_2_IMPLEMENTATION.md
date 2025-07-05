# 🏛️ Phase 2: Architecture Refactor - Implementation Guide

## 📋 Overview
Phase 2 implements Entity-Component-System (ECS) architecture, centralized event system, and enhanced state management.

---

## ⚙️ Week 4: Entity-Component-System (ECS)

### ECS Core Implementation

#### Create ECS Directory Structure
```bash
mkdir -p src/ecs/components src/ecs/systems
```

#### Base ECS Classes
**File: `src/ecs/Component.ts`**
```typescript
import { ComponentType, EntityId } from '../types/core';

export interface Component {
  readonly type: ComponentType;
  entityId: EntityId;
}

export interface Transform extends Component {
  type: 'Transform';
  position: { x: number; y: number };
  rotation: number;
  scale: { x: number; y: number };
}

export interface Health extends Component {
  type: 'Health';
  current: number;
  maximum: number;
  regeneration: number;
}

export interface Velocity extends Component {
  type: 'Velocity';
  x: number;
  y: number;
  maxSpeed: number;
}

export interface Sprite extends Component {
  type: 'Sprite';
  textureName: string;
  visible: boolean;
  zIndex: number;
  tint: number;
}

export interface Collider extends Component {
  type: 'Collider';
  radius: number;
  layer: string;
  isTrigger: boolean;
}

export interface Weapon extends Component {
  type: 'Weapon';
  damage: number;
  range: number;
  cooldown: number;
  lastFired: number;
  piercing: number;
}
```

**File: `src/ecs/Entity.ts`**
```typescript
import { Entity, EntityId, ComponentType, Component } from '../types/core';

export class EntityManager {
  private static instance: EntityManager;
  private entities: Map<EntityId, Entity> = new Map();
  private nextId: number = 1;

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  public createEntity(): Entity {
    const id = `entity_${this.nextId++}` as EntityId;
    const entity: Entity = {
      id,
      active: true,
      components: new Map()
    };
    
    this.entities.set(id, entity);
    return entity;
  }

  public removeEntity(id: EntityId): void {
    this.entities.delete(id);
  }

  public getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  public addComponent<T extends Component>(entityId: EntityId, component: T): void {
    const entity = this.getEntity(entityId);
    if (entity) {
      component.entityId = entityId;
      entity.components.set(component.type, component);
    }
  }

  public removeComponent(entityId: EntityId, componentType: ComponentType): void {
    const entity = this.getEntity(entityId);
    if (entity) {
      entity.components.delete(componentType);
    }
  }

  public getComponent<T extends Component>(entityId: EntityId, componentType: ComponentType): T | undefined {
    const entity = this.getEntity(entityId);
    return entity?.components.get(componentType) as T;
  }

  public hasComponent(entityId: EntityId, componentType: ComponentType): boolean {
    const entity = this.getEntity(entityId);
    return entity?.components.has(componentType) || false;
  }

  public getEntitiesWithComponents(...componentTypes: ComponentType[]): Entity[] {
    return Array.from(this.entities.values()).filter(entity => {
      return componentTypes.every(type => entity.components.has(type));
    });
  }

  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }
}
```

**File: `src/ecs/System.ts`**
```typescript
import { System, Entity, ComponentType, SystemType } from '../types/core';

export abstract class BaseSystem implements System {
  public abstract readonly type: SystemType;
  public abstract readonly requiredComponents: ComponentType[];
  public abstract readonly priority: number;

  public abstract update(entities: Entity[], deltaTime: number): void;

  public init?(): void;
  public destroy?(): void;

  protected getValidEntities(entities: Entity[]): Entity[] {
    return entities.filter(entity => 
      entity.active && 
      this.requiredComponents.every(type => entity.components.has(type))
    );
  }
}

export class SystemManager {
  private static instance: SystemManager;
  private systems: Map<SystemType, System> = new Map();
  private systemOrder: SystemType[] = [];

  public static getInstance(): SystemManager {
    if (!SystemManager.instance) {
      SystemManager.instance = new SystemManager();
    }
    return SystemManager.instance;
  }

  public addSystem(system: System): void {
    this.systems.set(system.type, system);
    this.updateSystemOrder();
    
    if (system.init) {
      system.init();
    }
  }

  public removeSystem(systemType: SystemType): void {
    const system = this.systems.get(systemType);
    if (system && system.destroy) {
      system.destroy();
    }
    this.systems.delete(systemType);
    this.updateSystemOrder();
  }

  public updateSystems(entities: Entity[], deltaTime: number): void {
    for (const systemType of this.systemOrder) {
      const system = this.systems.get(systemType);
      if (system) {
        system.update(entities, deltaTime);
      }
    }
  }

  private updateSystemOrder(): void {
    this.systemOrder = Array.from(this.systems.values())
      .sort((a, b) => a.priority - b.priority)
      .map(system => system.type);
  }
}
```

### Core Systems Implementation

**File: `src/ecs/systems/MovementSystem.ts`**
```typescript
import { BaseSystem } from '../System';
import { ComponentType, SystemType, Entity } from '../../types/core';
import { Transform, Velocity } from '../Component';

export class MovementSystem extends BaseSystem {
  public readonly type: SystemType = 'MovementSystem' as SystemType;
  public readonly requiredComponents: ComponentType[] = ['Transform', 'Velocity'] as ComponentType[];
  public readonly priority: number = 100;

  public update(entities: Entity[], deltaTime: number): void {
    const validEntities = this.getValidEntities(entities);

    for (const entity of validEntities) {
      const transform = entity.components.get('Transform' as ComponentType) as Transform;
      const velocity = entity.components.get('Velocity' as ComponentType) as Velocity;

      if (transform && velocity) {
        // Apply velocity to position
        transform.position.x += velocity.x * deltaTime;
        transform.position.y += velocity.y * deltaTime;

        // Apply speed limits
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > velocity.maxSpeed) {
          const factor = velocity.maxSpeed / speed;
          velocity.x *= factor;
          velocity.y *= factor;
        }
      }
    }
  }
}
```

**File: `src/ecs/systems/CollisionSystem.ts`**
```typescript
import { BaseSystem } from '../System';
import { ComponentType, SystemType, Entity } from '../../types/core';
import { Transform, Collider } from '../Component';
import { EventBus } from '../../core/EventBus';

export class CollisionSystem extends BaseSystem {
  public readonly type: SystemType = 'CollisionSystem' as SystemType;
  public readonly requiredComponents: ComponentType[] = ['Transform', 'Collider'] as ComponentType[];
  public readonly priority: number = 200;

  private eventBus: EventBus;

  constructor() {
    super();
    this.eventBus = EventBus.getInstance();
  }

  public update(entities: Entity[], deltaTime: number): void {
    const validEntities = this.getValidEntities(entities);

    for (let i = 0; i < validEntities.length; i++) {
      for (let j = i + 1; j < validEntities.length; j++) {
        this.checkCollision(validEntities[i], validEntities[j]);
      }
    }
  }

  private checkCollision(entityA: Entity, entityB: Entity): void {
    const transformA = entityA.components.get('Transform' as ComponentType) as Transform;
    const colliderA = entityA.components.get('Collider' as ComponentType) as Collider;
    const transformB = entityB.components.get('Transform' as ComponentType) as Transform;
    const colliderB = entityB.components.get('Collider' as ComponentType) as Collider;

    if (!transformA || !colliderA || !transformB || !colliderB) return;

    const dx = transformA.position.x - transformB.position.x;
    const dy = transformA.position.y - transformB.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = colliderA.radius + colliderB.radius;

    if (distance < minDistance) {
      this.eventBus.emit('collision', {
        entityA: entityA.id,
        entityB: entityB.id,
        distance,
        overlap: minDistance - distance
      });
    }
  }
}
```

---

## ⚡ Week 5: Event System & State Management

### Event Bus Implementation

**File: `src/core/EventBus.ts`**
```typescript
import { GameEvent, TypedGameEvent } from '../types/core';

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Function[]> = new Map();
  private eventHistory: GameEvent[] = [];

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<T = any>(eventType: string, callback: (event: TypedGameEvent<T>) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  public off(eventType: string, callback: Function): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  public emit<T = any>(eventType: string, data?: T): void {
    const event: TypedGameEvent<T> = {
      type: eventType,
      timestamp: Date.now(),
      data: data as T
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event callback for ${eventType}:`, error);
      }
    });
  }

  public once<T = any>(eventType: string, callback: (event: TypedGameEvent<T>) => void): void {
    const onceWrapper = (event: TypedGameEvent<T>) => {
      callback(event);
      this.off(eventType, onceWrapper);
    };
    this.on(eventType, onceWrapper);
  }

  public getEventHistory(): GameEvent[] {
    return [...this.eventHistory];
  }

  public clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }
}
```

### Enhanced State Management

**File: `src/state/StateManager.ts`**
```typescript
import { GameState } from '../core/GameState';
import { UserSettings, SaveData } from '../types/game';
import { EventBus } from '../core/EventBus';

export interface PersistentState {
  totalPlayTime: number;
  gamesPlayed: number;
  highScore: number;
  unlockedUpgrades: string[];
  achievements: string[];
  statistics: {
    totalEnemiesKilled: number;
    totalDamageDealt: number;
    totalExperienceGained: number;
  };
}

export class StateManager {
  private static instance: StateManager;
  private gameState: GameState;
  private persistentState: PersistentState;
  private settings: UserSettings;
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.gameState = new GameState();
    this.persistentState = this.getDefaultPersistentState();
    this.settings = this.getDefaultSettings();
    this.setupEventListeners();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  private setupEventListeners(): void {
    this.eventBus.on('enemy_killed', (event) => {
      this.persistentState.statistics.totalEnemiesKilled++;
      this.eventBus.emit('persistent_state_changed', this.persistentState);
    });

    this.eventBus.on('damage_dealt', (event) => {
      this.persistentState.statistics.totalDamageDealt += event.data.amount;
    });

    this.eventBus.on('experience_gained', (event) => {
      this.persistentState.statistics.totalExperienceGained += event.data.amount;
    });
  }

  public async save(): Promise<void> {
    const saveData: SaveData = {
      version: '2.0.0',
      timestamp: Date.now(),
      playerState: {
        level: this.gameState.level,
        experience: this.gameState.experience,
        experienceToNextLevel: this.gameState.experienceToNextLevel,
        health: 100, // Will be taken from player entity
        maxHealth: 100,
        upgrades: []
      },
      gameState: {
        time: this.gameState.time,
        score: this.gameState.score,
        enemiesKilled: this.gameState.enemiesKilled,
        currentWave: 0 // Will be taken from wave system
      },
      settings: this.settings
    };

    try {
      localStorage.setItem('momsters_save', JSON.stringify(saveData));
      localStorage.setItem('momsters_persistent', JSON.stringify(this.persistentState));
      this.eventBus.emit('game_saved', saveData);
    } catch (error) {
      console.error('Failed to save game:', error);
      this.eventBus.emit('save_failed', { error });
    }
  }

  public async load(): Promise<SaveData | null> {
    try {
      const savedData = localStorage.getItem('momsters_save');
      const persistentData = localStorage.getItem('momsters_persistent');

      if (savedData) {
        const saveData: SaveData = JSON.parse(savedData);
        this.applyGameState(saveData);
        this.eventBus.emit('game_loaded', saveData);
        return saveData;
      }

      if (persistentData) {
        this.persistentState = JSON.parse(persistentData);
      }

      return null;
    } catch (error) {
      console.error('Failed to load game:', error);
      this.eventBus.emit('load_failed', { error });
      return null;
    }
  }

  private applyGameState(saveData: SaveData): void {
    // Apply loaded state to game systems
    this.gameState.setLevel(saveData.playerState.level);
    this.gameState.setExperience(saveData.playerState.experience);
    this.settings = saveData.settings;
    
    this.eventBus.emit('state_applied', saveData);
  }

  public getGameState(): Readonly<GameState> {
    return this.gameState;
  }

  public getPersistentState(): Readonly<PersistentState> {
    return { ...this.persistentState };
  }

  public getSettings(): Readonly<UserSettings> {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<UserSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.eventBus.emit('settings_changed', this.settings);
  }

  private getDefaultPersistentState(): PersistentState {
    return {
      totalPlayTime: 0,
      gamesPlayed: 0,
      highScore: 0,
      unlockedUpgrades: [],
      achievements: [],
      statistics: {
        totalEnemiesKilled: 0,
        totalDamageDealt: 0,
        totalExperienceGained: 0
      }
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        muted: false
      },
      graphics: {
        quality: 'medium',
        particleCount: 100,
        showFPS: false
      },
      controls: {
        keyBindings: {
          moveUp: 'KeyW',
          moveDown: 'KeyS',
          moveLeft: 'KeyA',
          moveRight: 'KeyD'
        },
        mouseSensitivity: 1.0
      },
      accessibility: {
        colorBlindMode: false,
        highContrast: false,
        textSize: 'medium'
      }
    };
  }
}
```

---

## 🔄 Week 6: System Integration

### Migration of Existing Systems

**File: `src/migration/PlayerMigration.ts`**
```typescript
import { EntityManager } from '../ecs/Entity';
import { Transform, Health, Velocity, Sprite, Weapon } from '../ecs/Component';
import { ComponentType, EntityId } from '../types/core';

export class PlayerMigration {
  public static migratePlayerToECS(existingPlayer: any): EntityId {
    const entityManager = EntityManager.getInstance();
    const playerEntity = entityManager.createEntity();

    // Add Transform component
    const transform: Transform = {
      type: 'Transform' as ComponentType,
      entityId: playerEntity.id,
      position: { x: existingPlayer.sprite.x, y: existingPlayer.sprite.y },
      rotation: existingPlayer.sprite.rotation,
      scale: { x: existingPlayer.sprite.scale.x, y: existingPlayer.sprite.scale.y }
    };
    entityManager.addComponent(playerEntity.id, transform);

    // Add Health component
    const health: Health = {
      type: 'Health' as ComponentType,
      entityId: playerEntity.id,
      current: existingPlayer.health,
      maximum: existingPlayer.maxHealth,
      regeneration: existingPlayer.healthRegeneration || 0
    };
    entityManager.addComponent(playerEntity.id, health);

    // Add Velocity component
    const velocity: Velocity = {
      type: 'Velocity' as ComponentType,
      entityId: playerEntity.id,
      x: 0,
      y: 0,
      maxSpeed: existingPlayer.moveSpeed
    };
    entityManager.addComponent(playerEntity.id, velocity);

    // Add Sprite component
    const sprite: Sprite = {
      type: 'Sprite' as ComponentType,
      entityId: playerEntity.id,
      textureName: 'player_godzilla',
      visible: true,
      zIndex: 1500,
      tint: 0xFFFFFF
    };
    entityManager.addComponent(playerEntity.id, sprite);

    return playerEntity.id;
  }
}
```

### ECS Integration with Game Class

**File: `src/core/ECSGame.ts`**
```typescript
import { Game } from './Game';
import { EntityManager } from '../ecs/Entity';
import { SystemManager } from '../ecs/System';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { CollisionSystem } from '../ecs/systems/CollisionSystem';
import { EventBus } from './EventBus';
import { StateManager } from '../state/StateManager';

export class ECSGame extends Game {
  private entityManager: EntityManager;
  private systemManager: SystemManager;
  private stateManager: StateManager;
  private eventBus: EventBus;

  constructor(app: any) {
    super(app);
    this.entityManager = EntityManager.getInstance();
    this.systemManager = SystemManager.getInstance();
    this.stateManager = StateManager.getInstance();
    this.eventBus = EventBus.getInstance();
    this.initializeSystems();
  }

  private initializeSystems(): void {
    // Add core systems
    this.systemManager.addSystem(new MovementSystem());
    this.systemManager.addSystem(new CollisionSystem());
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on('collision', (event) => {
      console.log('Collision detected:', event.data);
    });

    this.eventBus.on('entity_damaged', (event) => {
      // Handle entity damage
    });

    this.eventBus.on('level_up', (event) => {
      // Handle level up
    });
  }

  protected update(deltaTime: number): void {
    // Update ECS systems
    const entities = this.entityManager.getAllEntities();
    this.systemManager.updateSystems(entities, deltaTime);

    // Call parent update for compatibility
    super.update(deltaTime);

    // Update state manager
    this.stateManager.getGameState().update(deltaTime);
  }
}
```

---

## 📋 Phase 2 Execution Checklist

### ECS Implementation ✅
- [ ] Create ECS directory structure (`src/ecs/components`, `src/ecs/systems`)
- [ ] Implement base Component interfaces
- [ ] Create EntityManager for entity lifecycle
- [ ] Build SystemManager with priority ordering
- [ ] Implement MovementSystem
- [ ] Create CollisionSystem
- [ ] Add component query system

### Event System ✅
- [ ] Implement EventBus singleton
- [ ] Add type-safe event handling
- [ ] Create event history tracking
- [ ] Add error handling for callbacks
- [ ] Implement once() for one-time events

### State Management ✅
- [ ] Create StateManager singleton
- [ ] Implement persistent state handling
- [ ] Add save/load functionality
- [ ] Create settings management
- [ ] Set up event-driven state updates

### System Integration ✅
- [ ] Create migration utilities
- [ ] Migrate Player to ECS entity
- [ ] Update Game class to use ECS
- [ ] Integrate with existing systems
- [ ] Add backward compatibility layer

---

## 🚀 Commands to Execute Phase 2

```bash
# 1. Create ECS directory structure
mkdir -p src/ecs/components src/ecs/systems src/state src/migration

# 2. Run tests for new systems
npm run test:unit

# 3. Validate ECS integration
npm run type-check

# 4. Test state management
npm run test:integration

# 5. Build and verify
npm run build
```

This completes Phase 2 implementation with full ECS architecture, event system, and state management ready for Phase 3. 