import { EntityId } from '../types/core';
import {
  GameEvent,
  EventListener,
  EventSubscription,
  EventPriority,
  PrioritizedEventListener,
  EventBus,
  EventMiddleware,
  EventHistory,
} from './interfaces';

/**
 * High-performance EventBus implementation with type safety and middleware support
 */
export class EventBusImpl implements EventBus {
  private listeners: Map<string, PrioritizedEventListener[]> = new Map();
  private middleware: EventMiddleware[] = [];
  private history: EventHistoryImpl;
  private isEmitting = false;
  private deferredOperations: Array<() => void> = [];

  constructor(historySize: number = 1000) {
    this.history = new EventHistoryImpl(historySize);
  }

  // Subscribe to events with priority
  public on<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>,
    priority: EventPriority = EventPriority.NORMAL
  ): EventSubscription {
    return this.addListener(eventType, listener, priority, false);
  }

  // Subscribe to events (one-time)
  public once<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>,
    priority: EventPriority = EventPriority.NORMAL
  ): EventSubscription {
    return this.addListener(eventType, listener, priority, true);
  }

  // Unsubscribe from events
  public off<T extends GameEvent>(eventType: string, listener: EventListener<T>): void {
    const operation = (): void => {
      const eventListeners = this.listeners.get(eventType);
      if (!eventListeners) return;

      const index = eventListeners.findIndex(pl => pl.listener === listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
        if (eventListeners.length === 0) {
          this.listeners.delete(eventType);
        }
      }
    };

    if (this.isEmitting) {
      this.deferredOperations.push(operation);
    } else {
      operation();
    }
  }

  // Emit typed events
  public emit<T extends GameEvent>(event: T): void {
    // Add to history
    this.history.add(event);

    // Apply middleware beforeDispatch
    let processedEvent = event;
    for (const middleware of this.middleware) {
      if (middleware.beforeDispatch) {
        const result = middleware.beforeDispatch(processedEvent);
        if (result === null) {
          // Event was cancelled by middleware
          return;
        }
        processedEvent = result;
      }
    }

    // Get listeners for this event type
    const eventListeners = this.listeners.get(processedEvent.type);
    if (!eventListeners || eventListeners.length === 0) {
      return;
    }

    // Set emitting flag to defer listener modifications
    this.isEmitting = true;

    try {
      // Sort by priority (highest first) if not already sorted
      if (!this.isListenersSorted(eventListeners)) {
        eventListeners.sort((a, b) => b.priority - a.priority);
      }

      // Dispatch to listeners
      const listenersToRemove: PrioritizedEventListener[] = [];

      for (const prioritizedListener of eventListeners) {
        try {
          prioritizedListener.listener(processedEvent);

          // Mark one-time listeners for removal
          if (prioritizedListener.once) {
            listenersToRemove.push(prioritizedListener);
          }
        } catch (error) {
          // Handle errors via middleware
          for (const middleware of this.middleware) {
            if (middleware.onError) {
              middleware.onError(processedEvent, error as Error, prioritizedListener.listener);
            }
          }

          // Re-throw if no middleware handled it
          if (this.middleware.length === 0 || !this.middleware.some(m => m.onError)) {
            console.error(`Error in event listener for ${processedEvent.type}:`, error);
          }
        }
      }

      // Remove one-time listeners
      for (const listenerToRemove of listenersToRemove) {
        const index = eventListeners.indexOf(listenerToRemove);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }

      // Clean up empty listener arrays
      if (eventListeners.length === 0) {
        this.listeners.delete(processedEvent.type);
      }
    } finally {
      this.isEmitting = false;

      // Process deferred operations
      const operations = [...this.deferredOperations];
      this.deferredOperations = [];
      for (const operation of operations) {
        operation();
      }
    }

    // Apply middleware afterDispatch
    for (const middleware of this.middleware) {
      if (middleware.afterDispatch) {
        middleware.afterDispatch(processedEvent);
      }
    }
  }

  // Emit events with data helper
  public emitEvent<T = unknown>(eventType: string, data?: T, entityId?: EntityId): void {
    const event: GameEvent = {
      type: eventType,
      timestamp: Date.now(),
      entityId,
      data,
    };
    this.emit(event);
  }

  // Clear all listeners for an event type
  public clearListeners(eventType: string): void {
    const operation = (): void => {
      this.listeners.delete(eventType);
    };

    if (this.isEmitting) {
      this.deferredOperations.push(operation);
    } else {
      operation();
    }
  }

  // Clear all listeners
  public clearAllListeners(): void {
    const operation = (): void => {
      this.listeners.clear();
    };

    if (this.isEmitting) {
      this.deferredOperations.push(operation);
    } else {
      operation();
    }
  }

  // Get listener count
  public getListenerCount(eventType?: string): number {
    if (eventType) {
      const listeners = this.listeners.get(eventType);
      return listeners ? listeners.length : 0;
    }

    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.length;
    }
    return total;
  }

  // Check if event type has listeners
  public hasListeners(eventType: string): boolean {
    const listeners = this.listeners.get(eventType);
    return listeners ? listeners.length > 0 : false;
  }

  // Middleware management
  public addMiddleware(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  public removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
    }
  }

  // History access
  public getHistory(): EventHistory {
    return this.history;
  }

  // Statistics for debugging
  public getStats(): {
    totalListeners: number;
    eventTypes: number;
    historySize: number;
    isEmitting: boolean;
    deferredOperations: number;
  } {
    return {
      totalListeners: this.getListenerCount(),
      eventTypes: this.listeners.size,
      historySize: this.history.events.length,
      isEmitting: this.isEmitting,
      deferredOperations: this.deferredOperations.length,
    };
  }

  // Private helper methods
  private addListener<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>,
    priority: EventPriority,
    once: boolean
  ): EventSubscription {
    const operation = (): void => {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }

      const eventListeners = this.listeners.get(eventType)!;
      const prioritizedListener: PrioritizedEventListener = {
        listener: listener as EventListener,
        priority,
        once,
      };

      eventListeners.push(prioritizedListener);

      // Sort by priority (highest first)
      eventListeners.sort((a, b) => b.priority - a.priority);
    };

    if (this.isEmitting) {
      this.deferredOperations.push(operation);
    } else {
      operation();
    }

    // Return subscription object
    return {
      unsubscribe: () => {
        this.off(eventType, listener);
      },
    };
  }

  private isListenersSorted(listeners: PrioritizedEventListener[]): boolean {
    for (let i = 1; i < listeners.length; i++) {
      if (listeners[i - 1].priority < listeners[i].priority) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Event history implementation for debugging and replay
 */
class EventHistoryImpl implements EventHistory {
  public events: GameEvent[] = [];
  public maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  public add(event: GameEvent): void {
    this.events.push(event);

    // Remove old events if we exceed max size
    if (this.events.length > this.maxSize) {
      this.events.shift();
    }
  }

  public clear(): void {
    this.events = [];
  }

  public getEvents(eventType?: string): GameEvent[] {
    if (!eventType) {
      return [...this.events];
    }

    return this.events.filter(event => event.type === eventType);
  }

  public getEventsInRange(startTime: number, endTime: number): GameEvent[] {
    return this.events.filter(event => event.timestamp >= startTime && event.timestamp <= endTime);
  }
}
