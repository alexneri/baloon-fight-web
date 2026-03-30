import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, STORAGE_KEYS } from '../data/constants.js';

export class HUD extends Container {
  private scoreText: Text;
  private hiText: Text;
  private livesContainer: Container;
  private readonly font = new TextStyle({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 8,
    fill: COLORS.ACCENT,
  });

  constructor() {
    super();

    this.scoreText = new Text({ text: '000000', style: this.font });
    this.scoreText.x = 128;
    this.scoreText.y = 4;
    this.scoreText.anchor.set(0.5, 0);

    this.hiText = new Text({ text: 'HI:000000', style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: COLORS.WHITE }) });
    this.hiText.x = 248;
    this.hiText.y = 4;
    this.hiText.anchor.set(1, 0);

    this.livesContainer = new Container();
    this.livesContainer.x = 4;
    this.livesContainer.y = 4;

    this.addChild(this.scoreText);
    this.addChild(this.hiText);
    this.addChild(this.livesContainer);
  }

  update(score: number, hiScore: number, lives: number): void {
    this.scoreText.text = String(score).padStart(7, '0');
    this.hiText.text = `HI:${String(hiScore).padStart(7, '0')}`;
    this.updateLives(lives);
  }

  private updateLives(lives: number): void {
    this.livesContainer.removeChildren();
    for (let i = 0; i < lives; i++) {
      const icon = new Graphics()
        .rect(i * 10, 0, 8, 8)
        .fill(COLORS.RED);
      this.livesContainer.addChild(icon);
    }
  }
}
