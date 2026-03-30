import { Container, Graphics, Text } from 'pixi.js';
import type { InputManager } from '../../engine/InputManager.js';
import type { InputAction } from '../../types/index.js';
import { PHYSICS } from '../data/constants.js';

interface TouchBtn {
  gfx: Graphics;
  action: InputAction;
}

export class TouchControls extends Container {
  private buttons: TouchBtn[] = [];
  private activePointers = new Map<number, InputAction>();

  constructor(private readonly input: InputManager) {
    super();
    this.visible = false;
    this.eventMode = 'static';

    const W = PHYSICS.GAME_WIDTH;
    const H = PHYSICS.GAME_HEIGHT;
    const btnY = H - 52;

    this.addBtn('LEFT',  4,       btnY, 48, 44, '◀');
    this.addBtn('RIGHT', 56,      btnY, 48, 44, '▶');
    this.addBtn('FLAP',  W - 56,  btnY, 52, 44, 'FLAP');

    this.on('pointerdown',  this.onDown);
    this.on('pointermove',  this.onMove);
    this.on('pointerup',    this.onUp);
    this.on('pointerupoutside', this.onUp);
    this.on('pointercancel', this.onUp);
  }

  show(): void { this.visible = true; }
  hide(): void {
    this.visible = false;
    this.clearAll();
  }

  private addBtn(action: InputAction, x: number, y: number, w: number, h: number, label: string): void {
    const gfx = new Graphics()
      .roundRect(x, y, w, h, 4)
      .fill({ color: 0xffffff, alpha: 0.25 })
      .stroke({ color: 0xffffff, alpha: 0.5, width: 2 });

    const txt = new Text({ text: label, style: { fontFamily: 'monospace', fontSize: 10, fill: 0xffffff } });
    txt.anchor.set(0.5);
    txt.x = x + w / 2;
    txt.y = y + h / 2;

    this.addChild(gfx);
    this.addChild(txt);
    this.buttons.push({ gfx, action });
  }

  private onDown = (e: { pointerId: number; global: { x: number; y: number } }): void => {
    const action = this.actionAt(e.global.x, e.global.y);
    if (action) {
      this.activePointers.set(e.pointerId, action);
      this.input.setTouchAction(action, true);
    }
  };

  private onMove = (e: { pointerId: number; global: { x: number; y: number } }): void => {
    const prev = this.activePointers.get(e.pointerId);
    const next = this.actionAt(e.global.x, e.global.y);
    if (prev !== next) {
      if (prev) this.input.setTouchAction(prev, false);
      if (next) {
        this.activePointers.set(e.pointerId, next);
        this.input.setTouchAction(next, true);
      } else {
        this.activePointers.delete(e.pointerId);
      }
    }
  };

  private onUp = (e: { pointerId: number }): void => {
    const action = this.activePointers.get(e.pointerId);
    if (action) this.input.setTouchAction(action, false);
    this.activePointers.delete(e.pointerId);
  };

  private clearAll(): void {
    for (const action of this.activePointers.values()) {
      this.input.setTouchAction(action, false);
    }
    this.activePointers.clear();
  }

  private actionAt(gx: number, gy: number): InputAction | null {
    // Convert global coords to local
    const local = this.toLocal({ x: gx, y: gy });
    for (const btn of this.buttons) {
      const b = btn.gfx.getBounds();
      if (local.x >= b.x && local.x <= b.x + b.width &&
          local.y >= b.y && local.y <= b.y + b.height) {
        return btn.action;
      }
    }
    return null;
  }
}
