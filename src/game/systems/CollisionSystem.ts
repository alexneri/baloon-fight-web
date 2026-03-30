import type { AABB, PlatformDefinition } from '../../types/index.js';
import type { Entity } from '../entities/Entity.js';
import { PHYSICS, WATER_Y } from '../data/constants.js';
import type { Player } from '../entities/Player.js';

function overlaps(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return overlaps(a, b);
}

export class CollisionSystem {
  /** Resolve entity against platform list. Returns true if on ground. */
  resolvePlatforms(entity: Entity, platforms: PlatformDefinition[]): boolean {
    entity.onGround = false;

    for (const p of platforms) {
      if (p.water) continue;

      const eb = entity.bounds;
      const pb = p.bounds;

      if (eb.x + eb.width <= pb.x || eb.x >= pb.x + pb.width) continue;

      const prevBottom = eb.y + eb.height - entity.vel.y;
      const curBottom  = eb.y + eb.height;

      // Landing on top
      if (prevBottom <= pb.y && curBottom >= pb.y && entity.vel.y >= 0) {
        entity.pos.y = pb.y - entity.height / 2;
        entity.vel.y = 0;
        entity.onGround = true;
      }

      // Solid platforms: also block from sides and below (only for ground blocks)
      if (p.solid === 'SOLID' && !p.passThrough) {
        if (overlaps(eb, pb)) {
          // Push out vertically (feet below top)
          if (entity.vel.y >= 0) {
            entity.pos.y = pb.y - entity.height / 2;
            entity.vel.y = 0;
            entity.onGround = true;
          }
        }
      }
    }

    return entity.onGround;
  }

  /** Check if entity fell into the water zone */
  isInWater(entity: Entity): boolean {
    return entity.pos.y + entity.height / 2 > WATER_Y + 2;
  }

  /** Public AABB overlap test for entity-to-entity checks */
  isOverlapping(a: AABB, b: AABB): boolean {
    return overlaps(a, b);
  }

  /** Check if entity went above the screen (wrap to bottom) */
  checkVerticalWrap(entity: Entity): void {
    if (entity.pos.y < -entity.height) {
      entity.pos.y = PHYSICS.GAME_HEIGHT + entity.height;
    }
  }
}
