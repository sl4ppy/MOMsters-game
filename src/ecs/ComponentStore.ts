import { EntityId } from '../types/core';
import { Component, ComponentStore } from './interfaces';

/**
 * Efficient component storage implementation
 * Uses Map for O(1) lookups and provides type safety
 */
export class ComponentStoreImpl<T extends Component> implements ComponentStore<T> {
  private components: Map<EntityId, T> = new Map();
  private readonly componentType: string;

  constructor(componentType: string) {
    this.componentType = componentType;
  }

  public set(entityId: EntityId, component: T): void {
    if (component.type !== this.componentType) {
      throw new Error(
        `Component type mismatch: expected ${this.componentType}, got ${component.type}`
      );
    }
    this.components.set(entityId, component);
  }

  public get(entityId: EntityId): T | null {
    return this.components.get(entityId) || null;
  }

  public has(entityId: EntityId): boolean {
    return this.components.has(entityId);
  }

  public delete(entityId: EntityId): boolean {
    return this.components.delete(entityId);
  }

  public getAllComponents(): Map<EntityId, T> {
    return new Map(this.components);
  }

  public clear(): void {
    this.components.clear();
  }

  public getSize(): number {
    return this.components.size;
  }

  public getComponentType(): string {
    return this.componentType;
  }

  // Iterator support
  public *[Symbol.iterator](): Iterator<[EntityId, T]> {
    for (const [entityId, component] of this.components) {
      yield [entityId, component];
    }
  }

  // Get all entity IDs that have this component
  public getEntityIds(): EntityId[] {
    return Array.from(this.components.keys());
  }

  // Get all components as array
  public getComponents(): T[] {
    return Array.from(this.components.values());
  }
} 