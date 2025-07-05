// Core ECS exports
export * from './interfaces';
export * from './ComponentStore';
export * from './EntityManager';
export * from './SystemManager';
export * from './ECSWorld';

// Base components
export * from './components/BaseComponents';

// Player components
export * from './components/PlayerComponents';

// Enemy components
export * from './components/EnemyComponents';

// Camera components
export * from './components/CameraComponents';

// Input components
export * from './components/InputComponents';

// Weapon components
export * from './components/WeaponComponents';

// Base systems
export * from './systems/BaseSystems';

// Event-driven systems
export * from './systems/EventDrivenSystems';

// Input system
export * from './systems/InputSystem';

// Camera system
export * from './systems/CameraSystem';

// Player system
export * from './systems/PlayerSystem';

// Enemy system
export * from './systems/EnemySystem';

// Weapon system
export * from './systems/WeaponSystem';

// Projectile system
export * from './systems/ProjectileSystem';

// Re-export for convenience
export { EntityManagerImpl as EntityManager } from './EntityManager';
export { SystemManagerImpl as SystemManager } from './SystemManager';
export { ECSWorldImpl as ECSWorld } from './ECSWorld';
export { ComponentStoreImpl as ComponentStore } from './ComponentStore';
