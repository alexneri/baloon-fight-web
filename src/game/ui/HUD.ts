import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, STORAGE_KEYS } from '../data/constants.js';

function hudText(fill: number): TextStyle {
  return new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill });
}

export class HUD extends Container {
  private p1ScoreText: Text;
  private topScoreText: Text;
  private p1Label: Text;
  private topLabel: Text;
  private livesContainer: Container;

  constructor() {
    super();

    // "I-" prefix in red, score in white — NES style
    this.p1Label = new Text({ text: 'I-', style: hudText(0xF82020) });
    this.p1Label.x = 4;
    this.p1Label.y = 4;

    this.p1ScoreText = new Text({ text: '000000', style: hudText(COLORS.WHITE) });
    this.p1ScoreText.x = 20;
    this.p1ScoreText.y = 4;

    // "TOP-" in orange, score in white — centred
    this.topLabel = new Text({ text: 'TOP-', style: hudText(COLORS.ACCENT) });
    this.topLabel.anchor.set(1, 0);
    this.topLabel.x = 128;
    this.topLabel.y = 4;

    this.topScoreText = new Text({ text: '000000', style: hudText(COLORS.WHITE) });
    this.topScoreText.x = 128;
    this.topScoreText.y = 4;

    // Lives — balloon icons below score
    this.livesContainer = new Container();
    this.livesContainer.x = 4;
    this.livesContainer.y = 16;

    this.addChild(this.p1Label, this.p1ScoreText, this.topLabel, this.topScoreText, this.livesContainer);
  }

  update(score: number, hiScore: number, lives: number): void {
    this.p1ScoreText.text  = String(score).padStart(6, '0');
    this.topScoreText.text = String(hiScore).padStart(6, '0');
    this.updateLives(lives);
  }

  private updateLives(lives: number): void {
    this.livesContainer.removeChildren();
    for (let i = 0; i < Math.min(lives, 6); i++) {
      const icon = new Graphics();
      // Mini balloon icon (6×7 px)
      icon.ellipse(i * 9 + 3, 3, 3, 4).fill(COLORS.RED);
      icon.rect(i * 9 + 2, 6, 2, 2).fill(0xC0C0C0); // string
      this.livesContainer.addChild(icon);
    }
  }

  /** Load persisted hi-score into the display without a full update() call. */
  loadHiScore(): void {
    const hi = parseInt(localStorage.getItem(STORAGE_KEYS.HI_SCORE) ?? '0', 10);
    this.topScoreText.text = String(hi).padStart(6, '0');
  }
}
