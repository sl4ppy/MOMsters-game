import { ComponentType, createComponentType } from '../../types/core';

/**
 * Input-related components for the ECS system
 */

// Component for entities that can receive input (usually player)
export interface InputReceiverComponent {
  type: ComponentType;
  enabled: boolean;
  priority: number; // Higher priority gets input first
}

export const INPUT_RECEIVER_COMPONENT: ComponentType = createComponentType('input_receiver');

export function createInputReceiverComponent(
  enabled: boolean = true,
  priority: number = 0
): InputReceiverComponent {
  return {
    type: INPUT_RECEIVER_COMPONENT,
    enabled,
    priority,
  };
}

// Component for storing current input state
export interface InputStateComponent {
  type: ComponentType;
  movement: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    magnitude: number; // 0-1 for analog input support
  };
  mouse: {
    x: number;
    y: number;
    worldX: number; // Mouse position in world coordinates
    worldY: number;
  };
  keys: {
    [keyCode: string]: {
      pressed: boolean;
      justPressed: boolean;
      justReleased: boolean;
      pressTime: number; // Time the key has been held
    };
  };
  gamepad?: {
    connected: boolean;
    leftStick: { x: number; y: number };
    rightStick: { x: number; y: number };
    triggers: { left: number; right: number };
    buttons: { [buttonIndex: number]: boolean };
  };
}

export const INPUT_STATE_COMPONENT: ComponentType = createComponentType('input_state');

export function createInputStateComponent(): InputStateComponent {
  return {
    type: INPUT_STATE_COMPONENT,
    movement: {
      up: false,
      down: false,
      left: false,
      right: false,
      magnitude: 0,
    },
    mouse: {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
    },
    keys: {},
    gamepad: undefined,
  };
}

// Component for input configuration per entity
export interface InputMappingComponent {
  type: ComponentType;
  keyBindings: {
    [actionName: string]: {
      primary: string;
      secondary?: string;
      type: 'key' | 'mouse' | 'gamepad';
    };
  };
  mouseConfig: {
    sensitivity: number;
    invertY: boolean;
  };
  gamepadConfig: {
    deadzone: number;
    sensitivity: number;
  };
}

export const INPUT_MAPPING_COMPONENT: ComponentType = createComponentType('input_mapping');

export function createInputMappingComponent(): InputMappingComponent {
  return {
    type: INPUT_MAPPING_COMPONENT,
    keyBindings: {
      // Movement
      moveUp: { primary: 'KeyW', secondary: 'ArrowUp', type: 'key' },
      moveDown: { primary: 'KeyS', secondary: 'ArrowDown', type: 'key' },
      moveLeft: { primary: 'KeyA', secondary: 'ArrowLeft', type: 'key' },
      moveRight: { primary: 'KeyD', secondary: 'ArrowRight', type: 'key' },

      // UI
      pause: { primary: 'Escape', type: 'key' },
      restart: { primary: 'KeyR', type: 'key' },
      interact: { primary: 'Space', secondary: 'Enter', type: 'key' },

      // Upgrades
      upgrade1: { primary: 'Digit1', type: 'key' },
      upgrade2: { primary: 'Digit2', type: 'key' },
      upgrade3: { primary: 'Digit3', type: 'key' },

      // Debug
      toggleDebug: { primary: 'F1', type: 'key' },
      cycleWeapon: { primary: 'Tab', type: 'key' },
    },
    mouseConfig: {
      sensitivity: 1.0,
      invertY: false,
    },
    gamepadConfig: {
      deadzone: 0.1,
      sensitivity: 1.0,
    },
  };
}
