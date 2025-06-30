import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { InputManager } from '../core/InputManager'

export class TitleScreen {
  public container: Container
  private background!: Graphics
  private titleText!: Text
  private subtitleText!: Text
  private gameplayText!: Text
  private controlsTitle!: Text
  private controlsText!: Text
  private startText!: Text
  private versionText!: Text
  
  // Callbacks
  public onStartGame?: () => void
  
  private isVisible: boolean = true
  private animationTime: number = 0

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container()
    this.container.visible = true
    
    this.createBackground(screenWidth, screenHeight)
    this.createTitle()
    this.createGameplayDescription()
    this.createControls()
    this.createStartInstructions()
    this.createVersionInfo()
    
    // Center everything
    this.container.x = screenWidth / 2
    this.container.y = screenHeight / 2
  }

  private createBackground(screenWidth: number, screenHeight: number): void {
    this.background = new Graphics()
    
    // Dark gradient background
    this.background.beginFill(0x0a0a1a, 1.0)
    this.background.drawRect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight)
    this.background.endFill()
    
    // Add some decorative elements
    this.background.beginFill(0x1a1a2e, 0.3)
    this.background.drawCircle(-200, -150, 100)
    this.background.drawCircle(250, 100, 80)
    this.background.drawCircle(-100, 200, 60)
    this.background.endFill()
    
    this.container.addChild(this.background)
  }

  private createTitle(): void {
    // Main title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      fill: ['#ff6b6b', '#4ecdc4'], // Gradient from red to cyan
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 4,
      dropShadowBlur: 2
    })
    
    this.titleText = new Text('SURVIVAL ARENA', titleStyle)
    this.titleText.anchor.set(0.5)
    this.titleText.x = 0
    this.titleText.y = -180
    
    // Subtitle
    const subtitleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fontStyle: 'italic',
      fill: 0xaaaaaa,
      align: 'center'
    })
    
    this.subtitleText = new Text('A Vampire Survivors-style Action Game', subtitleStyle)
    this.subtitleText.anchor.set(0.5)
    this.subtitleText.x = 0
    this.subtitleText.y = -140
    
    this.container.addChild(this.titleText)
    this.container.addChild(this.subtitleText)
  }

  private createGameplayDescription(): void {
    const gameplayStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
      align: 'center',
      lineHeight: 24
    })
    
    const gameplayDesc = `Survive waves of enemies in an endless arena!
Your weapons fire automatically - focus on positioning and upgrades.
Collect XP orbs to level up and choose powerful upgrades.
How long can you survive?`
    
    this.gameplayText = new Text(gameplayDesc, gameplayStyle)
    this.gameplayText.anchor.set(0.5)
    this.gameplayText.x = 0
    this.gameplayText.y = -60
    
    this.container.addChild(this.gameplayText)
  }

  private createControls(): void {
    // Controls title
    const controlsTitleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffd700,
      align: 'center'
    })
    
    this.controlsTitle = new Text('CONTROLS', controlsTitleStyle)
    this.controlsTitle.anchor.set(0.5)
    this.controlsTitle.x = 0
    this.controlsTitle.y = 20
    
    // Controls text
    const controlsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xcccccc,
      align: 'center',
      lineHeight: 20
    })
    
    const controlsDesc = `🎮 WASD / Arrow Keys - Move
🔫 Weapons fire automatically at nearest enemies
💎 Walk over XP orbs to collect them
⬆️ Level up to choose upgrades (Press 1, 2, or 3)
⏸️ ESC - Pause/Menu | SPACE - Restart (when dead)`
    
    this.controlsText = new Text(controlsDesc, controlsStyle)
    this.controlsText.anchor.set(0.5)
    this.controlsText.x = 0
    this.controlsText.y = 80
    
    this.container.addChild(this.controlsTitle)
    this.container.addChild(this.controlsText)
  }

  private createStartInstructions(): void {
    const startStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0x00ff00,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x008800,
      dropShadowDistance: 2
    })
    
    this.startText = new Text('Press SPACE to Start!', startStyle)
    this.startText.anchor.set(0.5)
    this.startText.x = 0
    this.startText.y = 160
    
    this.container.addChild(this.startText)
  }

  private createVersionInfo(): void {
    const versionStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x666666,
      align: 'center'
    })
    
    this.versionText = new Text('Built with PixiJS & TypeScript | v1.0.0', versionStyle)
    this.versionText.anchor.set(0.5)
    this.versionText.x = 0
    this.versionText.y = 200
    
    this.container.addChild(this.versionText)
  }

  /**
   * Update title screen animations and handle input
   */
  update(deltaTime: number, inputManager: InputManager): void {
    if (!this.isVisible) {
      console.log('ERROR: TitleScreen update called but screen is not visible!')
      return
    }
    
    this.updateAnimations(deltaTime)
    this.handleInput(inputManager)
  }

  private updateAnimations(deltaTime: number): void {
    this.animationTime += deltaTime / 60 // Convert to seconds
    
    // Pulsing effect for start text
    const pulse = Math.sin(this.animationTime * 3) * 0.2 + 0.8
    this.startText.alpha = pulse
    this.startText.scale.set(pulse)
    
    // Gentle floating effect for title
    const titleFloat = Math.sin(this.animationTime * 1.5) * 3
    this.titleText.y = -180 + titleFloat
    
    // Subtle rotation for title
    this.titleText.rotation = Math.sin(this.animationTime * 0.5) * 0.05
    
    // Color cycling for title (optional, subtle effect)
    const colorShift = Math.sin(this.animationTime * 2) * 0.3 + 0.7
    this.titleText.alpha = colorShift
  }

  private handleInput(inputManager: InputManager): void {
    // Debug: Check what keys are being pressed
    const spacePressed = inputManager.isKeyJustPressed('Space')
    const enterPressed = inputManager.isKeyJustPressed('Enter')
    
    // Try alternative key codes as backup
    const spaceAlt = inputManager.isKeyJustPressed(' ')
    const enterAlt = inputManager.isKeyJustPressed('NumpadEnter')
    
    if (spacePressed || enterPressed || spaceAlt || enterAlt) {
      console.log('Title screen detected key press - Space:', spacePressed, 'Enter:', enterPressed, 'SpaceAlt:', spaceAlt, 'EnterAlt:', enterAlt)
      this.startGame()
    }
  }

  private startGame(): void {
    console.log('TitleScreen startGame() called')
    if (this.onStartGame) {
      console.log('Calling onStartGame callback')
      this.onStartGame()
    } else {
      console.log('ERROR: onStartGame callback is not set!')
    }
    this.hide()
  }

  /**
   * Show the title screen
   */
  show(): void {
    this.isVisible = true
    this.container.visible = true
    this.animationTime = 0
  }

  /**
   * Hide the title screen
   */
  hide(): void {
    this.isVisible = false
    this.container.visible = false
  }

  /**
   * Check if title screen is currently visible
   */
  get visible(): boolean {
    return this.isVisible
  }
} 