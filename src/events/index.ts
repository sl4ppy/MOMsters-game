// Event system interfaces
export * from './interfaces';

// EventBus implementation
export { EventBusImpl } from './EventBus';
import { EventBusImpl } from './EventBus';

// Game event types and factory - specific exports to avoid conflicts
export type { 
  GameStartedEvent, 
  GameOverEvent, 
  GamePausedEvent, 
  GameResumedEvent,
  CollisionStartEvent,
  CollisionEndEvent,
  ExperienceGainedEvent,
  UpgradeSelectedEvent,
  WaveStartedEvent,
  WaveCompletedEvent,
  UIClickEvent,
  UIHoverEvent,
  UIToggleEvent,
  AudioPlayEvent,
  AudioStopEvent
} from './GameEvents';

export { GameEventFactory, EVENT_TYPES } from './GameEvents';

// Input events
export * from './InputEvents';

// Camera events
export * from './CameraEvents';

// Player events - specialized version
export * from './PlayerEvents';

// Enemy events - specialized version
export * from './EnemyEvents';

// Weapon events - specialized version  
export * from './WeaponEvents';

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
