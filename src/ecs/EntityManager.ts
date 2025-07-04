import { EntityId, ComponentType, createEntityId } from '../types/core';
import { Entity, EntityManager, Component, Query } from './interfaces';
import { ComponentStoreImpl } from './ComponentStore';

/**
 * EntityManager implementation
 * Manages entities and their components with efficient querying
 */
export class EntityManagerImpl implements EntityManager {
  private entities: Map<EntityId, Entity> = new Map();
  private componentStores: Map<ComponentType, ComponentStoreImpl<any>> = new Map();
  private entityComponents: Map<EntityId, Set<ComponentType>> = new Map();
  private nextEntityId = 1;

  public createEntity(): Entity {
    const id = createEntityId(this.nextEntityId++);
    const entity: Entity = { id };
    
    this.entities.set(id, entity);
    this.entityComponents.set(id, new Set());
    
    return entity;
  }

  public destroyEntity(entityId: EntityId): void {
    if (!this.entities.has(entityId)) {
      return;
    }

    // Remove all components from this entity
    const components = this.entityComponents.get(entityId);
    if (components) {
      for (const componentType of components) {
        this.removeComponent(entityId, componentType);
      }
    }

    // Remove entity tracking
    this.entities.delete(entityId);
    this.entityComponents.delete(entityId);
  }

  public hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  public getEntity(entityId: EntityId): Entity | null {
    return this.entities.get(entityId) || null;
  }

  public addComponent<T extends Component>(entityId: EntityId, component: T): void {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    // Get or create component store for this component type
    let store = this.componentStores.get(component.type);
    if (!store) {
      store = new ComponentStoreImpl<T>(component.type);
      this.componentStores.set(component.type, store);
    }

    // Add component to store
    store.set(entityId, component);

    // Track that this entity has this component
    const entityComponents = this.entityComponents.get(entityId);
    if (entityComponents) {
      entityComponents.add(component.type);
    }
  }

  public removeComponent(entityId: EntityId, componentType: ComponentType): void {
    if (!this.entities.has(entityId)) {
      return;
    }

    const store = this.componentStores.get(componentType);
    if (store) {
      store.delete(entityId);
    }

    // Remove from entity tracking
    const entityComponents = this.entityComponents.get(entityId);
    if (entityComponents) {
      entityComponents.delete(componentType);
    }
  }

  public getComponent<T extends Component>(
    entityId: EntityId,
    componentType: ComponentType
  ): T | null {
    if (!this.entities.has(entityId)) {
      return null;
    }

    const store = this.componentStores.get(componentType);
    if (!store) {
      return null;
    }

    return store.get(entityId) as T;
  }

  public hasComponent(entityId: EntityId, componentType: ComponentType): boolean {
    if (!this.entities.has(entityId)) {
      return false;
    }

    const entityComponents = this.entityComponents.get(entityId);
    return entityComponents ? entityComponents.has(componentType) : false;
  }

  public query(query: Query): Entity[] {
    const results: Entity[] = [];

    for (const [entityId, entity] of this.entities) {
      if (this.matchesQuery(entityId, query)) {
        results.push(entity);
        
        // Apply limit if specified
        if (query.limit && results.length >= query.limit) {
          break;
        }
      }
    }

    return results;
  }

  private matchesQuery(entityId: EntityId, query: Query): boolean {
    const entityComponents = this.entityComponents.get(entityId);
    if (!entityComponents) {
      return false;
    }

    // Check required components
    for (const componentType of query.with) {
      if (!entityComponents.has(componentType)) {
        return false;
      }
    }

    // Check excluded components
    if (query.without) {
      for (const componentType of query.without) {
        if (entityComponents.has(componentType)) {
          return false;
        }
      }
    }

    return true;
  }

  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  public getEntityCount(): number {
    return this.entities.size;
  }

  // Additional utility methods
  public getEntityComponents(entityId: EntityId): ComponentType[] {
    const components = this.entityComponents.get(entityId);
    return components ? Array.from(components) : [];
  }

  public getEntitiesWithComponent(componentType: ComponentType): Entity[] {
    const store = this.componentStores.get(componentType);
    if (!store) {
      return [];
    }

    const entities: Entity[] = [];
    for (const entityId of store.getEntityIds()) {
      const entity = this.entities.get(entityId);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  public getComponentStore<T extends Component>(componentType: ComponentType): ComponentStoreImpl<T> | null {
    return this.componentStores.get(componentType) || null;
  }

  public getComponentCount(): number {
    let total = 0;
    for (const store of this.componentStores.values()) {
      total += store.getSize();
    }
    return total;
  }

  public clear(): void {
    this.entities.clear();
    this.entityComponents.clear();
    for (const store of this.componentStores.values()) {
      store.clear();
    }
    this.componentStores.clear();
    this.nextEntityId = 1;
  }
} 