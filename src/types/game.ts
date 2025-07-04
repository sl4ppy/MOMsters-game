// Core types will be used in future implementations

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
