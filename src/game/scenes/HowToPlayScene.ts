import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { Scene } from '../../engine/SceneManager.js';
import type { SceneId } from '../../types/index.js';
import { COLORS } from '../data/constants.js';

export class HowToPlayScene implements Scene {
  readonly id: SceneId = 'HOW_TO_PLAY';
  private container = new Container();

  constructor(private readonly navigate: (to: SceneId) => void) {}

  init(app: Application): void {
    app.stage.addChild(this.container);
    const W = app.screen.width;

    const panel = new Graphics()
      .rect(W / 2 - 110, 10, 220, 215)
      .fill({ color: COLORS.SURFACE, alpha: 0.97 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.container.addChild(panel);

    const title = new Text({
      text: 'HOW TO PLAY',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 9, fill: COLORS.ACCENT }),
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = 18;
    this.container.addChild(title);

    const lines = [
      'FLY above enemies',
      'to pop their balloons!',
      '',
      '← →  Move',
      'Z / SPC  Flap',
      'P / ESC  Pause',
      'M  Mute',
      '',
      'Pop TWICE to defeat!',
      'Collect eggs for bonus.',
      'Avoid the FISH!',
    ];

    lines.forEach((line, i) => {
      const t = new Text({
        text: line,
        style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.WHITE }),
      });
      t.anchor.set(0.5, 0);
      t.x = W / 2;
      t.y = 42 + i * 16;
      this.container.addChild(t);
    });

    const back = new Container();
    back.eventMode = 'static';
    back.cursor = 'pointer';
    const backBg = new Graphics().rect(W / 2 - 30, 214, 60, 16).fill(COLORS.SURFACE).stroke({ color: COLORS.BORDER, width: 2 });
    const backTxt = new Text({ text: '← BACK', style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.WHITE }) });
    backTxt.anchor.set(0.5, 0.5);
    backTxt.x = W / 2;
    backTxt.y = 222;
    back.addChild(backBg, backTxt);
    back.on('pointerdown', () => this.navigate('MENU'));
    this.container.addChild(back);
  }

  update(_delta: number, _elapsed: number): void {}
  render(_alpha: number): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
