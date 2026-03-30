import { Enemy } from './Enemy.js';

export class BalloonBirdA extends Enemy {
  readonly type = 'BALLOON_BIRD_A' as const;
  readonly width = 14;
  readonly height = 14;
}
