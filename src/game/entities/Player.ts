import { Entity } from './Entity.js';
import type { BalloonState } from '../../types/index.js';
import { PHYSICS } from '../data/constants.js';

export class Player extends Entity {
  readonly width = 16;
  readonly height = 16;

  balloonState: BalloonState = 'TWO_BALLOONS';
  invincibilityFrames = 0;
  score = 0;
  lives = 3;
  highScore = 0;

  /** ms until respawn (0 = alive) */
  respawnTimer = 0;

  flap(): void {
    if (this.state === 'DEAD' || this.state === 'FALLING') return;
    this.vel.y = PHYSICS.FLAP_IMPULSE;
  }

  get isInvincible(): boolean {
    return this.state === 'INVINCIBLE' || this.invincibilityFrames > 0;
  }

  loseLife(): void {
    this.lives = Math.max(0, this.lives - 1);
  }

  addScore(pts: number): boolean {
    this.score += pts;
    if (this.score > this.highScore) this.highScore = this.score;
    // Return true if extra life threshold crossed
    const before = Math.floor((this.score - pts) / PHYSICS.EXTRA_LIFE_SCORE);
    const after  = Math.floor(this.score          / PHYSICS.EXTRA_LIFE_SCORE);
    return after > before && this.lives < PHYSICS.MAX_LIVES;
  }
}
