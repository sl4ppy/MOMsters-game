import { EventBusImpl } from '../events/EventBus';
import { SettingsData } from '../ui/SettingsMenu';

export interface GameSaveData {
  version: string;
  timestamp: number;
  player: {
    level: number;
    experience: number;
    health: number;
    maxHealth: number;
    position: { x: number; y: number };
    weapons: Array<{
      type: string;
      level: number;
      damage: number;
    }>;
  };
  gameState: {
    currentWave: number;
    enemiesKilled: number;
    timePlayed: number;
    score: number;
  };
  settings: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    spatialAudio: boolean;
    graphicsQuality: 'low' | 'medium' | 'high';
  };
  achievements: Array<{
    id: string;
    unlockedAt: number;
    progress?: number;
  }>;
}

export interface SaveMetadata {
  id: string;
  name: string;
  timestamp: number;
  version: string;
  size: number;
  checksum: string;
}

export interface SaveOptions {
  autoSave: boolean;
  maxAutoSaves: number;
  compression: boolean;
  encryption: boolean;
  cloudSync: boolean;
}

export class SaveManager {
  private eventBus: EventBusImpl;
  private options: SaveOptions = {
    autoSave: true,
    maxAutoSaves: 5,
    compression: true,
    encryption: false, // For future implementation
    cloudSync: false,  // For future implementation
  };

  private readonly SAVE_VERSION = '1.0.0';
  private readonly SAVE_KEY_PREFIX = 'momsters_save_';
  private readonly AUTO_SAVE_KEY = 'momsters_autosave';
  private readonly SETTINGS_KEY = 'momsters_settings';

  // Performance tracking
  private performanceMetrics = {
    savesPerformed: 0,
    loadsPerformed: 0,
    lastSaveTime: 0,
    lastLoadTime: 0,
    totalSaveSize: 0,
  };

  constructor(eventBus: EventBusImpl) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Auto-save triggers
    this.eventBus.on('player:level_up', () => this.autoSave());
    this.eventBus.on('player:xp_gained', () => this.autoSave());
    this.eventBus.on('game:wave_completed', () => this.autoSave());
    this.eventBus.on('game:paused', () => this.autoSave());
    
    // Manual save triggers
    this.eventBus.on('save:request', () => this.saveGame());
    this.eventBus.on('load:request', () => this.loadGame());
  }

  async saveGame(saveName?: string): Promise<SaveMetadata | null> {
    try {
      // console.log('💾 SaveManager: Starting save operation...');
      
      const saveData = await this.collectGameData();
      const metadata = await this.createSaveMetadata(saveName);
      
      // Validate save data
      if (!this.validateSaveData(saveData)) {
        throw new Error('Invalid save data');
      }

      // Compress data if enabled
      const processedData = this.options.compression 
        ? await this.compressData(saveData)
        : JSON.stringify(saveData);

      // Store save data
      const saveKey = saveName 
        ? `${this.SAVE_KEY_PREFIX}${saveName}`
        : this.AUTO_SAVE_KEY;

      localStorage.setItem(saveKey, processedData);
      localStorage.setItem(`${saveKey}_meta`, JSON.stringify(metadata));

      this.performanceMetrics.savesPerformed++;
      this.performanceMetrics.lastSaveTime = Date.now();
      this.performanceMetrics.totalSaveSize += processedData.length;

      // console.log(`💾 SaveManager: Game saved successfully as "${metadata.name}"`);
      
      // Emit save event
      this.eventBus.emitEvent('save:completed');
      
      return metadata;
    } catch {
      console.warn('Failed to save game data:');
    }
  }

  async loadGame(saveName?: string): Promise<GameSaveData | null> {
    try {
      // console.log('📂 SaveManager: Starting load operation...');
      
      const saveKey = saveName 
        ? `${this.SAVE_KEY_PREFIX}${saveName}`
        : this.AUTO_SAVE_KEY;

      const savedData = localStorage.getItem(saveKey);
      if (!savedData) {
        throw new Error('No save data found');
      }

      // Decompress data if it was compressed
      const decompressedData = this.options.compression 
        ? await this.decompressData(savedData)
        : savedData;

      const saveData: GameSaveData = JSON.parse(decompressedData);

      // Validate loaded data
      if (!this.validateSaveData(saveData)) {
        throw new Error('Invalid save data format');
      }

      // Version migration if needed
      const migratedData = await this.migrateSaveData(saveData);

      this.performanceMetrics.loadsPerformed++;
      this.performanceMetrics.lastLoadTime = Date.now();

      // console.log('📂 SaveManager: Game loaded successfully');
      
      // Emit load event
      this.eventBus.emitEvent('load:completed');
      
      return migratedData;
    } catch {
      console.warn('Failed to load game data:');
    }
  }

  private async collectGameData(): Promise<GameSaveData> {
    // This would collect data from the game state
    // For now, we'll create a sample structure
    const saveData: GameSaveData = {
      version: this.SAVE_VERSION,
      timestamp: Date.now(),
      player: {
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        position: { x: 0, y: 0 },
        weapons: [
          { type: 'fireball', level: 1, damage: 10 },
          { type: 'beam', level: 1, damage: 15 },
        ],
      },
      gameState: {
        currentWave: 1,
        enemiesKilled: 0,
        timePlayed: 0,
        score: 0,
      },
      settings: {
        masterVolume: 0.7,
        sfxVolume: 0.8,
        musicVolume: 0.6,
        spatialAudio: true,
        graphicsQuality: 'medium',
      },
      achievements: [],
    };

    return saveData;
  }

  private async createSaveMetadata(saveName?: string): Promise<SaveMetadata> {
    const id = saveName || `autosave_${Date.now()}`;
    const name = saveName || `Auto Save ${new Date().toLocaleString()}`;
    
    return {
      id,
      name,
      timestamp: Date.now(),
      version: this.SAVE_VERSION,
      size: 0, // Will be calculated after compression
      checksum: '', // Will be calculated after compression
    };
  }

  private validateSaveData(data: unknown): data is GameSaveData {
    // Validate save data
    return false;
  }

  private async compressData(data: GameSaveData): Promise<string> {
    // Simple compression using LZ-string or similar
    // For now, we'll use a basic approach
    const jsonString = JSON.stringify(data);
    
    // Simple compression: remove unnecessary whitespace
    const compressed = jsonString.replace(/\s+/g, '');
    
    // Add compression marker
    return `COMPRESSED:${compressed}`;
  }

  private async decompressData(compressedData: string): Promise<string> {
    if (compressedData.startsWith('COMPRESSED:')) {
      // Remove compression marker and return
      return compressedData.substring(11);
    }
    return compressedData;
  }

  private async migrateSaveData(data: GameSaveData): Promise<GameSaveData> {
    // Handle version migrations
    if (data.version !== this.SAVE_VERSION) {
      // console.log(`🔄 SaveManager: Migrating save from version ${data.version} to ${this.SAVE_VERSION}`);
      
      // Add migration logic here as needed
      data.version = this.SAVE_VERSION;
    }
    
    return data;
  }

  private async autoSave(): Promise<void> {
    if (!this.options.autoSave) return;

    // Throttle auto-saves to prevent spam
    const now = Date.now();
    if (now - this.performanceMetrics.lastSaveTime < 30000) { // 30 seconds
      return;
    }

    // console.log('💾 SaveManager: Performing auto-save...');
    await this.saveGame();
  }

  // Save management methods
  async listSaves(): Promise<SaveMetadata[]> {
    const saves: SaveMetadata[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.SAVE_KEY_PREFIX) && key.endsWith('_meta')) {
        try {
          const metadata = JSON.parse(localStorage.getItem(key)!);
          saves.push(metadata);
        } catch {
          console.warn(`SaveManager: Invalid metadata for key ${key}`);
        }
      }
    }
    
    // Sort by timestamp (newest first)
    return saves.sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteSave(saveName: string): Promise<boolean> {
    try {
      const saveKey = `${this.SAVE_KEY_PREFIX}${saveName}`;
      localStorage.removeItem(saveKey);
      localStorage.removeItem(`${saveKey}_meta`);
      
      // console.log(`🗑️ SaveManager: Deleted save "${saveName}"`);
      this.eventBus.emitEvent('save:deleted');
      
      return true;
    } catch {
      console.warn('Failed to delete save data:');
      return false;
    }
  }

  async exportSave(saveName: string): Promise<string | null> {
    try {
      const saveKey = `${this.SAVE_KEY_PREFIX}${saveName}`;
      const saveData = localStorage.getItem(saveKey);
      const metadata = localStorage.getItem(`${saveKey}_meta`);
      
      if (!saveData || !metadata) {
        throw new Error('Save not found');
      }
      
      const exportData = {
        saveData,
        metadata: JSON.parse(metadata),
        exportTimestamp: Date.now(),
      };
      
      return JSON.stringify(exportData);
    } catch {
      console.error('❌ SaveManager: Failed to export save:');
      return null;
    }
  }

  async importSave(exportData: string): Promise<boolean> {
    try {
      const data = JSON.parse(exportData);
      const { saveData, metadata } = data;
      
      if (!saveData || !metadata) {
        throw new Error('Invalid export data');
      }
      
      const saveKey = `${this.SAVE_KEY_PREFIX}${metadata.name}`;
      localStorage.setItem(saveKey, saveData);
      localStorage.setItem(`${saveKey}_meta`, JSON.stringify(metadata));
      
      // console.log(`📥 SaveManager: Imported save "${metadata.name}"`);
      this.eventBus.emitEvent('save:imported');
      
      return true;
    } catch {
      console.error('❌ SaveManager: Failed to import save:');
      return false;
    }
  }

  // Settings management
  saveSettings(settings: SettingsData): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      // console.log('⚙️ SaveManager: Settings saved');
    } catch {
      console.error('❌ SaveManager: Failed to save settings:');
    }
  }

  loadSettings(): SettingsData | null {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : null;
    } catch {
      console.error('❌ SaveManager: Failed to load settings:');
      return null;
    }
  }

  // Performance and debugging
  getPerformanceMetrics(): {
    saveCount: number;
    loadCount: number;
    lastSaveTime: number;
    lastLoadTime: number;
    totalSaveTime: number;
    totalLoadTime: number;
    averageSaveTime: number;
    averageLoadTime: number;
  } {
    return {
      saveCount: this.performanceMetrics.savesPerformed,
      loadCount: this.performanceMetrics.loadsPerformed,
      lastSaveTime: this.performanceMetrics.lastSaveTime,
      lastLoadTime: this.performanceMetrics.lastLoadTime,
      totalSaveTime: this.performanceMetrics.lastSaveTime - this.performanceMetrics.lastSaveTime,
      totalLoadTime: this.performanceMetrics.lastLoadTime - this.performanceMetrics.lastLoadTime,
      averageSaveTime: this.performanceMetrics.lastSaveTime / this.performanceMetrics.savesPerformed,
      averageLoadTime: this.performanceMetrics.lastLoadTime / this.performanceMetrics.loadsPerformed,
    };
  }

  getOptions(): SaveOptions {
    return { ...this.options };
  }

  setOptions(options: Partial<SaveOptions>): void {
    this.options = { ...this.options, ...options };
  }

  // Cleanup
  clearAllSaves(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.SAVE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    // console.log('🗑️ SaveManager: Cleared all saves');
  }
} 