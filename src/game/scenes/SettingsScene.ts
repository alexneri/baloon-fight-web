import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { Scene } from '../../engine/SceneManager.js';
import type { SceneId } from '../../types/index.js';
import type { AudioManager } from '../../engine/AudioManager.js';
import { COLORS, STORAGE_KEYS } from '../data/constants.js';

export class SettingsScene implements Scene {
  readonly id: SceneId = 'SETTINGS';
  private container = new Container();

  constructor(
    private readonly audio: AudioManager,
    private readonly navigate: (to: SceneId) => void,
  ) {}

  init(app: Application): void {
    app.stage.addChild(this.container);
    this.build(app);
  }

  private build(app: Application): void {
    const W = app.screen.width;

    const panel = new Graphics()
      .rect(W / 2 - 110, 20, 220, 190)
      .fill({ color: COLORS.SURFACE, alpha: 0.97 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.container.addChild(panel);

    const title = new Text({
      text: 'SETTINGS',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 10, fill: COLORS.ACCENT }),
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = 30;
    this.container.addChild(title);

    const rows: Array<{ label: string; value: string }> = [
      { label: 'MUTE',   value: this.audio.isMuted() ? 'ON' : 'OFF' },
      { label: 'VOLUME', value: `${Math.round(this.audio.getVolume() * 100)}%` },
      { label: 'MUSIC',  value: this.audio.isMusicEnabled() ? 'ON' : 'OFF' },
    ];

    rows.forEach((row, i) => {
      const lbl = new Text({
        text: `${row.label}: ${row.value}`,
        style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: COLORS.WHITE }),
      });
      lbl.anchor.set(0, 0.5);
      lbl.x = W / 2 - 90;
      lbl.y = 70 + i * 30;
      this.container.addChild(lbl);
    });

    const note = new Text({
      text: 'Use browser controls\nto adjust audio.',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.GREY, align: 'center' }),
    });
    note.anchor.set(0.5, 0);
    note.x = W / 2;
    note.y = 155;
    this.container.addChild(note);

    const back = new Container();
    back.eventMode = 'static';
    back.cursor = 'pointer';
    const backBg = new Graphics().rect(W / 2 - 30, 194, 60, 16).fill(COLORS.SURFACE).stroke({ color: COLORS.BORDER, width: 2 });
    const backTxt = new Text({ text: '← BACK', style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 7, fill: COLORS.WHITE }) });
    backTxt.anchor.set(0.5, 0.5);
    backTxt.x = W / 2;
    backTxt.y = 202;
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
