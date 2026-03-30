import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, STORAGE_KEYS } from '../data/constants.js';
import { fetchLeaderboard } from '../../api/leaderboard.js';
import type { LeaderboardEntry, SceneId } from '../../types/index.js';

export class LeaderboardView extends Container {
  constructor(
    private readonly W: number,
    private readonly navigate: (to: SceneId) => void,
  ) {
    super();
    this.buildLoading();
    void this.load();
  }

  private buildLoading(): void {
    const txt = new Text({
      text: 'LOADING...',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 9, fill: COLORS.GREY }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = this.W / 2;
    txt.y = 120;
    this.addChild(txt);
  }

  private async load(): Promise<void> {
    const result = await fetchLeaderboard();
    this.removeChildren();
    const entries: LeaderboardEntry[] = result.ok ? result.value : this.localEntries();
    this.buildContent(entries, !result.ok);
  }

  private buildContent(entries: LeaderboardEntry[], failed: boolean): void {
    const cx = this.W / 2;
    const panel = new Graphics()
      .rect(cx - 110, 10, 220, 210)
      .fill({ color: COLORS.SURFACE, alpha: 0.97 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.addChild(panel);

    const title = new Text({
      text: 'LEADERBOARD',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 9, fill: COLORS.ACCENT }),
    });
    title.anchor.set(0.5, 0);
    title.x = cx;
    title.y = 18;
    this.addChild(title);

    entries.slice(0, 8).forEach((e, i) => {
      const row = new Text({
        text: `${String(e.rank).padStart(2)} ${e.name.padEnd(3)} ${String(e.score).padStart(7, '0')}`,
        style: new TextStyle({
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          fill: i === 0 ? COLORS.ACCENT : COLORS.WHITE,
        }),
      });
      row.x = cx - 100;
      row.y = 38 + i * 20;
      this.addChild(row);
    });

    if (failed) {
      const warn = new Text({
        text: 'Could not load scores. Try again.',
        style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 6, fill: COLORS.RED }),
      });
      warn.anchor.set(0.5, 0);
      warn.x = cx;
      warn.y = 195;
      this.addChild(warn);
    }

    const back = new Container();
    back.eventMode = 'static';
    back.cursor = 'pointer';
    const backBg = new Graphics().rect(cx - 30, 208, 60, 18).fill(COLORS.SURFACE).stroke({ color: COLORS.BORDER, width: 2 });
    const backTxt = new Text({
      text: '← BACK',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.WHITE }),
    });
    backTxt.anchor.set(0.5, 0.5);
    backTxt.x = cx;
    backTxt.y = 217;
    back.addChild(backBg, backTxt);
    back.on('pointerdown', () => this.navigate('MENU'));
    this.addChild(back);
  }

  private localEntries(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
    } catch {
      return [];
    }
  }
}
