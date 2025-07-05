# 🎵 Phase 3: Core Features - Implementation Guide

## 📋 Overview
Phase 3 implements audio system, save/load functionality, and enhanced UI components.

---

## 🔊 Week 7: Audio System Implementation

### Audio Manager Core

**File: `src/audio/AudioManager.ts`**
```typescript
import { EventBus } from '../core/EventBus';
import { AUDIO_CONFIGS, AudioConfig } from '../assets/AudioAssets';
import { UserSettings } from '../types/game';

export interface AudioContext {
  context: AudioContext;
  masterGain: GainNode;
  musicGain: GainNode;
  sfxGain: GainNode;
}

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private loadedSounds: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode[]> = new Map();
  private musicSource: AudioBufferSourceNode | null = null;
  private currentMusic: string | null = null;
  private isInitialized: boolean = false;
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create audio context
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain nodes
      const masterGain = context.createGain();
      const musicGain = context.createGain();
      const sfxGain = context.createGain();

      // Connect gain nodes
      masterGain.connect(context.destination);
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);

      this.audioContext = {
        context,
        masterGain,
        musicGain,
        sfxGain
      };

      // Load all audio assets
      await this.loadAllAudio();
      
      this.isInitialized = true;
      this.eventBus.emit('audio_initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      this.eventBus.emit('audio_init_failed', { error });
    }
  }

  private async loadAllAudio(): Promise<void> {
    const loadPromises = AUDIO_CONFIGS.map(config => this.loadAudio(config));
    await Promise.allSettled(loadPromises);
  }

  private async loadAudio(config: AudioConfig): Promise<void> {
    try {
      const response = await fetch(config.path);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.context.decodeAudioData(arrayBuffer);
      
      this.loadedSounds.set(config.name, audioBuffer);
      console.log(`✅ Loaded audio: ${config.name}`);
    } catch (error) {
      console.error(`❌ Failed to load audio: ${config.name}`, error);
    }
  }

  public playMusic(trackName: string, loop: boolean = true): void {
    if (!this.isInitialized || !this.audioContext) return;

    // Stop current music
    if (this.musicSource) {
      this.musicSource.stop();
      this.musicSource = null;
    }

    const audioBuffer = this.loadedSounds.get(trackName);
    if (!audioBuffer) {
      console.warn(`Music track not found: ${trackName}`);
      return;
    }

    const source = this.audioContext.context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = loop;
    source.connect(this.audioContext.musicGain);
    
    source.start(0);
    this.musicSource = source;
    this.currentMusic = trackName;

    this.eventBus.emit('music_started', { trackName });
  }

  public stopMusic(): void {
    if (this.musicSource) {
      this.musicSource.stop();
      this.musicSource = null;
      this.currentMusic = null;
      this.eventBus.emit('music_stopped');
    }
  }

  public playSFX(soundName: string, volume: number = 1.0): void {
    if (!this.isInitialized || !this.audioContext) return;

    const audioBuffer = this.loadedSounds.get(soundName);
    if (!audioBuffer) {
      console.warn(`Sound effect not found: ${soundName}`);
      return;
    }

    const source = this.audioContext.context.createBufferSource();
    const gainNode = this.audioContext.context.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.sfxGain);
    gainNode.gain.value = volume;

    source.start(0);

    // Track active sources for cleanup
    if (!this.activeSources.has(soundName)) {
      this.activeSources.set(soundName, []);
    }
    this.activeSources.get(soundName)!.push(source);

    // Clean up when sound ends
    source.onended = () => {
      const sources = this.activeSources.get(soundName) || [];
      const index = sources.indexOf(source);
      if (index > -1) {
        sources.splice(index, 1);
      }
    };
  }

  public setMasterVolume(volume: number): void {
    if (this.audioContext) {
      this.audioContext.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public setMusicVolume(volume: number): void {
    if (this.audioContext) {
      this.audioContext.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public setSFXVolume(volume: number): void {
    if (this.audioContext) {
      this.audioContext.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public applySettings(settings: UserSettings): void {
    this.setMasterVolume(settings.audio.masterVolume);
    this.setMusicVolume(settings.audio.musicVolume);
    this.setSFXVolume(settings.audio.sfxVolume);

    if (settings.audio.muted) {
      this.setMasterVolume(0);
    }
  }

  private setupEventListeners(): void {
    this.eventBus.on('settings_changed', (event) => {
      this.applySettings(event.data);
    });

    this.eventBus.on('game_paused', () => {
      if (this.audioContext) {
        this.audioContext.context.suspend();
      }
    });

    this.eventBus.on('game_resumed', () => {
      if (this.audioContext) {
        this.audioContext.context.resume();
      }
    });
  }
}
```

### Spatial Audio System

**File: `src/audio/SpatialAudio.ts`**
```typescript
import { AudioManager } from './AudioManager';
import { Vector2 } from '../types/core';

export class SpatialAudio {
  private audioManager: AudioManager;
  private listenerPosition: Vector2 = { x: 0, y: 0 };

  constructor() {
    this.audioManager = AudioManager.getInstance();
  }

  public setListenerPosition(position: Vector2): void {
    this.listenerPosition = position;
  }

  public playSpatialSFX(soundName: string, position: Vector2, maxDistance: number = 500): void {
    const distance = this.calculateDistance(this.listenerPosition, position);
    const volume = this.calculateVolumeFromDistance(distance, maxDistance);
    
    if (volume > 0.01) {
      this.audioManager.playSFX(soundName, volume);
    }
  }

  private calculateDistance(pos1: Vector2, pos2: Vector2): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateVolumeFromDistance(distance: number, maxDistance: number): number {
    if (distance >= maxDistance) return 0;
    return 1 - (distance / maxDistance);
  }
}
```

---

## 💾 Week 8: Save System & Settings

### Enhanced Save Manager

**File: `src/persistence/SaveManager.ts`**
```typescript
import { SaveData, UserSettings } from '../types/game';
import { EventBus } from '../core/EventBus';

export interface SaveSlot {
  id: string;
  name: string;
  saveData: SaveData;
  thumbnail?: string;
}

export class SaveManager {
  private static instance: SaveManager;
  private eventBus: EventBus;
  private saveSlots: Map<string, SaveSlot> = new Map();
  private autosaveEnabled: boolean = true;
  private autosaveInterval: number = 30000; // 30 seconds
  private autosaveTimer: number | null = null;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.loadSaveSlots();
    this.setupAutosave();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public async saveGame(slotId: string, saveData: SaveData, slotName?: string): Promise<boolean> {
    try {
      const saveSlot: SaveSlot = {
        id: slotId,
        name: slotName || `Save ${new Date().toLocaleString()}`,
        saveData,
        thumbnail: await this.generateThumbnail()
      };

      // Save to localStorage
      localStorage.setItem(`momsters_save_${slotId}`, JSON.stringify(saveSlot));
      
      // Update save slots cache
      this.saveSlots.set(slotId, saveSlot);
      
      // Update save slots index
      this.updateSaveSlotsIndex();
      
      this.eventBus.emit('game_saved', { slotId, saveData });
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      this.eventBus.emit('save_failed', { slotId, error });
      return false;
    }
  }

  public async loadGame(slotId: string): Promise<SaveData | null> {
    try {
      const savedData = localStorage.getItem(`momsters_save_${slotId}`);
      if (!savedData) return null;

      const saveSlot: SaveSlot = JSON.parse(savedData);
      
      // Validate save data
      if (!this.validateSaveData(saveSlot.saveData)) {
        throw new Error('Invalid save data');
      }

      this.eventBus.emit('game_loaded', { slotId, saveData: saveSlot.saveData });
      return saveSlot.saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      this.eventBus.emit('load_failed', { slotId, error });
      return null;
    }
  }

  public deleteSave(slotId: string): boolean {
    try {
      localStorage.removeItem(`momsters_save_${slotId}`);
      this.saveSlots.delete(slotId);
      this.updateSaveSlotsIndex();
      
      this.eventBus.emit('save_deleted', { slotId });
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  public getSaveSlots(): SaveSlot[] {
    return Array.from(this.saveSlots.values()).sort((a, b) => 
      b.saveData.timestamp - a.saveData.timestamp
    );
  }

  public async saveSettings(settings: UserSettings): Promise<boolean> {
    try {
      localStorage.setItem('momsters_settings', JSON.stringify(settings));
      this.eventBus.emit('settings_saved', settings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  public async loadSettings(): Promise<UserSettings | null> {
    try {
      const settingsData = localStorage.getItem('momsters_settings');
      if (!settingsData) return null;

      const settings: UserSettings = JSON.parse(settingsData);
      this.eventBus.emit('settings_loaded', settings);
      return settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  private validateSaveData(saveData: SaveData): boolean {
    return !!(
      saveData.version &&
      saveData.timestamp &&
      saveData.playerState &&
      saveData.gameState &&
      saveData.settings
    );
  }

  private loadSaveSlots(): void {
    const slotsIndex = localStorage.getItem('momsters_save_slots');
    if (slotsIndex) {
      try {
        const slotIds: string[] = JSON.parse(slotsIndex);
        slotIds.forEach(slotId => {
          const slotData = localStorage.getItem(`momsters_save_${slotId}`);
          if (slotData) {
            const saveSlot: SaveSlot = JSON.parse(slotData);
            this.saveSlots.set(slotId, saveSlot);
          }
        });
      } catch (error) {
        console.error('Failed to load save slots index:', error);
      }
    }
  }

  private updateSaveSlotsIndex(): void {
    const slotIds = Array.from(this.saveSlots.keys());
    localStorage.setItem('momsters_save_slots', JSON.stringify(slotIds));
  }

  private async generateThumbnail(): Promise<string> {
    // In a real implementation, this would capture a screenshot of the game
    return 'data:image/png;base64,placeholder_thumbnail_data';
  }

  private setupAutosave(): void {
    if (this.autosaveEnabled) {
      this.autosaveTimer = window.setInterval(() => {
        this.eventBus.emit('autosave_triggered');
      }, this.autosaveInterval);
    }
  }

  public setAutosaveEnabled(enabled: boolean): void {
    this.autosaveEnabled = enabled;
    
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
    
    if (enabled) {
      this.setupAutosave();
    }
  }
}
```

### Settings Screen Implementation

**File: `src/ui/screens/SettingsScreen.ts`**
```typescript
import { Container, Graphics, Text } from 'pixi.js';
import { UserSettings } from '../../types/game';
import { EventBus } from '../../core/EventBus';
import { Slider } from '../components/Slider';
import { Button } from '../components/Button';

export class SettingsScreen {
  public container: Container;
  private background: Graphics;
  private eventBus: EventBus;
  private settings: UserSettings;
  private sliders: Map<string, Slider> = new Map();
  private buttons: Map<string, Button> = new Map();

  constructor(width: number, height: number) {
    this.container = new Container();
    this.eventBus = EventBus.getInstance();
    this.settings = this.getDefaultSettings();
    
    this.createBackground(width, height);
    this.createUI();
    this.setupEventListeners();
    
    this.container.visible = false;
  }

  private createBackground(width: number, height: number): void {
    this.background = new Graphics();
    this.background.beginFill(0x000000, 0.8);
    this.background.drawRect(0, 0, width, height);
    this.background.endFill();
    this.container.addChild(this.background);
  }

  private createUI(): void {
    const centerX = this.background.width / 2;
    let currentY = 100;

    // Title
    const title = new Text('Settings', {
      fontSize: 48,
      fill: 0xFFFFFF,
      fontFamily: 'Arial'
    });
    title.anchor.set(0.5);
    title.x = centerX;
    title.y = currentY;
    this.container.addChild(title);
    currentY += 80;

    // Audio Section
    currentY = this.createAudioSection(centerX, currentY);
    
    // Graphics Section
    currentY = this.createGraphicsSection(centerX, currentY);
    
    // Controls Section
    currentY = this.createControlsSection(centerX, currentY);
    
    // Buttons
    this.createButtons(centerX, currentY + 50);
  }

  private createAudioSection(centerX: number, startY: number): number {
    let currentY = startY;

    // Audio section title
    const audioTitle = new Text('Audio', {
      fontSize: 24,
      fill: 0xFFD700,
      fontFamily: 'Arial'
    });
    audioTitle.anchor.set(0.5);
    audioTitle.x = centerX;
    audioTitle.y = currentY;
    this.container.addChild(audioTitle);
    currentY += 40;

    // Master Volume
    const masterSlider = new Slider(200, 20, this.settings.audio.masterVolume);
    masterSlider.container.x = centerX;
    masterSlider.container.y = currentY;
    masterSlider.onValueChange = (value) => {
      this.settings.audio.masterVolume = value;
      this.eventBus.emit('settings_changed', this.settings);
    };
    this.container.addChild(masterSlider.container);
    this.sliders.set('masterVolume', masterSlider);

    const masterLabel = new Text('Master Volume', {
      fontSize: 16,
      fill: 0xFFFFFF,
      fontFamily: 'Arial'
    });
    masterLabel.anchor.set(0.5);
    masterLabel.x = centerX - 150;
    masterLabel.y = currentY;
    this.container.addChild(masterLabel);
    currentY += 40;

    // Music Volume
    const musicSlider = new Slider(200, 20, this.settings.audio.musicVolume);
    musicSlider.container.x = centerX;
    musicSlider.container.y = currentY;
    musicSlider.onValueChange = (value) => {
      this.settings.audio.musicVolume = value;
      this.eventBus.emit('settings_changed', this.settings);
    };
    this.container.addChild(musicSlider.container);
    this.sliders.set('musicVolume', musicSlider);

    const musicLabel = new Text('Music Volume', {
      fontSize: 16,
      fill: 0xFFFFFF,
      fontFamily: 'Arial'
    });
    musicLabel.anchor.set(0.5);
    musicLabel.x = centerX - 150;
    musicLabel.y = currentY;
    this.container.addChild(musicLabel);
    currentY += 40;

    // SFX Volume
    const sfxSlider = new Slider(200, 20, this.settings.audio.sfxVolume);
    sfxSlider.container.x = centerX;
    sfxSlider.container.y = currentY;
    sfxSlider.onValueChange = (value) => {
      this.settings.audio.sfxVolume = value;
      this.eventBus.emit('settings_changed', this.settings);
    };
    this.container.addChild(sfxSlider.container);
    this.sliders.set('sfxVolume', sfxSlider);

    const sfxLabel = new Text('SFX Volume', {
      fontSize: 16,
      fill: 0xFFFFFF,
      fontFamily: 'Arial'
    });
    sfxLabel.anchor.set(0.5);
    sfxLabel.x = centerX - 150;
    sfxLabel.y = currentY;
    this.container.addChild(sfxLabel);

    return currentY + 60;
  }

  private createGraphicsSection(centerX: number, startY: number): number {
    let currentY = startY;

    const graphicsTitle = new Text('Graphics', {
      fontSize: 24,
      fill: 0xFFD700,
      fontFamily: 'Arial'
    });
    graphicsTitle.anchor.set(0.5);
    graphicsTitle.x = centerX;
    graphicsTitle.y = currentY;
    this.container.addChild(graphicsTitle);
    currentY += 40;

    // Quality buttons
    const qualities = ['low', 'medium', 'high'];
    qualities.forEach((quality, index) => {
      const qualityButton = new Button(
        80, 30, 
        quality.charAt(0).toUpperCase() + quality.slice(1),
        () => {
          this.settings.graphics.quality = quality as any;
          this.updateQualityButtons();
          this.eventBus.emit('settings_changed', this.settings);
        }
      );
      qualityButton.container.x = centerX - 120 + (index * 90);
      qualityButton.container.y = currentY;
      this.container.addChild(qualityButton.container);
      this.buttons.set(`quality_${quality}`, qualityButton);
    });

    this.updateQualityButtons();
    return currentY + 60;
  }

  private createControlsSection(centerX: number, startY: number): number {
    let currentY = startY;

    const controlsTitle = new Text('Controls', {
      fontSize: 24,
      fill: 0xFFD700,
      fontFamily: 'Arial'
    });
    controlsTitle.anchor.set(0.5);
    controlsTitle.x = centerX;
    controlsTitle.y = currentY;
    this.container.addChild(controlsTitle);
    currentY += 40;

    // Key binding display (simplified)
    const keyBindings = [
      { label: 'Move Up', key: 'W' },
      { label: 'Move Down', key: 'S' },
      { label: 'Move Left', key: 'A' },
      { label: 'Move Right', key: 'D' }
    ];

    keyBindings.forEach((binding, index) => {
      const label = new Text(`${binding.label}: ${binding.key}`, {
        fontSize: 16,
        fill: 0xFFFFFF,
        fontFamily: 'Arial'
      });
      label.anchor.set(0.5);
      label.x = centerX;
      label.y = currentY + (index * 25);
      this.container.addChild(label);
    });

    return currentY + (keyBindings.length * 25) + 40;
  }

  private createButtons(centerX: number, startY: number): void {
    // Save button
    const saveButton = new Button(100, 40, 'Save', () => {
      this.eventBus.emit('save_settings', this.settings);
      this.hide();
    });
    saveButton.container.x = centerX - 60;
    saveButton.container.y = startY;
    this.container.addChild(saveButton.container);
    this.buttons.set('save', saveButton);

    // Cancel button
    const cancelButton = new Button(100, 40, 'Cancel', () => {
      this.hide();
    });
    cancelButton.container.x = centerX + 60;
    cancelButton.container.y = startY;
    this.container.addChild(cancelButton.container);
    this.buttons.set('cancel', cancelButton);
  }

  private updateQualityButtons(): void {
    ['low', 'medium', 'high'].forEach(quality => {
      const button = this.buttons.get(`quality_${quality}`);
      if (button) {
        button.setSelected(this.settings.graphics.quality === quality);
      }
    });
  }

  private setupEventListeners(): void {
    this.eventBus.on('show_settings', () => this.show());
    this.eventBus.on('hide_settings', () => this.hide());
    this.eventBus.on('settings_loaded', (event) => {
      this.settings = event.data;
      this.updateUI();
    });
  }

  private updateUI(): void {
    this.sliders.get('masterVolume')?.setValue(this.settings.audio.masterVolume);
    this.sliders.get('musicVolume')?.setValue(this.settings.audio.musicVolume);
    this.sliders.get('sfxVolume')?.setValue(this.settings.audio.sfxVolume);
    this.updateQualityButtons();
  }

  public show(): void {
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
  }

  private getDefaultSettings(): UserSettings {
    return {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        muted: false
      },
      graphics: {
        quality: 'medium',
        particleCount: 100,
        showFPS: false
      },
      controls: {
        keyBindings: {},
        mouseSensitivity: 1.0
      },
      accessibility: {
        colorBlindMode: false,
        highContrast: false,
        textSize: 'medium'
      }
    };
  }
}
```

---

## 🎨 Week 9: Enhanced UI Components

### Reusable UI Components

**File: `src/ui/components/Button.ts`**
```typescript
import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';

export class Button {
  public container: Container;
  private background: Graphics;
  private label: Text;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private onClick?: () => void;

  constructor(width: number, height: number, text: string, onClick?: () => void) {
    this.container = new Container();
    this.onClick = onClick;
    
    this.createBackground(width, height);
    this.createLabel(text);
    this.setupInteraction();
  }

  private createBackground(width: number, height: number): void {
    this.background = new Graphics();
    this.updateBackground(width, height);
    this.container.addChild(this.background);
  }

  private createLabel(text: string): void {
    this.label = new Text(text, {
      fontSize: 16,
      fill: 0xFFFFFF,
      fontFamily: 'Arial'
    });
    this.label.anchor.set(0.5);
    this.label.x = this.background.width / 2;
    this.label.y = this.background.height / 2;
    this.container.addChild(this.label);
  }

  private updateBackground(width: number, height: number): void {
    this.background.clear();
    
    let fillColor = 0x333333;
    if (this.isSelected) fillColor = 0x555555;
    if (this.isHovered) fillColor = 0x666666;
    
    this.background.beginFill(fillColor);
    this.background.lineStyle(2, 0xFFFFFF, 0.8);
    this.background.drawRoundedRect(0, 0, width, height, 5);
    this.background.endFill();
  }

  private setupInteraction(): void {
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    
    this.container.on('pointerdown', this.onPointerDown.bind(this));
    this.container.on('pointerover', this.onPointerOver.bind(this));
    this.container.on('pointerout', this.onPointerOut.bind(this));
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    if (this.onClick) {
      this.onClick();
    }
  }

  private onPointerOver(): void {
    this.isHovered = true;
    this.updateBackground(this.background.width, this.background.height);
  }

  private onPointerOut(): void {
    this.isHovered = false;
    this.updateBackground(this.background.width, this.background.height);
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.updateBackground(this.background.width, this.background.height);
  }

  public setText(text: string): void {
    this.label.text = text;
  }
}
```

**File: `src/ui/components/Slider.ts`**
```typescript
import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';

export class Slider {
  public container: Container;
  private track: Graphics;
  private handle: Graphics;
  private isDragging: boolean = false;
  private value: number = 0;
  private width: number;
  private height: number;
  public onValueChange?: (value: number) => void;

  constructor(width: number, height: number, initialValue: number = 0) {
    this.container = new Container();
    this.width = width;
    this.height = height;
    this.value = Math.max(0, Math.min(1, initialValue));
    
    this.createTrack();
    this.createHandle();
    this.setupInteraction();
    this.updateHandle();
  }

  private createTrack(): void {
    this.track = new Graphics();
    this.track.beginFill(0x333333);
    this.track.lineStyle(1, 0x666666);
    this.track.drawRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, this.height / 2);
    this.track.endFill();
    this.container.addChild(this.track);
  }

  private createHandle(): void {
    this.handle = new Graphics();
    this.handle.beginFill(0xFFFFFF);
    this.handle.lineStyle(2, 0x666666);
    this.handle.drawCircle(0, 0, this.height / 2 + 2);
    this.handle.endFill();
    this.container.addChild(this.handle);
  }

  private setupInteraction(): void {
    this.container.eventMode = 'static';
    this.handle.eventMode = 'static';
    this.handle.cursor = 'pointer';
    
    this.handle.on('pointerdown', this.onPointerDown.bind(this));
    this.container.on('pointermove', this.onPointerMove.bind(this));
    this.container.on('pointerup', this.onPointerUp.bind(this));
    this.container.on('pointerupoutside', this.onPointerUp.bind(this));
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    this.isDragging = true;
    event.stopPropagation();
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    if (!this.isDragging) return;

    const localPosition = event.getLocalPosition(this.container);
    const relativeX = localPosition.x + this.width / 2;
    const newValue = Math.max(0, Math.min(1, relativeX / this.width));
    
    if (newValue !== this.value) {
      this.setValue(newValue);
      if (this.onValueChange) {
        this.onValueChange(this.value);
      }
    }
  }

  private onPointerUp(): void {
    this.isDragging = false;
  }

  private updateHandle(): void {
    const x = (this.value * this.width) - (this.width / 2);
    this.handle.x = x;
  }

  public setValue(value: number): void {
    this.value = Math.max(0, Math.min(1, value));
    this.updateHandle();
  }

  public getValue(): number {
    return this.value;
  }
}
```

---

## 📋 Phase 3 Execution Checklist

### Audio System ✅
- [ ] Create audio directory structure (`src/audio/`)
- [ ] Implement AudioManager with Web Audio API
- [ ] Add spatial audio support
- [ ] Create audio asset loading system
- [ ] Integrate with settings system
- [ ] Add audio event handling

### Save System ✅
- [ ] Implement SaveManager with multiple slots
- [ ] Add save data validation
- [ ] Create autosave functionality
- [ ] Implement settings persistence
- [ ] Add thumbnail generation
- [ ] Create save/load UI integration

### Enhanced UI ✅
- [ ] Create reusable Button component
- [ ] Implement Slider component
- [ ] Build comprehensive SettingsScreen
- [ ] Add UI event system integration
- [ ] Create responsive UI layouts
- [ ] Implement UI theming system

---

## 🔊 Audio System - Final Notes
- **Audio is now muted by default** for new users and on reset
- Unmute with the HUD speaker button or 'M' key
- All SFX and music are event-driven and can be tested via gameplay and settings

---

## 🚀 Commands to Execute Phase 3

```bash
# 1. Create audio and UI directories
mkdir -p src/audio src/persistence src/ui/components src/ui/screens

# 2. Test audio system
npm run test:unit -- --testPathPattern=audio

# 3. Test save system
npm run test:unit -- --testPathPattern=persistence

# 4. Test UI components
npm run test:unit -- --testPathPattern=ui

# 5. Integration test
npm run test:integration

# 6. Build and verify
npm run build
```

This completes Phase 3 with full audio system, save/load functionality, and enhanced UI ready for Phase 4. 