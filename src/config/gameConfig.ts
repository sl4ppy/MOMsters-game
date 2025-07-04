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
    magnetRange: 100,
  },
  enemies: {
    spawnRateMultiplier: 1.0,
    healthScaling: 1.0,
    damageScaling: 1.0,
    experienceMultiplier: 1.0,
  },
  waves: [
    {
      duration: 60000,
      spawnRate: 50,
      enemies: ['Blob'],
      event: 'normal',
    },
    {
      duration: 90000,
      spawnRate: 60,
      enemies: ['Blob', 'Goblin', 'Plant'],
      event: 'normal',
    },
    // More waves will be migrated from existing system
  ],
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    showCollisionBoxes: false,
    showPerformanceStats: true,
  },
};
