import { Enemy } from './Enemy.js';

export class BalloonBirdB extends Enemy {
  readonly type = 'BALLOON_BIRD_B' as const;
  readonly width = 14;
  readonly height = 14;
}
