import { Assets, Texture, Spritesheet } from 'pixi.js';
import { SPRITE_CONFIGS, ATLAS_CONFIGS } from '../config/spriteConfig';
import { BUILD_CONFIG } from '../config/buildConfig';

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset: string;
}

export interface AssetValidationResult {
  valid: boolean;
  missing: string[];
  corrupted: string[];
}

export class AssetManager {
  private static instance: AssetManager;
  private loadedAssets: Map<string, any> = new Map();
  private loadedTextures: Map<string, Texture> = new Map();
  private loadedSpritesheets: Map<string, Spritesheet> = new Map();
  private onProgress?: (progress: LoadProgress) => void;
  private loadingPromise?: Promise<void>;

  private constructor() {
    this.setupAssetLoader();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  private setupAssetLoader(): void {
    // Configure PIXI Assets with proper error handling
    Assets.cache.reset();
  }

  public async loadAssets(onProgress?: (progress: LoadProgress) => void): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.onProgress = onProgress;

    this.loadingPromise = this.performAssetLoading();
    return this.loadingPromise;
  }

  private async performAssetLoading(): Promise<void> {
    try {
      const assetUrls: Record<string, string> = {};
      let totalAssets = 0;

      // Prepare sprite assets
      SPRITE_CONFIGS.forEach(config => {
        const fullPath = BUILD_CONFIG.cdnUrl + config.path;
        assetUrls[config.name] = fullPath;
        totalAssets++;
      });

      // Prepare atlas assets
      ATLAS_CONFIGS.forEach(config => {
        const imageUrl = BUILD_CONFIG.cdnUrl + config.imagePath;
        const jsonUrl = BUILD_CONFIG.cdnUrl + config.jsonPath;

        assetUrls[`${config.name}_image`] = imageUrl;
        assetUrls[`${config.name}_json`] = jsonUrl;
        totalAssets += 2;
      });

      let loadedCount = 0;

      // Load assets with progress tracking
      for (const [name, url] of Object.entries(assetUrls)) {
        try {
          const asset = await Assets.load(url);
          this.loadedAssets.set(name, asset);

          if (asset instanceof Texture) {
            this.loadedTextures.set(name, asset);
          }

          if (asset && typeof asset === 'object' && 'textures' in asset) {
            this.loadedSpritesheets.set(name, asset as Spritesheet);
          }

          loadedCount++;

          if (this.onProgress) {
            this.onProgress({
              loaded: loadedCount,
              total: totalAssets,
              percentage: (loadedCount / totalAssets) * 100,
              currentAsset: name,
            });
          }
        } catch (error) {
          console.error(`❌ Failed to load asset: ${name} from ${url}`, error);
        }
      }

      console.log('✅ All assets loaded successfully');
    } catch (error) {
      console.error('❌ Asset loading failed:', error);
      throw error;
    }
  }

  public getTexture(name: string): Texture | null {
    const texture = this.loadedTextures.get(name);
    if (!texture) {
      console.warn(`⚠️ Texture not found: ${name}`);
      return null;
    }
    return texture;
  }

  public getSpritesheet(name: string): Spritesheet | null {
    const spritesheet = this.loadedSpritesheets.get(name);
    if (!spritesheet) {
      console.warn(`⚠️ Spritesheet not found: ${name}`);
      return null;
    }
    return spritesheet;
  }

  public getAsset(name: string): any | null {
    const asset = this.loadedAssets.get(name);
    if (!asset) {
      console.warn(`⚠️ Asset not found: ${name}`);
      return null;
    }
    return asset;
  }

  public isLoaded(name: string): boolean {
    return this.loadedAssets.has(name);
  }

  public getLoadedAssetNames(): string[] {
    return Array.from(this.loadedAssets.keys());
  }

  // Preload specific critical assets first
  public async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      'player_godzilla',
      'player_shark_man',
      'projectile_fireball',
      'enemies_image',
    ];

    console.log('🚀 Preloading critical assets...');

    for (const assetName of criticalAssets) {
      const config =
        SPRITE_CONFIGS.find(c => c.name === assetName) ||
        ATLAS_CONFIGS.find(c => c.name === assetName);

      if (config) {
        try {
          const path = 'imagePath' in config ? config.imagePath : config.path;
          const fullPath = BUILD_CONFIG.cdnUrl + path;

          const asset = await Assets.load(fullPath);
          this.loadedAssets.set(assetName, asset);

          if (asset instanceof Texture) {
            this.loadedTextures.set(assetName, asset);
          }

          console.log(`✅ Critical asset loaded: ${assetName}`);
        } catch (error) {
          console.error(`❌ Failed to preload critical asset: ${assetName}`, error);
        }
      }
    }
  }

  // Asset validation
  public validateAssets(): AssetValidationResult {
    const missing: string[] = [];
    const corrupted: string[] = [];

    // Check sprite configs
    SPRITE_CONFIGS.forEach(config => {
      if (!this.isLoaded(config.name)) {
        missing.push(config.name);
      }
    });

    // Check atlas configs
    ATLAS_CONFIGS.forEach(config => {
      if (!this.isLoaded(config.name + '_image') || !this.isLoaded(config.name + '_json')) {
        missing.push(config.name);
      }
    });

    // Check for corrupted textures
    this.loadedTextures.forEach((texture, name) => {
      if (!texture.valid) {
        corrupted.push(name);
      }
    });

    const result = {
      valid: missing.length === 0 && corrupted.length === 0,
      missing,
      corrupted,
    };

    if (!result.valid) {
      console.warn('⚠️ Asset validation failed:', result);
    }

    return result;
  }

  // Clear cache and reload assets
  public async reloadAssets(): Promise<void> {
    console.log('🔄 Reloading assets...');

    // Clear existing assets
    this.loadedAssets.clear();
    this.loadedTextures.clear();
    this.loadedSpritesheets.clear();

    // Reset the loading promise
    this.loadingPromise = undefined;

    // Reload all assets
    await this.loadAssets(this.onProgress);
  }

  // Get asset loading statistics
  public getLoadingStats(): { total: number; loaded: number; missing: number; corrupted: number } {
    const validation = this.validateAssets();
    const expectedTotal = SPRITE_CONFIGS.length + ATLAS_CONFIGS.length * 2;

    return {
      total: expectedTotal,
      loaded: this.loadedAssets.size,
      missing: validation.missing.length,
      corrupted: validation.corrupted.length,
    };
  }
}
