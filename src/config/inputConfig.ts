export interface KeyBinding {
  primary: string;
  secondary?: string;
}

export interface InputConfig {
  movement: {
    up: KeyBinding;
    down: KeyBinding;
    left: KeyBinding;
    right: KeyBinding;
  };
  ui: {
    pause: KeyBinding;
    restart: KeyBinding;
    upgrade1: KeyBinding;
    upgrade2: KeyBinding;
    upgrade3: KeyBinding;
    interact: KeyBinding;
  };
  debug: {
    toggleDebug: KeyBinding;
    cycleWeapon: KeyBinding;
  };
}

export const INPUT_CONFIG: InputConfig = {
  movement: {
    up: { primary: 'KeyW', secondary: 'ArrowUp' },
    down: { primary: 'KeyS', secondary: 'ArrowDown' },
    left: { primary: 'KeyA', secondary: 'ArrowLeft' },
    right: { primary: 'KeyD', secondary: 'ArrowRight' },
  },
  ui: {
    pause: { primary: 'Escape' },
    restart: { primary: 'KeyR' },
    upgrade1: { primary: 'Digit1' },
    upgrade2: { primary: 'Digit2' },
    upgrade3: { primary: 'Digit3' },
    interact: { primary: 'Space', secondary: 'Enter' },
  },
  debug: {
    toggleDebug: { primary: 'F1' },
    cycleWeapon: { primary: 'Tab' },
  },
};
