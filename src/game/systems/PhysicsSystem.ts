import type { Entity } from '../entities/Entity.js';
import { PHYSICS } from '../data/constants.js';
import type { Player } from '../entities/Player.js';

export class PhysicsSystem {
  /** Apply gravity + integrate velocity. delta in ms. */
  update(entities: Entity[], delta: number): void {
    const dt = delta / FIXED_STEP_MS; // normalise to 60 fps ticks

    for (const e of entities) {
      if (e.state === 'DEAD' || e.state === 'EGG') continue;

      // Gravity
      e.vel.y = Math.min(e.vel.y + PHYSICS.GRAVITY * dt, PHYSICS.TERMINAL_VELOCITY);

      // Integrate
      e.pos.x += e.vel.x * dt;
      e.pos.y += e.vel.y * dt;

      // Horizontal screen wrap
      const W = PHYSICS.GAME_WIDTH;
      if (e.pos.x < -8)     e.pos.x = W + 8;
      if (e.pos.x > W + 8)  e.pos.x = -8;
    }
  }

  /** Apply horizontal movement for player (called before physics update) */
  movePlayer(player: Player, left: boolean, right: boolean): void {
    if (player.state === 'DEAD' || player.state === 'FALLING') return;
    if (left)  { player.vel.x = -PHYSICS.PLAYER_SPEED; player.facing = -1; }
    else if (right) { player.vel.x =  PHYSICS.PLAYER_SPEED; player.facing = 1; }
    else       { player.vel.x *= 0.85; } // friction
  }
}

const FIXED_STEP_MS = 1000 / 60;
