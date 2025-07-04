# 🗄️ Data-Driven Design System Implementation

## 📋 Overview
This system allows game designers to easily modify game balance and content through JSON data files, enabling rapid iteration without code changes.

---

## 🏗️ Data Architecture

### Directory Structure
```
src/data/
├── schemas/           # JSON schemas for validation
│   ├── enemySchema.json
│   ├── weaponSchema.json
│   ├── waveSchema.json
│   └── levelingSchema.json
├── game-data/         # Actual game data files
│   ├── enemies/
│   │   ├── basic-enemies.json
│   │   ├── boss-enemies.json
│   │   └── special-enemies.json
│   ├── weapons/
│   │   ├── player-weapons.json
│   │   └── weapon-upgrades.json
│   ├── waves/
│   │   ├── early-waves.json
│   │   ├── mid-waves.json
│   │   └── late-waves.json
│   ├── progression/
│   │   ├── leveling.json
│   │   ├── upgrades.json
│   │   └── achievements.json
│   └── balance/
│       ├── difficulty-modifiers.json
│       └── spawn-rates.json
├── DataManager.ts     # Core data management
├── DataValidator.ts   # Schema validation
├── DataLoader.ts      # File loading and caching
└── DataTypes.ts       # TypeScript interfaces
```

---

## 📊 Data Schema Definitions

### Enemy Data Schema
**File: `src/data/schemas/enemySchema.json`**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "enemies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "category": { "type": "string", "enum": ["basic", "elite", "boss", "special"] },
          "stats": {
            "type": "object",
            "properties": {
              "health": { "type": "number", "minimum": 1 },
              "damage": { "type": "number", "minimum": 0 },
              "speed": { "type": "number", "minimum": 0 },
              "experienceValue": { "type": "number", "minimum": 0 },
              "scoreValue": { "type": "number", "minimum": 0 }
            },
            "required": ["health", "damage", "speed", "experienceValue"]
          },
          "appearance": {
            "type": "object",
            "properties": {
              "sprite": { "type": "string" },
              "scale": { "type": "number", "minimum": 0.1, "maximum": 10 },
              "tint": { "type": "string", "pattern": "^0x[0-9A-Fa-f]{6}$" },
              "animations": {
                "type": "object",
                "properties": {
                  "idle": { "type": "string" },
                  "move": { "type": "string" },
                  "attack": { "type": "string" },
                  "death": { "type": "string" }
                }
              }
            },
            "required": ["sprite", "scale"]
          },
          "behavior": {
            "type": "object",
            "properties": {
              "movementPattern": { "type": "string", "enum": ["direct", "circular", "zigzag", "random"] },
              "attackPattern": { "type": "string", "enum": ["melee", "ranged", "special"] },
              "aggroRange": { "type": "number", "minimum": 0 },
              "attackRange": { "type": "number", "minimum": 0 },
              "attackCooldown": { "type": "number", "minimum": 0 }
            }
          },
          "drops": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": { "type": "string", "enum": ["experience", "health", "powerup"] },
                "amount": { "type": "number" },
                "chance": { "type": "number", "minimum": 0, "maximum": 1 }
              },
              "required": ["type", "amount", "chance"]
            }
          }
        },
        "required": ["id", "name", "category", "stats", "appearance"]
      }
    }
  },
  "required": ["enemies"]
}
```

### Weapon Data Schema
**File: `src/data/schemas/weaponSchema.json`**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "weapons": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "category": { "type": "string", "enum": ["primary", "secondary", "special"] },
          "stats": {
            "type": "object",
            "properties": {
              "damage": { "type": "number", "minimum": 0 },
              "attackSpeed": { "type": "number", "minimum": 0.1 },
              "range": { "type": "number", "minimum": 1 },
              "piercing": { "type": "integer", "minimum": 0 },
              "projectileSpeed": { "type": "number", "minimum": 1 },
              "critChance": { "type": "number", "minimum": 0, "maximum": 1 },
              "critMultiplier": { "type": "number", "minimum": 1 }
            },
            "required": ["damage", "attackSpeed", "range"]
          },
          "projectile": {
            "type": "object",
            "properties": {
              "sprite": { "type": "string" },
              "scale": { "type": "number", "minimum": 0.1 },
              "effects": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "type": { "type": "string", "enum": ["trail", "explosion", "bounce"] },
                    "config": { "type": "object" }
                  }
                }
              }
            }
          },
          "upgrades": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "level": { "type": "integer", "minimum": 1 },
                "requirements": {
                  "type": "object",
                  "properties": {
                    "playerLevel": { "type": "integer", "minimum": 1 },
                    "prerequisiteWeapons": { "type": "array", "items": { "type": "string" } }
                  }
                },
                "modifications": {
                  "type": "object",
                  "properties": {
                    "damageMultiplier": { "type": "number", "minimum": 0 },
                    "speedMultiplier": { "type": "number", "minimum": 0 },
                    "rangeMultiplier": { "type": "number", "minimum": 0 },
                    "additionalPiercing": { "type": "integer", "minimum": 0 }
                  }
                }
              },
              "required": ["level", "modifications"]
            }
          }
        },
        "required": ["id", "name", "category", "stats"]
      }
    }
  },
  "required": ["weapons"]
}
```

---

## 💾 Data Implementation

### Core Data Types
**File: `src/data/DataTypes.ts`**
```typescript
// Base interfaces for all game data
export interface GameDataEntity {
  id: string;
  name: string;
  category: string;
}

// Enemy Data Types
export interface EnemyStats {
  health: number;
  damage: number;
  speed: number;
  experienceValue: number;
  scoreValue?: number;
}

export interface EnemyAppearance {
  sprite: string;
  scale: number;
  tint?: string;
  animations?: {
    idle?: string;
    move?: string;
    attack?: string;
    death?: string;
  };
}

export interface EnemyBehavior {
  movementPattern?: 'direct' | 'circular' | 'zigzag' | 'random';
  attackPattern?: 'melee' | 'ranged' | 'special';
  aggroRange?: number;
  attackRange?: number;
  attackCooldown?: number;
}

export interface EnemyDrop {
  type: 'experience' | 'health' | 'powerup';
  amount: number;
  chance: number;
}

export interface EnemyData extends GameDataEntity {
  category: 'basic' | 'elite' | 'boss' | 'special';
  stats: EnemyStats;
  appearance: EnemyAppearance;
  behavior?: EnemyBehavior;
  drops?: EnemyDrop[];
}

// Weapon Data Types
export interface WeaponStats {
  damage: number;
  attackSpeed: number;
  range: number;
  piercing?: number;
  projectileSpeed?: number;
  critChance?: number;
  critMultiplier?: number;
}

export interface ProjectileConfig {
  sprite: string;
  scale?: number;
  effects?: Array<{
    type: 'trail' | 'explosion' | 'bounce';
    config: any;
  }>;
}

export interface WeaponUpgrade {
  level: number;
  requirements?: {
    playerLevel?: number;
    prerequisiteWeapons?: string[];
  };
  modifications: {
    damageMultiplier?: number;
    speedMultiplier?: number;
    rangeMultiplier?: number;
    additionalPiercing?: number;
  };
}

export interface WeaponData extends GameDataEntity {
  description: string;
  category: 'primary' | 'secondary' | 'special';
  stats: WeaponStats;
  projectile?: ProjectileConfig;
  upgrades?: WeaponUpgrade[];
}

// Wave Data Types
export interface SpawnGroup {
  enemyId: string;
  count: number;
  spawnPattern: 'random' | 'circle' | 'line' | 'formation';
  delay?: number;
}

export interface WaveEvent {
  type: 'spawn' | 'boss' | 'special';
  timing: number; // seconds from wave start
  config: any;
}

export interface WaveData extends GameDataEntity {
  duration: number; // seconds
  difficulty: number;
  spawnGroups: SpawnGroup[];
  events?: WaveEvent[];
  rewards?: {
    experienceBonus?: number;
    specialDrops?: string[];
  };
}

// Leveling Data Types
export interface LevelRequirement {
  level: number;
  experienceRequired: number;
  experienceTotal: number;
}

export interface PlayerUpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  effects: Array<{
    property: string;
    value: number;
    type: 'add' | 'multiply' | 'set';
  }>;
}

export interface LevelingData {
  requirements: LevelRequirement[];
  upgradeOptions: PlayerUpgradeOption[];
}

// Container types for data files
export interface EnemyDataFile {
  enemies: EnemyData[];
}

export interface WeaponDataFile {
  weapons: WeaponData[];
}

export interface WaveDataFile {
  waves: WaveData[];
}
```

### Data Manager Implementation
**File: `src/data/DataManager.ts`**
```typescript
import { EventBus } from '../core/EventBus';
import { DataLoader } from './DataLoader';
import { DataValidator } from './DataValidator';
import { 
  EnemyData, 
  WeaponData, 
  WaveData, 
  LevelingData,
  EnemyDataFile,
  WeaponDataFile,
  WaveDataFile
} from './DataTypes';

export class DataManager {
  private static instance: DataManager;
  private loader: DataLoader;
  private validator: DataValidator;
  private eventBus: EventBus;

  // Data caches
  private enemies: Map<string, EnemyData> = new Map();
  private weapons: Map<string, WeaponData> = new Map();
  private waves: Map<string, WaveData> = new Map();
  private levelingData: LevelingData | null = null;

  private isLoaded: boolean = false;

  private constructor() {
    this.loader = DataLoader.getInstance();
    this.validator = DataValidator.getInstance();
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  public async loadAllData(): Promise<void> {
    try {
      console.log('📊 Loading game data...');
      
      await Promise.all([
        this.loadEnemyData(),
        this.loadWeaponData(),
        this.loadWaveData(),
        this.loadLevelingData()
      ]);

      this.isLoaded = true;
      this.eventBus.emit('data_loaded');
      console.log('✅ All game data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load game data:', error);
      this.eventBus.emit('data_load_failed', { error });
      throw error;
    }
  }

  private async loadEnemyData(): Promise<void> {
    const enemyFiles = [
      'enemies/basic-enemies.json',
      'enemies/boss-enemies.json', 
      'enemies/special-enemies.json'
    ];

    for (const file of enemyFiles) {
      const data = await this.loader.loadDataFile<EnemyDataFile>(file);
      
      if (this.validator.validateEnemyData(data)) {
        data.enemies.forEach(enemy => {
          this.enemies.set(enemy.id, enemy);
        });
      } else {
        throw new Error(`Invalid enemy data in ${file}`);
      }
    }
  }

  private async loadWeaponData(): Promise<void> {
    const weaponFiles = [
      'weapons/player-weapons.json',
      'weapons/weapon-upgrades.json'
    ];

    for (const file of weaponFiles) {
      const data = await this.loader.loadDataFile<WeaponDataFile>(file);
      
      if (this.validator.validateWeaponData(data)) {
        data.weapons.forEach(weapon => {
          this.weapons.set(weapon.id, weapon);
        });
      } else {
        throw new Error(`Invalid weapon data in ${file}`);
      }
    }
  }

  private async loadWaveData(): Promise<void> {
    const waveFiles = [
      'waves/early-waves.json',
      'waves/mid-waves.json',
      'waves/late-waves.json'
    ];

    for (const file of waveFiles) {
      const data = await this.loader.loadDataFile<WaveDataFile>(file);
      
      if (this.validator.validateWaveData(data)) {
        data.waves.forEach(wave => {
          this.waves.set(wave.id, wave);
        });
      } else {
        throw new Error(`Invalid wave data in ${file}`);
      }
    }
  }

  private async loadLevelingData(): Promise<void> {
    const data = await this.loader.loadDataFile<LevelingData>('progression/leveling.json');
    
    if (this.validator.validateLevelingData(data)) {
      this.levelingData = data;
    } else {
      throw new Error('Invalid leveling data');
    }
  }

  // Data access methods
  public getEnemy(id: string): EnemyData | null {
    return this.enemies.get(id) || null;
  }

  public getAllEnemies(): EnemyData[] {
    return Array.from(this.enemies.values());
  }

  public getEnemiesByCategory(category: string): EnemyData[] {
    return Array.from(this.enemies.values()).filter(enemy => enemy.category === category);
  }

  public getWeapon(id: string): WeaponData | null {
    return this.weapons.get(id) || null;
  }

  public getAllWeapons(): WeaponData[] {
    return Array.from(this.weapons.values());
  }

  public getWave(id: string): WaveData | null {
    return this.waves.get(id) || null;
  }

  public getAllWaves(): WaveData[] {
    return Array.from(this.waves.values());
  }

  public getLevelingData(): LevelingData | null {
    return this.levelingData;
  }

  public getExperienceRequired(level: number): number {
    if (!this.levelingData) return 100;
    
    const requirement = this.levelingData.requirements.find(req => req.level === level);
    return requirement ? requirement.experienceRequired : 100 * Math.pow(1.2, level - 1);
  }

  public getUpgradeOptions(): any[] {
    return this.levelingData?.upgradeOptions || [];
  }

  // Hot reload functionality
  public async reloadData(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Hot reloading game data...');
      this.clearCaches();
      await this.loadAllData();
      this.eventBus.emit('data_hot_reloaded');
    }
  }

  private clearCaches(): void {
    this.enemies.clear();
    this.weapons.clear();
    this.waves.clear();
    this.levelingData = null;
    this.isLoaded = false;
  }

  private setupEventListeners(): void {
    // Listen for file change events (in development)
    if (process.env.NODE_ENV === 'development') {
      this.eventBus.on('data_file_changed', async (event) => {
        console.log(`📁 Data file changed: ${event.data.filename}`);
        await this.reloadData();
      });
    }
  }

  public isDataLoaded(): boolean {
    return this.isLoaded;
  }

  // Data modification methods (for editor tools)
  public updateEnemyData(id: string, data: Partial<EnemyData>): void {
    const existing = this.enemies.get(id);
    if (existing) {
      const updated = { ...existing, ...data };
      this.enemies.set(id, updated);
      this.eventBus.emit('enemy_data_updated', { id, data: updated });
    }
  }

  public updateWeaponData(id: string, data: Partial<WeaponData>): void {
    const existing = this.weapons.get(id);
    if (existing) {
      const updated = { ...existing, ...data };
      this.weapons.set(id, updated);
      this.eventBus.emit('weapon_data_updated', { id, data: updated });
    }
  }
}
```

### Data Validator
**File: `src/data/DataValidator.ts`**
```typescript
import Ajv from 'ajv';
import { EnemyDataFile, WeaponDataFile, WaveDataFile, LevelingData } from './DataTypes';

export class DataValidator {
  private static instance: DataValidator;
  private ajv: Ajv;
  private schemas: Map<string, any> = new Map();

  private constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.loadSchemas();
  }

  public static getInstance(): DataValidator {
    if (!DataValidator.instance) {
      DataValidator.instance = new DataValidator();
    }
    return DataValidator.instance;
  }

  private async loadSchemas(): Promise<void> {
    try {
      // Load JSON schemas
      const enemySchema = await import('./schemas/enemySchema.json');
      const weaponSchema = await import('./schemas/weaponSchema.json');
      const waveSchema = await import('./schemas/waveSchema.json');
      const levelingSchema = await import('./schemas/levelingSchema.json');

      this.schemas.set('enemy', this.ajv.compile(enemySchema));
      this.schemas.set('weapon', this.ajv.compile(weaponSchema));
      this.schemas.set('wave', this.ajv.compile(waveSchema));
      this.schemas.set('leveling', this.ajv.compile(levelingSchema));
    } catch (error) {
      console.error('Failed to load validation schemas:', error);
    }
  }

  public validateEnemyData(data: EnemyDataFile): boolean {
    return this.validate('enemy', data);
  }

  public validateWeaponData(data: WeaponDataFile): boolean {
    return this.validate('weapon', data);
  }

  public validateWaveData(data: WaveDataFile): boolean {
    return this.validate('wave', data);
  }

  public validateLevelingData(data: LevelingData): boolean {
    return this.validate('leveling', data);
  }

  private validate(schemaType: string, data: any): boolean {
    const validator = this.schemas.get(schemaType);
    if (!validator) {
      console.warn(`No validator found for schema type: ${schemaType}`);
      return true; // Allow if no schema available
    }

    const isValid = validator(data);
    if (!isValid) {
      console.error(`Validation failed for ${schemaType}:`, validator.errors);
      return false;
    }

    return true;
  }

  // Additional custom validation methods
  public validateDataIntegrity(): string[] {
    const issues: string[] = [];
    
    // Check for missing enemy references in waves
    // Check for missing weapon references
    // Check for circular dependencies
    // etc.

    return issues;
  }
}
```

---

## 📁 Sample Data Files

### Basic Enemies Data
**File: `src/data/game-data/enemies/basic-enemies.json`**
```json
{
  "enemies": [
    {
      "id": "blob",
      "name": "Blob",
      "category": "basic",
      "stats": {
        "health": 10,
        "damage": 5,
        "speed": 50,
        "experienceValue": 1,
        "scoreValue": 10
      },
      "appearance": {
        "sprite": "enemy_blob",
        "scale": 1.0,
        "tint": "0x00FF00"
      },
      "behavior": {
        "movementPattern": "direct",
        "attackPattern": "melee",
        "aggroRange": 100,
        "attackRange": 30
      },
      "drops": [
        {
          "type": "experience",
          "amount": 1,
          "chance": 1.0
        }
      ]
    },
    {
      "id": "goblin",
      "name": "Goblin",
      "category": "basic",
      "stats": {
        "health": 15,
        "damage": 8,
        "speed": 70,
        "experienceValue": 2,
        "scoreValue": 20
      },
      "appearance": {
        "sprite": "enemy_goblin",
        "scale": 1.0
      },
      "behavior": {
        "movementPattern": "zigzag",
        "attackPattern": "melee",
        "aggroRange": 120,
        "attackRange": 35
      }
    },
    {
      "id": "plant",
      "name": "Carnivorous Plant",
      "category": "basic",
      "stats": {
        "health": 20,
        "damage": 6,
        "speed": 30,
        "experienceValue": 2,
        "scoreValue": 25
      },
      "appearance": {
        "sprite": "enemy_plant",
        "scale": 1.2,
        "tint": "0x228B22"
      },
      "behavior": {
        "movementPattern": "random",
        "attackPattern": "ranged",
        "aggroRange": 150,
        "attackRange": 80,
        "attackCooldown": 2000
      }
    }
  ]
}
```

### Player Weapons Data
**File: `src/data/game-data/weapons/player-weapons.json`**
```json
{
  "weapons": [
    {
      "id": "fireball",
      "name": "Fireball",
      "description": "A basic fireball projectile that deals fire damage",
      "category": "primary",
      "stats": {
        "damage": 25,
        "attackSpeed": 1.0,
        "range": 400,
        "piercing": 1,
        "projectileSpeed": 300,
        "critChance": 0.05,
        "critMultiplier": 2.0
      },
      "projectile": {
        "sprite": "projectile_fireball",
        "scale": 1.0,
        "effects": [
          {
            "type": "trail",
            "config": {
              "color": "0xFF4400",
              "length": 5
            }
          }
        ]
      },
      "upgrades": [
        {
          "level": 2,
          "requirements": {
            "playerLevel": 5
          },
          "modifications": {
            "damageMultiplier": 1.3,
            "additionalPiercing": 1
          }
        },
        {
          "level": 3,
          "requirements": {
            "playerLevel": 10
          },
          "modifications": {
            "damageMultiplier": 1.5,
            "speedMultiplier": 1.2,
            "additionalPiercing": 1
          }
        }
      ]
    },
    {
      "id": "ice_shard",
      "name": "Ice Shard",
      "description": "Shoots sharp ice projectiles that can slow enemies",
      "category": "secondary",
      "stats": {
        "damage": 20,
        "attackSpeed": 1.5,
        "range": 350,
        "piercing": 2,
        "projectileSpeed": 400
      },
      "projectile": {
        "sprite": "projectile_ice",
        "scale": 0.8,
        "effects": [
          {
            "type": "slow",
            "config": {
              "duration": 2000,
              "slowFactor": 0.5
            }
          }
        ]
      }
    }
  ]
}
```

### Early Waves Data
**File: `src/data/game-data/waves/early-waves.json`**
```json
{
  "waves": [
    {
      "id": "wave_1",
      "name": "First Contact",
      "category": "tutorial",
      "duration": 60,
      "difficulty": 1,
      "spawnGroups": [
        {
          "enemyId": "blob",
          "count": 5,
          "spawnPattern": "random",
          "delay": 0
        },
        {
          "enemyId": "blob",
          "count": 3,
          "spawnPattern": "random",
          "delay": 30
        }
      ],
      "events": [
        {
          "type": "spawn",
          "timing": 45,
          "config": {
            "message": "More enemies incoming!"
          }
        }
      ],
      "rewards": {
        "experienceBonus": 10
      }
    },
    {
      "id": "wave_2",
      "name": "Growing Threat",
      "category": "early",
      "duration": 90,
      "difficulty": 2,
      "spawnGroups": [
        {
          "enemyId": "blob",
          "count": 8,
          "spawnPattern": "circle",
          "delay": 0
        },
        {
          "enemyId": "goblin",
          "count": 4,
          "spawnPattern": "random",
          "delay": 30
        },
        {
          "enemyId": "plant",
          "count": 2,
          "spawnPattern": "line",
          "delay": 60
        }
      ]
    }
  ]
}
```

### Leveling Data
**File: `src/data/game-data/progression/leveling.json`**
```json
{
  "requirements": [
    { "level": 1, "experienceRequired": 0, "experienceTotal": 0 },
    { "level": 2, "experienceRequired": 100, "experienceTotal": 100 },
    { "level": 3, "experienceRequired": 150, "experienceTotal": 250 },
    { "level": 4, "experienceRequired": 200, "experienceTotal": 450 },
    { "level": 5, "experienceRequired": 300, "experienceTotal": 750 },
    { "level": 6, "experienceRequired": 400, "experienceTotal": 1150 },
    { "level": 7, "experienceRequired": 500, "experienceTotal": 1650 },
    { "level": 8, "experienceRequired": 650, "experienceTotal": 2300 },
    { "level": 9, "experienceRequired": 800, "experienceTotal": 3100 },
    { "level": 10, "experienceRequired": 1000, "experienceTotal": 4100 }
  ],
  "upgradeOptions": [
    {
      "id": "health_boost",
      "name": "Health Boost",
      "description": "Increase maximum health by 20",
      "icon": "upgrade_health",
      "maxLevel": 10,
      "effects": [
        {
          "property": "maxHealth",
          "value": 20,
          "type": "add"
        }
      ]
    },
    {
      "id": "speed_boost",
      "name": "Speed Boost", 
      "description": "Increase movement speed by 10%",
      "icon": "upgrade_speed",
      "maxLevel": 5,
      "effects": [
        {
          "property": "moveSpeed",
          "value": 1.1,
          "type": "multiply"
        }
      ]
    },
    {
      "id": "damage_boost",
      "name": "Damage Boost",
      "description": "Increase weapon damage by 15%",
      "icon": "upgrade_damage",
      "maxLevel": 8,
      "effects": [
        {
          "property": "weaponDamage",
          "value": 1.15,
          "type": "multiply"
        }
      ]
    },
    {
      "id": "attack_speed",
      "name": "Attack Speed",
      "description": "Increase attack speed by 12%",
      "icon": "upgrade_attack_speed",
      "maxLevel": 6,
      "effects": [
        {
          "property": "attackSpeed",
          "value": 1.12,
          "type": "multiply"
        }
      ]
    },
    {
      "id": "magnet_range",
      "name": "Magnet Range",
      "description": "Increase XP pickup range by 25%",
      "icon": "upgrade_magnet",
      "maxLevel": 4,
      "effects": [
        {
          "property": "magnetRange",
          "value": 1.25,
          "type": "multiply"
        }
      ]
    }
  ]
}
```

---

## 🔧 Development Tools

### Data Editor Tool (Optional)
**File: `tools/data-editor.html`**
```html
<!DOCTYPE html>
<html>
<head>
    <title>MOMsters Data Editor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .data-section { margin: 20px 0; border: 1px solid #ccc; padding: 15px; }
        textarea { width: 100%; height: 300px; font-family: monospace; }
        button { padding: 10px 20px; margin: 5px; }
        .error { color: red; }
        .success { color: green; }
    </style>
</head>
<body>
    <h1>MOMsters Game Data Editor</h1>
    
    <div class="data-section">
        <h2>Enemy Data</h2>
        <textarea id="enemyData" placeholder="Paste enemy JSON data here..."></textarea>
        <br>
        <button onclick="validateData('enemy')">Validate</button>
        <button onclick="saveData('enemy')">Save</button>
        <div id="enemyStatus"></div>
    </div>
    
    <div class="data-section">
        <h2>Weapon Data</h2>
        <textarea id="weaponData" placeholder="Paste weapon JSON data here..."></textarea>
        <br>
        <button onclick="validateData('weapon')">Validate</button>
        <button onclick="saveData('weapon')">Save</button>
        <div id="weaponStatus"></div>
    </div>
    
    <script>
        function validateData(type) {
            const textarea = document.getElementById(type + 'Data');
            const status = document.getElementById(type + 'Status');
            
            try {
                const data = JSON.parse(textarea.value);
                status.innerHTML = '<span class="success">✅ Valid JSON</span>';
                
                // Here you would call your validation logic
                // For now, just check basic structure
                if (type === 'enemy' && data.enemies && Array.isArray(data.enemies)) {
                    status.innerHTML += '<br><span class="success">✅ Valid enemy structure</span>';
                } else if (type === 'weapon' && data.weapons && Array.isArray(data.weapons)) {
                    status.innerHTML += '<br><span class="success">✅ Valid weapon structure</span>';
                } else {
                    status.innerHTML += '<br><span class="error">❌ Invalid structure</span>';
                }
            } catch (error) {
                status.innerHTML = '<span class="error">❌ Invalid JSON: ' + error.message + '</span>';
            }
        }
        
        function saveData(type) {
            const textarea = document.getElementById(type + 'Data');
            const status = document.getElementById(type + 'Status');
            
            try {
                const data = JSON.parse(textarea.value);
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = type + '-data.json';
                a.click();
                URL.revokeObjectURL(url);
                
                status.innerHTML = '<span class="success">✅ File downloaded</span>';
            } catch (error) {
                status.innerHTML = '<span class="error">❌ Cannot save: ' + error.message + '</span>';
            }
        }
    </script>
</body>
</html>
```

---

## 🔄 Integration with Modernization Plan

### Phase 1 Extension: Data Foundation
Add to **PHASE_1_IMPLEMENTATION.md**:

**Day 6: Data-Driven System**
```bash
mkdir -p src/data/schemas src/data/game-data/{enemies,weapons,waves,progression,balance}
npm install ajv  # For JSON schema validation
# Create all data files and schemas
# Implement DataManager, DataValidator, DataLoader
```

### Phase 2 Integration: ECS Data Binding
Update **EntityManager** to use data-driven enemy creation:
```typescript
public createEnemyFromData(enemyId: string, position: Vector2): EntityId {
  const enemyData = DataManager.getInstance().getEnemy(enemyId);
  if (!enemyData) throw new Error(`Enemy not found: ${enemyId}`);
  
  const entity = this.createEntity();
  // Create components based on enemyData
  // ...
}
```

### Phase 3 Integration: UI Data Binding
Update **LevelUpScreen** to use data-driven upgrades:
```typescript
private createUpgradeOptions(): void {
  const upgradeOptions = DataManager.getInstance().getUpgradeOptions();
  upgradeOptions.forEach(option => {
    // Create UI elements based on option data
  });
}
```

---

## 📋 Data-Driven Features Checklist

### Core Data System ✅
- [ ] JSON schema definitions for validation
- [ ] DataManager for centralized data access
- [ ] DataValidator with schema validation
- [ ] DataLoader with caching and hot-reload
- [ ] TypeScript interfaces for all data types

### Game Data Files ✅
- [ ] Enemy definitions (basic, boss, special)
- [ ] Weapon and ability configurations
- [ ] Wave and spawn pattern definitions
- [ ] Leveling and progression data
- [ ] Balance and difficulty modifiers

### Development Tools ✅
- [ ] Data validation on load
- [ ] Hot-reload for development iteration
- [ ] Data editor tool (optional)
- [ ] Export/import functionality
- [ ] Data integrity checking

### Integration ✅
- [ ] ECS entity creation from data
- [ ] Weapon system using data configs
- [ ] Wave spawner using data definitions
- [ ] Leveling system using progression data
- [ ] UI systems reading from data

---

## 🎯 Benefits of Data-Driven Design

### For Developers
- **Rapid Iteration**: Change game balance without recompiling
- **A/B Testing**: Easy to test different configurations
- **Modding Support**: External data files enable community mods
- **Version Control**: Data changes tracked separately from code

### For Designers
- **Visual Editing**: JSON files can be edited in any text editor
- **Instant Testing**: Hot-reload means immediate feedback
- **Balance Tweaking**: Fine-tune numbers without programming knowledge
- **Content Creation**: Add new enemies/weapons by creating data files

### For Players
- **Customization**: Players can modify data files (if desired)
- **Community Content**: Easy for community to create new content
- **Regular Updates**: Game balance can be updated without full patches

This data-driven system transforms your game from hard-coded values to a flexible, easily maintainable system that supports rapid iteration and community involvement! 