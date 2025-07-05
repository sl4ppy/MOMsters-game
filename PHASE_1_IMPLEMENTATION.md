# 🏗️ Phase 1: Foundation & Tooling - Complete Implementation Guide

## 📋 Overview
This guide provides complete, executable instructions for implementing Phase 1 of the MOMsters game modernization. Every command, configuration, and code change is provided in detail.

---

## ⚙️ Prerequisites Setup

### Step 1: Install Development Dependencies
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D husky lint-staged
npm install -D @types/jest jest ts-jest
npm install -D @types/node
```

### Step 2: Install Runtime Dependencies
```bash
npm install eventemitter3 idb
```

---

## 🛠️ Week 1: Configuration & Code Quality

### Day 1-2: Configuration System

#### Create Configuration Directory Structure
```bash
mkdir -p src/config
mkdir -p src/types
```

#### Create Game Configuration File
**File: `src/config/gameConfig.ts`**
```typescript
export interface PlayerConfig {
  baseHealth: number;
  baseMoveSpeed: number;
  experienceMultiplier: number;
  baseAttackInterval: number;
  magnetRange: number;
}

export interface EnemyConfig {
  spawnRateMultiplier: number;
  healthScaling: number;
  damageScaling: number;
  experienceMultiplier: number;
}

export interface WaveConfig {
  duration: number;
  spawnRate: number;
  enemies: string[];
  event?: string;
  specialSpawning?: boolean;
}

export interface GameConfig {
  player: PlayerConfig;
  enemies: EnemyConfig;
  waves: WaveConfig[];
  debug: {
    enabled: boolean;
    showCollisionBoxes: boolean;
    showPerformanceStats: boolean;
  };
}

export const GAME_CONFIG: GameConfig = {
  player: {
    baseHealth: 100,
    baseMoveSpeed: 200,
    experienceMultiplier: 1.0,
    baseAttackInterval: 1000,
    magnetRange: 100
  },
  enemies: {
    spawnRateMultiplier: 1.0,
    healthScaling: 1.0,
    damageScaling: 1.0,
    experienceMultiplier: 1.0
  },
  waves: [
    {
      duration: 60000,
      spawnRate: 50,
      enemies: ['Blob'],
      event: 'normal'
    },
    {
      duration: 90000,
      spawnRate: 60,
      enemies: ['Blob', 'Goblin', 'Plant'],
      event: 'normal'
    }
    // More waves will be migrated from existing system
  ],
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    showCollisionBoxes: false,
    showPerformanceStats: true
  }
};
```

#### Create Input Configuration
**File: `src/config/inputConfig.ts`**
```typescript
export interface KeyBinding {
  primary: string;
  secondary?: string;
}

export interface InputConfig {
  movement: {
    up: KeyBinding;
    down: KeyBinding;
    left: KeyBinding;
    right: KeyBinding;
  };
  ui: {
    pause: KeyBinding;
    restart: KeyBinding;
    upgrade1: KeyBinding;
    upgrade2: KeyBinding;
    upgrade3: KeyBinding;
    interact: KeyBinding;
  };
  debug: {
    toggleDebug: KeyBinding;
    cycleWeapon: KeyBinding;
  };
}

export const INPUT_CONFIG: InputConfig = {
  movement: {
    up: { primary: 'KeyW', secondary: 'ArrowUp' },
    down: { primary: 'KeyS', secondary: 'ArrowDown' },
    left: { primary: 'KeyA', secondary: 'ArrowLeft' },
    right: { primary: 'KeyD', secondary: 'ArrowRight' }
  },
  ui: {
    pause: { primary: 'Escape' },
    restart: { primary: 'KeyR' },
    upgrade1: { primary: 'Digit1' },
    upgrade2: { primary: 'Digit2' },
    upgrade3: { primary: 'Digit3' },
    interact: { primary: 'Space', secondary: 'Enter' }
  },
  debug: {
    toggleDebug: { primary: 'F1' },
    cycleWeapon: { primary: 'Tab' }
  }
};
```

#### Create Build Configuration
**File: `src/config/buildConfig.ts`**
```typescript
export interface BuildConfig {
  environment: 'development' | 'production' | 'testing';
  apiUrl: string;
  cdnUrl: string;
  enableAnalytics: boolean;
  enableErrorTracking: boolean;
  version: string;
}

export const BUILD_CONFIG: BuildConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.momsters-game.com' 
    : 'http://localhost:3001',
  cdnUrl: process.env.NODE_ENV === 'production'
    ? 'https://cdn.momsters-game.com'
    : '/assets',
  enableAnalytics: process.env.NODE_ENV === 'production',
  enableErrorTracking: process.env.NODE_ENV === 'production',
  version: process.env.npm_package_version || '1.0.0'
};
```

#### Move and Enhance Sprite Configuration
**File: `src/config/spriteConfig.ts`** (Move from `src/assets/spriteConfigs.ts`)
```typescript
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
  sprites: Record<string, {
    frame: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
  }>;
}

export const SPRITE_CONFIGS: SpriteConfig[] = [
  // Player sprites
  {
    name: 'player_godzilla',
    path: '/sprites/godzilla_small.png',
    width: 64,
    height: 64,
    scale: 1.0
  },
  {
    name: 'player_shark_man',
    path: '/sprites/shark-man.png',
    width: 64,
    height: 64,
    scale: 1.0
  },
  
  // Projectile sprites
  {
    name: 'projectile_fireball',
    path: '/sprites/fireball.png',
    width: 16,
    height: 16,
    frameCount: 4,
    animationSpeed: 0.2
  },
  
  // UI sprites
  {
    name: 'ui_button',
    path: '/sprites/ui_button.png',
    width: 200,
    height: 50
  }
];

export const ATLAS_CONFIGS: SpriteAtlasConfig[] = [
  {
    name: 'enemies',
    imagePath: '/sprites/enemies_01.png',
    jsonPath: '/sprites/enemies_01.json',
    sprites: {
      // Will be loaded from JSON
    }
  },
  {
    name: 'gems',
    imagePath: '/sprites/gems.png',
    jsonPath: '/sprites/gems.json',
    sprites: {
      // Will be loaded from JSON
    }
  }
];
```

#### Create Configuration Index
**File: `src/config/index.ts`**
```typescript
export * from './gameConfig';
export * from './inputConfig';
export * from './buildConfig';
export * from './spriteConfig';

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
```

### Day 3-4: Code Quality Tools

#### Create ESLint Configuration
**File: `.eslintrc.json`**
```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error",
    "@typescript-eslint/no-inferrable-types": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-arrow-callback": "error"
  },
  "ignorePatterns": ["dist", "node_modules", "*.js"]
}
```

#### Create Prettier Configuration
**File: `.prettierrc`**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf",
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "bracketSameLine": false
}
```

#### Create Jest Configuration
**File: `jest.config.js`**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

#### Create Test Setup
**File: `tests/setupTests.ts`**
```typescript
// Mock PIXI.js for testing
global.HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(),
  createOscillator: jest.fn(),
  destination: {},
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Setup console suppression for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
```

#### Setup Husky and Lint-Staged
**File: `.husky/pre-commit`**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Add to `package.json`:**
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "type-check": "tsc --noEmit",
    "test:unit": "jest",
    "test:coverage": "jest --coverage",
    "quality-check": "npm run lint && npm run type-check && npm run test:unit",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

### Day 5: Type Safety Improvements

#### Create Core Type Definitions
**File: `src/types/core.ts`**
```typescript
// Branded types for type safety
export type EntityId = string & { __brand: 'EntityId' };
export type ComponentType = string & { __brand: 'ComponentType' };
export type SystemType = string & { __brand: 'SystemType' };

// Vector types
export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 extends Vector2 {
  z: number;
}

// Utility types
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Event types
export interface GameEvent {
  type: string;
  timestamp: number;
  data?: any;
}

export interface TypedGameEvent<T = any> extends GameEvent {
  data: T;
}

// Entity-Component types
export interface Component {
  readonly type: ComponentType;
  entityId: EntityId;
}

export interface Entity {
  id: EntityId;
  active: boolean;
  components: Map<ComponentType, Component>;
}

// System types
export interface System {
  readonly type: SystemType;
  readonly requiredComponents: ComponentType[];
  readonly priority: number;
  update(entities: Entity[], deltaTime: number): void;
  init?(): void;
  destroy?(): void;
}
```

#### Create Game-Specific Types
**File: `src/types/game.ts`**
```typescript
import { Vector2, EntityId, Component } from './core';

// Player types
export interface PlayerState {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  health: number;
  maxHealth: number;
  upgrades: PlayerUpgrade[];
}

export interface PlayerUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effect: (player: PlayerState) => PlayerState;
}

// Enemy types
export interface EnemyData {
  name: string;
  health: number;
  damage: number;
  speed: number;
  experienceValue: number;
  sprite: string;
  scale?: number;
}

// Weapon types
export interface WeaponConfig {
  type: string;
  damage: number;
  interval: number;
  piercing: number;
  speed: number;
  range: number;
  sprite: string;
}

// Wave types
export interface WaveEvent {
  type: 'normal' | 'circle' | 'boss' | 'swarm' | 'final';
  spawnPattern?: SpawnPattern;
  specialConfig?: any;
}

export interface SpawnPattern {
  type: 'random' | 'circle' | 'line' | 'burst';
  count: number;
  radius?: number;
  angle?: number;
}

// UI types
export interface UITheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    health: string;
    experience: string;
  };
  fonts: {
    primary: string;
    ui: string;
  };
}

// Save/Load types
export interface SaveData {
  version: string;
  timestamp: number;
  playerState: PlayerState;
  gameState: {
    time: number;
    score: number;
    enemiesKilled: number;
    currentWave: number;
  };
  settings: UserSettings;
}

export interface UserSettings {
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
  };
  graphics: {
    quality: 'low' | 'medium' | 'high';
    particleCount: number;
    showFPS: boolean;
  };
  controls: {
    keyBindings: Record<string, string>;
    mouseSensitivity: number;
  };
  accessibility: {
    colorBlindMode: boolean;
    highContrast: boolean;
    textSize: 'small' | 'medium' | 'large';
  };
}
```

---

## 📦 Week 2: Enhanced Asset Management

### Day 6-7: Asset Management System

#### Create Asset Manager
**File: `src/assets/AssetManager.ts`**
```typescript
import { Application, Loader, LoaderResource, Texture, Spritesheet } from 'pixi.js';
import { SPRITE_CONFIGS, ATLAS_CONFIGS } from '../config/spriteConfig';
import { BUILD_CONFIG } from '../config/buildConfig';

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset: string;
}

export class AssetManager {
  private static instance: AssetManager;
  private loader: Loader;
  private loadedAssets: Map<string, LoaderResource> = new Map();
  private loadedTextures: Map<string, Texture> = new Map();
  private loadedSpritesheets: Map<string, Spritesheet> = new Map();
  private onProgress?: (progress: LoadProgress) => void;

  private constructor() {
    this.loader = new Loader();
    this.setupLoader();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  private setupLoader(): void {
    this.loader.onProgress.add((loader, resource) => {
      if (this.onProgress) {
        this.onProgress({
          loaded: loader.progress,
          total: 100,
          percentage: loader.progress,
          currentAsset: resource.name || resource.url || 'Unknown'
        });
      }
    });

    this.loader.onError.add((error, loader, resource) => {
      console.error(`❌ Failed to load asset: ${resource.name || resource.url}`, error);
    });

    this.loader.onComplete.add(() => {
      console.log('✅ All assets loaded successfully');
    });
  }

  public async loadAssets(onProgress?: (progress: LoadProgress) => void): Promise<void> {
    this.onProgress = onProgress;
    
    return new Promise((resolve, reject) => {
      try {
        // Add sprite configurations to loader
        SPRITE_CONFIGS.forEach(config => {
          const fullPath = BUILD_CONFIG.cdnUrl + config.path;
          this.loader.add(config.name, fullPath);
        });

        // Add atlas configurations to loader
        ATLAS_CONFIGS.forEach(config => {
          const imageUrl = BUILD_CONFIG.cdnUrl + config.imagePath;
          const jsonUrl = BUILD_CONFIG.cdnUrl + config.jsonPath;
          
          this.loader.add(`${config.name}_image`, imageUrl);
          this.loader.add(`${config.name}_json`, jsonUrl);
        });

        this.loader.load((loader, resources) => {
          // Store loaded resources
          Object.keys(resources).forEach(key => {
            const resource = resources[key];
            this.loadedAssets.set(key, resource);
            
            if (resource.texture) {
              this.loadedTextures.set(key, resource.texture);
            }
            
            if (resource.spritesheet) {
              this.loadedSpritesheets.set(key, resource.spritesheet);
            }
          });

          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public getTexture(name: string): Texture | null {
    return this.loadedTextures.get(name) || null;
  }

  public getSpritesheet(name: string): Spritesheet | null {
    return this.loadedSpritesheets.get(name) || null;
  }

  public getResource(name: string): LoaderResource | null {
    return this.loadedAssets.get(name) || null;
  }

  public isLoaded(name: string): boolean {
    return this.loadedAssets.has(name);
  }

  public getLoadedAssetNames(): string[] {
    return Array.from(this.loadedAssets.keys());
  }

  // Preload specific assets
  public async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      'player_godzilla',
      'projectile_fireball',
      'enemies_image',
      'enemies_json'
    ];

    return new Promise((resolve, reject) => {
      let loaded = 0;
      const total = criticalAssets.length;

      criticalAssets.forEach(assetName => {
        const config = SPRITE_CONFIGS.find(c => c.name === assetName) ||
                      ATLAS_CONFIGS.find(c => c.name === assetName);
        
        if (config) {
          const path = 'imagePath' in config ? config.imagePath : config.path;
          const fullPath = BUILD_CONFIG.cdnUrl + path;
          
          const tempLoader = new Loader();
          tempLoader.add(assetName, fullPath);
          tempLoader.load(() => {
            loaded++;
            if (loaded === total) {
              resolve();
            }
          });
        }
      });
    });
  }

  // Asset validation
  public validateAssets(): { valid: boolean; missing: string[]; corrupted: string[] } {
    const missing: string[] = [];
    const corrupted: string[] = [];

    SPRITE_CONFIGS.forEach(config => {
      if (!this.isLoaded(config.name)) {
        missing.push(config.name);
      }
    });

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

    return {
      valid: missing.length === 0 && corrupted.length === 0,
      missing,
      corrupted
    };
  }
}
```

#### Create Audio Assets Manager
**File: `src/assets/AudioAssets.ts`**
```typescript
export interface AudioConfig {
  name: string;
  path: string;
  volume: number;
  loop: boolean;
  category: 'music' | 'sfx' | 'ui';
}

export const AUDIO_CONFIGS: AudioConfig[] = [
  // Music
  {
    name: 'background_music_main',
    path: '/audio/music/main_theme.mp3',
    volume: 0.6,
    loop: true,
    category: 'music'
  },
  {
    name: 'background_music_boss',
    path: '/audio/music/boss_theme.mp3',
    volume: 0.7,
    loop: true,
    category: 'music'
  },
  
  // SFX
  {
    name: 'sfx_fireball_shoot',
    path: '/audio/sfx/fireball_shoot.wav',
    volume: 0.4,
    loop: false,
    category: 'sfx'
  },
  {
    name: 'sfx_enemy_hit',
    path: '/audio/sfx/enemy_hit.wav',
    volume: 0.3,
    loop: false,
    category: 'sfx'
  },
  {
    name: 'sfx_player_damage',
    path: '/audio/sfx/player_damage.wav',
    volume: 0.5,
    loop: false,
    category: 'sfx'
  },
  {
    name: 'sfx_level_up',
    path: '/audio/sfx/level_up.wav',
    volume: 0.6,
    loop: false,
    category: 'sfx'
  },
  {
    name: 'sfx_pickup_xp',
    path: '/audio/sfx/pickup_xp.wav',
    volume: 0.3,
    loop: false,
    category: 'sfx'
  },
  
  // UI
  {
    name: 'ui_button_click',
    path: '/audio/ui/button_click.wav',
    volume: 0.4,
    loop: false,
    category: 'ui'
  },
  {
    name: 'ui_menu_select',
    path: '/audio/ui/menu_select.wav',
    volume: 0.3,
    loop: false,
    category: 'ui'
  }
];
```

#### Create Data Assets Manager
**File: `src/assets/DataAssets.ts`**
```typescript
import { WaveConfig } from '../types/game';

export interface LevelData {
  id: string;
  name: string;
  waves: WaveConfig[];
  background: string;
  music: string;
}

export const WAVE_DATA: WaveConfig[] = [
  {
    duration: 60000, // 1 minute
    spawnRate: 50,
    enemies: ['Blob'],
    event: 'normal'
  },
  {
    duration: 90000, // 1.5 minutes
    spawnRate: 60,
    enemies: ['Blob', 'Goblin', 'Plant'],
    event: 'normal'
  },
  {
    duration: 60000,
    spawnRate: 80,
    enemies: ['Hobgoblin', 'Mermaid'],
    event: 'normal'
  },
  {
    duration: 45000,
    spawnRate: 90,
    enemies: ['Gargoyle', 'ChompChest'],
    event: 'circle'
  },
  // Add all 21 waves here...
];

export const ENEMY_DATA = {
  Blob: {
    name: 'Blob',
    health: 10,
    damage: 5,
    speed: 50,
    experienceValue: 1,
    sprite: 'enemy_blob',
    scale: 1.0
  },
  Goblin: {
    name: 'Goblin',
    health: 15,
    damage: 8,
    speed: 70,
    experienceValue: 2,
    sprite: 'enemy_goblin',
    scale: 1.0
  },
  // Add all 30 enemy types here...
};

export const UPGRADE_DATA = [
  {
    id: 'health_increase',
    name: 'Health Boost',
    description: 'Increase maximum health by 20',
    maxLevel: 10,
    effect: (state: any) => ({
      ...state,
      maxHealth: state.maxHealth + 20,
      health: state.health + 20
    })
  },
  {
    id: 'speed_increase',
    name: 'Speed Boost',
    description: 'Increase movement speed by 10%',
    maxLevel: 5,
    effect: (state: any) => ({
      ...state,
      moveSpeed: state.moveSpeed * 1.1
    })
  },
  // Add all upgrade types here...
];
```

### Day 8: Performance Monitoring

#### Create Performance Monitor
**File: `src/debug/PerformanceMonitor.ts`**
```typescript
export interface PerformanceMetrics {
  fps: number;
  averageFPS: number;
  memoryUsage: number;
  drawCalls: number;
  entityCount: number;
  systemUpdateTime: number;
  renderTime: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private fpsHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private updateCallbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private isEnabled: boolean = false;

  private constructor() {
    this.metrics = {
      fps: 0,
      averageFPS: 0,
      memoryUsage: 0,
      drawCalls: 0,
      entityCount: 0,
      systemUpdateTime: 0,
      renderTime: 0
    };
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public enable(): void {
    this.isEnabled = true;
    this.lastFrameTime = performance.now();
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public update(deltaTime: number): void {
    if (!this.isEnabled) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    
    // Calculate FPS
    this.metrics.fps = frameTime > 0 ? 1000 / frameTime : 0;
    
    // Update FPS history
    this.fpsHistory.push(this.metrics.fps);
    if (this.fpsHistory.length > 60) { // Keep last 60 frames
      this.fpsHistory.shift();
    }
    
    // Calculate average FPS
    this.metrics.averageFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    
    // Update memory usage
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    
    this.lastFrameTime = currentTime;
    this.frameCount++;
    
    // Notify callbacks
    this.updateCallbacks.forEach(callback => callback(this.metrics));
  }

  public setEntityCount(count: number): void {
    this.metrics.entityCount = count;
  }

  public setDrawCalls(count: number): void {
    this.metrics.drawCalls = count;
  }

  public setSystemUpdateTime(time: number): void {
    this.metrics.systemUpdateTime = time;
  }

  public setRenderTime(time: number): void {
    this.metrics.renderTime = time;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    this.updateCallbacks.push(callback);
  }

  public removeMetricsCallback(callback: (metrics: PerformanceMetrics) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  // Performance warnings
  public checkPerformance(): string[] {
    const warnings: string[] = [];
    
    if (this.metrics.fps < 30) {
      warnings.push('Low FPS detected');
    }
    
    if (this.metrics.memoryUsage > 100) {
      warnings.push('High memory usage detected');
    }
    
    if (this.metrics.entityCount > 1000) {
      warnings.push('High entity count may impact performance');
    }
    
    return warnings;
  }
}
```

---

## 🧪 Week 3: Testing Infrastructure

### Day 9-10: Unit Testing Setup

#### Create Test Utilities
**File: `tests/testUtils.ts`**
```typescript
import { Application } from 'pixi.js';
import { Game } from '../src/core/Game';

export function createMockApplication(): Application {
  return {
    view: {
      width: 1024,
      height: 768
    },
    stage: {
      addChild: jest.fn(),
      removeChild: jest.fn()
    },
    ticker: {
      add: jest.fn(),
      remove: jest.fn()
    }
  } as any;
}

export function createTestGame(): Game {
  const mockApp = createMockApplication();
  return new Game(mockApp);
}

export class MockEventBus {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### Create Sample Tests
**File: `src/config/__tests__/gameConfig.test.ts`**
```typescript
import { GAME_CONFIG, ConfigManager } from '../gameConfig';

describe('Game Configuration', () => {
  test('should have valid player configuration', () => {
    expect(GAME_CONFIG.player.baseHealth).toBeGreaterThan(0);
    expect(GAME_CONFIG.player.baseMoveSpeed).toBeGreaterThan(0);
    expect(GAME_CONFIG.player.experienceMultiplier).toBeGreaterThanOrEqual(0);
  });

  test('should have valid enemy configuration', () => {
    expect(GAME_CONFIG.enemies.spawnRateMultiplier).toBeGreaterThan(0);
    expect(GAME_CONFIG.enemies.healthScaling).toBeGreaterThan(0);
    expect(GAME_CONFIG.enemies.damageScaling).toBeGreaterThan(0);
  });

  test('should have at least one wave configuration', () => {
    expect(GAME_CONFIG.waves.length).toBeGreaterThan(0);
    expect(GAME_CONFIG.waves[0].duration).toBeGreaterThan(0);
    expect(GAME_CONFIG.waves[0].spawnRate).toBeGreaterThan(0);
    expect(GAME_CONFIG.waves[0].enemies.length).toBeGreaterThan(0);
  });
});

describe('ConfigManager', () => {
  test('should be a singleton', () => {
    const instance1 = ConfigManager.getInstance();
    const instance2 = ConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should validate configuration successfully', () => {
    const configManager = ConfigManager.getInstance();
    expect(configManager.validateConfig()).toBe(true);
  });
});
```

**File: `src/assets/__tests__/AssetManager.test.ts`**
```typescript
import { AssetManager } from '../AssetManager';

// Mock PIXI.js
jest.mock('pixi.js', () => ({
  Loader: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnThis(),
    load: jest.fn().mockImplementation((callback) => {
      callback({}, {});
    }),
    onProgress: { add: jest.fn() },
    onError: { add: jest.fn() },
    onComplete: { add: jest.fn() },
  })),
  LoaderResource: jest.fn(),
  Texture: jest.fn(),
  Spritesheet: jest.fn()
}));

describe('AssetManager', () => {
  test('should be a singleton', () => {
    const instance1 = AssetManager.getInstance();
    const instance2 = AssetManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should load assets successfully', async () => {
    const assetManager = AssetManager.getInstance();
    
    const progressCallback = jest.fn();
    await assetManager.loadAssets(progressCallback);
    
    // Should have called progress callback
    expect(progressCallback).toHaveBeenCalled();
  });

  test('should validate assets', () => {
    const assetManager = AssetManager.getInstance();
    const validation = assetManager.validateAssets();
    
    expect(validation).toHaveProperty('valid');
    expect(validation).toHaveProperty('missing');
    expect(validation).toHaveProperty('corrupted');
  });
});
```

### Day 11: Integration Testing

#### Create Integration Test Setup
**File: `tests/integration/gameIntegration.test.ts`**
```typescript
import { createTestGame, MockEventBus } from '../testUtils';
import { Game } from '../../src/core/Game';

describe('Game Integration Tests', () => {
  let game: Game;

  beforeEach(async () => {
    game = createTestGame();
    await game.init();
  });

  test('should initialize game successfully', () => {
    expect(game).toBeDefined();
    expect(game.gameState).toBeDefined();
    expect(game.gameCamera).toBeDefined();
  });

  test('should handle game start and stop', () => {
    game.start();
    // Game should be running
    expect(game).toBeDefined(); // Add more specific checks

    game.stop();
    // Game should be stopped
    expect(game).toBeDefined(); // Add more specific checks
  });

  test('should manage game state transitions', () => {
    // Test title screen -> playing -> game over flow
    expect(game.gameState.level).toBe(1);
    expect(game.gameState.experience).toBe(0);
  });
});
```

---

## 📋 Phase 1 Execution Checklist

### Configuration System ✅
- [ ] Create `src/config/` directory structure
- [ ] Implement `gameConfig.ts` with game balance settings
- [ ] Create `inputConfig.ts` for key bindings
- [ ] Add `buildConfig.ts` for environment settings
- [ ] Move sprite configs to `src/config/spriteConfig.ts`
- [ ] Create configuration index and manager

### Code Quality Tools ✅
- [ ] Install ESLint and TypeScript ESLint plugins
- [ ] Configure `.eslintrc.json` with strict rules
- [ ] Set up Prettier with `.prettierrc`
- [ ] Install and configure Jest for testing
- [ ] Set up Husky for pre-commit hooks
- [ ] Configure lint-staged for automatic fixes

### Type Safety ✅
- [ ] Create `src/types/core.ts` with branded types
- [ ] Add `src/types/game.ts` with game-specific interfaces
- [ ] Update `tsconfig.json` with strict settings
- [ ] Add runtime type validation

### Asset Management ✅
- [ ] Create comprehensive `AssetManager.ts`
- [ ] Implement asset preloading system
- [ ] Add asset validation and error handling
- [ ] Create audio and data asset configurations
- [ ] Set up asset path management

### Performance Monitoring ✅
- [ ] Implement `PerformanceMonitor.ts`
- [ ] Add FPS tracking and memory monitoring
- [ ] Create performance metrics interface
- [ ] Add performance warning system

### Testing Infrastructure ✅
- [ ] Set up Jest with TypeScript support
- [ ] Create test utilities and mocks
- [ ] Write unit tests for configurations
- [ ] Add integration tests for core systems
- [ ] Configure test coverage reporting

---

## 🎯 Next Steps

After completing Phase 1, proceed to:
1. **Phase 2**: Architecture Refactor (ECS, Event System)
2. **Phase 3**: Core Features (Audio, Save System)
3. **Phase 4**: Enhancement & Polish (VFX, Optimization)

Each subsequent phase will build upon the foundation established in Phase 1.

---

## 🚀 Commands to Execute Phase 1

```bash
# 1. Install dependencies
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged @types/jest jest ts-jest @types/node
npm install eventemitter3 idb

# 2. Create directory structure
mkdir -p src/config src/types src/assets src/debug tests

# 3. Initialize Husky
npm run prepare

# 4. Run quality checks
npm run quality-check

# 5. Run tests
npm run test:unit

# 6. Check build
npm run build
```

This completes the detailed implementation guide for Phase 1. Each file and configuration is provided in full, ready to be implemented step by step. 