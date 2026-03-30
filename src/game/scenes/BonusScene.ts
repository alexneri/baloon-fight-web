import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { Scene } from '../../engine/SceneManager.js';
import type { SceneId } from '../../types/index.js';
import type { AudioManager } from '../../engine/AudioManager.js';
import { COLORS, PHYSICS, SCORE } from '../data/constants.js';

interface BalloonTarget {
  x: number;
  y: number;
  caught: boolean;
  gfx: Graphics;
}

export class BonusScene implements Scene {
  readonly id: SceneId = 'BONUS';
  private container = new Container();
  private balloons: BalloonTarget[] = [];
  private timer = 0;
  private score = 0;
  private onComplete!: (pts: number) => void;
  private app!: Application;
  private elapsed = 0;

  constructor(
    private readonly audio: AudioManager,
    private readonly navigate: (to: SceneId) => void,
    onComplete: (pts: number) => void,
  ) {
    this.onComplete = onComplete;
  }

  init(app: Application): void {
    this.app = app;
    app.stage.addChild(this.container);
    this.buildScene(app);
  }

  private buildScene(app: Application): void {
    const W = app.screen.width;
    const H = app.screen.height;

    const bg = new Graphics().rect(0, 0, W, H).fill({ color: COLORS.SKY, alpha: 0.8 });
    this.container.addChild(bg);

    const title = new Text({
      text: 'BONUS STAGE!',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 12, fill: COLORS.ACCENT }),
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = 20;
    this.container.addChild(title);

    const sub = new Text({
      text: 'Catch all balloons!',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: COLORS.WHITE }),
    });
    sub.anchor.set(0.5, 0);
    sub.x = W / 2;
    sub.y = 42;
    this.container.addChild(sub);

    // Spawn 8 balloons at random positions
    for (let i = 0; i < 8; i++) {
      const x = 30 + Math.random() * (W - 60);
      const y = 70 + Math.random() * (H - 120);
      const gfx = new Graphics().circle(0, 0, 10).fill(COLORS.ACCENT);
      gfx.x = x;
      gfx.y = y;
      gfx.eventMode = 'static';
      gfx.cursor = 'pointer';
      const balloon: BalloonTarget = { x, y, caught: false, gfx };
      gfx.on('pointerdown', () => this.catchBalloon(balloon));
      this.container.addChild(gfx);
      this.balloons.push(balloon);
    }
  }

  private catchBalloon(b: BalloonTarget): void {
    if (b.caught) return;
    b.caught = true;
    b.gfx.visible = false;
    this.score += SCORE.BONUS_CATCH;
    this.audio.play('bonus_catch');

    if (this.balloons.every((bln) => bln.caught)) {
      this.finish();
    }
  }

  private finish(): void {
    this.onComplete(this.score);
    this.navigate('GAME');
  }

  update(delta: number, _elapsed: number): void {
    this.elapsed += delta;
    if (this.elapsed > PHYSICS.BONUS_STAGE_DURATION_MS) {
      this.finish();
    }
  }

  render(_alpha: number): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
