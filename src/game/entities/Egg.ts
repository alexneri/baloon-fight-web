import type { EnemyType } from '../../types/index.js';
import { Entity } from './Entity.js';

export class Egg extends Entity {
  readonly width = 10;
  readonly height = 10;
  /** Which enemy type will hatch */
  readonly enemyType: EnemyType;
  /** ms remaining until hatch */
  hatchTimer: number;

  constructor(x: number, y: number, enemyType: EnemyType, hatchDelayMs: number) {
    super(x, y);
    this.state = 'EGG';
    this.enemyType = enemyType;
    this.hatchTimer = hatchDelayMs;
  }
}
