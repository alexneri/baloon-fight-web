import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../data/constants.js';
import type { SceneId } from '../../types/index.js';

type MenuAction = 'play' | 'leaderboard' | 'howto' | 'settings';

const ITEMS: Array<{ action: MenuAction; label: string }> = [
  { action: 'play',        label: '▶ PLAY' },
  { action: 'leaderboard', label: '★ LEADERBOARD' },
  { action: 'howto',       label: '? HOW TO PLAY' },
  { action: 'settings',    label: '⚙ SETTINGS' },
];

const ACTION_MAP: Record<MenuAction, SceneId> = {
  play:        'GAME',
  leaderboard: 'LEADERBOARD',
  howto:       'HOW_TO_PLAY',
  settings:    'SETTINGS',
};

export class MainMenu extends Container {
  private selectedIdx = 0;

  constructor(
    private readonly W: number,
    private readonly navigate: (to: SceneId) => void,
  ) {
    super();
    this.build();
  }

  private build(): void {
    this.removeChildren();
    ITEMS.forEach((item, i) => {
      const row = new Container();
      row.eventMode = 'static';
      row.cursor = 'pointer';

      const bg = new Graphics()
        .rect(this.W / 2 - 80, 75 + i * 28, 160, 24)
        .fill({ color: COLORS.ACCENT, alpha: i === this.selectedIdx ? 0.2 : 0 });

      const label = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 9,
          fill: i === this.selectedIdx ? COLORS.ACCENT : COLORS.WHITE,
        }),
      });
      label.anchor.set(0.5, 0.5);
      label.x = this.W / 2;
      label.y = 75 + i * 28 + 12;

      row.addChild(bg, label);
      row.on('pointerdown', () => this.select(item.action));
      this.addChild(row);
    });
  }

  select(action: MenuAction): void {
    this.navigate(ACTION_MAP[action]);
  }

  moveSelection(dir: 1 | -1): void {
    this.selectedIdx = (this.selectedIdx + dir + ITEMS.length) % ITEMS.length;
    this.build();
  }

  confirm(): void {
    const item = ITEMS[this.selectedIdx];
    if (item) this.select(item.action);
  }
}
