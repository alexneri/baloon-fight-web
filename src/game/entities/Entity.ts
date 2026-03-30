import type { AABB, Vec2, EntityState } from '../../types/index.js';

let nextId = 0;

export abstract class Entity {
  readonly id: string;
  pos: Vec2;
  vel: Vec2;
  state: EntityState = 'ALIVE';
  facing: 1 | -1 = 1; // 1 = right, -1 = left
  onGround = false;

  constructor(x: number, y: number) {
    this.id = `e${nextId++}`;
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
  }

  abstract get width(): number;
  abstract get height(): number;

  get bounds(): AABB {
    return {
      x: this.pos.x - this.width / 2,
      y: this.pos.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  get isDead(): boolean {
    return this.state === 'DEAD';
  }
}
