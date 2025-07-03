import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { WaveSpawner } from '../systems/WaveSpawner'
import { WeaponSystem } from '../systems/WeaponSystem'
import { LevelingSystem } from '../systems/LevelingSystem'

// Interface for player objects that the HUD needs
interface PlayerLike {
  currentHealth: number
  maximumHealth: number
  healthPercent: number
}

export class HUD {
  private container: Container
  private healthBar!: Graphics
  private healthBarBackground!: Graphics
  private healthText!: Text
  private statsText!: Text
  private weaponStatsText!: Text
  private timeText!: Text
  private damageOverlay!: Graphics
  private xpBar!: Graphics
  private xpBarBackground!: Graphics
  private levelText!: Text
  private xpText!: Text
  
  private screenWidth: number
  private screenHeight: number
  
  // Damage screen effect
  private damageEffectTimer: number = 0
  private damageEffectDuration: number = 30 // frames
  
  // Survival timer
  private survivalTime: number = 0

  private currentWeaponNotification?: Text

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container()
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    
    this.createHUD()
  }

  private createHUD(): void {
    // Health bar background
    this.healthBarBackground = new Graphics()
    this.healthBarBackground.beginFill(0x000000, 0.5)
    this.healthBarBackground.drawRoundedRect(0, 0, 200, 20, 5)
    this.healthBarBackground.endFill()
    this.healthBarBackground.x = 20
    this.healthBarBackground.y = 20
    this.container.addChild(this.healthBarBackground)
    
    // Health bar foreground
    this.healthBar = new Graphics()
    this.container.addChild(this.healthBar)
    
    // Health text
    const healthTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: 'bold'
    })
    
    this.healthText = new Text('100/100 HP', healthTextStyle)
    this.healthText.x = 240
    this.healthText.y = 20
    this.container.addChild(this.healthText)
    
    // Stats text (enemy count, etc.)
    const statsTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff
    })
    
    this.statsText = new Text('Enemies: 0', statsTextStyle)
    this.statsText.x = 20
    this.statsText.y = 50
    this.container.addChild(this.statsText)
    
    // Weapon stats text
    this.weaponStatsText = new Text('Weapon: Ready', statsTextStyle)
    this.weaponStatsText.x = 20
    this.weaponStatsText.y = 70
    this.container.addChild(this.weaponStatsText)
    
    // Survival time
    const timeTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffff00,
      fontWeight: 'bold'
    })
    
    this.timeText = new Text('Time: 0:00', timeTextStyle)
    this.timeText.x = this.screenWidth - 120
    this.timeText.y = 20
    this.container.addChild(this.timeText)
    
    // XP bar background
    this.xpBarBackground = new Graphics()
    this.xpBarBackground.beginFill(0x000000, 0.5)
    this.xpBarBackground.drawRoundedRect(0, 0, 300, 15, 5)
    this.xpBarBackground.endFill()
    this.xpBarBackground.x = this.screenWidth / 2 - 150
    this.xpBarBackground.y = this.screenHeight - 50
    this.container.addChild(this.xpBarBackground)
    
    // XP bar foreground
    this.xpBar = new Graphics()
    this.container.addChild(this.xpBar)
    
    // Level text
    const levelTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffd700,
      fontWeight: 'bold'
    })
    
    this.levelText = new Text('Level 1', levelTextStyle)
    this.levelText.x = this.screenWidth / 2 - 170
    this.levelText.y = this.screenHeight - 50
    this.container.addChild(this.levelText)
    
    // XP text
    const xpTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff
    })
    
    this.xpText = new Text('0/100 XP', xpTextStyle)
    this.xpText.x = this.screenWidth / 2 - 25
    this.xpText.y = this.screenHeight - 47
    this.container.addChild(this.xpText)
    
    // Damage overlay (full screen red flash)
    this.damageOverlay = new Graphics()
    this.damageOverlay.beginFill(0xff0000, 0.3)
    this.damageOverlay.drawRect(0, 0, this.screenWidth, this.screenHeight)
    this.damageOverlay.endFill()
    this.damageOverlay.visible = false
    this.container.addChild(this.damageOverlay)
    
    // Make sure HUD is always on top
    this.container.zIndex = 1000
  }

  /**
   * Update HUD with current game state
   */
  update(deltaTime: number, player: PlayerLike, enemySpawner: WaveSpawner, weaponSystem?: WeaponSystem, levelingSystem?: LevelingSystem): void {
    this.updateSurvivalTime(deltaTime)
    this.updateHealthBar(player)
    this.updateStats(enemySpawner)
    if (weaponSystem) {
      this.updateWeaponStats(weaponSystem)
    }
    if (levelingSystem) {
      this.updateXPBar(levelingSystem)
    }
    this.updateDamageEffect(deltaTime)
  }

  private updateSurvivalTime(deltaTime: number): void {
    this.survivalTime += deltaTime / 60 // Convert to seconds
    
    const minutes = Math.floor(this.survivalTime / 60)
    const seconds = Math.floor(this.survivalTime % 60)
    this.timeText.text = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  private updateHealthBar(player: PlayerLike): void {
    const healthPercent = player.healthPercent
    const maxWidth = 200
    const currentWidth = maxWidth * healthPercent
    
    // Clear and redraw health bar
    this.healthBar.clear()
    
    // Health bar color based on health percentage
    let barColor = 0x00ff00 // Green
    if (healthPercent < 0.3) {
      barColor = 0xff0000 // Red
    } else if (healthPercent < 0.6) {
      barColor = 0xffff00 // Yellow
    }
    
    this.healthBar.beginFill(barColor, 0.8)
    this.healthBar.drawRoundedRect(22, 22, currentWidth - 4, 16, 3)
    this.healthBar.endFill()
    
    // Update health text
    this.healthText.text = `${player.currentHealth}/${player.maximumHealth} HP`
    
    // Flash health bar when critically low
    if (healthPercent < 0.2) {
      const flash = Math.sin(Date.now() / 200) * 0.5 + 0.5
      this.healthBar.alpha = 0.5 + flash * 0.5
    } else {
      this.healthBar.alpha = 1.0
    }
  }

  private updateStats(enemySpawner: WaveSpawner): void {
    const stats = enemySpawner.getStats()
    const waveInfo = enemySpawner.getWaveInfo()
    const progressionInfo = enemySpawner.getProgressionInfo()
    
    // Format wave progress as percentage
    const waveProgress = Math.round(waveInfo.waveProgress * 100)
    
    // Format time remaining
    const timeRemaining = Math.max(0, waveInfo.timeRemaining)
    const minutes = Math.floor(timeRemaining)
    const seconds = Math.floor((timeRemaining % 1) * 60)
    
    this.statsText.text = `Wave ${waveInfo.currentWave}/${enemySpawner.getTotalWaves()}: ${waveInfo.waveName} (${waveProgress}%)\n` +
                         `Time: ${minutes}:${seconds.toString().padStart(2, '0')} | Event: ${waveInfo.event}\n` +
                         `Enemies: ${stats.count}/${stats.maxEnemies} | Spawn Rate: ${stats.spawnRate.toFixed(1)}/s`
  }

  private updateWeaponStats(weaponSystem: WeaponSystem): void {
    const stats = weaponSystem.getStats()
    this.weaponStatsText.text = `Weapon: ${stats.shotsFired} shots | ${stats.hits} hits | ${stats.accuracy}% accuracy`
  }

  private updateXPBar(levelingSystem: LevelingSystem): void {
    const xpProgress = levelingSystem.xpProgress
    const maxWidth = 300
    const currentWidth = maxWidth * xpProgress
    
    // Clear and redraw XP bar
    this.xpBar.clear()
    
    // XP bar color - blue/cyan gradient
    this.xpBar.beginFill(0x00ccff, 0.8)
    this.xpBar.drawRoundedRect(this.screenWidth / 2 - 148, this.screenHeight - 48, currentWidth - 4, 11, 3)
    this.xpBar.endFill()
    
    // Update level text
    this.levelText.text = `Level ${levelingSystem.level}`
    
    // Update XP text
    this.xpText.text = `${levelingSystem.experience}/${levelingSystem.experienceToNext} XP`
    
    // Add glow effect when near level up
    if (xpProgress > 0.8) {
      const glow = Math.sin(Date.now() / 300) * 0.3 + 0.7
      this.xpBar.alpha = glow
      this.levelText.alpha = glow
    } else {
      this.xpBar.alpha = 1.0
      this.levelText.alpha = 1.0
    }
  }

  private updateDamageEffect(deltaTime: number): void {
    if (this.damageEffectTimer > 0) {
      this.damageEffectTimer -= deltaTime
      
      // Fade out the damage overlay
      const alpha = (this.damageEffectTimer / this.damageEffectDuration) * 0.3
      this.damageOverlay.alpha = alpha
      this.damageOverlay.visible = alpha > 0
      
      if (this.damageEffectTimer <= 0) {
        this.damageOverlay.visible = false
      }
    }
  }

  /**
   * Trigger damage screen effect
   */
  showDamageEffect(): void {
    this.damageEffectTimer = this.damageEffectDuration
    this.damageOverlay.visible = true
    this.damageOverlay.alpha = 0.3
  }

  /**
   * Get HUD container for adding to stage
   */
  getContainer(): Container {
    return this.container
  }

  /**
   * Get survival time in seconds
   */
  getSurvivalTime(): number {
    return this.survivalTime
  }

  /**
   * Reset HUD for new game
   */
  reset(): void {
    this.survivalTime = 0
    this.damageEffectTimer = 0
    this.damageOverlay.visible = false
  }

  showDebugModeNotification(): void {
    console.log('🔧 DEBUG MODE ACTIVATED')
    // Create a temporary notification text
    const debugText = new Text('🔧 DEBUG MODE ACTIVATED', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xff0000,
      fontWeight: 'bold'
    })
    debugText.x = this.screenWidth / 2 - 150
    debugText.y = this.screenHeight / 2 - 50
    this.container.addChild(debugText)
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (this.container.children.includes(debugText)) {
        this.container.removeChild(debugText)
      }
    }, 3000)
  }

  showWeaponNotification(weaponType: string): void {
    // Remove previous notification if it exists
    if (this.currentWeaponNotification && this.container.children.includes(this.currentWeaponNotification)) {
      this.container.removeChild(this.currentWeaponNotification)
      this.currentWeaponNotification.destroy()
    }
    // Create a new notification text
    const weaponText = new Text(`🔫 ${weaponType.toUpperCase()}`, {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0x00ff00,
      fontWeight: 'bold'
    })
    weaponText.x = this.screenWidth / 2 - 100
    weaponText.y = this.screenHeight / 2 - 30
    this.container.addChild(weaponText)
    this.currentWeaponNotification = weaponText
    // Remove after 2 seconds
    setTimeout(() => {
      if (this.currentWeaponNotification === weaponText && this.container.children.includes(weaponText)) {
        this.container.removeChild(weaponText)
        weaponText.destroy()
        this.currentWeaponNotification = undefined
      }
    }, 2000)
  }
} 