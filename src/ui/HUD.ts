import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { WaveSpawner } from '../systems/WaveSpawner';
import { WeaponSystem } from '../systems/WeaponSystem';
import { LevelingSystem } from '../systems/LevelingSystem';

// Interface for player objects that the HUD needs
interface PlayerLike {
  currentHealth: number;
  maximumHealth: number;
  healthPercent: number;
}

export class HUD {
  private container: Container;
  private healthBar!: Graphics;
  private healthBarBackground!: Graphics;
  private healthText!: Text;
  private statsBlockText!: Text;
  private timeText!: Text;
  private damageOverlay!: Graphics;
  private xpBar!: Graphics;
  private xpBarBackground!: Graphics;
  private levelText!: Text;
  private xpText!: Text;
  private muteButton!: Graphics;
  private muteButtonText!: Text;
  private muteButtonBackground!: Graphics;
  private statsBlockBackground!: Graphics;

  private screenWidth: number;
  private screenHeight: number;

  // Damage screen effect
  private damageEffectTimer: number = 0;
  private damageEffectDuration: number = 30; // frames

  // Survival timer
  private survivalTime: number = 0;

  private currentWeaponNotification?: Text;

  // Audio state
  private isMuted: boolean = false;
  private onMuteToggle?: (muted: boolean) => void;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.createHUD();
  }

  private createHUD(): void {
    // Health bar background
    this.healthBarBackground = new Graphics();
    this.healthBarBackground.beginFill(0x000000, 0.5);
    this.healthBarBackground.drawRoundedRect(0, 0, 200, 20, 5);
    this.healthBarBackground.endFill();
    this.healthBarBackground.x = 20;
    this.healthBarBackground.y = 20;
    this.container.addChild(this.healthBarBackground);

    // Health bar foreground
    this.healthBar = new Graphics();
    this.container.addChild(this.healthBar);

    // Health text
    const healthTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: 'bold',
    });

    this.healthText = new Text('100/100 HP', healthTextStyle);
    this.healthText.x = 240;
    this.healthText.y = 20;
    this.container.addChild(this.healthText);

    // Stats block background
    this.statsBlockBackground = new Graphics();
    this.statsBlockBackground.beginFill(0x000000, 0.5);
    this.statsBlockBackground.drawRoundedRect(15, 45, 320, 60, 8);
    this.statsBlockBackground.endFill();
    this.container.addChild(this.statsBlockBackground);
    this.statsBlockBackground.zIndex = 1;

    // Stats block text (multi-line)
    const statsBlockTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
    });
    this.statsBlockText = new Text('', statsBlockTextStyle);
    this.statsBlockText.x = 30;
    this.statsBlockText.y = 55;
    this.statsBlockText.zIndex = 2;
    this.container.addChild(this.statsBlockText);

    // Survival time
    const timeTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffff00,
      fontWeight: 'bold',
    });

    this.timeText = new Text('Time: 0:00', timeTextStyle);
    this.timeText.x = this.screenWidth - 120;
    this.timeText.y = 20;
    this.container.addChild(this.timeText);

    // XP bar background
    this.xpBarBackground = new Graphics();
    this.xpBarBackground.beginFill(0x000000, 0.5);
    this.xpBarBackground.drawRoundedRect(0, 0, 300, 15, 5);
    this.xpBarBackground.endFill();
    this.xpBarBackground.x = this.screenWidth / 2 - 150;
    this.xpBarBackground.y = this.screenHeight - 50;
    this.container.addChild(this.xpBarBackground);

    // XP bar foreground
    this.xpBar = new Graphics();
    this.container.addChild(this.xpBar);

    // Level text
    const levelTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffd700,
      fontWeight: 'bold',
    });

    this.levelText = new Text('Level 1', levelTextStyle);
    this.levelText.x = this.screenWidth / 2 - 170;
    this.levelText.y = this.screenHeight - 50;
    this.container.addChild(this.levelText);

    // XP text
    const xpTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
    });

    this.xpText = new Text('0/100 XP', xpTextStyle);
    this.xpText.x = this.screenWidth / 2 - 25;
    this.xpText.y = this.screenHeight - 47;
    this.container.addChild(this.xpText);

    // Damage overlay (full screen red flash)
    this.damageOverlay = new Graphics();
    this.damageOverlay.beginFill(0xff0000, 0.3);
    this.damageOverlay.drawRect(0, 0, this.screenWidth, this.screenHeight);
    this.damageOverlay.endFill();
    this.damageOverlay.visible = false;
    this.container.addChild(this.damageOverlay);

    // Create mute button
    this.createMuteButton();

    // Make sure HUD is always on top
    this.container.zIndex = 1000;
  }

  private createMuteButton(): void {
    // Mute button background
    this.muteButtonBackground = new Graphics();
    this.muteButtonBackground.beginFill(0x000000, 0.7);
    this.muteButtonBackground.drawRoundedRect(0, 0, 50, 50, 8);
    this.muteButtonBackground.endFill();
    this.muteButtonBackground.x = this.screenWidth - 70;
    this.muteButtonBackground.y = 20;
    this.container.addChild(this.muteButtonBackground);

    // Mute button icon background
    this.muteButton = new Graphics();
    this.muteButton.beginFill(0x333333, 0.8);
    this.muteButton.drawRoundedRect(0, 0, 40, 40, 6);
    this.muteButton.endFill();
    this.muteButton.lineStyle(2, 0x666666, 0.5);
    this.muteButton.drawRoundedRect(0, 0, 40, 40, 6);
    this.muteButton.x = this.screenWidth - 65;
    this.muteButton.y = 25;
    this.container.addChild(this.muteButton);

    // Mute button text (speaker icon)
    const muteTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xffffff,
      fontWeight: 'bold',
    });

    this.muteButtonText = new Text('🔊', muteTextStyle);
    this.muteButtonText.x = this.screenWidth - 55;
    this.muteButtonText.y = 30;
    this.container.addChild(this.muteButtonText);

    // Create tooltip (initially hidden)
    const tooltip = new Text('Click to mute/unmute audio (or press M)', {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    tooltip.x = this.screenWidth - 200;
    tooltip.y = 75;
    tooltip.visible = false;
    this.container.addChild(tooltip);

    // Make button interactive
    this.muteButtonBackground.eventMode = 'static';
    this.muteButtonBackground.cursor = 'pointer';
    this.muteButtonBackground.on('pointerdown', () => this.toggleMute());
    this.muteButtonBackground.on('pointerover', () => {
      this.muteButtonBackground.tint = 0x666666;
      tooltip.visible = true;
    });
    this.muteButtonBackground.on('pointerout', () => {
      this.muteButtonBackground.tint = 0xffffff;
      tooltip.visible = false;
    });

    this.muteButton.eventMode = 'static';
    this.muteButton.cursor = 'pointer';
    this.muteButton.on('pointerdown', () => this.toggleMute());
    this.muteButton.on('pointerover', () => {
      this.muteButton.tint = 0x666666;
      tooltip.visible = true;
    });
    this.muteButton.on('pointerout', () => {
      this.muteButton.tint = 0xffffff;
      tooltip.visible = false;
    });
  }

  /**
   * Update HUD with current game state
   */
  update(
    deltaTime: number,
    player: PlayerLike,
    enemySpawner: WaveSpawner,
    weaponSystem?: WeaponSystem,
    levelingSystem?: LevelingSystem
  ): void {
    this.updateSurvivalTime(deltaTime);
    this.updateHealthBar(player);
    this.updateStats(enemySpawner, weaponSystem);
    if (levelingSystem) {
      this.updateXPBar(levelingSystem);
    }
    this.updateDamageEffect(deltaTime);
  }

  private updateSurvivalTime(deltaTime: number): void {
    this.survivalTime += deltaTime / 60; // Convert to seconds

    const minutes = Math.floor(this.survivalTime / 60);
    const seconds = Math.floor(this.survivalTime % 60);
    this.timeText.text = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private updateHealthBar(player: PlayerLike): void {
    const healthPercent = player.healthPercent;
    const maxWidth = 200;
    const currentWidth = maxWidth * healthPercent;

    // Clear and redraw health bar
    this.healthBar.clear();

    // Health bar color based on health percentage
    let barColor = 0x00ff00; // Green
    if (healthPercent < 0.3) {
      barColor = 0xff0000; // Red
    } else if (healthPercent < 0.6) {
      barColor = 0xffff00; // Yellow
    }

    this.healthBar.beginFill(barColor, 0.8);
    this.healthBar.drawRoundedRect(22, 22, currentWidth - 4, 16, 3);
    this.healthBar.endFill();

    // Update health text
    this.healthText.text = `${player.currentHealth}/${player.maximumHealth} HP`;

    // Flash health bar when critically low
    if (healthPercent < 0.2) {
      const flash = Math.sin(Date.now() / 200) * 0.5 + 0.5;
      this.healthBar.alpha = 0.5 + flash * 0.5;
    } else {
      this.healthBar.alpha = 1.0;
    }
  }

  private updateStats(enemySpawner: WaveSpawner, weaponSystem?: WeaponSystem): void {
    // Get wave info
    const waveInfo = enemySpawner.getWaveInfo();
    const stats = enemySpawner.getStats();
    // const progression = enemySpawner.getProgressionInfo(); // Removed unused variable
    // Get weapon stats
    let weaponStatsLine = '';
    if (weaponSystem) {
      const weaponStats = weaponSystem.getStats();
      weaponStatsLine = `Weapon: ${weaponStats.shotsFired} shots | ${weaponStats.hits} hits | ${weaponStats.accuracy}% accuracy`;
    }
    // Compose all stats into a single multi-line string
    const statsLines = [
      `Wave ${waveInfo.currentWave}/${enemySpawner.getTotalWaves()}: ${waveInfo.waveName} (${Math.round(waveInfo.waveProgress * 100)}%)`,
      `Time: ${this.formatSurvivalTime(waveInfo.timeRemaining)} | Event: ${waveInfo.event}`,
      weaponStatsLine,
      `Enemies: ${stats.count}/${stats.maxEnemies} | Spawn Rate: ${stats.spawnRate.toFixed(1)}/s`
    ];
    this.statsBlockText.text = statsLines.filter(Boolean).join('\n');
    // Dynamically resize background to fit text
    const padding = 12;
    const width = this.statsBlockText.width + padding * 2;
    const height = this.statsBlockText.height + padding * 2;
    this.statsBlockBackground.clear();
    this.statsBlockBackground.beginFill(0x000000, 0.5);
    this.statsBlockBackground.drawRoundedRect(20, 50, width, height, 8);
    this.statsBlockBackground.endFill();
  }

  private updateXPBar(levelingSystem: LevelingSystem): void {
    const xpProgress = levelingSystem.xpProgress;
    const maxWidth = 300;
    const currentWidth = maxWidth * xpProgress;

    // Clear and redraw XP bar
    this.xpBar.clear();

    // XP bar color - blue/cyan gradient
    this.xpBar.beginFill(0x00ccff, 0.8);
    this.xpBar.drawRoundedRect(
      this.screenWidth / 2 - 148,
      this.screenHeight - 48,
      currentWidth - 4,
      11,
      3
    );
    this.xpBar.endFill();

    // Update level text
    this.levelText.text = `Level ${levelingSystem.level}`;

    // Update XP text
    this.xpText.text = `${levelingSystem.experience}/${levelingSystem.experienceToNext} XP`;

    // Add glow effect when near level up
    if (xpProgress > 0.8) {
      const glow = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      this.xpBar.alpha = glow;
      this.levelText.alpha = glow;
    } else {
      this.xpBar.alpha = 1.0;
      this.levelText.alpha = 1.0;
    }
  }

  private updateDamageEffect(deltaTime: number): void {
    if (this.damageEffectTimer > 0) {
      this.damageEffectTimer -= deltaTime;

      // Fade out the damage overlay
      const alpha = (this.damageEffectTimer / this.damageEffectDuration) * 0.3;
      this.damageOverlay.alpha = alpha;
      this.damageOverlay.visible = alpha > 0;

      if (this.damageEffectTimer <= 0) {
        this.damageOverlay.visible = false;
      }
    }
  }

  /**
   * Trigger damage screen effect
   */
  showDamageEffect(): void {
    this.damageEffectTimer = this.damageEffectDuration;
    this.damageOverlay.visible = true;
    this.damageOverlay.alpha = 0.3;
  }

  /**
   * Get HUD container for adding to stage
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Get survival time in seconds
   */
  getSurvivalTime(): number {
    return this.survivalTime;
  }

  /**
   * Reset HUD for new game
   */
  reset(): void {
    this.survivalTime = 0;
    this.damageEffectTimer = 0;
    this.damageOverlay.visible = false;
  }

  showDebugModeNotification(): void {
    // Create a temporary notification text
    const debugText = new Text('🔧 DEBUG MODE ACTIVATED', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xff0000,
      fontWeight: 'bold',
    });
    debugText.x = this.screenWidth / 2 - 150;
    debugText.y = this.screenHeight / 2 - 50;
    this.container.addChild(debugText);

    // Remove after 3 seconds
    setTimeout(() => {
      if (this.container.children.includes(debugText)) {
        this.container.removeChild(debugText);
      }
    }, 3000);
  }

  showWeaponNotification(weaponType: string): void {
    // Remove previous notification if it exists
    if (
      this.currentWeaponNotification &&
      this.container.children.includes(this.currentWeaponNotification)
    ) {
      this.container.removeChild(this.currentWeaponNotification);
      this.currentWeaponNotification.destroy();
    }
    // Create a new notification text
    const weaponText = new Text(`🔫 ${weaponType.toUpperCase()}`, {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0x00ff00,
      fontWeight: 'bold',
    });
    weaponText.x = this.screenWidth / 2 - 100;
    weaponText.y = this.screenHeight / 2 - 30;
    this.container.addChild(weaponText);
    this.currentWeaponNotification = weaponText;
    // Remove after 2 seconds
    setTimeout(() => {
      if (
        this.currentWeaponNotification === weaponText &&
        this.container.children.includes(weaponText)
      ) {
        this.container.removeChild(weaponText);
        weaponText.destroy();
        this.currentWeaponNotification = undefined;
      }
    }, 2000);
  }

  // Mute button functionality
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    
    // Update button appearance
    if (this.isMuted) {
      this.muteButtonText.text = '🔇'; // Muted speaker
      this.muteButton.tint = 0xff6666; // Red tint when muted
    } else {
      this.muteButtonText.text = '🔊'; // Unmuted speaker
      this.muteButton.tint = 0xffffff; // Normal tint when unmuted
    }
    
    // Call the callback if set
    if (this.onMuteToggle) {
      this.onMuteToggle(this.isMuted);
    }
    
    // Show notification
    this.showMuteNotification();
  }

  private showMuteNotification(): void {
    const message = this.isMuted ? '🔇 Audio Muted' : '🔊 Audio Unmuted';
    const color = this.isMuted ? 0xff6666 : 0x00ff00;
    
    const notification = new Text(message, {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: color,
      fontWeight: 'bold',
    });
    
    notification.x = this.screenWidth / 2 - 80;
    notification.y = this.screenHeight / 2 - 100;
    this.container.addChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (this.container.children.includes(notification)) {
        this.container.removeChild(notification);
        notification.destroy();
      }
    }, 2000);
  }

  setMuteToggle(callback: (muted: boolean) => void): void {
    this.onMuteToggle = callback;
  }

  isAudioMuted(): boolean {
    return this.isMuted;
  }

  private formatSurvivalTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
