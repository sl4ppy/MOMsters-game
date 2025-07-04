import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class GameOverScreen {
  private container: Container;
  private background!: Graphics;
  private titleText!: Text;
  private statsText!: Text;
  private instructionText!: Text;
  private isVisible: boolean = false;

  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.createGameOverScreen();
    this.hide();
  }

  private createGameOverScreen(): void {
    // Semi-transparent background
    this.background = new Graphics();
    this.background.beginFill(0x000000, 0.8);
    this.background.drawRect(0, 0, this.screenWidth, this.screenHeight);
    this.background.endFill();
    this.container.addChild(this.background);

    // Game Over title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xff0000,
      fontWeight: 'bold',
      align: 'center',
    });

    this.titleText = new Text('GAME OVER', titleStyle);
    this.titleText.anchor.set(0.5);
    this.titleText.x = this.screenWidth / 2;
    this.titleText.y = this.screenHeight / 2 - 100;
    this.container.addChild(this.titleText);

    // Stats text (will be updated when game ends)
    const statsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xffffff,
      align: 'center',
    });

    this.statsText = new Text('', statsStyle);
    this.statsText.anchor.set(0.5);
    this.statsText.x = this.screenWidth / 2;
    this.statsText.y = this.screenHeight / 2 - 20;
    this.container.addChild(this.statsText);

    // Restart instructions
    const instructionStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffff00,
      align: 'center',
    });

    this.instructionText = new Text('Press SPACE to restart or ESC to quit', instructionStyle);
    this.instructionText.anchor.set(0.5);
    this.instructionText.x = this.screenWidth / 2;
    this.instructionText.y = this.screenHeight / 2 + 60;
    this.container.addChild(this.instructionText);

    // Make sure game over screen is always on top
    this.container.zIndex = 2000;
  }

  /**
   * Show the game over screen with final stats
   */
  show(survivalTime: number, enemiesKilled: number, maxEnemies: number): void {
    this.isVisible = true;
    this.container.visible = true;

    // Format survival time
    const minutes = Math.floor(survivalTime / 60);
    const seconds = Math.floor(survivalTime % 60);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update stats text
    this.statsText.text =
      `You survived for ${timeString}\n` +
      `Enemies faced: ${maxEnemies}\n` +
      `Peak enemy count: ${enemiesKilled}`;

    // Add flashing effect to title
    this.startTitleFlash();
  }

  /**
   * Hide the game over screen
   */
  hide(): void {
    this.isVisible = false;
    this.container.visible = false;
  }

  /**
   * Update game over screen (for animations)
   */
  update(_deltaTime: number): void {
    if (!this.isVisible) return;

    // Pulsing title effect
    const pulse = Math.sin(Date.now() / 300) * 0.2 + 0.8;
    this.titleText.alpha = pulse;

    // Pulsing instruction text
    const instructionPulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
    this.instructionText.alpha = instructionPulse;
  }

  private startTitleFlash(): void {
    // Reset title opacity for flashing effect
    this.titleText.alpha = 1.0;
  }

  /**
   * Get container for adding to stage
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Check if game over screen is visible
   */
  get visible(): boolean {
    return this.isVisible;
  }
}
