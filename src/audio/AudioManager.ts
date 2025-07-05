import { EventBusImpl } from '../events/EventBus';

export interface AudioConfig {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  spatialAudio: boolean;
  maxConcurrentSounds: number;
}

export interface SoundEffect {
  id: string;
  url: string;
  volume: number;
  loop: boolean;
  spatial?: boolean;
  category: 'sfx' | 'music' | 'ui';
}

export interface AudioEvent {
  type: string;
  soundId: string;
  volume?: number;
  position?: { x: number; y: number };
  timestamp: number;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private eventBus: EventBusImpl;
  
  // Audio buffers cache
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();
  
  // Configuration
  private config: AudioConfig = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.6,
    spatialAudio: true,
    maxConcurrentSounds: 32,
  };

  // Performance tracking
  private performanceMetrics = {
    soundsPlayed: 0,
    soundsCached: 0,
    activeSounds: 0,
    loadTime: 0,
    lastUpdate: 0,
  };

  // Sound definitions
  private readonly SOUND_EFFECTS: Record<string, SoundEffect> = {
    // Player sounds
    'player_move': { id: 'player_move', url: '/audio/sfx/player_move.wav', volume: 0.3, loop: false, category: 'sfx' },
    'player_attack': { id: 'player_attack', url: '/audio/sfx/player_attack.wav', volume: 0.5, loop: false, category: 'sfx' },
    'player_hurt': { id: 'player_hurt', url: '/audio/sfx/player_hurt.wav', volume: 0.6, loop: false, category: 'sfx' },
    'player_death': { id: 'player_death', url: '/audio/sfx/player_death.wav', volume: 0.7, loop: false, category: 'sfx' },
    
    // Weapon sounds
    'fireball_launch': { id: 'fireball_launch', url: '/audio/sfx/fireball_launch.wav', volume: 0.4, loop: false, category: 'sfx' },
    'fireball_hit': { id: 'fireball_hit', url: '/audio/sfx/fireball_hit.wav', volume: 0.5, loop: false, category: 'sfx' },
    'beam_charge': { id: 'beam_charge', url: '/audio/sfx/beam_charge.wav', volume: 0.3, loop: true, category: 'sfx' },
    'beam_fire': { id: 'beam_fire', url: '/audio/sfx/beam_fire.wav', volume: 0.6, loop: false, category: 'sfx' },
    
    // Enemy sounds
    'enemy_spawn': { id: 'enemy_spawn', url: '/audio/sfx/enemy_spawn.wav', volume: 0.4, loop: false, category: 'sfx' },
    'enemy_hurt': { id: 'enemy_hurt', url: '/audio/sfx/enemy_hurt.wav', volume: 0.4, loop: false, category: 'sfx' },
    'enemy_death': { id: 'enemy_death', url: '/audio/sfx/enemy_death.wav', volume: 0.5, loop: false, category: 'sfx' },
    
    // UI sounds
    'ui_click': { id: 'ui_click', url: '/audio/sfx/ui_click.wav', volume: 0.3, loop: false, category: 'ui' },
    'ui_hover': { id: 'ui_hover', url: '/audio/sfx/ui_hover.wav', volume: 0.2, loop: false, category: 'ui' },
    'level_up': { id: 'level_up', url: '/audio/sfx/level_up.wav', volume: 0.6, loop: false, category: 'ui' },
    'xp_pickup': { id: 'xp_pickup', url: '/audio/sfx/xp_pickup.wav', volume: 0.4, loop: false, category: 'ui' },
    
    // Music tracks
    'music_title': { id: 'music_title', url: '/audio/music/title_theme.mp3', volume: 0.4, loop: true, category: 'music' },
    'music_game': { id: 'music_game', url: '/audio/music/game_theme.mp3', volume: 0.3, loop: true, category: 'music' },
    'music_boss': { id: 'music_boss', url: '/audio/music/boss_theme.mp3', volume: 0.4, loop: true, category: 'music' },
  };

  constructor(eventBus: EventBusImpl) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    // console.log('🎵 AudioManager: Initializing...');
    
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      
      // Connect gain nodes
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.updateVolumes();
      
      // Preload essential sounds
      await this.preloadEssentialSounds();
      
      // console.log('🎵 AudioManager: Initialized successfully');
    } catch (error) {
      console.error('❌ AudioManager: Failed to initialize:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Game events
    this.eventBus.on('player:moved', () => this.playSound('player_move'));
    this.eventBus.on('player:attacked', () => this.playSound('player_attack'));
    this.eventBus.on('player:hurt', () => this.playSound('player_hurt'));
    this.eventBus.on('player:died', () => this.playSound('player_death'));
    
    // Weapon events
    this.eventBus.on('weapon:fireball_launched', () => this.playSound('fireball_launch'));
    this.eventBus.on('weapon:fireball_hit', () => this.playSound('fireball_hit'));
    this.eventBus.on('weapon:beam_charging', () => this.playSound('beam_charge'));
    this.eventBus.on('weapon:beam_fired', () => this.playSound('beam_fire'));
    
    // Enemy events
    this.eventBus.on('enemy:created', () => this.playSound('enemy_spawn'));
    this.eventBus.on('enemy:hurt', () => this.playSound('enemy_hurt'));
    this.eventBus.on('enemy:died', () => this.playSound('enemy_death'));
    
    // UI events
    this.eventBus.on('ui:click', () => this.playSound('ui_click'));
    this.eventBus.on('ui:hover', () => this.playSound('ui_hover'));
    this.eventBus.on('player:level_up', () => this.playSound('level_up'));
    this.eventBus.on('player:xp_gained', () => this.playSound('xp_pickup'));
    
    // Music events
    this.eventBus.on('game:title_screen', () => this.playMusic('music_title'));
    this.eventBus.on('game:started', () => this.playMusic('music_game'));
    this.eventBus.on('game:boss_fight', () => this.playMusic('music_boss'));
  }

  private async preloadEssentialSounds(): Promise<void> {
    const essentialSounds = [
      'ui_click',
      'ui_hover', 
      'player_move',
      'player_attack',
      'enemy_death',
      'xp_pickup'
    ];

    // console.log('🎵 AudioManager: Preloading essential sounds...');
    
    const loadPromises = essentialSounds.map(soundId => this.loadSound(soundId));
    await Promise.all(loadPromises);
    
    // console.log(`🎵 AudioManager: Preloaded ${essentialSounds.length} essential sounds`);
  }

  async loadSound(soundId: string): Promise<void> {
    const sound = this.SOUND_EFFECTS[soundId];
    if (!sound) {
      console.warn(`🎵 AudioManager: Unknown sound ID: ${soundId}`);
      return;
    }

    if (this.audioBuffers.has(soundId)) {
      return; // Already loaded
    }

    try {
      const response = await fetch(sound.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      this.audioBuffers.set(soundId, audioBuffer);
      this.performanceMetrics.soundsCached++;
      
      // console.log(`🎵 AudioManager: Loaded sound: ${soundId}`);
    } catch (error) {
      console.warn(`🎵 AudioManager: Failed to load sound ${soundId}, generating fallback:`, error);
      // Generate a fallback sound
      await this.generateFallbackSound(soundId, sound);
    }
  }

  private async generateFallbackSound(soundId: string, _sound: SoundEffect): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Generate a simple tone based on sound type
      const frequency = this.getFallbackFrequency(soundId);
      const duration = this.getFallbackDuration(soundId);
      
      const sampleRate = this.audioContext.sampleRate;
      const length = sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate a simple sine wave with fade in/out
      for (let i = 0; i < length; i++) {
        const fadeIn = Math.min(1, i / (sampleRate * 0.01)); // 10ms fade in
        const fadeOut = Math.min(1, (length - i) / (sampleRate * 0.01)); // 10ms fade out
        const fade = Math.min(fadeIn, fadeOut);
        
        data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3 * fade;
      }
      
      this.audioBuffers.set(soundId, buffer);
      this.performanceMetrics.soundsCached++;
      
      console.warn(`🎵 AudioManager: Generated fallback sound: ${soundId} (${frequency}Hz, ${duration}s)`);
    } catch (error) {
      console.error(`🎵 AudioManager: Failed to generate fallback sound ${soundId}:`, error);
    }
  }

  private getFallbackFrequency(soundId: string): number {
    // Return different frequencies for different sound types
    const frequencies: Record<string, number> = {
      // UI sounds - higher frequencies
      'ui_click': 800,
      'ui_hover': 600,
      'level_up': 1200,
      'xp_pickup': 1000,
      
      // Player sounds - medium frequencies
      'player_move': 400,
      'player_attack': 500,
      'player_hurt': 300,
      'player_death': 200,
      
      // Weapon sounds - various frequencies
      'fireball_launch': 600,
      'fireball_hit': 400,
      'beam_charge': 800,
      'beam_fire': 700,
      
      // Enemy sounds - lower frequencies
      'enemy_spawn': 500,
      'enemy_hurt': 400,
      'enemy_death': 300,
    };
    
    return frequencies[soundId] || 440; // Default to A4
  }

  private getFallbackDuration(soundId: string): number {
    // Return different durations for different sound types
    const durations: Record<string, number> = {
      // UI sounds - short
      'ui_click': 0.1,
      'ui_hover': 0.1,
      'level_up': 0.3,
      'xp_pickup': 0.2,
      
      // Player sounds - medium
      'player_move': 0.1,
      'player_attack': 0.2,
      'player_hurt': 0.3,
      'player_death': 0.5,
      
      // Weapon sounds - various
      'fireball_launch': 0.2,
      'fireball_hit': 0.3,
      'beam_charge': 0.4,
      'beam_fire': 0.3,
      
      // Enemy sounds - medium
      'enemy_spawn': 0.2,
      'enemy_hurt': 0.2,
      'enemy_death': 0.3,
    };
    
    return durations[soundId] || 0.2; // Default to 200ms
  }

  playSound(soundId: string, options?: {
    volume?: number;
    position?: { x: number; y: number };
    loop?: boolean;
  }): void {
    if (!this.audioContext || !this.masterGain) {
      console.warn('🎵 AudioManager: Audio context not initialized');
      return;
    }

    const sound = this.SOUND_EFFECTS[soundId];
    if (!sound) {
      console.warn(`🎵 AudioManager: Unknown sound ID: ${soundId}`);
      return;
    }

    const buffer = this.audioBuffers.get(soundId);
    if (!buffer) {
      // Try to load the sound on-demand
      this.loadSound(soundId).then(() => this.playSound(soundId, options));
      return;
    }

    // Check concurrent sound limit
    if (this.activeSounds.size >= this.config.maxConcurrentSounds) {
      this.stopOldestSound();
    }

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = options?.loop ?? sound.loop;

      // Create gain node for this sound
      const gainNode = this.audioContext.createGain();
      const volume = (options?.volume ?? sound.volume) * this.getCategoryVolume(sound.category);
      gainNode.gain.value = volume;

      // Apply spatial audio if enabled and position provided
      if (this.config.spatialAudio && options?.position && sound.spatial) {
        const panner = this.audioContext.createPanner();
        panner.setPosition(options.position.x, options.position.y, 0);
        source.connect(panner);
        panner.connect(gainNode);
      } else {
        source.connect(gainNode);
      }

      // Connect to appropriate category gain node
      const categoryGain = sound.category === 'music' ? this.musicGain! : this.sfxGain!;
      gainNode.connect(categoryGain);

      // Store active sound
      this.activeSounds.set(soundId, source);
      this.performanceMetrics.soundsPlayed++;

      // Clean up when sound ends
      source.onended = () => {
        this.activeSounds.delete(soundId);
      };

      source.start();
      console.log(`🎵 AudioManager: Playing sound: ${soundId}`);
    } catch (error) {
      console.error(`🎵 AudioManager: Failed to play sound ${soundId}:`, error);
    }
  }

  playMusic(musicId: string): void {
    // Stop current music
    this.stopMusic();
    
    // Play new music
    this.playSound(musicId, { loop: true });
  }

  stopMusic(): void {
    // Stop all music sounds
    for (const [soundId, source] of this.activeSounds.entries()) {
      const sound = this.SOUND_EFFECTS[soundId];
      if (sound?.category === 'music') {
        source.stop();
        this.activeSounds.delete(soundId);
      }
    }
  }

  stopSound(soundId: string): void {
    const source = this.activeSounds.get(soundId);
    if (source) {
      source.stop();
      this.activeSounds.delete(soundId);
    }
  }

  stopAllSounds(): void {
    for (const source of this.activeSounds.values()) {
      source.stop();
    }
    this.activeSounds.clear();
  }

  private stopOldestSound(): void {
    const firstSoundId = this.activeSounds.keys().next().value;
    if (firstSoundId) {
      this.stopSound(firstSoundId);
    }
  }

  private getCategoryVolume(category: string): number {
    switch (category) {
      case 'sfx': return this.config.sfxVolume;
      case 'music': return this.config.musicVolume;
      case 'ui': return this.config.sfxVolume;
      default: return 1.0;
    }
  }

  updateVolumes(): void {
    if (!this.masterGain || !this.sfxGain || !this.musicGain) return;

    this.masterGain.gain.value = this.config.masterVolume;
    this.sfxGain.gain.value = this.config.sfxVolume;
    this.musicGain.gain.value = this.config.musicVolume;
  }

  // Configuration methods
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setSpatialAudio(enabled: boolean): void {
    this.config.spatialAudio = enabled;
  }

  // Performance and debugging
  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    this.stopAllSounds();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioBuffers.clear();
    this.activeSounds.clear();
    
    console.log('🎵 AudioManager: Destroyed');
  }
} 