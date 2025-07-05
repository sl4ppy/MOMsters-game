import { EntityId } from '../types/core';
import { TypedGameEvent } from './interfaces';

/**
 * Input-related events for the EventBus system
 */

// Key events
export interface KeyPressedEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    keyCode: string;
    key: string;
    repeat: boolean;
    timestamp: number;
  }> {
  type: 'input:key_pressed';
}

export interface KeyReleasedEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    keyCode: string;
    key: string;
    timestamp: number;
  }> {
  type: 'input:key_released';
}

export interface KeyHeldEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    keyCode: string;
    key: string;
    duration: number;
    timestamp: number;
  }> {
  type: 'input:key_held';
}

// Mouse events
export interface MouseMoveEvent
  extends TypedGameEvent<{
    entityId?: EntityId;
    screenX: number;
    screenY: number;
    worldX: number;
    worldY: number;
    deltaX: number;
    deltaY: number;
    timestamp: number;
  }> {
  type: 'input:mouse_move';
}

export interface MouseClickEvent
  extends TypedGameEvent<{
    entityId?: EntityId;
    button: number; // 0=left, 1=middle, 2=right
    screenX: number;
    screenY: number;
    worldX: number;
    worldY: number;
    timestamp: number;
  }> {
  type: 'input:mouse_click';
}

export interface MouseWheelEvent
  extends TypedGameEvent<{
    entityId?: EntityId;
    deltaX: number;
    deltaY: number;
    deltaZ: number;
    timestamp: number;
  }> {
  type: 'input:mouse_wheel';
}

// Movement events (high-level)
export interface MovementInputEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    direction: {
      x: number; // -1 to 1
      y: number; // -1 to 1
    };
    magnitude: number; // 0 to 1
    timestamp: number;
  }> {
  type: 'input:movement';
}

export interface MovementStartEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    direction: {
      x: number;
      y: number;
    };
    timestamp: number;
  }> {
  type: 'input:movement_start';
}

export interface MovementStopEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    timestamp: number;
  }> {
  type: 'input:movement_stop';
}

// Action events (mapped from key/mouse inputs)
export interface ActionEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    action: string; // e.g., 'attack', 'jump', 'interact'
    inputType: 'key' | 'mouse' | 'gamepad';
    inputCode: string;
    timestamp: number;
  }> {
  type: 'input:action';
}

export interface ActionStartEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    action: string;
    inputType: 'key' | 'mouse' | 'gamepad';
    inputCode: string;
    timestamp: number;
  }> {
  type: 'input:action_start';
}

export interface ActionStopEvent
  extends TypedGameEvent<{
    entityId: EntityId;
    action: string;
    inputType: 'key' | 'mouse' | 'gamepad';
    inputCode: string;
    timestamp: number;
  }> {
  type: 'input:action_stop';
}

// Gamepad events
export interface GamepadConnectedEvent
  extends TypedGameEvent<{
    gamepadIndex: number;
    gamepadId: string;
    timestamp: number;
  }> {
  type: 'input:gamepad_connected';
}

export interface GamepadDisconnectedEvent
  extends TypedGameEvent<{
    gamepadIndex: number;
    timestamp: number;
  }> {
  type: 'input:gamepad_disconnected';
}

export interface GamepadButtonEvent
  extends TypedGameEvent<{
    entityId?: EntityId;
    gamepadIndex: number;
    buttonIndex: number;
    pressed: boolean;
    value: number;
    timestamp: number;
  }> {
  type: 'input:gamepad_button';
}

export interface GamepadAxisEvent
  extends TypedGameEvent<{
    entityId?: EntityId;
    gamepadIndex: number;
    axisIndex: number;
    value: number;
    timestamp: number;
  }> {
  type: 'input:gamepad_axis';
}

// UI-specific input events
export interface UIKeyEvent
  extends TypedGameEvent<{
    keyCode: string;
    key: string;
    action:
      | 'pause'
      | 'restart'
      | 'upgrade1'
      | 'upgrade2'
      | 'upgrade3'
      | 'interact'
      | 'toggleDebug'
      | 'cycleWeapon';
    timestamp: number;
  }> {
  type: 'input:ui_key';
}

// Event factory functions
export class InputEventFactory {
  public static createKeyPressed(
    entityId: EntityId,
    keyCode: string,
    key: string,
    repeat: boolean = false
  ): KeyPressedEvent {
    return {
      type: 'input:key_pressed',
      timestamp: Date.now(),
      entityId,
      data: {
        entityId,
        keyCode,
        key,
        repeat,
        timestamp: Date.now(),
      },
    };
  }

  public static createKeyReleased(
    entityId: EntityId,
    keyCode: string,
    key: string
  ): KeyReleasedEvent {
    return {
      type: 'input:key_released',
      timestamp: Date.now(),
      entityId,
      data: {
        entityId,
        keyCode,
        key,
        timestamp: Date.now(),
      },
    };
  }

  public static createMouseMove(
    screenX: number,
    screenY: number,
    worldX: number,
    worldY: number,
    deltaX: number,
    deltaY: number,
    entityId?: EntityId
  ): MouseMoveEvent {
    return {
      type: 'input:mouse_move',
      timestamp: Date.now(),
      entityId,
      data: {
        entityId,
        screenX,
        screenY,
        worldX,
        worldY,
        deltaX,
        deltaY,
        timestamp: Date.now(),
      },
    };
  }

  public static createMovementInput(
    entityId: EntityId,
    direction: { x: number; y: number },
    magnitude: number
  ): MovementInputEvent {
    return {
      type: 'input:movement',
      timestamp: Date.now(),
      entityId,
      data: {
        entityId,
        direction,
        magnitude,
        timestamp: Date.now(),
      },
    };
  }

  public static createAction(
    entityId: EntityId,
    action: string,
    inputType: 'key' | 'mouse' | 'gamepad',
    inputCode: string
  ): ActionEvent {
    return {
      type: 'input:action',
      timestamp: Date.now(),
      entityId,
      data: {
        entityId,
        action,
        inputType,
        inputCode,
        timestamp: Date.now(),
      },
    };
  }

  public static createUIKey(
    keyCode: string,
    key: string,
    action:
      | 'pause'
      | 'restart'
      | 'upgrade1'
      | 'upgrade2'
      | 'upgrade3'
      | 'interact'
      | 'toggleDebug'
      | 'cycleWeapon'
  ): UIKeyEvent {
    return {
      type: 'input:ui_key',
      timestamp: Date.now(),
      data: {
        keyCode,
        key,
        action,
        timestamp: Date.now(),
      },
    };
  }
}

// Input event type constants
export const INPUT_EVENT_TYPES = {
  // Key events
  KEY_PRESSED: 'input:key_pressed',
  KEY_RELEASED: 'input:key_released',
  KEY_HELD: 'input:key_held',

  // Mouse events
  MOUSE_MOVE: 'input:mouse_move',
  MOUSE_CLICK: 'input:mouse_click',
  MOUSE_WHEEL: 'input:mouse_wheel',

  // Movement events
  MOVEMENT: 'input:movement',
  MOVEMENT_START: 'input:movement_start',
  MOVEMENT_STOP: 'input:movement_stop',

  // Action events
  ACTION: 'input:action',
  ACTION_START: 'input:action_start',
  ACTION_STOP: 'input:action_stop',

  // Gamepad events
  GAMEPAD_CONNECTED: 'input:gamepad_connected',
  GAMEPAD_DISCONNECTED: 'input:gamepad_disconnected',
  GAMEPAD_BUTTON: 'input:gamepad_button',
  GAMEPAD_AXIS: 'input:gamepad_axis',

  // UI events
  UI_KEY: 'input:ui_key',
} as const;
