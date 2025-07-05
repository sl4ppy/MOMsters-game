import { Application, BaseTexture, Rectangle, Sprite, Texture } from 'pixi.js';

export interface GemConfig {
  xpValue: number;
  spriteIndex: number;
  scale: number;
  tint?: number;
}

export class GemSpriteManager {
  private app: Application;
  private gemTexture: BaseTexture | null = null;
  private gemSprites: Sprite[] = [];
  private isLoaded: boolean = false;

  // Gem configurations
  private gemConfigs: GemConfig[] = [
    { xpValue: 1, spriteIndex: 0, scale: 1.0, tint: 0x00ff00 }, // Green for 1XP
    { xpValue: 10, spriteIndex: 1, scale: 1.2, tint: 0xff8800 }, // Orange for 10XP
  ];

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Load the gems sprite sheet
   */
  async loadGemAtlas(): Promise<void> {
    if (this.isLoaded) return;

    try {
      console.warn('GemSpriteManager: Loading gem sprites...');

      // Load the gems texture
      this.gemTexture = BaseTexture.from(import.meta.env.BASE_URL + 'sprites/gems.png');

      // Wait for texture to load
      await new Promise<void>((resolve, reject) => {
        if (this.gemTexture!.valid) {
          resolve();
        } else {
          this.gemTexture!.on('loaded', () => resolve());
          this.gemTexture!.on('error', reject);
        }
      });

      // Create sprites for each gem type
      this.createGemSprites();

      this.isLoaded = true;
      console.warn('GemSpriteManager: Gem sprites loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load gem atlas:', error);
      this.isLoaded = false;
    }
  }

  /**
   * Create sprite objects for each gem type
   */
  private createGemSprites(): void {
    if (!this.gemTexture) return;

    const tileSize = 16; // Each gem is 16x16
    const tilesPerRow = 2; // 2 gems side by side

    for (let i = 0; i < 2; i++) {
      const x = (i % tilesPerRow) * tileSize;
      const y = Math.floor(i / tilesPerRow) * tileSize;

      const texture = new Texture(this.gemTexture, new Rectangle(x, y, tileSize, tileSize));
      const sprite = new Sprite(texture);

      // Center the sprite's anchor point
      sprite.anchor.set(0.5, 0.5);

      this.gemSprites.push(sprite);
    }
  }

  /**
   * Create a gem sprite for the given XP value
   */
  createGemSprite(xpValue: number): Sprite | null {
    if (!this.isLoaded || this.gemSprites.length === 0) {
      return null;
    }

    // Find the appropriate gem config
    const config = this.gemConfigs.find(c => c.xpValue === xpValue);
    if (!config) {
      // Fallback to first gem for unknown XP values
      const fallbackSprite = new Sprite(this.gemSprites[0].texture);
      fallbackSprite.anchor.set(0.5, 0.5);
      fallbackSprite.scale.set(1.0);
      return fallbackSprite;
    }

    // Create new sprite and apply configuration
    const sprite = new Sprite(this.gemSprites[config.spriteIndex].texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(config.scale);

    if (config.tint) {
      sprite.tint = config.tint;
    }

    return sprite;
  }

  /**
   * Get gem configuration for the given XP value
   */
  getGemConfig(xpValue: number): GemConfig | null {
    return this.gemConfigs.find(c => c.xpValue === xpValue) || null;
  }

  /**
   * Check if the gem atlas is loaded
   */
  get loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get all available gem configurations
   */
  getAllGemConfigs(): GemConfig[] {
    return [...this.gemConfigs];
  }
}
