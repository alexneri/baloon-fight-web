import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../data/constants.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export class NameEntryDialog extends Container {
  private slots: string[] = ['A', 'A', 'A'];
  private activeSlot = 0;
  private slotTexts: Text[] = [];
  private readonly onConfirm: (name: string) => void;

  constructor(
    W: number,
    onConfirm: (name: string) => void,
  ) {
    super();
    this.onConfirm = onConfirm;
    this.build(W);
  }

  private build(W: number): void {
    const cx = W / 2;

    const panel = new Graphics()
      .rect(cx - 100, 80, 200, 100)
      .fill({ color: COLORS.SURFACE, alpha: 0.98 })
      .stroke({ color: COLORS.BORDER, width: 2 });
    this.addChild(panel);

    const title = new Text({
      text: 'ENTER NAME',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 9, fill: COLORS.ACCENT }),
    });
    title.anchor.set(0.5, 0);
    title.x = cx;
    title.y = 90;
    this.addChild(title);

    // Three character slots
    for (let i = 0; i < 3; i++) {
      const slotBg = new Graphics()
        .rect(cx - 45 + i * 34, 110, 28, 36)
        .fill(COLORS.BG)
        .stroke({ color: i === this.activeSlot ? COLORS.ACCENT : COLORS.BORDER, width: 2 });
      this.addChild(slotBg);

      const txt = new Text({
        text: this.slots[i] ?? 'A',
        style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 14, fill: i === this.activeSlot ? COLORS.ACCENT : COLORS.WHITE }),
      });
      txt.anchor.set(0.5, 0.5);
      txt.x = cx - 31 + i * 34;
      txt.y = 128;
      this.addChild(txt);
      this.slotTexts.push(txt);
    }

    // Confirm button
    const confirm = new Container();
    confirm.eventMode = 'static';
    confirm.cursor = 'pointer';
    const confirmBg = new Graphics().rect(cx - 24, 155, 48, 18).fill(COLORS.ACCENT).stroke({ color: 0xc89600, width: 2 });
    const confirmTxt = new Text({
      text: 'OK',
      style: new TextStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: 8, fill: 0x000000 }),
    });
    confirmTxt.anchor.set(0.5, 0.5);
    confirmTxt.x = cx;
    confirmTxt.y = 164;
    confirm.addChild(confirmBg, confirmTxt);
    confirm.on('pointerdown', () => this.submit());
    this.addChild(confirm);
  }

  cycleChar(dir: 1 | -1): void {
    const current = this.slots[this.activeSlot] ?? 'A';
    const idx = (CHARS.indexOf(current) + dir + CHARS.length) % CHARS.length;
    this.slots[this.activeSlot] = CHARS[idx] ?? 'A';
    const txt = this.slotTexts[this.activeSlot];
    if (txt) txt.text = this.slots[this.activeSlot] ?? 'A';
  }

  nextSlot(): void {
    if (this.activeSlot < 2) {
      this.activeSlot++;
    } else {
      this.submit();
    }
  }

  submit(): void {
    this.onConfirm(this.slots.join(''));
  }

  get playerName(): string {
    return this.slots.join('');
  }
}
