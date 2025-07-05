import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface SettingsData {
  audio: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    muted: boolean;
  };
  graphics: {
    particleQuality: 'low' | 'medium' | 'high';
    screenShake: boolean;
    showFPS: boolean;
    vsync: boolean;
  };
  controls: {
    mouseSensitivity: number;
    keyboardLayout: 'qwerty' | 'azerty' | 'custom';
    invertY: boolean;
  };
  gameplay: {
    autoSave: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
    tutorialEnabled: boolean;
  };
}

export class SettingsMenu {
  private container: Container;
  private background: Graphics;
  private title: Text;
  private tabs: Text[] = [];
  private currentTab: string = 'audio';
  private settingsData: SettingsData;
  private onSettingsChange?: (settings: SettingsData) => void;
  private onClose?: () => void;

  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number, initialSettings: SettingsData) {
    this.container = new Container();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.settingsData = { ...initialSettings };
    
    this.createMenu();
  }

  private createMenu(): void {
    // Background overlay
    this.background = new Graphics();
    this.background.beginFill(0x000000, 0.8);
    this.background.drawRect(0, 0, this.screenWidth, this.screenHeight);
    this.background.endFill();
    this.container.addChild(this.background);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    this.title = new Text('Settings', titleStyle);
    this.title.x = this.screenWidth / 2 - this.title.width / 2;
    this.title.y = 50;
    this.container.addChild(this.title);

    // Create tabs
    this.createTabs();

    // Create content areas
    this.createAudioTab();
    this.createGraphicsTab();
    this.createControlsTab();
    this.createGameplayTab();

    // Create buttons
    this.createButtons();

    // Initially hide all tabs except audio
    this.showTab('audio');
  }

  private createTabs(): void {
    const tabNames = ['Audio', 'Graphics', 'Controls', 'Gameplay'];
    const tabStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xcccccc,
      fontWeight: 'bold',
    });

    tabNames.forEach((name, index) => {
      const tab = new Text(name, tabStyle);
      tab.x = 100 + index * 150;
      tab.y = 120;
      tab.eventMode = 'static';
      tab.cursor = 'pointer';
      
      tab.on('pointerdown', () => {
        this.showTab(name.toLowerCase());
      });
      
      tab.on('pointerover', () => {
        tab.tint = 0xffffff;
      });
      
      tab.on('pointerout', () => {
        if (this.currentTab !== name.toLowerCase()) {
          tab.tint = 0xcccccc;
        }
      });

      this.tabs.push(tab);
      this.container.addChild(tab);
    });
  }

  private createAudioTab(): void {
    const audioContainer = new Container();
    audioContainer.name = 'audio-tab';
    audioContainer.x = 100;
    audioContainer.y = 160;

    const labelStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
    });

    // Master Volume
    const masterLabel = new Text('Master Volume', labelStyle);
    masterLabel.y = 0;
    audioContainer.addChild(masterLabel);

    const masterSlider = this.createSlider(200, 30, this.settingsData.audio.masterVolume, (value) => {
      this.settingsData.audio.masterVolume = value;
      this.onSettingsChange?.(this.settingsData);
    });
    masterSlider.y = 25;
    audioContainer.addChild(masterSlider);

    // SFX Volume
    const sfxLabel = new Text('SFX Volume', labelStyle);
    sfxLabel.y = 70;
    audioContainer.addChild(sfxLabel);

    const sfxSlider = this.createSlider(200, 30, this.settingsData.audio.sfxVolume, (value) => {
      this.settingsData.audio.sfxVolume = value;
      this.onSettingsChange?.(this.settingsData);
    });
    sfxSlider.y = 95;
    audioContainer.addChild(sfxSlider);

    // Music Volume
    const musicLabel = new Text('Music Volume', labelStyle);
    musicLabel.y = 140;
    audioContainer.addChild(musicLabel);

    const musicSlider = this.createSlider(200, 30, this.settingsData.audio.musicVolume, (value) => {
      this.settingsData.audio.musicVolume = value;
      this.onSettingsChange?.(this.settingsData);
    });
    musicSlider.y = 165;
    audioContainer.addChild(musicSlider);

    // Mute Toggle
    const muteToggle = this.createToggle('Mute Audio', this.settingsData.audio.muted, (value) => {
      this.settingsData.audio.muted = value;
      this.onSettingsChange?.(this.settingsData);
    });
    muteToggle.y = 220;
    audioContainer.addChild(muteToggle);

    this.container.addChild(audioContainer);
  }

  private createGraphicsTab(): void {
    const graphicsContainer = new Container();
    graphicsContainer.name = 'graphics-tab';
    graphicsContainer.x = 100;
    graphicsContainer.y = 160;
    graphicsContainer.visible = false;

    const labelStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
    });

    // Particle Quality
    const particleLabel = new Text('Particle Quality', labelStyle);
    particleLabel.y = 0;
    graphicsContainer.addChild(particleLabel);

    const particleDropdown = this.createDropdown(
      ['Low', 'Medium', 'High'],
      this.settingsData.graphics.particleQuality,
      (value) => {
        this.settingsData.graphics.particleQuality = value as 'low' | 'medium' | 'high';
        this.onSettingsChange?.(this.settingsData);
      }
    );
    particleDropdown.y = 25;
    graphicsContainer.addChild(particleDropdown);

    // Screen Shake
    const shakeToggle = this.createToggle('Screen Shake', this.settingsData.graphics.screenShake, (value) => {
      this.settingsData.graphics.screenShake = value;
      this.onSettingsChange?.(this.settingsData);
    });
    shakeToggle.y = 70;
    graphicsContainer.addChild(shakeToggle);

    // Show FPS
    const fpsToggle = this.createToggle('Show FPS', this.settingsData.graphics.showFPS, (value) => {
      this.settingsData.graphics.showFPS = value;
      this.onSettingsChange?.(this.settingsData);
    });
    fpsToggle.y = 120;
    graphicsContainer.addChild(fpsToggle);

    // V-Sync
    const vsyncToggle = this.createToggle('V-Sync', this.settingsData.graphics.vsync, (value) => {
      this.settingsData.graphics.vsync = value;
      this.onSettingsChange?.(this.settingsData);
    });
    vsyncToggle.y = 170;
    graphicsContainer.addChild(vsyncToggle);

    this.container.addChild(graphicsContainer);
  }

  private createControlsTab(): void {
    const controlsContainer = new Container();
    controlsContainer.name = 'controls-tab';
    controlsContainer.x = 100;
    controlsContainer.y = 160;
    controlsContainer.visible = false;

    const labelStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
    });

    // Mouse Sensitivity
    const sensitivityLabel = new Text('Mouse Sensitivity', labelStyle);
    sensitivityLabel.y = 0;
    controlsContainer.addChild(sensitivityLabel);

    const sensitivitySlider = this.createSlider(200, 30, this.settingsData.controls.mouseSensitivity, (value) => {
      this.settingsData.controls.mouseSensitivity = value;
      this.onSettingsChange?.(this.settingsData);
    });
    sensitivitySlider.y = 25;
    controlsContainer.addChild(sensitivitySlider);

    // Keyboard Layout
    const layoutLabel = new Text('Keyboard Layout', labelStyle);
    layoutLabel.y = 70;
    controlsContainer.addChild(layoutLabel);

    const layoutDropdown = this.createDropdown(
      ['QWERTY', 'AZERTY', 'Custom'],
      this.settingsData.controls.keyboardLayout,
      (value) => {
        this.settingsData.controls.keyboardLayout = value as 'qwerty' | 'azerty' | 'custom';
        this.onSettingsChange?.(this.settingsData);
      }
    );
    layoutDropdown.y = 95;
    controlsContainer.addChild(layoutDropdown);

    // Invert Y
    const invertToggle = this.createToggle('Invert Y-Axis', this.settingsData.controls.invertY, (value) => {
      this.settingsData.controls.invertY = value;
      this.onSettingsChange?.(this.settingsData);
    });
    invertToggle.y = 140;
    controlsContainer.addChild(invertToggle);

    this.container.addChild(controlsContainer);
  }

  private createGameplayTab(): void {
    const gameplayContainer = new Container();
    gameplayContainer.name = 'gameplay-tab';
    gameplayContainer.x = 100;
    gameplayContainer.y = 160;
    gameplayContainer.visible = false;

    const labelStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
    });

    // Auto Save
    const autoSaveToggle = this.createToggle('Auto Save', this.settingsData.gameplay.autoSave, (value) => {
      this.settingsData.gameplay.autoSave = value;
      this.onSettingsChange?.(this.settingsData);
    });
    autoSaveToggle.y = 0;
    gameplayContainer.addChild(autoSaveToggle);

    // Difficulty
    const difficultyLabel = new Text('Difficulty', labelStyle);
    difficultyLabel.y = 50;
    gameplayContainer.addChild(difficultyLabel);

    const difficultyDropdown = this.createDropdown(
      ['Easy', 'Normal', 'Hard'],
      this.settingsData.gameplay.difficulty,
      (value) => {
        this.settingsData.gameplay.difficulty = value as 'easy' | 'normal' | 'hard';
        this.onSettingsChange?.(this.settingsData);
      }
    );
    difficultyDropdown.y = 75;
    gameplayContainer.addChild(difficultyDropdown);

    // Tutorial
    const tutorialToggle = this.createToggle('Tutorial Enabled', this.settingsData.gameplay.tutorialEnabled, (value) => {
      this.settingsData.gameplay.tutorialEnabled = value;
      this.onSettingsChange?.(this.settingsData);
    });
    tutorialToggle.y = 120;
    gameplayContainer.addChild(tutorialToggle);

    this.container.addChild(gameplayContainer);
  }

  private createSlider(width: number, height: number, initialValue: number, onChange: (value: number) => void): Container {
    const container = new Container();
    
    // Background
    const background = new Graphics();
    background.beginFill(0x333333);
    background.drawRoundedRect(0, 0, width, height, 5);
    background.endFill();
    container.addChild(background);

    // Fill
    const fill = new Graphics();
    fill.beginFill(0x007acc);
    fill.drawRoundedRect(0, 0, width * initialValue, height, 5);
    fill.endFill();
    container.addChild(fill);

    // Handle
    const handle = new Graphics();
    handle.beginFill(0xffffff);
    handle.drawCircle(0, height / 2, 8);
    handle.endFill();
    handle.x = width * initialValue;
    container.addChild(handle);

    // Value text
    const valueText = new Text(`${Math.round(initialValue * 100)}%`, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
    });
    valueText.x = width + 10;
    valueText.y = height / 2 - valueText.height / 2;
    container.addChild(valueText);

    // Make interactive
    background.eventMode = 'static';
    background.cursor = 'pointer';
    
    const onDrag = (event: any): void => {
      const localX = event.data.getLocalPosition(container).x;
      const newValue = Math.max(0, Math.min(1, localX / width));
      
      fill.clear();
      fill.beginFill(0x007acc);
      fill.drawRoundedRect(0, 0, width * newValue, height, 5);
      fill.endFill();
      
      handle.x = width * newValue;
      valueText.text = `${Math.round(newValue * 100)}%`;
      
      onChange(newValue);
    };

    background.on('pointerdown', onDrag);
    background.on('pointermove', (event) => {
      if (event.buttons === 1) {
        onDrag(event);
      }
    });

    return container;
  }

  private createToggle(label: string, initialValue: boolean, onChange: (value: boolean) => void): Container {
    const container = new Container();
    
    const labelText = new Text(label, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
    });
    container.addChild(labelText);

    const toggle = new Graphics();
    toggle.beginFill(initialValue ? 0x00ff00 : 0x666666);
    toggle.drawRoundedRect(0, 0, 40, 20, 10);
    toggle.endFill();
    toggle.x = labelText.width + 20;
    toggle.y = labelText.height / 2 - 10;
    container.addChild(toggle);

    const handle = new Graphics();
    handle.beginFill(0xffffff);
    handle.drawCircle(0, 0, 8);
    handle.endFill();
    handle.x = initialValue ? 30 : 10;
    handle.y = toggle.y + 10;
    container.addChild(handle);

    toggle.eventMode = 'static';
    toggle.cursor = 'pointer';
    toggle.on('pointerdown', () => {
      const newValue = !initialValue;
      toggle.clear();
      toggle.beginFill(newValue ? 0x00ff00 : 0x666666);
      toggle.drawRoundedRect(0, 0, 40, 20, 10);
      toggle.endFill();
      
      handle.x = newValue ? 30 : 10;
      onChange(newValue);
    });

    return container;
  }

  private createDropdown(options: string[], initialValue: string, onChange: (value: string) => void): Container {
    const container = new Container();
    
    const button = new Graphics();
    button.beginFill(0x333333);
    button.drawRoundedRect(0, 0, 150, 30, 5);
    button.endFill();
    button.lineStyle(1, 0x666666);
    button.drawRoundedRect(0, 0, 150, 30, 5);
    container.addChild(button);

    const text = new Text(initialValue, {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
    });
    text.x = 10;
    text.y = 15 - text.height / 2;
    container.addChild(text);

    const arrow = new Text('▼', {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
    });
    arrow.x = 130;
    arrow.y = 15 - arrow.height / 2;
    container.addChild(arrow);

    let dropdownOpen = false;
    let dropdownContainer: Container | null = null;

    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerdown', () => {
      if (dropdownOpen) {
        if (dropdownContainer) {
          container.removeChild(dropdownContainer);
          dropdownContainer.destroy();
          dropdownContainer = null;
        }
        dropdownOpen = false;
        arrow.text = '▼';
      } else {
        dropdownContainer = new Container();
        dropdownContainer.x = 0;
        dropdownContainer.y = 35;

        options.forEach((option, index) => {
          const optionButton = new Graphics();
          optionButton.beginFill(0x222222);
          optionButton.drawRoundedRect(0, 0, 150, 25, 3);
          optionButton.endFill();
          optionButton.y = index * 25;
          dropdownContainer!.addChild(optionButton);

          const optionText = new Text(option, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xffffff,
          });
          optionText.x = 10;
          optionText.y = index * 25 + 12 - optionText.height / 2;
          dropdownContainer!.addChild(optionText);

          optionButton.eventMode = 'static';
          optionButton.cursor = 'pointer';
          optionButton.on('pointerdown', () => {
            text.text = option;
            onChange(option);
            container.removeChild(dropdownContainer!);
            dropdownContainer!.destroy();
            dropdownContainer = null;
            dropdownOpen = false;
            arrow.text = '▼';
          });

          optionButton.on('pointerover', () => {
            optionButton.clear();
            optionButton.beginFill(0x444444);
            optionButton.drawRoundedRect(0, 0, 150, 25, 3);
            optionButton.endFill();
          });

          optionButton.on('pointerout', () => {
            optionButton.clear();
            optionButton.beginFill(0x222222);
            optionButton.drawRoundedRect(0, 0, 150, 25, 3);
            optionButton.endFill();
          });
        });

        container.addChild(dropdownContainer);
        dropdownOpen = true;
        arrow.text = '▲';
      }
    });

    return container;
  }

  private createButtons(): void {
    // Save Button
    const saveButton = new Graphics();
    saveButton.beginFill(0x00aa00);
    saveButton.drawRoundedRect(0, 0, 100, 40, 8);
    saveButton.endFill();
    saveButton.x = this.screenWidth / 2 - 120;
    saveButton.y = this.screenHeight - 100;
    saveButton.eventMode = 'static';
    saveButton.cursor = 'pointer';
    saveButton.on('pointerdown', () => {
      this.onSettingsChange?.(this.settingsData);
    });
    this.container.addChild(saveButton);

    const saveText = new Text('Save', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    saveText.x = saveButton.x + 50 - saveText.width / 2;
    saveText.y = saveButton.y + 20 - saveText.height / 2;
    this.container.addChild(saveText);

    // Close Button
    const closeButton = new Graphics();
    closeButton.beginFill(0xaa0000);
    closeButton.drawRoundedRect(0, 0, 100, 40, 8);
    closeButton.endFill();
    closeButton.x = this.screenWidth / 2 + 20;
    closeButton.y = this.screenHeight - 100;
    closeButton.eventMode = 'static';
    closeButton.cursor = 'pointer';
    closeButton.on('pointerdown', () => {
      this.onClose?.();
    });
    this.container.addChild(closeButton);

    const closeText = new Text('Close', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    closeText.x = closeButton.x + 50 - closeText.width / 2;
    closeText.y = closeButton.y + 20 - closeText.height / 2;
    this.container.addChild(closeText);
  }

  private showTab(tabName: string): void {
    // Hide all tabs
    this.container.children.forEach(child => {
      if (child.name && child.name.endsWith('-tab')) {
        child.visible = false;
      }
    });

    // Show selected tab
    const selectedTab = this.container.getChildByName(`${tabName}-tab`);
    if (selectedTab) {
      selectedTab.visible = true;
    }

    // Update tab styling
    this.tabs.forEach((tab, index) => {
      const tabNames = ['audio', 'graphics', 'controls', 'gameplay'];
      if (tabNames[index] === tabName) {
        tab.tint = 0xffffff;
      } else {
        tab.tint = 0xcccccc;
      }
    });

    this.currentTab = tabName;
  }

  setSettingsChangeCallback(callback: (settings: SettingsData) => void): void {
    this.onSettingsChange = callback;
  }

  setCloseCallback(callback: () => void): void {
    this.onClose = callback;
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

  getSettings(): SettingsData {
    return { ...this.settingsData };
  }

  updateSettings(newSettings: SettingsData): void {
    this.settingsData = { ...newSettings };
    // TODO: Update UI elements to reflect new settings
  }

  private handleKeyDown = (_event: KeyboardEvent): void => {
    // Handle key down events
  };
} 