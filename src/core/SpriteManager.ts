import { Application, Texture, Sprite, Assets } from 'pixi.js';

export interface SpriteConfig {
  name: string;
  path: string;
  width?: number;
  height?: number;
  anchor?: { x: number; y: number };
}

export class SpriteManager {
  private app: Application;
  private sprites: Map<string, Texture> = new Map();
  private loaded: boolean = false;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Load all sprite assets
   */
  async loadSprites(spriteConfigs: SpriteConfig[]): Promise<void> {
    console.warn('SpriteManager: Loading sprites...');

    try {
      // Load all textures
      for (const config of spriteConfigs) {
        const texture = await Assets.load(config.path);
        this.sprites.set(config.name, texture);
        console.log(`Loaded sprite: ${config.name}`);
      }

      this.loaded = true;
      console.warn('SpriteManager: Sprites loaded successfully');
    } catch (error) {
      console.error('Error loading sprites:', error);
      throw error;
    }
  }

  /**
   * Create a sprite from a loaded texture
   */
  createSprite(name: string, config?: Partial<SpriteConfig>): Sprite | null {
    const texture = this.sprites.get(name);
    if (!texture) {
      console.warn(`Sprite "${name}" not found!`);
      return null;
    }

    const sprite = new Sprite(texture);

    // Apply configuration
    if (config?.width && config?.height) {
      sprite.width = config.width;
      sprite.height = config.height;
    }

    if (config?.anchor) {
      sprite.anchor.set(config.anchor.x, config.anchor.y);
    } else {
      // Default to center anchor
      sprite.anchor.set(0.5, 0.5);
    }

    return sprite;
  }

  /**
   * Get a texture by name
   */
  getTexture(name: string): Texture | null {
    return this.sprites.get(name) || null;
  }

  /**
   * Check if sprites are loaded
   */
  get isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get all loaded sprite names
   */
  getLoadedSpriteNames(): string[] {
    return Array.from(this.sprites.keys());
  }
}
