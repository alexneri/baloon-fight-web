import { Enemy } from './Enemy.js';

export class Sparky extends Enemy {
  readonly type = 'SPARKY' as const;
  readonly width = 12;
  readonly height = 12;
  /** Sparky doesn't have balloons — always walks on platforms */
  override balloonState = 'NONE' as const;
  /** Charges periodically */
  chargeTimer = 0;
}
