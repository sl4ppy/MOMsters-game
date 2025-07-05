import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class PauseScreen {
  private container: Container;
  private background: Graphics;
  private title: Text;
  private buttons: Graphics[] = [];
  private buttonTexts: Text[] = [];
  private onResume?: () => void;
  private onSettings?: () => void;
  private onQuit?: () => void;

  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    
    this.createPauseScreen();
  }

  private createPauseScreen(): void {
    // Semi-transparent background
    this.background = new Graphics();
    this.background.beginFill(0x000000, 0.7);
    this.background.drawRect(0, 0, this.screenWidth, this.screenHeight);
    this.background.endFill();
    this.container.addChild(this.background);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    this.title = new Text('PAUSED', titleStyle);
    this.title.x = this.screenWidth / 2 - this.title.width / 2;
    this.title.y = this.screenHeight / 2 - 150;
    this.container.addChild(this.title);

    // Create buttons
    this.createButton('Resume', this.screenHeight / 2 - 50, () => this.onResume?.());
    this.createButton('Settings', this.screenHeight / 2 + 20, () => this.onSettings?.());
    this.createButton('Quit to Menu', this.screenHeight / 2 + 90, () => this.onQuit?.());

    // Initially hidden
    this.container.visible = false;
  }

  private createButton(text: string, y: number, onClick: () => void): void {
    const button = new Graphics();
    button.beginFill(0x333333, 0.8);
    button.drawRoundedRect(0, 0, 200, 50, 10);
    button.endFill();
    button.lineStyle(2, 0x666666);
    button.drawRoundedRect(0, 0, 200, 50, 10);
    button.x = this.screenWidth / 2 - 100;
    button.y = y;
    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerdown', onClick);
    button.on('pointerover', () => {
      button.clear();
      button.beginFill(0x555555, 0.8);
      button.drawRoundedRect(0, 0, 200, 50, 10);
      button.endFill();
      button.lineStyle(2, 0x888888);
      button.drawRoundedRect(0, 0, 200, 50, 10);
    });
    button.on('pointerout', () => {
      button.clear();
      button.beginFill(0x333333, 0.8);
      button.drawRoundedRect(0, 0, 200, 50, 10);
      button.endFill();
      button.lineStyle(2, 0x666666);
      button.drawRoundedRect(0, 0, 200, 50, 10);
    });

    this.container.addChild(button);
    this.buttons.push(button);

    const buttonText = new Text(text, {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    buttonText.x = this.screenWidth / 2 - buttonText.width / 2;
    buttonText.y = y + 25 - buttonText.height / 2;
    this.container.addChild(buttonText);
    this.buttonTexts.push(buttonText);
  }

  setResumeCallback(callback: () => void): void {
    this.onResume = callback;
  }

  setSettingsCallback(callback: () => void): void {
    this.onSettings = callback;
  }

  setQuitCallback(callback: () => void): void {
    this.onQuit = callback;
  }

  show(): void {
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  getContainer(): Container {
    return this.container;
  }
} 