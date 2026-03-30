import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../data/constants.js';
import type { SceneId } from '../../types/index.js';

type PauseAction = 'resume' | 'restart' | 'menu' | 'mute';

interface MenuItem {
  action: PauseAction;
  label: string;
}

export class PauseMenu extends Container {
  private items: MenuItem[];
  private selectedIdx = 0;
  private readonly W: number;
  private readonly H: number;

  constructor(
    W: number,
    H: number,
    private readonly muted: boolean,
    private readonly onAction: (action: PauseAction, navigate: (to: SceneId) => void) => void,
    private readonly navigate: (to: SceneId) => void,
  ) {
    super();
    this.W = W;
    this.H = H;
    this.items = [
      { action: 'resume',  label: '▶ RESUME' },
      { action: 'restart', label: '↺ RESTART' },
      { action: 'menu',    label: '⌂ MAIN MENU' },
      { action: 'mute',    label: muted ? '🔊 UNMUTE' : '🔇 MUTE' },
    ];
    this.build();
  }

  private build(): void {
    this.removeChildren();
    const cx = this.W / 2;
    const cy = this.H / 2;

    const overlay = new Graphics().rect(0, 0, this.W, this.H).fill({ color: 0x000000, alpha: 0.6 });
    this.addChild(overlay);

    const panel = new Graphics()
      .rect(cx - 90, cy - 70, 180, 150)
      .fill({ color: COLORS.SURFACE, alpha: 0.97 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.addChild(panel);

    const title = new Text({
      text: 'PAUSED',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 10, fill: COLORS.ACCENT }),
    });
    title.anchor.set(0.5, 0);
    title.x = cx;
    title.y = cy - 58;
    this.addChild(title);

    this.items.forEach((item, i) => {
      const row = new Container();
      row.eventMode = 'static';
      row.cursor = 'pointer';

      const bg = new Graphics()
        .rect(cx - 80, cy - 32 + i * 28, 160, 22)
        .fill({ color: COLORS.ACCENT, alpha: i === this.selectedIdx ? 0.15 : 0 });

      const label = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8,
          fill: i === this.selectedIdx ? COLORS.ACCENT : COLORS.WHITE,
        }),
      });
      label.anchor.set(0.5, 0.5);
      label.x = cx;
      label.y = cy - 32 + i * 28 + 11;

      row.addChild(bg, label);
      row.on('pointerdown', () => this.onAction(item.action, this.navigate));
      this.addChild(row);
    });

    // Controls hint
    const hint = new Text({
      text: '← → Move  Z Flap  P Pause  M Mute',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 5, fill: COLORS.GREY }),
    });
    hint.anchor.set(0.5, 0);
    hint.x = cx;
    hint.y = cy + 82;
    this.addChild(hint);
  }

  moveSelection(dir: 1 | -1): void {
    this.selectedIdx = (this.selectedIdx + dir + this.items.length) % this.items.length;
    this.build();
  }

  confirm(): void {
    const item = this.items[this.selectedIdx];
    if (item) this.onAction(item.action, this.navigate);
  }
}
