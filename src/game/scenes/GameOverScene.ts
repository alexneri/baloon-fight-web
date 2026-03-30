import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { Scene } from '../../engine/SceneManager.js';
import type { SceneId } from '../../types/index.js';
import { COLORS, STORAGE_KEYS } from '../data/constants.js';

export interface GameOverData {
  score: number;
  hiScore: number;
  phase: number;
  isNewHi: boolean;
}

export class GameOverScene implements Scene {
  readonly id: SceneId = 'GAME_OVER';
  private container = new Container();

  constructor(
    private readonly data: GameOverData,
    private readonly navigate: (to: SceneId) => void,
  ) {}

  init(app: Application): void {
    app.stage.addChild(this.container);
    this.build(app);
  }

  private build(app: Application): void {
    const W = app.screen.width;

    const panel = new Graphics()
      .rect(W / 2 - 100, 60, 200, 140)
      .fill({ color: COLORS.SURFACE, alpha: 0.97 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.container.addChild(panel);

    const header = new Text({
      text: 'GAME OVER',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 12, fill: COLORS.RED }),
    });
    header.anchor.set(0.5, 0);
    header.x = W / 2;
    header.y = 70;
    this.container.addChild(header);

    const scoreLabel = new Text({
      text: `SCORE  ${String(this.data.score).padStart(7, '0')}`,
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: COLORS.WHITE }),
    });
    scoreLabel.anchor.set(0.5, 0);
    scoreLabel.x = W / 2;
    scoreLabel.y = 100;
    this.container.addChild(scoreLabel);

    if (this.data.isNewHi) {
      const newBest = new Text({
        text: 'NEW BEST!',
        style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 9, fill: COLORS.GREEN }),
      });
      newBest.anchor.set(0.5, 0);
      newBest.x = W / 2;
      newBest.y = 118;
      this.container.addChild(newBest);
    }

    const phaseLabel = new Text({
      text: `PHASE  ${this.data.phase}`,
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: COLORS.GREY }),
    });
    phaseLabel.anchor.set(0.5, 0);
    phaseLabel.x = W / 2;
    phaseLabel.y = 136;
    this.container.addChild(phaseLabel);

    // Buttons
    this.addBtn(app, 'PLAY AGAIN', W / 2 - 54, 165, () => this.navigate('GAME'));
    this.addBtn(app, 'MENU',       W / 2 + 4,  165, () => this.navigate('MENU'));
  }

  private addBtn(app: Application, label: string, x: number, y: number, cb: () => void): void {
    const W = app.screen.width;
    void W; // unused but keep for consistency
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics()
      .rect(x, y, 50, 20)
      .fill(COLORS.SURFACE)
      .stroke({ color: COLORS.BORDER, width: 2 });

    const txt = new Text({
      text: label,
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.WHITE }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = x + 25;
    txt.y = y + 10;

    btn.addChild(bg);
    btn.addChild(txt);
    btn.on('pointerdown', cb);
    this.container.addChild(btn);
  }

  update(_delta: number, _elapsed: number): void {}
  render(_alpha: number): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
