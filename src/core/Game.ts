import { Application, Container, Graphics } from 'pixi.js'
import { GameState } from './GameState'
import { InputManager } from './InputManager'
import { Player } from '../entities/Player'
import { Camera } from './Camera'
import { CollisionManager, CollisionGroup } from './CollisionManager'
import { EnemySpawner } from '../systems/EnemySpawner'
import { WeaponSystem } from '../systems/WeaponSystem'
import { LevelingSystem } from '../systems/LevelingSystem'
import { ExperienceOrb } from '../entities/ExperienceOrb'
import { HUD } from '../ui/HUD'
import { GameOverScreen } from '../ui/GameOverScreen'
import { LevelUpScreen } from '../ui/LevelUpScreen'
import { TitleScreen } from '../ui/TitleScreen'

export class Game {
  private app: Application
  private gameContainer: Container
  private state: GameState
  private inputManager: InputManager
  private player: Player
  private camera: Camera
  private collisionManager: CollisionManager
  private enemySpawner: EnemySpawner
  private weaponSystem: WeaponSystem
  private levelingSystem: LevelingSystem
  private hud: HUD
  private gameOverScreen: GameOverScreen
  private levelUpScreen: LevelUpScreen
  private titleScreen: TitleScreen
  private experienceOrbs: ExperienceOrb[] = []
  private isRunning: boolean = false
  private isGameOver: boolean = false
  private isPaused: boolean = false // For level up screen
  private showingTitleScreen: boolean = true // Start with title screen

  constructor(app: Application) {
    this.app = app
    this.gameContainer = new Container()
    this.state = new GameState()
    this.inputManager = new InputManager()  
    this.player = new Player()
    this.camera = new Camera(this.gameContainer, app.view.width, app.view.height)
    this.collisionManager = new CollisionManager()
    this.enemySpawner = new EnemySpawner(this.gameContainer, this.camera, this.collisionManager, this.player)
    this.weaponSystem = new WeaponSystem(this.gameContainer, this.collisionManager, this.player, this.enemySpawner)
    this.levelingSystem = new LevelingSystem()
    this.hud = new HUD(app.view.width, app.view.height)
    this.gameOverScreen = new GameOverScreen(app.view.width, app.view.height)
    this.levelUpScreen = new LevelUpScreen()
    this.titleScreen = new TitleScreen(app.view.width, app.view.height)
    
    // Add the main game container to the stage
    this.app.stage.addChild(this.gameContainer)
    
    // Position level up screen at center of viewport
    this.levelUpScreen.container.x = app.view.width / 2
    this.levelUpScreen.container.y = app.view.height / 2
    
    // Add UI containers (layered: HUD -> Game Over -> Level Up Screen -> Title Screen)
    this.app.stage.addChild(this.hud.getContainer())
    this.app.stage.addChild(this.gameOverScreen.getContainer())
    this.app.stage.addChild(this.levelUpScreen.container)
    this.app.stage.addChild(this.titleScreen.container)
  }

  async init(): Promise<void> {
    console.log('Initializing game...')
    
    // Initialize systems
    this.inputManager.init()
    
    // Initialize player
    this.player.init()
    this.gameContainer.addChild(this.player.sprite)
    
    // Position player at world origin (camera will center the view)
    this.player.sprite.x = 0
    this.player.sprite.y = 0
    
    // Register player with collision system
    this.collisionManager.addEntity(this.player)
    
    // Set up player callbacks
    this.player.onDamageTaken = (damage: number) => {
      this.hud.showDamageEffect()
    }
    
    this.player.onPlayerDied = () => {
      this.handleGameOver()
    }
    
    // Set up all game callbacks
    this.setupLevelingCallbacks()
    
    // Set up enemy death callback for XP drops
    this.enemySpawner.onEnemyKilled = (enemy, position) => {
      this.dropExperienceOrb(position.x, position.y, enemy.experienceValue || 1)
    }
    
    // Set up title screen callback
    console.log('Setting up title screen callback...')
    this.titleScreen.onStartGame = () => {
      console.log('Title screen callback triggered')
      this.startGameFromTitle()
    }
    console.log('Title screen callback set. Current state - showingTitleScreen:', this.showingTitleScreen, 'titleScreen.visible:', this.titleScreen.visible)
    
    // Add some visual reference points to test camera movement
    this.addWorldReferencePoints()
    
    // Test collision object no longer needed - we have real enemies now!
    // this.addTestCollisionObject()
    
    // Set camera to follow player
    this.camera.setTarget(this.player.sprite.x, this.player.sprite.y)
    
    console.log(`Player positioned at world coordinates: ${this.player.sprite.x}, ${this.player.sprite.y}`)
    console.log('Camera system initialized')
    
    // Hide HUD initially since we start with title screen
    this.hud.getContainer().visible = false
    
    console.log('Game initialized - title screen ready!')
  }

  start(): void {
    // Always start the main loop, but initially show title screen
    console.log('Starting game ticker...')
    this.app.ticker.add(this.update, this)
    console.log('Game ticker started, main loop should be running')
    
    console.log('Application started - showing title screen')
  }
  
  private startGameFromTitle(): void {
    console.log('startGameFromTitle() called')
    console.log('Current state - showingTitleScreen:', this.showingTitleScreen, 'isRunning:', this.isRunning)
    
    this.showingTitleScreen = false
    this.isRunning = true
    this.titleScreen.hide()
    
    // Show HUD when game starts
    this.hud.getContainer().visible = true
    
    console.log('Game started from title screen! New state - showingTitleScreen:', this.showingTitleScreen, 'isRunning:', this.isRunning)
  }

  stop(): void {
    this.isRunning = false
    this.app.ticker.remove(this.update, this)
  }

  private handleGameOver(): void {
    this.isGameOver = true
    this.isRunning = false
    
    // Show game over screen with final stats
    const survivalTime = this.hud.getSurvivalTime()
    const enemyStats = this.enemySpawner.getStats()
    this.gameOverScreen.show(survivalTime, enemyStats.count, enemyStats.maxEnemies)
    
    console.log('Game Over! Survival time:', survivalTime.toFixed(1), 'seconds')
  }

  private updateGameOverState(): void {
    this.gameOverScreen.update(0)
    
    // Add restart functionality (will need to implement restart logic)
    if (this.inputManager.isKeyJustPressed('Space')) {
      console.log('Space key detected - restarting!')
      this.restart()
      return
    }
    
    // Also try with different space key variations
    if (this.inputManager.isKeyJustPressed(' ') || this.inputManager.isKeyJustPressed('Spacebar')) {
      console.log('Alternative space key detected - restarting!')
      this.restart()
      return
    }
    
    // Add quit functionality (for now just reload)
    if (this.inputManager.isKeyJustPressed('Escape')) {
      console.log('Escape key detected - quitting!')
      location.reload()
      return
    }
  }

  private restart(): void {
    // Reset game state
    this.isGameOver = false
    this.isRunning = false
    
    // Reset player
    this.player.heal(this.player.maximumHealth) // Full heal
    this.player.sprite.x = 0
    this.player.sprite.y = 0
    
    // Clear enemies
    this.enemySpawner.clear()
    
    // Clear projectiles
    this.weaponSystem.clear()
    
    // Clear experience orbs
    for (const orb of this.experienceOrbs) {
      this.collisionManager.removeEntity(orb)
      if (orb.sprite.parent) {
        orb.sprite.parent.removeChild(orb.sprite)
      }
    }
    this.experienceOrbs = []
    
    // Reset leveling system (could keep progress or reset - let's reset for fresh start)
    this.levelingSystem = new LevelingSystem()
    this.setupLevelingCallbacks()
    
    // Reset HUD
    this.hud.reset()
    
    // Hide game over screen
    this.gameOverScreen.hide()
    
    // Show title screen again and hide HUD
    this.showingTitleScreen = true
    this.titleScreen.show()
    this.hud.getContainer().visible = false
    
    console.log('Game reset - showing title screen')
  }
  
  private setupLevelingCallbacks(): void {
    // Set up leveling system callbacks
    this.levelingSystem.onLevelUp = (event) => {
      console.log(`Level up! Now level ${event.newLevel}`)
      this.isPaused = true
      this.levelUpScreen.show(event.newLevel, event.availableUpgrades)
    }
    
    this.levelingSystem.onXPGained = (currentXP, xpToNext, totalXP) => {
      // HUD will be updated in the update loop
    }
    
    // Set up level up screen callback
    this.levelUpScreen.onUpgradeSelected = (upgradeId: string) => {
      this.levelingSystem.selectUpgrade(upgradeId)
      this.isPaused = false
      
      // Apply upgrades to player and weapon system
      this.levelingSystem.applyUpgrades(this.player, this.weaponSystem)
      
      console.log(`Selected upgrade: ${upgradeId}`)
    }
  }

  /**
   * Drop an experience orb at the specified location
   */
  private dropExperienceOrb(x: number, y: number, xpValue: number = 1): void {
    const orb = new ExperienceOrb(x, y, xpValue)
    
    // Set up orb collection callback
    orb.onCollected = (xp: number) => {
      this.levelingSystem.addExperience(xp)
      
      // Remove orb from game
      this.removeExperienceOrb(orb)
    }
    
    // Add to world and collision system
    this.gameContainer.addChild(orb.sprite)
    this.collisionManager.addEntity(orb)
    this.experienceOrbs.push(orb)
  }

  /**
   * Remove an experience orb from the game
   */
  private removeExperienceOrb(orb: ExperienceOrb): void {
    // Remove from collision system
    this.collisionManager.removeEntity(orb)
    
    // Remove sprite with a short delay for visual effect
    setTimeout(() => {
      if (orb.sprite.parent) {
        orb.sprite.parent.removeChild(orb.sprite)
      }
    }, 100)
    
    // Remove from orbs array
    const index = this.experienceOrbs.indexOf(orb)
    if (index > -1) {
      this.experienceOrbs.splice(index, 1)
    }
  }

  private addWorldReferencePoints(): void {
    // Add some static objects at different world positions to test camera
    
    // Create reference points at various positions
    const positions = [
      { x: 0, y: 0, color: 0xffffff, size: 5 }, // White dot at origin
      { x: 200, y: 0, color: 0xff0000, size: 8 }, // Red dot to the right
      { x: -200, y: 0, color: 0x0000ff, size: 8 }, // Blue dot to the left
      { x: 0, y: 200, color: 0x00ff00, size: 8 }, // Green dot below
      { x: 0, y: -200, color: 0xffff00, size: 8 }, // Yellow dot above
      { x: 300, y: 300, color: 0xff00ff, size: 10 }, // Magenta dot diagonal
      { x: -300, y: -300, color: 0x00ffff, size: 10 }, // Cyan dot diagonal
    ]
    
    positions.forEach(pos => {
      const dot = new Graphics()
      dot.beginFill(pos.color)
      dot.drawCircle(0, 0, pos.size)
      dot.endFill()
      dot.x = pos.x
      dot.y = pos.y
      this.gameContainer.addChild(dot)
    })
    
    console.log('Added world reference points for camera testing')
  }

  private addTestCollisionObject(): void {
    // Create a test collision object (red square that acts as an enemy)
    const testEnemy = {
      sprite: new Graphics(),
      collisionRadius: 20,
      collisionGroup: CollisionGroup.ENEMY,
      onCollision: (other: any) => {
        console.log(`Test enemy collided with ${other.collisionGroup}`)
      }
    }
    
    // Draw the test enemy as a red square
    testEnemy.sprite.beginFill(0xff0000, 0.7) // Semi-transparent red
    testEnemy.sprite.drawRect(-20, -20, 40, 40) // 40x40 square centered
    testEnemy.sprite.endFill()
    
    // Position it near the origin so player can easily test collision
    testEnemy.sprite.x = 100
    testEnemy.sprite.y = 100
    
    // Add to world and collision system
    this.gameContainer.addChild(testEnemy.sprite)
    this.collisionManager.addEntity(testEnemy as any)
    
    console.log('Added test collision object at (100, 100)')
  }

  private update(deltaTime: number): void {
    // Update game systems first
    this.inputManager.update()
    
    // Debug: Always log the current state so we can see what's happening
    console.log('Game update - showingTitleScreen:', this.showingTitleScreen, 'isRunning:', this.isRunning, 'isGameOver:', this.isGameOver)
    
    // Handle title screen state
    if (this.showingTitleScreen) {
      console.log('Updating title screen... titleScreen.visible:', this.titleScreen.visible)
      this.titleScreen.update(deltaTime, this.inputManager)
      this.inputManager.clearJustPressed()
      return
    }
    
    // Handle game over state
    if (this.isGameOver) {
      this.updateGameOverState()
      // Clear just-pressed keys after handling game over input
      this.inputManager.clearJustPressed()
      return
    }
    
    if (!this.isRunning) return
    
    // Handle level up screen
    if (this.isPaused) {
      this.levelUpScreen.update(this.inputManager)
      this.inputManager.clearJustPressed()
      return
    }
    
    // Update player (now using much larger world bounds since camera handles viewport)
    const worldSize = 2000 // Large world size
    this.player.update(deltaTime, this.inputManager, worldSize, worldSize)
    
    // Update camera to follow player
    this.camera.setTarget(this.player.sprite.x, this.player.sprite.y)
    this.camera.update(deltaTime)
    
    // Update experience orbs
    this.updateExperienceOrbs(deltaTime)
    
    // Update enemy spawning and AI
    this.enemySpawner.update(deltaTime)
    
    // Update weapon system (auto-firing and projectiles)
    this.weaponSystem.update(deltaTime)
    
    // Update collision detection
    this.collisionManager.update()
    
    // Update HUD with leveling info
    this.hud.update(deltaTime, this.player, this.enemySpawner, this.weaponSystem, this.levelingSystem)
    
    // Update game state
    this.state.update(deltaTime)
    
    // Clear just-pressed keys at end of frame
    this.inputManager.clearJustPressed()
  }

  /**
   * Update all experience orbs
   */
  private updateExperienceOrbs(deltaTime: number): void {
    const activeOrbs: ExperienceOrb[] = []
    
    for (const orb of this.experienceOrbs) {
      orb.update(deltaTime, this.player)
      activeOrbs.push(orb)
    }
    
    this.experienceOrbs = activeOrbs
  }

  // Getters
  get application(): Application {
    return this.app
  }

  get gameState(): GameState {
    return this.state
  }

  get gameCamera(): Camera {
    return this.camera
  }

  get collisions(): CollisionManager {
    return this.collisionManager
  }

  get enemies(): EnemySpawner {
    return this.enemySpawner
  }

  get weapons(): WeaponSystem {
    return this.weaponSystem
  }
} 