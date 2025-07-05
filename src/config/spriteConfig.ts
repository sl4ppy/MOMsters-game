export interface SpriteConfig {
  name: string;
  path: string;
  width: number;
  height: number;
  frameCount?: number;
  animationSpeed?: number;
  scale?: number;
}

export interface SpriteAtlasConfig {
  name: string;
  imagePath: string;
  jsonPath: string;
  sprites: Record<
    string,
    {
      frame: { x: number; y: number; w: number; h: number };
      sourceSize: { w: number; h: number };
    }
  >;
}

export const SPRITE_CONFIGS: SpriteConfig[] = [
  // Player sprites
  {
    name: 'player_godzilla',
    path: '/sprites/godzilla_small.png',
    width: 64,
    height: 64,
    scale: 1.0,
  },
  {
    name: 'player_shark_man',
    path: '/sprites/shark-man.png',
    width: 64,
    height: 64,
    scale: 1.0,
  },

  // Projectile sprites
  {
    name: 'projectile_fireball',
    path: '/sprites/fireball.png',
    width: 16,
    height: 16,
    frameCount: 4,
    animationSpeed: 0.2,
  },

  // UI sprites
  {
    name: 'ui_button',
    path: '/sprites/ui_button.png',
    width: 200,
    height: 50,
  },
];

export const ATLAS_CONFIGS: SpriteAtlasConfig[] = [
  {
    name: 'enemies',
    imagePath: '/sprites/enemies_01.png',
    jsonPath: '/sprites/enemies_01.json',
    sprites: {
      // Will be loaded from JSON
    },
  },
  {
    name: 'gems',
    imagePath: '/sprites/gems.png',
    jsonPath: '/sprites/gems.json',
    sprites: {
      // Will be loaded from JSON
    },
  },
];
