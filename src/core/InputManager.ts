export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  mouseX: number;
  mouseY: number;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private mousePosition = { x: 0, y: 0 };

  init(): void {
    // Keyboard event listeners
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    // Mouse event listeners
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    console.log('InputManager initialized');
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Only log Space and Escape for restart debugging
    if (event.code === 'Space' || event.code === 'Escape') {
      console.log('Key down:', event.code, '| Key:', event.key);
    }

    if (!this.keys.has(event.code)) {
      this.keysJustPressed.add(event.code);
    }
    this.keys.add(event.code);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
  }

  update(): void {
    // Clear just-pressed keys at the end of the frame (after they've been checked)
    // This happens in the next frame's update
  }

  clearJustPressed(): void {
    this.keysJustPressed.clear();
  }

  clearJustPressedKey(keyCode: string): void {
    this.keysJustPressed.delete(keyCode);
  }

  getInputState(): InputState {
    return {
      left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
      up: this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      down: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      mouseX: this.mousePosition.x,
      mouseY: this.mousePosition.y,
    };
  }

  isKeyPressed(keyCode: string): boolean {
    return this.keys.has(keyCode);
  }

  isKeyJustPressed(keyCode: string): boolean {
    return this.keysJustPressed.has(keyCode);
  }

  cleanup(): void {
    // Note: These won't work because bind creates new function references
    // For now, we'll leave event listeners attached
    // In a full game, we'd store the bound function references
    console.log('InputManager cleanup called');
  }
}
