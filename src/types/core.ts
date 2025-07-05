// Branded types for type safety
export type EntityId = string & { __brand: 'EntityId' };
export type ComponentType = string & { __brand: 'ComponentType' };
export type SystemType = string & { __brand: 'SystemType' };

// Factory functions for branded types
export function createEntityId(id: number): EntityId {
  return `entity_${id}` as EntityId;
}

export function createComponentType(type: string): ComponentType {
  return type as ComponentType;
}

export function createSystemType(type: string): SystemType {
  return type as SystemType;
}

// Vector types
export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 extends Vector2 {
  z: number;
}

// Utility types
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Event types
export interface GameEvent {
  type: string;
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TypedGameEvent<T = any> extends GameEvent {
  data: T;
}

// Entity-Component types
export interface Component {
  readonly type: ComponentType;
  entityId: EntityId;
}

export interface Entity {
  id: EntityId;
  active: boolean;
  components: Map<ComponentType, Component>;
}

// System types
export interface System {
  readonly type: SystemType;
  readonly requiredComponents: ComponentType[];
  readonly priority: number;
  update(entities: Entity[], deltaTime: number): void;
  init?(): void;
  destroy?(): void;
}
