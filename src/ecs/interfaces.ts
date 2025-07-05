import { EntityId, ComponentType, SystemType } from '../types/core';

/**
 * Core ECS Interfaces
 */

// Entity is just an ID with components
export interface Entity {
  id: EntityId;
}

// Component marker interface
export interface Component {
  type: ComponentType;
}

// System interface
export interface System {
  type: SystemType;
  priority: number;
  initialize(): void;
  update(deltaTime: number): void;
  shutdown(): void;
}

// Query interface for component queries
export interface Query {
  with: ComponentType[];
  without?: ComponentType[];
  limit?: number;
}

// System events
export interface SystemEvent {
  type: string;
  entityId?: EntityId;
  componentType?: ComponentType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// ECS Manager interfaces
export interface EntityManager {
  createEntity(): Entity;
  destroyEntity(entityId: EntityId): void;
  hasEntity(entityId: EntityId): boolean;
  getEntity(entityId: EntityId): Entity | null;
  addComponent<T extends Component>(entityId: EntityId, component: T): void;
  removeComponent(entityId: EntityId, componentType: ComponentType): void;
  getComponent<T extends Component>(entityId: EntityId, componentType: ComponentType): T | null;
  hasComponent(entityId: EntityId, componentType: ComponentType): boolean;
  query(query: Query): Entity[];
  getAllEntities(): Entity[];
  getEntityCount(): number;
}

export interface SystemManager {
  registerSystem(system: System): void;
  unregisterSystem(systemType: SystemType): void;
  getSystem<T extends System>(systemType: SystemType): T | null;
  updateSystems(deltaTime: number): void;
  initializeSystems(): void;
  shutdownSystems(): void;
  getSystemCount(): number;
}

// Component storage interface
export interface ComponentStore<T extends Component> {
  set(entityId: EntityId, component: T): void;
  get(entityId: EntityId): T | null;
  has(entityId: EntityId): boolean;
  delete(entityId: EntityId): boolean;
  getAllComponents(): Map<EntityId, T>;
  clear(): void;
}

// ECS World interface
export interface ECSWorld {
  entityManager: EntityManager;
  systemManager: SystemManager;
  update(deltaTime: number): void;
  shutdown(): void;
  getStats(): {
    entities: number;
    systems: number;
    components: number;
  };
}
