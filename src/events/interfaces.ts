import { EntityId } from '../types/core';

/**
 * Core Event System Interfaces
 */

// Base event interface
export interface GameEvent {
  type: string;
  timestamp: number;
  entityId?: EntityId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// Typed event interface for type safety
export interface TypedGameEvent<T = unknown> extends GameEvent {
  data: T;
}

// Event listener callback
export type EventListener<T extends GameEvent = GameEvent> = (event: T) => void;

// Event subscription interface
export interface EventSubscription {
  unsubscribe(): void;
}

// Event priority levels
export enum EventPriority {
  LOWEST = 0,
  LOW = 25,
  NORMAL = 50,
  HIGH = 75,
  HIGHEST = 100,
  CRITICAL = 200,
}

// Event listener with priority
export interface PrioritizedEventListener<T extends GameEvent = GameEvent> {
  listener: EventListener<T>;
  priority: EventPriority;
  once?: boolean;
}

// EventBus interface
export interface EventBus {
  // Subscribe to events
  on<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>,
    priority?: EventPriority
  ): EventSubscription;

  // Subscribe to events (one-time)
  once<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>,
    priority?: EventPriority
  ): EventSubscription;

  // Unsubscribe from events
  off<T extends GameEvent>(eventType: string, listener: EventListener<T>): void;

  // Emit events
  emit<T extends GameEvent>(event: T): void;

  // Emit events with data
  emitEvent<T = unknown>(eventType: string, data?: T, entityId?: EntityId): void;

  // Clear all listeners for an event type
  clearListeners(eventType: string): void;

  // Clear all listeners
  clearAllListeners(): void;

  // Get listener count for debugging
  getListenerCount(eventType?: string): number;

  // Check if event type has listeners
  hasListeners(eventType: string): boolean;
}

// Event middleware interface for intercepting events
export interface EventMiddleware {
  // Called before event is dispatched to listeners
  beforeDispatch?<T extends GameEvent>(event: T): T | null; // Return null to cancel

  // Called after event is dispatched to listeners
  afterDispatch?<T extends GameEvent>(event: T): void;

  // Called when an error occurs during event handling
  onError?<T extends GameEvent>(event: T, error: Error, listener: EventListener<T>): void;
}

// Event history interface for debugging and replay
export interface EventHistory {
  events: GameEvent[];
  maxSize: number;
  add(event: GameEvent): void;
  clear(): void;
  getEvents(eventType?: string): GameEvent[];
  getEventsInRange(startTime: number, endTime: number): GameEvent[];
}
