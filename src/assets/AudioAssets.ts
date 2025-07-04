export interface AudioConfig {
  name: string;
  path: string;
  volume: number;
  loop: boolean;
  category: 'music' | 'sfx' | 'ui';
}

export const AUDIO_CONFIGS: AudioConfig[] = [
  // Music
  {
    name: 'background_music_main',
    path: '/audio/music/main_theme.mp3',
    volume: 0.6,
    loop: true,
    category: 'music',
  },
  {
    name: 'background_music_boss',
    path: '/audio/music/boss_theme.mp3',
    volume: 0.7,
    loop: true,
    category: 'music',
  },

  // SFX
  {
    name: 'sfx_fireball_shoot',
    path: '/audio/sfx/fireball_shoot.wav',
    volume: 0.4,
    loop: false,
    category: 'sfx',
  },
  {
    name: 'sfx_enemy_hit',
    path: '/audio/sfx/enemy_hit.wav',
    volume: 0.3,
    loop: false,
    category: 'sfx',
  },
  {
    name: 'sfx_player_damage',
    path: '/audio/sfx/player_damage.wav',
    volume: 0.5,
    loop: false,
    category: 'sfx',
  },
  {
    name: 'sfx_level_up',
    path: '/audio/sfx/level_up.wav',
    volume: 0.6,
    loop: false,
    category: 'sfx',
  },
  {
    name: 'sfx_pickup_xp',
    path: '/audio/sfx/pickup_xp.wav',
    volume: 0.3,
    loop: false,
    category: 'sfx',
  },

  // UI
  {
    name: 'ui_button_click',
    path: '/audio/ui/button_click.wav',
    volume: 0.4,
    loop: false,
    category: 'ui',
  },
  {
    name: 'ui_menu_select',
    path: '/audio/ui/menu_select.wav',
    volume: 0.3,
    loop: false,
    category: 'ui',
  },
];
