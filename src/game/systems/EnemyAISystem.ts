import type { Enemy } from '../entities/Enemy.js';
import type { Player } from '../entities/Player.js';
import { PHYSICS } from '../data/constants.js';
import { BalloonBirdB } from '../entities/BalloonBirdB.js';
import { Sparky } from '../entities/Sparky.js';

const BASE_SPEED = 1.0;
const PURSUIT_RADIUS_A = 120;
const PURSUIT_RADIUS_B = 60;

export class EnemyAISystem {
  update(enemies: Enemy[], player: Player, delta: number): void {
    const dt = delta / (1000 / 60);

    for (const e of enemies) {
      if (e.state === 'EGG' || e.state === 'DEAD') continue;

      if (e instanceof Sparky) {
        this.updateSparky(e, dt);
      } else {
        this.updateBird(e, player, dt);
      }
    }
  }

  private updateBird(e: Enemy, player: Player, dt: number): void {
    const speed = BASE_SPEED * e.speedMult;
    const radius = e instanceof BalloonBirdB ? PURSUIT_RADIUS_B : PURSUIT_RADIUS_A;

    const dx = player.pos.x - e.pos.x;
    const dy = player.pos.y - e.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      // Pursue player
      e.vel.x = (dx / dist) * speed * dt;
      e.vel.y += ((dy / dist) * 0.5 - 0.1) * dt;
    } else {
      // Patrol: random horizontal drift
      if (Math.random() < 0.01) e.vel.x = (Math.random() - 0.5) * speed * dt * 2;
      e.vel.y += (Math.random() - 0.55) * 0.15 * dt; // slight upward bias
    }

    e.vel.y = Math.max(-PHYSICS.FLAP_IMPULSE * 0.8, Math.min(e.vel.y, PHYSICS.TERMINAL_VELOCITY * 0.6));
    if (e.vel.x !== 0) e.facing = e.vel.x > 0 ? 1 : -1;
  }

  private updateSparky(e: Sparky, dt: number): void {
    e.chargeTimer += dt;
    if (e.chargeTimer > 120) {
      e.vel.x = e.facing * 3 * e.speedMult;
      e.chargeTimer = 0;
    }
    e.vel.y = 0; // Sparky walks on platforms
  }
}
