import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Upgrade } from '../systems/LevelingSystem'
import { InputManager } from '../core/InputManager'

export class LevelUpScreen {
  public container: Container
  private background!: Graphics
  private titleText!: Text
  private instructionText!: Text
  private upgradeButtons: UpgradeButton[] = []
  private selectedIndex: number = 0
  
  // Callbacks
  public onUpgradeSelected?: (upgradeId: string) => void
  
  private isVisible: boolean = false

  constructor() {
    this.container = new Container()
    this.container.visible = false
    
    this.createBackground()
    this.createTitle()
    this.createInstructions()
  }

  private createBackground(): void {
    this.background = new Graphics()
    
    // Semi-transparent dark background
    this.background.beginFill(0x000000, 0.8)
    this.background.drawRect(-512, -384, 1024, 768) // Cover full screen
    this.background.endFill()
    
    // Main panel background
    this.background.beginFill(0x1a1a2e, 0.95)
    this.background.lineStyle(3, 0x16213e, 1)
    this.background.drawRoundedRect(-300, -200, 600, 400, 10)
    this.background.endFill()
    
    this.container.addChild(this.background)
  }

  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontWeight: 'bold',
      fill: 0xffd700, // Gold color
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 2
    })
    
    this.titleText = new Text('LEVEL UP!', titleStyle)
    this.titleText.anchor.set(0.5)
    this.titleText.x = 0
    this.titleText.y = -160
    
    this.container.addChild(this.titleText)
  }

  private createInstructions(): void {
    const instructionStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xcccccc,
      align: 'center'
    })
    
    this.instructionText = new Text('Use 1, 2, 3 keys to select an upgrade', instructionStyle)
    this.instructionText.anchor.set(0.5)
    this.instructionText.x = 0
    this.instructionText.y = 160
    
    this.container.addChild(this.instructionText)
  }

  /**
   * Show the level up screen with available upgrades
   */
  show(level: number, upgrades: Upgrade[]): void {
    this.isVisible = true
    this.container.visible = true
    
    // Update title with new level
    this.titleText.text = `LEVEL ${level}!`
    
    // Clear previous upgrade buttons
    this.clearUpgradeButtons()
    
    // Create new upgrade buttons
    this.createUpgradeButtons(upgrades)
    
    // Reset selection
    this.selectedIndex = 0
    this.updateButtonStates()
  }

  /**
   * Hide the level up screen
   */
  hide(): void {
    this.isVisible = false
    this.container.visible = false
    this.clearUpgradeButtons()
  }

  private clearUpgradeButtons(): void {
    for (const button of this.upgradeButtons) {
      this.container.removeChild(button.container)
    }
    this.upgradeButtons = []
  }

  private createUpgradeButtons(upgrades: Upgrade[]): void {
    const startY = -80
    const buttonSpacing = 80
    
    for (let i = 0; i < upgrades.length && i < 3; i++) {
      const upgrade = upgrades[i]
      const button = new UpgradeButton(upgrade, i + 1)
      
      button.container.x = 0
      button.container.y = startY + (i * buttonSpacing)
      
      this.upgradeButtons.push(button)
      this.container.addChild(button.container)
    }
  }

  private updateButtonStates(): void {
    for (let i = 0; i < this.upgradeButtons.length; i++) {
      this.upgradeButtons[i].setSelected(i === this.selectedIndex)
    }
  }

  /**
   * Handle input for upgrade selection
   */
  update(inputManager: InputManager): void {
    if (!this.isVisible) return
    
    // Handle number key selection (1, 2, 3)
    if (inputManager.isKeyJustPressed('Digit1') && this.upgradeButtons[0]) {
      this.selectUpgrade(0)
    } else if (inputManager.isKeyJustPressed('Digit2') && this.upgradeButtons[1]) {
      this.selectUpgrade(1)
    } else if (inputManager.isKeyJustPressed('Digit3') && this.upgradeButtons[2]) {
      this.selectUpgrade(2)
    }
  }

  private selectUpgrade(index: number): void {
    if (index >= 0 && index < this.upgradeButtons.length) {
      const selectedUpgrade = this.upgradeButtons[index].upgrade
      if (this.onUpgradeSelected) {
        this.onUpgradeSelected(selectedUpgrade.id)
      }
      this.hide()
    }
  }

  /**
   * Check if the level up screen is currently visible
   */
  get visible(): boolean {
    return this.isVisible
  }
}

class UpgradeButton {
  public container: Container
  public upgrade: Upgrade
  private background!: Graphics
  private iconText!: Text
  private nameText!: Text
  private descriptionText!: Text
  private levelText!: Text
  private keyHintText!: Text
  private isSelected: boolean = false

  constructor(upgrade: Upgrade, keyNumber: number) {
    this.upgrade = upgrade
    this.container = new Container()
    
    this.createBackground()
    this.createIcon()
    this.createTexts(keyNumber)
  }

  private createBackground(): void {
    this.background = new Graphics()
    this.updateBackground()
    this.container.addChild(this.background)
  }

  private updateBackground(): void {
    this.background.clear()
    
    const bgColor = this.isSelected ? 0x4a4a6a : 0x2a2a3a
    const borderColor = this.isSelected ? 0x6a6a8a : 0x4a4a5a
    
    this.background.beginFill(bgColor, 0.9)
    this.background.lineStyle(2, borderColor, 1)
    this.background.drawRoundedRect(-280, -25, 560, 50, 5)
    this.background.endFill()
  }

  private createIcon(): void {
    const iconStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xffffff
    })
    
    this.iconText = new Text(this.upgrade.icon, iconStyle)
    this.iconText.anchor.set(0.5)
    this.iconText.x = -240
    this.iconText.y = 0
    
    this.container.addChild(this.iconText)
  }

  private createTexts(keyNumber: number): void {
    // Upgrade name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffffff
    })
    
    this.nameText = new Text(this.upgrade.name, nameStyle)
    this.nameText.anchor.set(0, 0.5)
    this.nameText.x = -200
    this.nameText.y = -8
    
    // Upgrade description
    const descStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xcccccc
    })
    
    this.descriptionText = new Text(this.upgrade.description, descStyle)
    this.descriptionText.anchor.set(0, 0.5)
    this.descriptionText.x = -200
    this.descriptionText.y = 8
    
    // Current level
    const levelStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xaaaaaa
    })
    
    this.levelText = new Text(`Level ${this.upgrade.currentLevel}/${this.upgrade.maxLevel}`, levelStyle)
    this.levelText.anchor.set(1, 0.5)
    this.levelText.x = 200
    this.levelText.y = -8
    
    // Key hint
    const keyStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffd700
    })
    
    this.keyHintText = new Text(`[${keyNumber}]`, keyStyle)
    this.keyHintText.anchor.set(1, 0.5)
    this.keyHintText.x = 200
    this.keyHintText.y = 8
    
    this.container.addChild(this.nameText)
    this.container.addChild(this.descriptionText)
    this.container.addChild(this.levelText)
    this.container.addChild(this.keyHintText)
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected
    this.updateBackground()
    
    // Update text colors when selected
    const primaryColor = selected ? 0xffd700 : 0xffffff
    const secondaryColor = selected ? 0xffffaa : 0xcccccc
    
    this.nameText.style.fill = primaryColor
    this.iconText.style.fill = primaryColor
    this.descriptionText.style.fill = secondaryColor
  }
} 