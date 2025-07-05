import { SpriteConfig } from '../core/SpriteManager';

export const SPRITE_CONFIGS: SpriteConfig[] = [
  // Player sprites
  {
    name: 'player_shark_man',
    path: '/sprites/shark-man.png',
    width: 64,
    height: 64,
  },
  {
    name: 'player_hexagon',
    path: '/src/assets/sprites/player_hexagon.png',
    width: 64,
    height: 64,
  },
  {
    name: 'player_circle',
    path: '/src/assets/sprites/player_circle.png',
    width: 64,
    height: 64,
  },
  {
    name: 'player_damaged',
    path: '/src/assets/sprites/player_damaged.png',
    width: 64,
    height: 64,
  },

  // Enemy sprites
  {
    name: 'enemy_basic',
    path: '/src/assets/sprites/enemy_basic.png',
    width: 24,
    height: 24,
  },
  {
    name: 'enemy_fast',
    path: '/src/assets/sprites/enemy_fast.png',
    width: 20,
    height: 20,
  },
  {
    name: 'enemy_tank',
    path: '/src/assets/sprites/enemy_tank.png',
    width: 32,
    height: 32,
  },

  // Projectile sprites
  {
    name: 'projectile_basic',
    path: '/src/assets/sprites/projectile_basic.png',
    width: 8,
    height: 8,
  },
  {
    name: 'projectile_energy',
    path: '/src/assets/sprites/projectile_energy.png',
    width: 12,
    height: 12,
  },

  // Pickup sprites
  {
    name: 'xp_orb',
    path: '/src/assets/sprites/xp_orb.png',
    width: 16,
    height: 16,
  },
  {
    name: 'health_pickup',
    path: '/src/assets/sprites/health_pickup.png',
    width: 16,
    height: 16,
  },

  // UI sprites
  {
    name: 'ui_button',
    path: '/src/assets/sprites/ui_button.png',
    width: 200,
    height: 50,
  },
  {
    name: 'ui_icon_health',
    path: '/src/assets/sprites/ui_icon_health.png',
    width: 24,
    height: 24,
  },
  {
    name: 'ui_icon_xp',
    path: '/src/assets/sprites/ui_icon_xp.png',
    width: 24,
    height: 24,
  },
];

// Fallback sprite configurations (for when images aren't available)
export const FALLBACK_SPRITE_CONFIGS: SpriteConfig[] = [
  {
    name: 'fallback_player',
    path: '', // Will be handled by code generation
    width: 64,
    height: 64,
  },
  {
    name: 'fallback_enemy',
    path: '', // Will be handled by code generation
    width: 24,
    height: 24,
  },
  {
    name: 'fallback_projectile',
    path: '', // Will be handled by code generation
    width: 8,
    height: 8,
  },
];
