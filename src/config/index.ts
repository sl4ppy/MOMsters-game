export * from './gameConfig';
export * from './inputConfig';
export * from './buildConfig';
export * from './spriteConfig';

import { BUILD_CONFIG } from './buildConfig';

// Centralized config access
export class ConfigManager {
  private static instance: ConfigManager;

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Hot-reload config in development
  public reloadConfig(): void {
    if (BUILD_CONFIG.environment === 'development') {
      // Re-import configurations
      console.log('🔄 Reloading configuration...');
    }
  }

  // Validate configuration
  public validateConfig(): boolean {
    try {
      // Add validation logic here
      return true;
    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      return false;
    }
  }
}
