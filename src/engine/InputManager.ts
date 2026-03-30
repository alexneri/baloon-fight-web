import type { InputAction } from '../types/index.js';

const KEY_MAP: Record<string, InputAction> = {
  ArrowLeft:  'LEFT',
  KeyA:       'LEFT',
  ArrowRight: 'RIGHT',
  KeyD:       'RIGHT',
  ArrowUp:    'FLAP',
  KeyZ:       'FLAP',
  Space:      'FLAP',
  KeyP:       'PAUSE',
  Escape:     'PAUSE',
  Enter:      'CONFIRM',
  KeyM:       'MUTE',
};

export class InputManager {
  private held = new Set<InputAction>();
  private pressed = new Set<InputAction>();
  private prevGamepad = { left: false, right: false, flap: false, pause: false };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** Call once per frame AFTER reading, to clear just-pressed state */
  clearFrame(): void {
    this.pressed.clear();
  }

  isDown(action: InputAction): boolean {
    return this.held.has(action);
  }

  wasPressed(action: InputAction): boolean {
    return this.pressed.has(action);
  }

  /** Inject touch state from TouchControls overlay */
  setTouchAction(action: InputAction, down: boolean): void {
    if (down) {
      this.held.add(action);
    } else {
      this.held.delete(action);
    }
  }

  /** Call once per frame to poll gamepad */
  pollGamepad(): void {
    const gamepads = navigator.getGamepads();
    let gp: Gamepad | null = null;
    for (const g of gamepads) {
      if (g) { gp = g; break; }
    }
    if (!gp) {
      this.prevGamepad = { left: false, right: false, flap: false, pause: false };
      return;
    }

    const lx = (gp.axes[0] ?? 0);
    const cur = {
      left:  !!(gp.buttons[14]?.pressed) || lx < -0.3,
      right: !!(gp.buttons[15]?.pressed) || lx > 0.3,
      flap:  !!(gp.buttons[0]?.pressed),
      pause: !!(gp.buttons[9]?.pressed),
    };

    if (cur.left)  this.held.add('LEFT');  else this.held.delete('LEFT');
    if (cur.right) this.held.add('RIGHT'); else this.held.delete('RIGHT');
    if (cur.flap)  this.held.add('FLAP');  else this.held.delete('FLAP');

    if (cur.pause && !this.prevGamepad.pause) this.pressed.add('PAUSE');
    if (cur.flap  && !this.prevGamepad.flap)  this.pressed.add('FLAP');

    this.prevGamepad = cur;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    if (!this.held.has(action)) this.pressed.add(action);
    this.held.add(action);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const action = KEY_MAP[e.code];
    if (action) this.held.delete(action);
  };
}
