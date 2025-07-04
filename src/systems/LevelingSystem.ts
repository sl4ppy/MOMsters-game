import { WeaponSystem } from './WeaponSystem';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string; // Simple text icon for now, could be sprite later
  maxLevel: number;
  currentLevel: number;

  // Upgrade effects
  effects: {
    healthBonus?: number;
    speedBonus?: number;
    damageMultiplier?: number;
    fireRateMultiplier?: number;
    rangeBonus?: number;
    pierceBonus?: number;
    magnetRange?: number;
    expMultiplier?: number;
    regenBonus?: number;
    weaponUnlock?: string; // New weapon type to unlock
  };
}

export interface LevelUpEvent {
  newLevel: number;
  availableUpgrades: Upgrade[];
}

// Interface for player objects that can receive upgrades
interface UpgradablePlayer {
  applyHealthUpgrades(healthBonus: number, regenBonus: number): void;
  applySpeedUpgrade(speedBonus: number): void;
}

export class LevelingSystem {
  private currentLevel: number = 1;
  private currentXP: number = 0;
  private xpToNextLevel: number = 100;

  // XP progression formula: each level requires 20% more XP than the last
  private readonly XP_BASE = 100;
  private readonly XP_MULTIPLIER = 1.2;

  // All available upgrades
  private allUpgrades: Map<string, Upgrade> = new Map();

  // Callbacks
  public onLevelUp?: (event: LevelUpEvent) => void;
  public onXPGained?: (currentXP: number, xpToNext: number, totalXP: number) => void;

  private totalXPGained: number = 0;

  constructor() {
    this.initializeUpgrades();
  }

  private initializeUpgrades(): void {
    const upgrades: Upgrade[] = [
      // Health upgrades
      {
        id: 'health_boost',
        name: 'Health Boost',
        description: '+20 Max Health',
        icon: '❤️',
        maxLevel: 5,
        currentLevel: 0,
        effects: { healthBonus: 20 },
      },
      {
        id: 'health_regen',
        name: 'Health Regeneration',
        description: '+0.5 HP/sec regen',
        icon: '💚',
        maxLevel: 3,
        currentLevel: 0,
        effects: { regenBonus: 0.5 },
      },

      // Movement upgrades
      {
        id: 'speed_boost',
        name: 'Speed Boost',
        description: '+15 Movement Speed',
        icon: '⚡',
        maxLevel: 5,
        currentLevel: 0,
        effects: { speedBonus: 15 },
      },
      {
        id: 'magnet_range',
        name: 'Magnet Range',
        description: '+30 XP Pickup Range',
        icon: '🧲',
        maxLevel: 4,
        currentLevel: 0,
        effects: { magnetRange: 30 },
      },

      // Weapon upgrades
      {
        id: 'weapon_damage',
        name: 'Weapon Power',
        description: '+25% Weapon Damage',
        icon: '⚔️',
        maxLevel: 8,
        currentLevel: 0,
        effects: { damageMultiplier: 1.25 },
      },
      {
        id: 'fire_rate',
        name: 'Attack Speed',
        description: '-20% Attack Interval',
        icon: '🔥',
        maxLevel: 6,
        currentLevel: 0,
        effects: { fireRateMultiplier: 1.2 },
      },
      {
        id: 'weapon_range',
        name: 'Weapon Range',
        description: '+50 Attack Range',
        icon: '🎯',
        maxLevel: 4,
        currentLevel: 0,
        effects: { rangeBonus: 50 },
      },
      {
        id: 'projectile_pierce',
        name: 'Piercing Shot',
        description: '+1 Enemy Pierce',
        icon: '🏹',
        maxLevel: 3,
        currentLevel: 0,
        effects: { pierceBonus: 1 },
      },

      // XP upgrades
      {
        id: 'exp_bonus',
        name: 'Experience Gain',
        description: '+15% Experience',
        icon: '📈',
        maxLevel: 5,
        currentLevel: 0,
        effects: { expMultiplier: 1.15 },
      },

      // Weapon unlock upgrades (only weapons with unique art assets)
      {
        id: 'unlock_axe',
        name: 'Axe Thrower',
        description: 'Unlock Throwing Axe weapon',
        icon: '🪓',
        maxLevel: 1,
        currentLevel: 0,
        effects: { weaponUnlock: 'axe' },
      },
      {
        id: 'unlock_knife',
        name: 'Knife Storm',
        description: 'Unlock Multi-directional Knives',
        icon: '🗡️',
        maxLevel: 1,
        currentLevel: 0,
        effects: { weaponUnlock: 'knife' },
      },
      {
        id: 'unlock_rune_tracer',
        name: 'Eye Beam Projectiles',
        description: 'Unlock blue laser projectiles from eyes',
        icon: '🎯',
        maxLevel: 1,
        currentLevel: 0,
        effects: { weaponUnlock: 'rune_tracer' },
      },
      {
        id: 'unlock_eye_beam',
        name: 'Rotating Eye Beam',
        description: 'Unlock continuous rotating beam weapon',
        icon: '👁️',
        maxLevel: 1,
        currentLevel: 0,
        effects: { weaponUnlock: 'eye_beam' },
      },

      // DISABLED - Weapons without unique art assets:
      // - Lightning Strike (lightning)
      // - Whip Mastery (whip)
      // - Magic Wand (magic_wand)
      // - Tail Mastery (bible)
      // - Thermal Control (garlic)
      // - Acid Glands (holy_water)
    ];

    // Store upgrades in map for easy access
    upgrades.forEach(upgrade => {
      this.allUpgrades.set(upgrade.id, upgrade);
    });
  }

  /**
   * Add experience points
   */
  addExperience(xp: number): void {
    // Apply XP multiplier from upgrades
    const xpMultiplier = this.getUpgradeEffect('expMultiplier', 1);
    const actualXP = Math.floor(xp * xpMultiplier);

    this.currentXP += actualXP;
    this.totalXPGained += actualXP;

    // Check for level up
    if (this.currentXP >= this.xpToNextLevel) {
      this.levelUp();
    }

    // Notify XP change
    if (this.onXPGained) {
      this.onXPGained(this.currentXP, this.xpToNextLevel, this.totalXPGained);
    }
  }

  private levelUp(): void {
    this.currentLevel++;
    this.currentXP -= this.xpToNextLevel;

    // Calculate XP needed for next level
    this.xpToNextLevel = Math.floor(
      this.XP_BASE * Math.pow(this.XP_MULTIPLIER, this.currentLevel - 1)
    );

    // Generate available upgrades for this level
    const availableUpgrades = this.getAvailableUpgrades();

    // Trigger level up event
    if (this.onLevelUp) {
      this.onLevelUp({
        newLevel: this.currentLevel,
        availableUpgrades,
      });
    }
  }

  private getAvailableUpgrades(): Upgrade[] {
    const available: Upgrade[] = [];

    // Get all upgrades that aren't maxed out
    for (const upgrade of this.allUpgrades.values()) {
      if (upgrade.currentLevel < upgrade.maxLevel) {
        available.push({ ...upgrade }); // Return a copy
      }
    }

    // Shuffle and return 3 random upgrades
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(3, shuffled.length));
  }

  /**
   * Select an upgrade when leveling up
   */
  selectUpgrade(upgradeId: string, weaponSystem?: any): void {
    const upgrade = this.allUpgrades.get(upgradeId);
    if (upgrade && upgrade.currentLevel < upgrade.maxLevel) {
      upgrade.currentLevel++;
      console.log(`Upgraded ${upgrade.name} to level ${upgrade.currentLevel}`);

      // Handle weapon unlocks
      if (upgrade.effects.weaponUnlock && weaponSystem) {
        const weaponType = upgrade.effects.weaponUnlock;
        weaponSystem.addWeapon(weaponType);
        // Set the weapon to level 1 when first unlocked
        weaponSystem.upgradeWeapon(weaponType);
        console.log(`Unlocked weapon: ${weaponType}`);
      }
    }
  }

  /**
   * Get the total effect value for a specific upgrade type
   */
  getUpgradeEffect(effectType: keyof Upgrade['effects'], baseValue: number): number {
    let totalEffect = baseValue;

    for (const upgrade of this.allUpgrades.values()) {
      if (upgrade.currentLevel > 0 && upgrade.effects[effectType] !== undefined) {
        const effectValue = upgrade.effects[effectType]!;

        // Handle different effect types
        switch (effectType) {
          case 'damageMultiplier':
          case 'fireRateMultiplier':
          case 'expMultiplier':
            // Multiplicative effects - multiply by effect value for each level
            if (typeof effectValue === 'number') {
              totalEffect *= Math.pow(effectValue, upgrade.currentLevel);
            }
            break;
          case 'healthBonus':
          case 'speedBonus':
          case 'regenBonus':
          case 'rangeBonus':
          case 'pierceBonus':
          case 'magnetRange':
            // Additive effects - add effect value for each level
            if (typeof effectValue === 'number') {
              totalEffect += effectValue * upgrade.currentLevel;
            }
            break;
          case 'weaponUnlock':
            // Weapon unlocks don't affect numeric calculations
            break;
          default:
            // Default to additive for unknown numeric effects
            if (typeof effectValue === 'number') {
              totalEffect += effectValue * upgrade.currentLevel;
            }
            break;
        }
      }
    }

    return totalEffect;
  }

  /**
   * Apply all upgrades to game systems
   */
  applyUpgrades(player: UpgradablePlayer, weaponSystem: WeaponSystem): void {
    // Apply health bonuses
    const healthBonus = this.getUpgradeEffect('healthBonus', 0);
    const regenBonus = this.getUpgradeEffect('regenBonus', 0);
    player.applyHealthUpgrades(healthBonus, regenBonus);

    // Apply speed bonus
    const speedBonus = this.getUpgradeEffect('speedBonus', 0);
    player.applySpeedUpgrade(speedBonus);

    // Apply weapon upgrades
    const damageMultiplier = this.getUpgradeEffect('damageMultiplier', 1);
    const fireRateMultiplier = this.getUpgradeEffect('fireRateMultiplier', 1);
    const rangeBonus = this.getUpgradeEffect('rangeBonus', 0);
    const pierceBonus = this.getUpgradeEffect('pierceBonus', 0);

    weaponSystem.applyUpgrades({
      damageMultiplier,
      fireRateMultiplier,
      rangeBonus,
      pierceBonus,
    });
  }

  // Getters
  get level(): number {
    return this.currentLevel;
  }
  get experience(): number {
    return this.currentXP;
  }
  get experienceToNext(): number {
    return this.xpToNextLevel;
  }
  get totalExperience(): number {
    return this.totalXPGained;
  }

  /**
   * Get XP progress as percentage (0-1)
   */
  get xpProgress(): number {
    return this.currentXP / this.xpToNextLevel;
  }

  /**
   * Get current magnet range with upgrades applied
   */
  get magnetRange(): number {
    return this.getUpgradeEffect('magnetRange', 80); // Base magnet range is 80
  }

  /**
   * Get all upgrades for display
   */
  getAllUpgrades(): Upgrade[] {
    return Array.from(this.allUpgrades.values());
  }
}
