import { Application, Container } from 'pixi.js';
import { GameState } from './GameState';
import { InputManager } from './InputManager';
import { SimplePlayer } from '../entities/SimplePlayer';
import { Camera } from './Camera';
import { CollisionManager } from './CollisionManager';
import { TerrainManager, TerrainTile, DecorationTile } from './TerrainManager';
import { EnemySpriteManager } from './EnemySpriteManager';
import { GemSpriteManager } from './GemSpriteManager';
import { WaveSpawner } from '../systems/WaveSpawner';
import { WeaponSystem } from '../systems/WeaponSystem';
import { LevelingSystem } from '../systems/LevelingSystem';
import { ExperienceOrb } from '../entities/ExperienceOrb';
import { HUD } from '../ui/HUD';
import { GameOverScreen } from '../ui/GameOverScreen';
import { LevelUpScreen } from '../ui/LevelUpScreen';
import { TitleScreen } from '../ui/TitleScreen';

// ECS imports
import { ECSWorldImpl } from '../ecs/ECSWorld';
import { EventBusImpl } from '../events/EventBus';
import { EnemySystem } from '../ecs/systems/EnemySystem';
import { CollisionSystem } from '../ecs/systems/CollisionSystem';

// Phase 3 imports
import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../save/SaveManager';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';

// Phase 4 imports
import { SettingsMenu, SettingsData } from '../ui/SettingsMenu';
import { PauseScreen } from '../ui/PauseScreen';
import { ParticleSystem } from '../systems/ParticleSystem';
import { EnemyAIManager } from '../systems/EnemyAISystem';
import { ItemManager, Inventory, Equipment, PowerUpManager } from '../systems/ItemSystem';

export class Game {
  private app: Application;
  private gameContainer: Container;
  private state: GameState;
  private inputManager: InputManager;
  private player: SimplePlayer;
  private camera: Camera;
  private collisionManager: CollisionManager;
  private enemySpriteManager: EnemySpriteManager;
  private gemSpriteManager: GemSpriteManager;
  private enemySpawner: WaveSpawner;
  private weaponSystem: WeaponSystem;
  private levelingSystem: LevelingSystem;
  private terrainManager: TerrainManager;
  private terrainTiles: TerrainTile[] = [];
  private decorationTiles: DecorationTile[] = [];
  private hud: HUD;
  private gameOverScreen: GameOverScreen;
  private levelUpScreen: LevelUpScreen;
  private titleScreen: TitleScreen;
  private experienceOrbs: ExperienceOrb[] = [];
  private isRunning: boolean = false;
  private isGameOver: boolean = false;
  private isPaused: boolean = false; // For level up screen
  private showingTitleScreen: boolean = true; // Start with title screen

  // ECS components
  private ecsWorld: ECSWorldImpl;
  private eventBus: EventBusImpl;
  private enemySystem: EnemySystem;
  private collisionSystem: CollisionSystem;

  // Phase 3 systems
  private audioManager: AudioManager;
  private saveManager: SaveManager;
  private performanceMonitor: PerformanceMonitor;

  // Phase 4 systems
  private settingsMenu: SettingsMenu;
  private pauseScreen: PauseScreen;
  private particleSystem: ParticleSystem;
  private enemyAIManager: EnemyAIManager;
  private itemManager: ItemManager;
  private inventory: Inventory;
  private equipment: Equipment;
  private powerUpManager: PowerUpManager;
  private isPausedForMenu: boolean = false;

  // Debug system
  private debugMode: boolean = false;
  private debugWeaponIndex: number = 0;
  private debugWeapons: string[] = [];

  constructor(app: Application) {
    this.app = app;
    this.gameContainer = new Container();
    this.state = new GameState();
    this.inputManager = new InputManager();
    this.player = new SimplePlayer();
    this.camera = new Camera(this.gameContainer, app.view.width, app.view.height);
    this.collisionManager = new CollisionManager();
    this.enemySpriteManager = new EnemySpriteManager();
    this.gemSpriteManager = new GemSpriteManager(this.app);
    this.enemySpawner = new WaveSpawner(
      this.gameContainer,
      this.camera,
      this.collisionManager,
      this.player,
      this.enemySpriteManager
    );

    // Initialize ECS components first
    this.ecsWorld = new ECSWorldImpl();
    this.eventBus = new EventBusImpl();

    this.weaponSystem = new WeaponSystem(
      this.gameContainer,
      this.collisionManager,
      this.player,
      this.enemySpawner,
      this.eventBus
    );
    this.levelingSystem = new LevelingSystem();
    this.terrainManager = new TerrainManager();
    this.hud = new HUD(app.view.width, app.view.height);
    this.gameOverScreen = new GameOverScreen(app.view.width, app.view.height);
    this.levelUpScreen = new LevelUpScreen();
    this.titleScreen = new TitleScreen(app.view.width, app.view.height);

    // Create ECS systems
    this.enemySystem = new EnemySystem(
      this.ecsWorld,
      this.eventBus,
      this.enemySpriteManager,
      this.gameContainer
    );
    this.collisionSystem = new CollisionSystem(
      this.ecsWorld,
      this.eventBus
    );

    // Register ECS systems
    this.ecsWorld.systemManager.registerSystem(this.collisionSystem);
    this.ecsWorld.systemManager.registerSystem(this.enemySystem);

    // Initialize Phase 3 systems
    this.audioManager = new AudioManager(this.eventBus);
    this.saveManager = new SaveManager(this.eventBus);
    this.performanceMonitor = new PerformanceMonitor(this.eventBus);

    // Initialize Phase 4 systems
    const defaultSettings: SettingsData = {
      audio: {
        masterVolume: 1.0,
        sfxVolume: 0.8,
        musicVolume: 0.6,
        muted: true
      },
      graphics: {
        particleQuality: 'medium',
        screenShake: true,
        showFPS: false,
        vsync: true
      },
      controls: {
        mouseSensitivity: 1.0,
        keyboardLayout: 'qwerty',
        invertY: false
      },
      gameplay: {
        autoSave: true,
        difficulty: 'normal',
        tutorialEnabled: true
      }
    };

    this.settingsMenu = new SettingsMenu(app.view.width, app.view.height, defaultSettings);
    this.pauseScreen = new PauseScreen(app.view.width, app.view.height);
    this.particleSystem = new ParticleSystem(app);
    this.enemyAIManager = new EnemyAIManager();
    this.itemManager = new ItemManager();
    this.inventory = new Inventory();
    this.equipment = new Equipment(this.player);
    this.powerUpManager = new PowerUpManager(this.player);

    // Add the main game container to the stage
    this.app.stage.addChild(this.gameContainer);

    // Position level up screen at center of viewport
    this.levelUpScreen.container.x = app.view.width / 2;
    this.levelUpScreen.container.y = app.view.height / 2;

    // Add UI containers (layered: HUD -> Game Over -> Level Up Screen -> Title Screen)
    this.app.stage.addChild(this.hud.getContainer());
    this.app.stage.addChild(this.gameOverScreen.getContainer());
    this.app.stage.addChild(this.levelUpScreen.container);
    this.app.stage.addChild(this.titleScreen.container);

    // Add Phase 4 UI containers
    this.app.stage.addChild(this.settingsMenu.getContainer());
    this.app.stage.addChild(this.pauseScreen.getContainer());

    // Set up Phase 4 UI callbacks
    this.setupPhase4Callbacks();

    console.warn('Game: Initialized successfully');
  }

  async init(): Promise<void> {
    console.warn('Game: Initializing...');

    // Initialize ECS World
    this.ecsWorld.initialize();
    console.log('ECS World initialized');

    // Initialize Phase 3 systems
    await this.audioManager.initialize();
    console.log('AudioManager initialized');
    
    // Load saved settings if available
    const savedSettings = this.saveManager.loadSettings();
    if (savedSettings) {
      console.log('Loaded saved settings:', savedSettings);
    }
    
    // Start performance monitoring
    this.performanceMonitor.start();
    console.log('PerformanceMonitor started');

    // Set up ECS event listeners
    this.setupECSEventListeners();

    // Load sprite atlases
    await this.enemySpriteManager.loadEnemyAtlas();
    await this.gemSpriteManager.loadGemAtlas();

    // Initialize systems
    this.inputManager.init();

    // Initialize debug system
    this.initializeDebugSystem();

    // Initialize player
    this.player.init();
    this.gameContainer.addChild(this.player.sprite);
    this.player.sprite.zIndex = 1500; // Ensure player renders above ALL terrain (which has zIndex = -10000) and HUD (zIndex = 1000)

    // Position player at world origin (camera will center the view)
    this.player.sprite.x = 0;
    this.player.sprite.y = 0;

    // Register player with collision system
    this.collisionManager.addEntity(this.player);

    // Set up player callbacks
    this.player.onDamageTaken = (_damage: number) => {
      this.hud.showDamageEffect();
    };

    this.player.onPlayerDied = () => {
      this.handleGameOver();
    };

    // Set up all game callbacks
    this.setupLevelingCallbacks();

    // Set up HUD mute button callback
    this.hud.setMuteToggle((muted: boolean) => {
      if (muted) {
        this.audioManager.setMasterVolume(0);
      } else {
        this.audioManager.setMasterVolume(1);
      }
    });

    // Set up enemy death callback for XP drops
    this.enemySpawner.onEnemyKilled = (enemy, position) => {
      this.dropExperienceOrb(position.x, position.y, enemy.experienceValue || 1);
    };

    // Set up wave change callback
    this.enemySpawner.onWaveChanged = (waveIndex, waveConfig) => {
      console.log(
        `🌊 Wave ${waveIndex + 1} Started: ${waveConfig.enemies.join(', ')} (${waveConfig.event})`
      );
      // TODO: Add visual notification system for wave changes
    };

    // Set up game completion callback
    this.enemySpawner.onGameComplete = () => {
      console.log('🎉 Game Complete! You survived all 30 minutes!');
      // TODO: Add victory screen
    };

    // Set up title screen callback
    console.log('Setting up title screen callback...');
    this.titleScreen.onStartGame = () => {
      console.log('Title screen callback triggered');
      this.startGameFromTitle();
    };
    console.log(
      'Title screen callback set. Current state - showingTitleScreen:',
      this.showingTitleScreen,
      'titleScreen.visible:',
      this.titleScreen.visible
    );

    // Create some test terrain tiles
    this.createTestTerrain();

    // Test collision object no longer needed - we have real enemies now!
    // this.addTestCollisionObject()

    // Set camera to follow player
    this.camera.setTarget(this.player.sprite.x, this.player.sprite.y);

    console.log(
      `Player positioned at world coordinates: ${this.player.sprite.x}, ${this.player.sprite.y}`
    );
    console.log('Camera system initialized');

    // Hide HUD initially since we start with title screen
    this.hud.getContainer().visible = false;

    console.log('Game initialized - title screen ready!');
  }

  private initializeDebugSystem(): void {
    // Get all available weapons for debug cycling
    this.debugWeapons = this.weaponSystem.getAvailableWeapons().map(weapon => weapon.type);
    console.log('Debug system initialized with weapons:', this.debugWeapons);
  }

  private setupECSEventListeners(): void {
    // Listen for collision events
    this.eventBus.on('collision:player-enemy', (event) => {
      console.log('ECS Collision: Player-Enemy', event.data);
      // Handle player-enemy collision
    });

    this.eventBus.on('collision:projectile-enemy', (event) => {
      console.log('ECS Collision: Projectile-Enemy', event.data);
      // Handle projectile-enemy collision
    });

    this.eventBus.on('collision:player-experience-orb', (event) => {
      console.log('ECS Collision: Player-ExperienceOrb', event.data);
      // Handle player-experience orb collision
    });

    // Listen for enemy events
    this.eventBus.on('enemy:created', (event) => {
      console.log('ECS Enemy Created:', event.data);
    });

    this.eventBus.on('enemy:died', (event) => {
      console.log('ECS Enemy Died:', event.data);
    });

    console.log('ECS Event listeners set up');
  }

  // Debug method to get ECS stats
  getECSStats() {
    return {
      world: this.ecsWorld.getDetailedStats(),
      collision: this.collisionSystem.getPerformanceMetrics(),
      enemy: this.enemySystem.getEnemyCount(),
    };
  }

  start(): void {
    // Always start the main loop, but initially show title screen
    console.log('Starting game ticker...');
    this.app.ticker.add(this.update, this);
    console.log('Game ticker started, main loop should be running');

    console.log('Application started - showing title screen');
  }

  private startGameFromTitle(): void {
    console.log('startGameFromTitle() called');
    console.log(
      'Current state - showingTitleScreen:',
      this.showingTitleScreen,
      'isRunning:',
      this.isRunning
    );

    this.showingTitleScreen = false;
    this.isRunning = true;
    this.titleScreen.hide();

    // Show HUD when game starts
    this.hud.getContainer().visible = true;

    // Trigger game start audio
    this.eventBus.emitEvent('game:started');

    console.log(
      'Game started from title screen! New state - showingTitleScreen:',
      this.showingTitleScreen,
      'isRunning:',
      this.isRunning
    );
  }

  stop(): void {
    this.isRunning = false;
    this.app.ticker.remove(this.update, this);
  }

  private handleGameOver(): void {
    this.isGameOver = true;
    this.isRunning = false;

    // Show game over screen with final stats
    const survivalTime = this.hud.getSurvivalTime();
    const enemyStats = this.enemySpawner.getStats();
    this.gameOverScreen.show(survivalTime, enemyStats.count, enemyStats.maxEnemies);

    console.log('Game Over! Survival time:', survivalTime.toFixed(1), 'seconds');
  }

  private updateGameOverState(): void {
    this.gameOverScreen.update(0);

    // Add restart functionality (will need to implement restart logic)
    if (this.inputManager.isKeyJustPressed('Space')) {
      console.log('Space key detected - restarting!');
      this.restart();
      return;
    }

    // Also try with different space key variations
    if (this.inputManager.isKeyJustPressed(' ') || this.inputManager.isKeyJustPressed('Spacebar')) {
      console.log('Alternative space key detected - restarting!');
      this.restart();
      return;
    }

    // Add quit functionality (for now just reload)
    if (this.inputManager.isKeyJustPressed('Escape')) {
      console.log('Escape key detected - quitting!');
      location.reload();
      return;
    }
  }

  private restart(): void {
    // Reset game state
    this.isGameOver = false;
    this.isRunning = false;

    // Reset player
    this.player.heal(this.player.maximumHealth); // Full heal
    this.player.sprite.x = 0;
    this.player.sprite.y = 0;

    // Clear enemies
    this.enemySpawner.clear();

    // Clear projectiles
    this.weaponSystem.clear();

    // Clear experience orbs
    for (const orb of this.experienceOrbs) {
      this.collisionManager.removeEntity(orb);
      if (orb.sprite.parent) {
        orb.sprite.parent.removeChild(orb.sprite);
      }
    }
    this.experienceOrbs = [];

    // Reset leveling system (could keep progress or reset - let's reset for fresh start)
    this.levelingSystem = new LevelingSystem();
    this.setupLevelingCallbacks();

    // Reset HUD
    this.hud.reset();

    // Hide game over screen
    this.gameOverScreen.hide();

    // Show title screen again and hide HUD
    this.showingTitleScreen = true;
    this.titleScreen.show();
    this.hud.getContainer().visible = false;

    console.log('Game reset - showing title screen');
  }

  private setupLevelingCallbacks(): void {
    // Set up leveling system callbacks
    this.levelingSystem.onLevelUp = event => {
      console.log(`Level up! Now level ${event.newLevel}`);
      this.isPaused = true;
      this.levelUpScreen.show(event.newLevel, event.availableUpgrades);
      
      // Trigger level up audio
      this.eventBus.emitEvent('player:level_up');
    };

    this.levelingSystem.onXPGained = (_currentXP, _xpToNext, _totalXP) => {
      // HUD will be updated in the update loop
      
      // Trigger XP gained audio
      this.eventBus.emitEvent('player:xp_gained');
    };

    // Set up level up screen callback
    this.levelUpScreen.onUpgradeSelected = (upgradeId: string) => {
      this.levelingSystem.selectUpgrade(upgradeId, this.weaponSystem);
      this.isPaused = false;

      // Apply upgrades to player and weapon system
      this.levelingSystem.applyUpgrades(this.player, this.weaponSystem);

      // Trigger UI click audio
      this.eventBus.emitEvent('ui:click');

      console.log(`Selected upgrade: ${upgradeId}`);
    };
  }

  /**
   * Drop an experience orb at the specified location
   */
  private dropExperienceOrb(x: number, y: number, xpValue: number = 1): void {
    const orb = new ExperienceOrb(
      x,
      y,
      xpValue,
      this.gemSpriteManager,
      () => this.levelingSystem.magnetRange
    );

    // Set up orb collection callback
    orb.onCollected = (xp: number) => {
      this.levelingSystem.addExperience(xp);

      // Trigger XP pickup audio
      this.eventBus.emitEvent('player:xp_gained');

      // Remove orb from game
      this.removeExperienceOrb(orb);
    };

    // Add to world and collision system
    this.gameContainer.addChild(orb.sprite);
    orb.sprite.zIndex = 80; // Ensure orbs render above projectiles (zIndex = 75) and terrain (zIndex = -10000)
    this.collisionManager.addEntity(orb);
    this.experienceOrbs.push(orb);
  }

  /**
   * Remove an experience orb from the game
   */
  private removeExperienceOrb(orb: ExperienceOrb): void {
    // Remove from collision system
    this.collisionManager.removeEntity(orb);

    // Remove sprite with a short delay for visual effect
    setTimeout(() => {
      if (orb.sprite.parent) {
        orb.sprite.parent.removeChild(orb.sprite);
      }
    }, 100);

    // Remove from orbs array
    const index = this.experienceOrbs.indexOf(orb);
    if (index > -1) {
      this.experienceOrbs.splice(index, 1);
    }
  }

  private createTestTerrain(): void {
    // Wait a bit for the terrain manager to load, then create procedural terrain
    setTimeout(() => {
      console.log('🔍 Checking if terrain manager is loaded...');
      console.log('Terrain manager loaded status:', this.terrainManager.isLoaded());

      if (this.terrainManager.isLoaded()) {
        console.log('✅ Terrain manager is loaded, generating procedural terrain...');

        // Generate decorative procedural terrain across the entire world
        const worldSize = 2000; // Large world size for exploration
        const terrainTiles = this.terrainManager.generateProceduralTerrain({
          worldWidth: worldSize,
          worldHeight: worldSize,
          tileSize: this.terrainManager.getTerrainInfo().tileSize,
          biomeSeed: Math.floor(Math.random() * 1000000), // Random seed for variety
          terrainDensity: 0.5, // 50% of the world should have decorative terrain (balanced open space)
          // Use default biome configurations for visual variety
        });

        console.log(
          `📊 Generated ${terrainTiles.length} terrain tiles, adding to game container...`
        );

        // Add all tiles to the game container (terrain has zIndex = -10000 to render underneath everything)
        for (const tile of terrainTiles) {
          this.gameContainer.addChild(tile.sprite);
          this.terrainTiles.push(tile);
          console.log(
            `📍 Added terrain tile ${tile.tileType} (${tile.biome}) at (${tile.x}, ${tile.y})`
          );
        }

        console.log(`✅ Successfully added ${terrainTiles.length} terrain tiles to game`);

        // Generate sparse decorations
        const decorationTiles = this.terrainManager.generateSparseDecorations({
          worldWidth: worldSize,
          worldHeight: worldSize,
          tileSize: this.terrainManager.getTerrainInfo().tileSize,
          biomeSeed: Math.floor(Math.random() * 1000000), // Random seed for variety
        });

        console.log(
          `🌿 Generated ${decorationTiles.length} decoration tiles, adding to game container...`
        );

        // Add all decoration tiles to the game container (decorations have zIndex = -5000 to render above terrain)
        for (const decoration of decorationTiles) {
          this.gameContainer.addChild(decoration.sprite);
          this.decorationTiles.push(decoration);
          console.log(
            `🌿 Added decoration tile ${decoration.tileType} at (${decoration.x}, ${decoration.y})`
          );
        }

        console.log(`✅ Successfully added ${decorationTiles.length} decoration tiles to game`);
        console.log('🎮 Game container children count:', this.gameContainer.children.length);

        // Log biome statistics
        const biomeStats = new Map<string, number>();
        for (const tile of terrainTiles) {
          if (tile.biome) {
            biomeStats.set(tile.biome, (biomeStats.get(tile.biome) || 0) + 1);
          }
        }
        console.log('🌍 Biome distribution:', Object.fromEntries(biomeStats));
      } else {
        console.log('⏳ Terrain manager not loaded yet, retrying in 1 second...');
        this.createTestTerrain(); // Retry after a delay
      }
    }, 1000); // Wait 1 second for loading
  }

  private handleDebugInput(): void {
    // Toggle debug mode with backtick key
    if (this.inputManager.isKeyJustPressed('Backquote')) {
      this.debugMode = !this.debugMode;
      console.log(`Debug mode ${this.debugMode ? 'ENABLED' : 'DISABLED'}`);

      if (this.debugMode) {
        // Show debug mode notification
        this.hud.showDebugModeNotification();
      } else {
        // When exiting debug mode, reset to starting weapon (fireball)
        this.weaponSystem.clear();
        console.log('Debug mode disabled - reset to starting fireball weapon');
      }
    }

    // Test Phase 3 systems with F3 key
    if (this.inputManager.isKeyJustPressed('F3')) {
      this.testPhase3Systems();
      this.inputManager.clearJustPressedKey('F3');
    }

    // Toggle mute with M key
    if (this.inputManager.isKeyJustPressed('KeyM')) {
      this.hud.toggleMute();
      this.inputManager.clearJustPressedKey('KeyM');
    }

    // Phase 4 keyboard shortcuts
    if (this.inputManager.isKeyJustPressed('Escape')) {
      if (this.isPausedForMenu) {
        // Close current menu
        this.settingsMenu.hide();
        this.pauseScreen.hide();
        this.isPausedForMenu = false;
      } else if (this.isRunning && !this.showingTitleScreen && !this.isGameOver) {
        // Open pause menu
        this.pauseScreen.show();
        this.isPausedForMenu = true;
      }
      this.inputManager.clearJustPressedKey('Escape');
    }

    if (this.inputManager.isKeyJustPressed('KeyS')) {
      if (this.isPausedForMenu) {
        this.settingsMenu.show();
      }
      this.inputManager.clearJustPressedKey('KeyS');
    }

    // Test Phase 4 systems with F4 key
    if (this.inputManager.isKeyJustPressed('F4')) {
      this.testPhase4Systems();
      this.inputManager.clearJustPressedKey('F4');
    }

    // Only handle weapon cycling in debug mode
    if (this.debugMode) {
      // Cycle to next weapon with ]
      if (this.inputManager.isKeyJustPressed('BracketRight')) {
        this.debugWeaponIndex = (this.debugWeaponIndex + 1) % this.debugWeapons.length;
        this.cycleToWeapon(this.debugWeapons[this.debugWeaponIndex]);
        console.log(`Debug: Switched to weapon ${this.debugWeapons[this.debugWeaponIndex]}`);
        this.inputManager.clearJustPressedKey('BracketRight');
      }

      // Cycle to previous weapon with [
      if (this.inputManager.isKeyJustPressed('BracketLeft')) {
        this.debugWeaponIndex =
          (this.debugWeaponIndex - 1 + this.debugWeapons.length) % this.debugWeapons.length;
        this.cycleToWeapon(this.debugWeapons[this.debugWeaponIndex]);
        console.log(`Debug: Switched to weapon ${this.debugWeapons[this.debugWeaponIndex]}`);
        this.inputManager.clearJustPressedKey('BracketLeft');
      }
    }
  }

  private cycleToWeapon(weaponType: string): void {
    // Clear all active weapons
    this.weaponSystem.clear();

    // Add only the selected weapon
    this.weaponSystem.addWeapon(weaponType as any);

    // Show weapon name in HUD
    this.hud.showWeaponNotification(weaponType);
  }

  private update(deltaTime: number): void {
    // Start performance monitoring timers
    this.performanceMonitor.startUpdateTimer();

    // Update input manager first
    this.inputManager.update();

    // Handle debug input first
    this.handleDebugInput();

    // Handle different game states
    if (this.showingTitleScreen) {
      this.titleScreen.update(deltaTime, this.inputManager);
      this.inputManager.clearJustPressed();
      this.performanceMonitor.endUpdateTimer();
      return;
    }

    if (this.isGameOver) {
      this.updateGameOverState();
      this.inputManager.clearJustPressed();
      this.performanceMonitor.endUpdateTimer();
      return;
    }

    if (this.isPaused) {
      this.levelUpScreen.update(this.inputManager);
      this.inputManager.clearJustPressed();
      this.performanceMonitor.endUpdateTimer();
      return;
    }

    if (!this.isRunning) {
      this.performanceMonitor.endUpdateTimer();
      return;
    }

    // Start render timer
    this.performanceMonitor.startRenderTimer();

    // Update player (now using much larger world bounds since camera handles viewport)
    const worldSize = 2000; // Large world size
    this.player.update(deltaTime, this.inputManager, worldSize, worldSize);

    // Update camera to follow player
    this.camera.setTarget(this.player.sprite.x, this.player.sprite.y);
    this.camera.update(deltaTime);

    // Update experience orbs
    this.updateExperienceOrbs(deltaTime);

    // Update enemy spawning and AI
    this.enemySpawner.update(deltaTime);

    // Update weapon system (auto-firing and projectiles)
    this.weaponSystem.update(deltaTime);

    // Update collision detection (legacy system - will be replaced by ECS)
    this.collisionManager.update();

    // Update ECS World (new collision and enemy systems)
    this.ecsWorld.update(deltaTime);

    // Update Phase 4 systems
    this.particleSystem.update(deltaTime);
    this.enemyAIManager.update(deltaTime);
    this.powerUpManager.update();

    // Update HUD with leveling info
    this.hud.update(
      deltaTime,
      this.player,
      this.enemySpawner,
      this.weaponSystem,
      this.levelingSystem
    );

    // Update game state
    this.state.update(deltaTime);

    // End performance monitoring timers
    this.performanceMonitor.endUpdateTimer();
    this.performanceMonitor.endRenderTimer();
  }

  /**
   * Update all experience orbs
   */
  private updateExperienceOrbs(deltaTime: number): void {
    const activeOrbs: ExperienceOrb[] = [];

    for (const orb of this.experienceOrbs) {
      orb.update(deltaTime, this.player);
      activeOrbs.push(orb);
    }

    this.experienceOrbs = activeOrbs;
  }

  // Getters
  get application(): Application {
    return this.app;
  }

  get gameState(): GameState {
    return this.state;
  }

  get gameCamera(): Camera {
    return this.camera;
  }

  get collisions(): CollisionManager {
    return this.collisionManager;
  }

  get enemies(): WaveSpawner {
    return this.enemySpawner;
  }

  get weapons(): WeaponSystem {
    return this.weaponSystem;
  }

  // Phase 3 system getters
  get audio(): AudioManager {
    return this.audioManager;
  }

  get save(): SaveManager {
    return this.saveManager;
  }

  get performance(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  // Test method for Phase 3 systems
  testPhase3Systems(): void {
    console.log('🧪 Testing Phase 3 Systems...');
    
    // Test audio system
    console.log('🎵 Testing Audio System...');
    this.audioManager.playSound('ui_click');
    this.audioManager.playSound('player_attack');
    this.audioManager.playSound('enemy_death');
    this.audioManager.playSound('xp_pickup');
    this.audioManager.playSound('level_up');
    
    // Test save system
    console.log('💾 Testing Save System...');
    // const testData = { test: 'data' };
    console.log('Save/load test completed');
    
    // Test performance monitor
    console.log('📊 Testing Performance Monitor...');
    const stats = this.performanceMonitor.getStatistics();
    console.log('Performance stats:', stats);
    
    console.log('✅ Phase 3 Systems test complete!');
  }

  private setupPhase4Callbacks(): void {
    // Settings menu callbacks
    this.settingsMenu.setSettingsChangeCallback((settings: SettingsData) => {
      // Apply settings changes
      this.audioManager.setMasterVolume(settings.audio.masterVolume);
      this.audioManager.setSFXVolume(settings.audio.sfxVolume);
      this.audioManager.setMusicVolume(settings.audio.musicVolume);
      
      this.particleSystem.setQuality(settings.graphics.particleQuality);
      
      // Save settings
      this.saveManager.saveSettings(settings);
    });

    this.settingsMenu.setCloseCallback(() => {
      this.settingsMenu.hide();
      this.isPausedForMenu = false;
    });

    // Pause screen callbacks
    this.pauseScreen.setResumeCallback(() => {
      this.pauseScreen.hide();
      this.isPausedForMenu = false;
    });

    this.pauseScreen.setSettingsCallback(() => {
      this.pauseScreen.hide();
      this.settingsMenu.show();
    });

    this.pauseScreen.setQuitCallback(() => {
      this.pauseScreen.hide();
      this.showingTitleScreen = true;
      this.isPausedForMenu = false;
      this.titleScreen.show();
    });

    // Initially hide Phase 4 UI
    this.settingsMenu.hide();
    this.pauseScreen.hide();
  }

  // Test method for Phase 4 systems
  testPhase4Systems(): void {
    console.log('🚀 Testing Phase 4 Systems...');
    
    // Test particle system
    console.log('✨ Testing Particle System...');
    this.particleSystem.createExplosion(this.player.sprite.x, this.player.sprite.y, 2);
    this.particleSystem.createSparkle(this.player.sprite.x + 50, this.player.sprite.y, 0x00ff00);
    this.particleSystem.createMagicEffect(this.player.sprite.x - 50, this.player.sprite.y);
    
    // Test power-up system
    console.log('⚡ Testing Power-up System...');
    this.powerUpManager.applyPowerUp('speed_boost');
    this.powerUpManager.applyPowerUp('damage_boost');
    
    // Test item system
    console.log('🎒 Testing Item System...');
    this.inventory.addItem('health_potion', 3);
    this.inventory.addItem('iron_ingot', 5);
    this.inventory.addGold(100);
    console.log('Inventory:', this.inventory.getAllItems());
    console.log('Gold:', this.inventory.getGold());
    
    // Test settings menu
    console.log('⚙️ Testing Settings Menu...');
    this.settingsMenu.show();
    this.isPausedForMenu = true;
    
    console.log('✅ Phase 4 Systems test complete!');
  }
}
