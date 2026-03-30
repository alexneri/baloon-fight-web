import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../data/constants.js';
import type { SceneId } from '../../types/index.js';

export interface GameOverData {
  score: number;
  hiScore: number;
  phase: number;
  isNewHi: boolean;
}

export class GameOverScreen extends Container {
  constructor(
    private readonly W: number,
    data: GameOverData,
    navigate: (to: SceneId) => void,
  ) {
    super();
    this.build(data, navigate);
  }

  private build(data: GameOverData, navigate: (to: SceneId) => void): void {
    const cx = this.W / 2;

    const panel = new Graphics()
      .rect(cx - 100, 60, 200, 130)
      .fill({ color: COLORS.SURFACE, alpha: 0.97 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.addChild(panel);

    const header = new Text({
      text: 'GAME OVER',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 12, fill: COLORS.RED }),
    });
    header.anchor.set(0.5, 0);
    header.x = cx;
    header.y = 70;
    this.addChild(header);

    const scoreLabel = new Text({
      text: `SCORE  ${String(data.score).padStart(7, '0')}`,
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: COLORS.WHITE }),
    });
    scoreLabel.anchor.set(0.5, 0);
    scoreLabel.x = cx;
    scoreLabel.y = 100;
    this.addChild(scoreLabel);

    if (data.isNewHi) {
      const newBest = new Text({
        text: 'NEW BEST!',
        style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 9, fill: COLORS.GREEN }),
      });
      newBest.anchor.set(0.5, 0);
      newBest.x = cx;
      newBest.y = 118;
      this.addChild(newBest);
    }

    const phaseLabel = new Text({
      text: `PHASE  ${data.phase}`,
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: COLORS.GREY }),
    });
    phaseLabel.anchor.set(0.5, 0);
    phaseLabel.x = cx;
    phaseLabel.y = data.isNewHi ? 136 : 118;
    this.addChild(phaseLabel);

    this.addBtn('PLAY AGAIN', cx - 54, 165, () => navigate('GAME'));
    this.addBtn('MENU',       cx + 4,  165, () => navigate('MENU'));
  }

  private addBtn(label: string, x: number, y: number, cb: () => void): void {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    const bg = new Graphics().rect(x, y, 50, 20).fill(COLORS.SURFACE).stroke({ color: COLORS.BORDER, width: 2 });
    const txt = new Text({
      text: label,
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.WHITE }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = x + 25;
    txt.y = y + 10;
    btn.addChild(bg, txt);
    btn.on('pointerdown', cb);
    this.addChild(btn);
  }
}
