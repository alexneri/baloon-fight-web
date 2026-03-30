import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { Scene } from '../../engine/SceneManager.js';
import type { SceneId } from '../../types/index.js';
import type { LeaderboardEntry } from '../../types/index.js';
import { COLORS, STORAGE_KEYS } from '../data/constants.js';
import { fetchLeaderboard } from '../../api/leaderboard.js';

export class LeaderboardScene implements Scene {
  readonly id: SceneId = 'LEADERBOARD';
  private container = new Container();

  constructor(private readonly navigate: (to: SceneId) => void) {}

  init(app: Application): void {
    app.stage.addChild(this.container);
    this.buildLoading(app);
    void this.loadEntries(app);
  }

  private buildLoading(app: Application): void {
    const W = app.screen.width;
    const txt = new Text({
      text: 'LOADING...',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 9, fill: COLORS.GREY }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = W / 2;
    txt.y = 120;
    this.container.addChild(txt);
  }

  private async loadEntries(app: Application): Promise<void> {
    const result = await fetchLeaderboard();
    this.container.removeChildren();

    const W = app.screen.width;
    const entries: LeaderboardEntry[] = result.ok ? result.value : this.localEntries();

    const panel = new Graphics()
      .rect(W / 2 - 110, 10, 220, 210)
      .fill({ color: COLORS.SURFACE, alpha: 0.97 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.container.addChild(panel);

    const title = new Text({
      text: 'LEADERBOARD',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 9, fill: COLORS.ACCENT }),
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = 18;
    this.container.addChild(title);

    entries.slice(0, 8).forEach((e, i) => {
      const row = new Text({
        text: `${String(e.rank).padStart(2)} ${e.name.padEnd(3)} ${String(e.score).padStart(7, '0')}`,
        style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: i === 0 ? COLORS.ACCENT : COLORS.WHITE }),
      });
      row.x = W / 2 - 100;
      row.y = 38 + i * 20;
      this.container.addChild(row);
    });

    if (!result.ok) {
      const warn = new Text({
        text: 'Could not load scores.',
        style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.RED }),
      });
      warn.anchor.set(0.5, 0);
      warn.x = W / 2;
      warn.y = 195;
      this.container.addChild(warn);
    }

    // Back button
    const back = new Container();
    back.eventMode = 'static';
    back.cursor = 'pointer';
    const backBg = new Graphics().rect(W / 2 - 30, 208, 60, 18).fill(COLORS.SURFACE).stroke({ color: COLORS.BORDER, width: 2 });
    const backTxt = new Text({ text: '← BACK', style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.WHITE }) });
    backTxt.anchor.set(0.5, 0.5);
    backTxt.x = W / 2;
    backTxt.y = 217;
    back.addChild(backBg, backTxt);
    back.on('pointerdown', () => this.navigate('MENU'));
    this.container.addChild(back);
  }

  private localEntries(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
    } catch {
      return [];
    }
  }

  update(_delta: number, _elapsed: number): void {}
  render(_alpha: number): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
