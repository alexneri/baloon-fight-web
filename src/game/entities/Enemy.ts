import { Entity } from './Entity.js';
import type { EnemyType, BalloonState } from '../../types/index.js';

export abstract class Enemy extends Entity {
  abstract readonly type: EnemyType;
  balloonState: BalloonState = 'TWO_BALLOONS';
  /** ms before egg hatches */
  hatchTimer = 0;
  /** Speed multiplier from difficulty scaling */
  speedMult = 1.0;

  pop(): void {
    if (this.balloonState === 'TWO_BALLOONS') {
      this.balloonState = 'ONE_BALLOON';
    } else if (this.balloonState === 'ONE_BALLOON') {
      this.balloonState = 'NONE';
      this.state = 'FALLING';
    }
  }

  becomeEgg(hatchDelayMs: number): void {
    this.state = 'EGG';
    this.vel = { x: 0, y: 0 };
    this.hatchTimer = hatchDelayMs;
  }
}
