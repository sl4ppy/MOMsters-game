/* eslint-disable no-console */
import { SystemType, createSystemType } from '../../types/core';
import { System, EntityManager } from '../interfaces';
import { EventBus } from '../../events/interfaces';
import {
  INPUT_RECEIVER_COMPONENT,
  INPUT_STATE_COMPONENT,
  INPUT_MAPPING_COMPONENT,
  InputReceiverComponent,
  InputStateComponent,
  InputMappingComponent,
} from '../components/InputComponents';
import { InputEventFactory, INPUT_EVENT_TYPES, UIKeyEvent } from '../../events/InputEvents';

/**
 * ECS InputSystem - Handles all input processing and event emission
 */
export class InputSystem implements System {
  public readonly type: SystemType = createSystemType('input');
  public readonly priority: number = 10; // High priority - input should be processed early

  private entityManager: EntityManager;
  private eventBus: EventBus;

  // Raw input state
  private keys: Map<string, boolean> = new Map();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();
  private keyPressTime: Map<string, number> = new Map();

  private mousePosition = { x: 0, y: 0 };
  private lastMousePosition = { x: 0, y: 0 };
  private mouseButtons: Map<number, boolean> = new Map();

  private gamepads: Map<number, Gamepad> = new Map();

  // Event listeners
  private boundKeyDown: (event: KeyboardEvent) => void;
  private boundKeyUp: (event: KeyboardEvent) => void;
  private boundMouseMove: (event: MouseEvent) => void;
  private boundMouseDown: (event: MouseEvent) => void;
  private boundMouseUp: (event: MouseEvent) => void;
  private boundMouseWheel: (event: WheelEvent) => void;
  private boundGamepadConnected: (event: GamepadEvent) => void;
  private boundGamepadDisconnected: (event: GamepadEvent) => void;

  // State tracking
  private lastMovementState: Map<string, { x: number; y: number; magnitude: number }> = new Map();

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;

    // Bind event handlers
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundMouseWheel = this.onMouseWheel.bind(this);
    this.boundGamepadConnected = this.onGamepadConnected.bind(this);
    this.boundGamepadDisconnected = this.onGamepadDisconnected.bind(this);
  }

  public initialize(): void {
    console.log('🚀 Input system initialized');

    // Add event listeners
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('wheel', this.boundMouseWheel);
    window.addEventListener('gamepadconnected', this.boundGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.boundGamepadDisconnected);

    console.log('✅ Input event listeners attached');
  }

  public update(deltaTime: number): void {
    // Update gamepad state
    this.updateGamepads();

    // Update input state for all entities with input components
    const inputEntities = this.entityManager.query({
      with: [INPUT_RECEIVER_COMPONENT, INPUT_STATE_COMPONENT],
    });

    for (const entity of inputEntities) {
      const receiver = this.entityManager.getComponent<InputReceiverComponent>(
        entity.id,
        INPUT_RECEIVER_COMPONENT
      );
      const inputState = this.entityManager.getComponent<InputStateComponent>(
        entity.id,
        INPUT_STATE_COMPONENT
      );
      const inputMapping = this.entityManager.getComponent<InputMappingComponent>(
        entity.id,
        INPUT_MAPPING_COMPONENT
      );

      if (!receiver?.enabled || !inputState) continue;

      // Update input state from raw input
      this.updateEntityInputState(entity.id, inputState, inputMapping, deltaTime);

      // Process movement input and emit events
      this.processMovementInput(entity.id, inputState, inputMapping);

      // Process action input and emit events
      this.processActionInput(entity.id, inputMapping);
    }

    // Update key press times
    this.updateKeyPressTime(deltaTime);

    // Clear just-pressed/released keys at end of frame
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  }

  public shutdown(): void {
    console.log('🛑 Input system shutdown');

    // Remove event listeners
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('wheel', this.boundMouseWheel);
    window.removeEventListener('gamepadconnected', this.boundGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.boundGamepadDisconnected);

    // Clear state
    this.keys.clear();
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.keyPressTime.clear();
    this.mouseButtons.clear();
    this.gamepads.clear();
    this.lastMovementState.clear();
  }

  // Event handlers
  private onKeyDown(event: KeyboardEvent): void {
    const wasPressed = this.keys.get(event.code) || false;

    if (!wasPressed) {
      this.keysJustPressed.add(event.code);
      this.keyPressTime.set(event.code, 0);

      // Emit key pressed event for input entities
      this.emitKeyEventToInputEntities(event.code, event.key, 'pressed', event.repeat);

      // Handle UI key mapping
      this.handleUIKeyInput(event.code, event.key);
    }

    this.keys.set(event.code, true);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.set(event.code, false);
    this.keysJustReleased.add(event.code);
    this.keyPressTime.delete(event.code);

    // Emit key released event for input entities
    this.emitKeyEventToInputEntities(event.code, event.key, 'released');
  }

  private onMouseMove(event: MouseEvent): void {
    this.lastMousePosition = { ...this.mousePosition };
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;

    const deltaX = this.mousePosition.x - this.lastMousePosition.x;
    const deltaY = this.mousePosition.y - this.lastMousePosition.y;

    // Emit mouse move event
    this.eventBus.emit(
      InputEventFactory.createMouseMove(
        this.mousePosition.x,
        this.mousePosition.y,
        this.mousePosition.x, // TODO: Convert to world coordinates via camera
        this.mousePosition.y,
        deltaX,
        deltaY
      )
    );
  }

  private onMouseDown(event: MouseEvent): void {
    this.mouseButtons.set(event.button, true);
    // TODO: Emit mouse click event
  }

  private onMouseUp(event: MouseEvent): void {
    this.mouseButtons.set(event.button, false);
  }

  private onMouseWheel(event: WheelEvent): void {
    // TODO: Emit mouse wheel event
    event.preventDefault();
  }

  private onGamepadConnected(event: GamepadEvent): void {
    console.log('🎮 Gamepad connected:', event.gamepad.id);
    this.gamepads.set(event.gamepad.index, event.gamepad);

    this.eventBus.emitEvent(INPUT_EVENT_TYPES.GAMEPAD_CONNECTED, {
      gamepadIndex: event.gamepad.index,
      gamepadId: event.gamepad.id,
      timestamp: Date.now(),
    });
  }

  private onGamepadDisconnected(event: GamepadEvent): void {
    console.log('🎮 Gamepad disconnected:', event.gamepad.index);
    this.gamepads.delete(event.gamepad.index);

    this.eventBus.emitEvent(INPUT_EVENT_TYPES.GAMEPAD_DISCONNECTED, {
      gamepadIndex: event.gamepad.index,
      timestamp: Date.now(),
    });
  }

  // Update methods
  private updateGamepads(): void {
    // Get fresh gamepad state
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        this.gamepads.set(i, gamepad);
      }
    }
  }

  private updateEntityInputState(
    entityId: string,
    inputState: InputStateComponent,
    inputMapping: InputMappingComponent | null,
    deltaTime: number
  ): void {
    // Update movement state
    const mapping = inputMapping?.keyBindings || {};

    inputState.movement.up = this.isActionPressed('moveUp', mapping);
    inputState.movement.down = this.isActionPressed('moveDown', mapping);
    inputState.movement.left = this.isActionPressed('moveLeft', mapping);
    inputState.movement.right = this.isActionPressed('moveRight', mapping);

    // Calculate movement magnitude
    const movementVector = {
      x: (inputState.movement.right ? 1 : 0) - (inputState.movement.left ? 1 : 0),
      y: (inputState.movement.down ? 1 : 0) - (inputState.movement.up ? 1 : 0),
    };

    inputState.movement.magnitude = Math.sqrt(
      movementVector.x * movementVector.x + movementVector.y * movementVector.y
    );

    // Normalize diagonal movement
    if (inputState.movement.magnitude > 1) {
      inputState.movement.magnitude = 1;
    }

    // Update mouse state
    inputState.mouse.x = this.mousePosition.x;
    inputState.mouse.y = this.mousePosition.y;
    inputState.mouse.worldX = this.mousePosition.x; // TODO: Convert via camera
    inputState.mouse.worldY = this.mousePosition.y;

    // Update key states
    for (const [keyCode, pressed] of this.keys.entries()) {
      if (!inputState.keys[keyCode]) {
        inputState.keys[keyCode] = {
          pressed: false,
          justPressed: false,
          justReleased: false,
          pressTime: 0,
        };
      }

      const keyState = inputState.keys[keyCode];
      keyState.justPressed = this.keysJustPressed.has(keyCode);
      keyState.justReleased = this.keysJustReleased.has(keyCode);
      keyState.pressed = pressed;

      if (pressed) {
        keyState.pressTime += deltaTime;
      } else {
        keyState.pressTime = 0;
      }
    }

    // Update gamepad state if available
    // TODO: Implement gamepad state updates
  }

  private processMovementInput(
    entityId: string,
    inputState: InputStateComponent,
    _inputMapping: InputMappingComponent | null
  ): void {
    const movementVector = {
      x: (inputState.movement.right ? 1 : 0) - (inputState.movement.left ? 1 : 0),
      y: (inputState.movement.down ? 1 : 0) - (inputState.movement.up ? 1 : 0),
    };

    const magnitude = inputState.movement.magnitude;
    const lastMovement = this.lastMovementState.get(entityId);

    // Check if movement changed
    const movementChanged =
      !lastMovement ||
      lastMovement.x !== movementVector.x ||
      lastMovement.y !== movementVector.y ||
      Math.abs(lastMovement.magnitude - magnitude) > 0.01;

    if (movementChanged) {
      // Store current state
      this.lastMovementState.set(entityId, {
        x: movementVector.x,
        y: movementVector.y,
        magnitude,
      });

      // Emit movement event
      this.eventBus.emit(
        InputEventFactory.createMovementInput(entityId as any, movementVector, magnitude)
      );

      // Emit start/stop events
      if (magnitude > 0 && (!lastMovement || lastMovement.magnitude === 0)) {
        this.eventBus.emitEvent(INPUT_EVENT_TYPES.MOVEMENT_START, {
          entityId: entityId as any,
          direction: movementVector,
          timestamp: Date.now(),
        });
      } else if (magnitude === 0 && lastMovement && lastMovement.magnitude > 0) {
        this.eventBus.emitEvent(INPUT_EVENT_TYPES.MOVEMENT_STOP, {
          entityId: entityId as any,
          timestamp: Date.now(),
        });
      }
    }
  }

  private processActionInput(entityId: string, inputMapping: InputMappingComponent | null): void {
    if (!inputMapping) return;

    // Check for action key presses
    for (const [actionName, binding] of Object.entries(inputMapping.keyBindings)) {
      if (binding.type === 'key') {
        const justPressed =
          this.keysJustPressed.has(binding.primary) ||
          (binding.secondary && this.keysJustPressed.has(binding.secondary));

        const justReleased =
          this.keysJustReleased.has(binding.primary) ||
          (binding.secondary && this.keysJustReleased.has(binding.secondary));

        if (justPressed) {
          this.eventBus.emit(
            InputEventFactory.createAction(entityId as any, actionName, 'key', binding.primary)
          );

          this.eventBus.emitEvent(INPUT_EVENT_TYPES.ACTION_START, {
            entityId: entityId as any,
            action: actionName,
            inputType: 'key' as const,
            inputCode: binding.primary,
            timestamp: Date.now(),
          });
        }

        if (justReleased) {
          this.eventBus.emitEvent(INPUT_EVENT_TYPES.ACTION_STOP, {
            entityId: entityId as any,
            action: actionName,
            inputType: 'key' as const,
            inputCode: binding.primary,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  // Helper methods
  private isActionPressed(
    actionName: string,
    keyBindings: InputMappingComponent['keyBindings']
  ): boolean {
    const binding = keyBindings[actionName];
    if (!binding || binding.type !== 'key') return false;

    return (
      (this.keys.get(binding.primary) ?? false) ||
      (binding.secondary ? (this.keys.get(binding.secondary) ?? false) : false)
    );
  }

  private emitKeyEventToInputEntities(
    keyCode: string,
    key: string,
    type: 'pressed' | 'released',
    repeat: boolean = false
  ): void {
    const inputEntities = this.entityManager.query({
      with: [INPUT_RECEIVER_COMPONENT],
    });

    for (const entity of inputEntities) {
      const receiver = this.entityManager.getComponent<InputReceiverComponent>(
        entity.id,
        INPUT_RECEIVER_COMPONENT
      );

      if (receiver?.enabled) {
        if (type === 'pressed') {
          this.eventBus.emit(
            InputEventFactory.createKeyPressed(entity.id as any, keyCode, key, repeat)
          );
        } else {
          this.eventBus.emit(InputEventFactory.createKeyReleased(entity.id as any, keyCode, key));
        }
      }
    }
  }

  private handleUIKeyInput(keyCode: string, key: string): void {
    // Map key codes to UI actions
    const uiActionMap: Record<string, UIKeyEvent['data']['action']> = {
      Escape: 'pause',
      KeyR: 'restart',
      Digit1: 'upgrade1',
      Digit2: 'upgrade2',
      Digit3: 'upgrade3',
      Space: 'interact',
      Enter: 'interact',
      F1: 'toggleDebug',
      Tab: 'cycleWeapon',
    };

    const action = uiActionMap[keyCode];
    if (action) {
      this.eventBus.emit(InputEventFactory.createUIKey(keyCode, key, action));
    }
  }

  private updateKeyPressTime(deltaTime: number): void {
    for (const [keyCode, pressTime] of this.keyPressTime.entries()) {
      if (this.keys.get(keyCode)) {
        this.keyPressTime.set(keyCode, pressTime + deltaTime);
      }
    }
  }

  // Public query methods for immediate input state access
  public isKeyPressed(keyCode: string): boolean {
    return this.keys.get(keyCode) === true;
  }

  public isKeyJustPressed(keyCode: string): boolean {
    return this.keysJustPressed.has(keyCode);
  }

  public isKeyJustReleased(keyCode: string): boolean {
    return this.keysJustReleased.has(keyCode);
  }

  public getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.get(button) === true;
  }
}
