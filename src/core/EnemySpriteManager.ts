import { Texture, Sprite, Rectangle } from 'pixi.js';
import { Assets } from 'pixi.js';

export interface EnemySpriteConfig {
  id: number; // 0-29 for the 30 enemy types
  name: string;
  health: number;
  speed: number;
  damage: number;
  collisionRadius: number;
  xpValue: number;
  scale?: number; // Optional scale factor
  customSprite?: string; // Optional custom sprite path
}

// Custom sprite configuration for special enemies
interface CustomSpriteConfig {
  enemyId: number;
  spritePath: string;
  scale: number;
}

export class EnemySpriteManager {
  private enemyAtlasTexture?: Texture;
  private loaded: boolean = false;
  private customTextures: Map<number, Texture> = new Map();

  // Atlas configuration
  private readonly atlasPath = import.meta.env.BASE_URL + 'sprites/enemies_01.png';
  private readonly tilesPerRow = 10;
  private readonly tilesPerColumn = 3;
  private readonly totalEnemies = this.tilesPerRow * this.tilesPerColumn; // 30 enemies
  private readonly tileSize = 32; // Assuming 32x32 tiles in the atlas

  // Custom sprite configurations for special enemies
  private readonly customSprites: CustomSpriteConfig[] = [
    // Skull King boss uses chicken sprite at 3x scale
    { enemyId: 28, spritePath: import.meta.env.BASE_URL + 'sprites/chicken_01.png', scale: 3.0 },
  ];

  // Enemy configurations for all 30 enemy types
  private readonly enemyConfigs: EnemySpriteConfig[] = [
    // Row 1 (0-9): Basic enemies
    { id: 0, name: 'Blob', health: 20, speed: 75, damage: 6, collisionRadius: 10, xpValue: 4 },
    { id: 1, name: 'Goblin', health: 25, speed: 90, damage: 8, collisionRadius: 12, xpValue: 6 },
    { id: 2, name: 'Plant', health: 15, speed: 60, damage: 5, collisionRadius: 8, xpValue: 4 },
    {
      id: 3,
      name: 'Hobgoblin',
      health: 35,
      speed: 85,
      damage: 10,
      collisionRadius: 13,
      xpValue: 8,
    },
    { id: 4, name: 'Mermaid', health: 30, speed: 95, damage: 9, collisionRadius: 11, xpValue: 6 },
    {
      id: 5,
      name: 'Gargoyle',
      health: 45,
      speed: 70,
      damage: 12,
      collisionRadius: 14,
      xpValue: 10,
    },
    {
      id: 6,
      name: 'ChompChest',
      health: 60,
      speed: 50,
      damage: 15,
      collisionRadius: 16,
      xpValue: 12,
    },
    { id: 7, name: 'TreeEnt', health: 80, speed: 45, damage: 18, collisionRadius: 18, xpValue: 16 },
    { id: 8, name: 'Reaper', health: 55, speed: 80, damage: 14, collisionRadius: 15, xpValue: 12 },
    {
      id: 9,
      name: 'Palomino',
      health: 40,
      speed: 100,
      damage: 11,
      collisionRadius: 13,
      xpValue: 8,
    },

    // Row 2 (10-19): Medium enemies
    {
      id: 10,
      name: 'Green Dragon',
      health: 120,
      speed: 75,
      damage: 25,
      collisionRadius: 20,
      xpValue: 30,
    },
    {
      id: 11,
      name: 'Red Dragon',
      health: 150,
      speed: 70,
      damage: 30,
      collisionRadius: 22,
      xpValue: 40,
    },
    {
      id: 12,
      name: 'Blue Dragon',
      health: 180,
      speed: 65,
      damage: 35,
      collisionRadius: 24,
      xpValue: 50,
    },
    {
      id: 13,
      name: 'Skeleton',
      health: 30,
      speed: 85,
      damage: 10,
      collisionRadius: 12,
      xpValue: 8,
    },
    { id: 14, name: 'Mollusk', health: 25, speed: 55, damage: 8, collisionRadius: 10, xpValue: 6 },
    {
      id: 15,
      name: 'Banshee',
      health: 35,
      speed: 90,
      damage: 12,
      collisionRadius: 12,
      xpValue: 10,
    },
    {
      id: 16,
      name: 'Floating Maw',
      health: 50,
      speed: 80,
      damage: 16,
      collisionRadius: 14,
      xpValue: 14,
    },
    {
      id: 17,
      name: 'Cacodemon',
      health: 70,
      speed: 75,
      damage: 20,
      collisionRadius: 16,
      xpValue: 18,
    },
    {
      id: 18,
      name: 'Sea Hag',
      health: 40,
      speed: 85,
      damage: 13,
      collisionRadius: 13,
      xpValue: 10,
    },
    { id: 19, name: 'Demon', health: 80, speed: 85, damage: 22, collisionRadius: 17, xpValue: 20 },

    // Row 3 (20-29): Elite enemies
    {
      id: 20,
      name: 'Centaur',
      health: 65,
      speed: 95,
      damage: 18,
      collisionRadius: 15,
      xpValue: 16,
    },
    {
      id: 21,
      name: 'Green Orc',
      health: 55,
      speed: 80,
      damage: 15,
      collisionRadius: 14,
      xpValue: 12,
    },
    {
      id: 22,
      name: 'Golden Orc',
      health: 75,
      speed: 75,
      damage: 20,
      collisionRadius: 16,
      xpValue: 18,
    },
    { id: 23, name: 'Void', health: 45, speed: 100, damage: 16, collisionRadius: 13, xpValue: 14 },
    { id: 24, name: 'Golem', health: 100, speed: 60, damage: 25, collisionRadius: 18, xpValue: 24 },
    {
      id: 25,
      name: 'Ice Golem',
      health: 120,
      speed: 55,
      damage: 28,
      collisionRadius: 19,
      xpValue: 28,
    },
    { id: 26, name: 'Jawa', health: 20, speed: 110, damage: 7, collisionRadius: 9, xpValue: 6 },
    {
      id: 27,
      name: 'Mud Golem',
      health: 90,
      speed: 50,
      damage: 22,
      collisionRadius: 17,
      xpValue: 20,
    },
    // Skull King boss - enhanced stats for boss fight
    {
      id: 28,
      name: 'Skull King',
      health: 500,
      speed: 60,
      damage: 50,
      collisionRadius: 25,
      xpValue: 100,
      scale: 3.0,
      customSprite: 'chicken_01.png',
    },
    {
      id: 29,
      name: 'PlasmaMan',
      health: 60,
      speed: 88,
      damage: 19,
      collisionRadius: 15,
      xpValue: 16,
    },
  ];

  constructor() {}

  /**
   * Load the enemy sprite atlas and custom sprites
   */
  async loadEnemyAtlas(): Promise<void> {
    console.warn('EnemySpriteManager: Loading enemy sprites...');

    try {
      // Load main atlas
      this.enemyAtlasTexture = await Assets.load(this.atlasPath);

      // Load custom sprites
      await this.loadCustomSprites();

      this.loaded = true;
      console.warn('EnemySpriteManager: Enemy sprites loaded successfully');
    } catch (error) {
      console.error('❌ Error loading enemy atlas:', error);
      throw error;
    }
  }

  /**
   * Load custom sprites for special enemies
   */
  private async loadCustomSprites(): Promise<void> {
    console.log('🎨 Loading custom enemy sprites...');

    for (const customConfig of this.customSprites) {
      try {
        const texture = await Assets.load(customConfig.spritePath);
        this.customTextures.set(customConfig.enemyId, texture);
        console.log(
          `✅ Loaded custom sprite for enemy ${customConfig.enemyId}: ${customConfig.spritePath}`
        );
      } catch (error) {
        console.warn(`⚠️ Failed to load custom sprite for enemy ${customConfig.enemyId}:`, error);
      }
    }
  }

  /**
   * Create a sprite for a specific enemy type
   */
  createEnemySprite(enemyId: number): Sprite | null {
    if (!this.loaded || !this.enemyAtlasTexture) {
      console.warn('Enemy atlas not loaded!');
      return null;
    }

    if (enemyId < 0 || enemyId >= this.totalEnemies) {
      console.warn(`Invalid enemy ID: ${enemyId}. Must be 0-${this.totalEnemies - 1}`);
      return null;
    }

    // Check if this enemy has a custom sprite
    const customTexture = this.customTextures.get(enemyId);
    if (customTexture) {
      const sprite = new Sprite(customTexture);
      sprite.anchor.set(0.5, 0.5); // Center anchor

      // Apply custom scale if defined
      const customConfig = this.customSprites.find(config => config.enemyId === enemyId);
      if (customConfig) {
        sprite.scale.set(customConfig.scale, customConfig.scale);
        console.log(
          `🐔 Created custom sprite for enemy ${enemyId} at ${customConfig.scale}x scale`
        );
      }

      return sprite;
    }

    // Use atlas sprite for normal enemies
    // Calculate tile position in the atlas
    const row = Math.floor(enemyId / this.tilesPerRow);
    const col = enemyId % this.tilesPerRow;

    // Create texture rectangle for this specific enemy
    const textureRect = new Rectangle(
      col * this.tileSize,
      row * this.tileSize,
      this.tileSize,
      this.tileSize
    );

    // Create texture from the atlas
    const enemyTexture = new Texture(this.enemyAtlasTexture.baseTexture, textureRect);

    // Create sprite
    const sprite = new Sprite(enemyTexture);
    sprite.anchor.set(0.5, 0.5); // Center anchor

    return sprite;
  }

  /**
   * Get enemy configuration by ID
   */
  getEnemyConfig(enemyId: number): EnemySpriteConfig | null {
    if (enemyId < 0 || enemyId >= this.enemyConfigs.length) {
      return null;
    }
    return this.enemyConfigs[enemyId];
  }

  /**
   * Get random enemy configuration
   */
  getRandomEnemyConfig(): EnemySpriteConfig {
    const randomId = Math.floor(Math.random() * this.enemyConfigs.length);
    return this.enemyConfigs[randomId];
  }

  /**
   * Get all enemy configurations
   */
  getAllEnemyConfigs(): EnemySpriteConfig[] {
    return [...this.enemyConfigs];
  }

  /**
   * Check if atlas is loaded
   */
  get isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get total number of enemy types
   */
  get totalEnemyTypes(): number {
    return this.totalEnemies;
  }
}
