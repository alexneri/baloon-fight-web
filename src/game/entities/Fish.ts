import { Entity } from './Entity.js';
import { PHYSICS } from '../data/constants.js';

export type FishPhase = 'idle' | 'warning' | 'lunging' | 'returning';

export class Fish extends Entity {
  readonly width = 16;
  readonly height = 10;
  readonly baseY: number;
  phase: FishPhase = 'idle';
  timer = 0;

  constructor(x: number, y: number) {
    super(x, y);
    this.baseY = y;
    this.state = 'ALIVE';
  }

  get isLunging(): boolean {
    return this.phase === 'lunging';
  }

  resetTimer(): void {
    this.timer = 0;
    this.phase = 'idle';
    this.pos.y = this.baseY;
  }

  updateTimer(delta: number): void {
    this.timer += delta;
    if (this.phase === 'idle' && this.timer > 200) {
      this.phase = 'warning';
    }
    if (this.phase === 'warning' && this.timer > PHYSICS.FISH_TRIGGER_DELAY_MS) {
      this.phase = 'lunging';
    }
    // Lunge: move upward fast
    if (this.phase === 'lunging') {
      this.pos.y -= 3;
      if (this.pos.y < this.baseY - 40) {
        this.phase = 'returning';
      }
    }
    if (this.phase === 'returning') {
      this.pos.y += 2;
      if (this.pos.y >= this.baseY) {
        this.resetTimer();
      }
    }
  }
}
