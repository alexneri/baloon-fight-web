import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { Scene } from '../../engine/SceneManager.js';
import type { SceneId } from '../../types/index.js';
import { COLORS, STORAGE_KEYS } from '../data/constants.js';

type MenuAction = 'play' | 'leaderboard' | 'howto' | 'settings';

interface MenuItem {
  action: MenuAction;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { action: 'play',        label: '▶ PLAY' },
  { action: 'leaderboard', label: '★ LEADERBOARD' },
  { action: 'howto',       label: '? HOW TO PLAY' },
  { action: 'settings',    label: '⚙ SETTINGS' },
];

export class MenuScene implements Scene {
  readonly id: SceneId = 'MENU';
  private container = new Container();
  private selectedIdx = 0;
  private onNavigate!: (to: SceneId) => void;
  private hiScore = 0;

  constructor(navigate: (to: SceneId) => void) {
    this.onNavigate = navigate;
    this.hiScore = parseInt(localStorage.getItem(STORAGE_KEYS.HI_SCORE) ?? '0', 10);
  }

  init(app: Application): void {
    app.stage.addChild(this.container);
    this.build(app);
  }

  private build(app: Application): void {
    this.container.removeChildren();
    const W = app.screen.width;
    const H = app.screen.height;

    // Background panel
    const panel = new Graphics()
      .rect(W / 2 - 90, 20, 180, 200)
      .fill({ color: COLORS.SURFACE, alpha: 0.95 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.container.addChild(panel);

    // Title
    const title = new Text({
      text: 'BALLOON FIGHT',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 10, fill: COLORS.ACCENT }),
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = 32;
    this.container.addChild(title);

    // Hi-score
    const hi = new Text({
      text: `HI: ${String(this.hiScore).padStart(7, '0')}`,
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: COLORS.WHITE }),
    });
    hi.anchor.set(0.5, 0);
    hi.x = W / 2;
    hi.y = 52;
    this.container.addChild(hi);

    // Menu items
    MENU_ITEMS.forEach((item, i) => {
      const itemContainer = new Container();
      itemContainer.eventMode = 'static';
      itemContainer.cursor = 'pointer';

      const bg = new Graphics()
        .rect(W / 2 - 80, 75 + i * 28, 160, 24)
        .fill({ color: i === this.selectedIdx ? COLORS.ACCENT : COLORS.SURFACE, alpha: i === this.selectedIdx ? 0.2 : 0 });

      const label = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 9,
          fill: i === this.selectedIdx ? COLORS.ACCENT : COLORS.WHITE,
        }),
      });
      label.anchor.set(0.5, 0.5);
      label.x = W / 2;
      label.y = 75 + i * 28 + 12;

      itemContainer.addChild(bg);
      itemContainer.addChild(label);
      itemContainer.on('pointerdown', () => this.selectItem(item.action));
      this.container.addChild(itemContainer);
    });
  }

  private selectItem(action: MenuAction): void {
    const map: Record<MenuAction, SceneId> = {
      play: 'GAME',
      leaderboard: 'LEADERBOARD',
      howto: 'HOW_TO_PLAY',
      settings: 'SETTINGS',
    };
    this.onNavigate(map[action]);
  }

  update(_delta: number, _elapsed: number): void {}
  render(_alpha: number): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
