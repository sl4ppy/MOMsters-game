// Event system interfaces
export * from './interfaces';

// EventBus implementation
export { EventBusImpl } from './EventBus';
import { EventBusImpl } from './EventBus';

// Game event types and factory
export * from './GameEvents';
export * from './InputEvents';
export * from './CameraEvents';
// TODO: Resolve conflicts with GameEvents before enabling
// export * from './PlayerEvents';

// Re-export common types for convenience
export type {
  GameEvent,
  EventListener,
  EventSubscription,
  EventPriority,
  EventBus,
  EventMiddleware,
  EventHistory,
} from './interfaces';

// Event-driven systems
export * from '../ecs/systems/EventDrivenSystems';

// Create default event bus instance
export const createEventBus = (historySize: number = 1000): EventBusImpl => {
  return new EventBusImpl(historySize);
};
