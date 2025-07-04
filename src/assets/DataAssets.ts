import { EnemyData, PlayerUpgrade } from '../types/game';

// Define WaveConfig interface for data assets
export interface WaveConfig {
  duration: number;
  spawnRate: number;
  enemies: string[];
  event?: string;
  specialSpawning?: boolean;
}

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
    event: 'normal',
  },
  {
    duration: 90000, // 1.5 minutes
    spawnRate: 60,
    enemies: ['Blob', 'Goblin', 'Plant'],
    event: 'normal',
  },
  {
    duration: 60000,
    spawnRate: 80,
    enemies: ['Hobgoblin', 'Mermaid'],
    event: 'normal',
  },
  {
    duration: 45000,
    spawnRate: 90,
    enemies: ['Gargoyle', 'ChompChest'],
    event: 'circle',
  },
  // More waves will be added as the system evolves
];

export const ENEMY_DATA: Record<string, EnemyData> = {
  Blob: {
    name: 'Blob',
    health: 10,
    damage: 5,
    speed: 50,
    experienceValue: 1,
    sprite: 'enemy_blob',
    scale: 1.0,
  },
  Goblin: {
    name: 'Goblin',
    health: 15,
    damage: 8,
    speed: 70,
    experienceValue: 2,
    sprite: 'enemy_goblin',
    scale: 1.0,
  },
  Plant: {
    name: 'Plant',
    health: 12,
    damage: 6,
    speed: 30,
    experienceValue: 2,
    sprite: 'enemy_plant',
    scale: 1.0,
  },
  Hobgoblin: {
    name: 'Hobgoblin',
    health: 25,
    damage: 12,
    speed: 80,
    experienceValue: 3,
    sprite: 'enemy_hobgoblin',
    scale: 1.0,
  },
  Mermaid: {
    name: 'Mermaid',
    health: 20,
    damage: 10,
    speed: 60,
    experienceValue: 3,
    sprite: 'enemy_mermaid',
    scale: 1.0,
  },
  Gargoyle: {
    name: 'Gargoyle',
    health: 35,
    damage: 15,
    speed: 90,
    experienceValue: 4,
    sprite: 'enemy_gargoyle',
    scale: 1.0,
  },
  ChompChest: {
    name: 'ChompChest',
    health: 40,
    damage: 18,
    speed: 40,
    experienceValue: 5,
    sprite: 'enemy_chompchest',
    scale: 1.0,
  },
};

export const UPGRADE_DATA: PlayerUpgrade[] = [
  {
    id: 'health_increase',
    name: 'Health Boost',
    description: 'Increase maximum health by 20',
    level: 0,
    maxLevel: 10,
    effect: state => ({
      ...state,
      maxHealth: state.maxHealth + 20,
      health: state.health + 20,
    }),
  },
  {
    id: 'speed_increase',
    name: 'Speed Boost',
    description: 'Increase movement speed by 10%',
    level: 0,
    maxLevel: 5,
    effect: state => ({
      ...state,
      // Note: This would need to integrate with the actual player movement system
    }),
  },
  {
    id: 'xp_boost',
    name: 'Experience Boost',
    description: 'Increase experience gain by 25%',
    level: 0,
    maxLevel: 3,
    effect: state => ({
      ...state,
      experienceMultiplier: (state as any).experienceMultiplier * 1.25,
    }),
  },
  {
    id: 'damage_boost',
    name: 'Damage Boost',
    description: 'Increase all weapon damage by 15%',
    level: 0,
    maxLevel: 8,
    effect: state => ({
      ...state,
      // Note: This would need to integrate with the weapon system
    }),
  },
];

// Level progression data
export const LEVEL_PROGRESSION = {
  experienceRequirements: [
    100, // Level 1 -> 2
    250, // Level 2 -> 3
    450, // Level 3 -> 4
    700, // Level 4 -> 5
    1000, // Level 5 -> 6
    1350, // Level 6 -> 7
    1750, // Level 7 -> 8
    2200, // Level 8 -> 9
    2700, // Level 9 -> 10
    3250, // Level 10 -> 11
  ],

  getExperienceRequirement(level: number): number {
    if (level <= 1) return 0;
    if (level <= this.experienceRequirements.length + 1) {
      return this.experienceRequirements[level - 2];
    }
    // Formula for levels beyond the predefined array
    return Math.floor(3250 + (level - 11) * 500);
  },
};
