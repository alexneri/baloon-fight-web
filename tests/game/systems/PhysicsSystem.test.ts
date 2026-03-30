import { describe, it, expect } from 'vitest';
import { PhysicsSystem } from '../../../src/game/systems/PhysicsSystem.js';
import { Player } from '../../../src/game/entities/Player.js';
import { PHYSICS } from '../../../src/game/data/constants.js';

function makePlayer(): Player {
  return new Player(128, 100);
}

describe('PhysicsSystem', () => {
  const physics = new PhysicsSystem();

  it('applies gravity per update tick', () => {
    const p = makePlayer();
    p.vel.y = 0;
    physics.update([p], 16.67);
    expect(p.vel.y).toBeGreaterThan(0);
  });

  it('clamps velocity at terminal velocity after many ticks', () => {
    const p = makePlayer();
    p.vel.y = PHYSICS.TERMINAL_VELOCITY - 0.01;
    // Apply many ticks
    for (let i = 0; i < 100; i++) physics.update([p], 16.67);
    expect(p.vel.y).toBeLessThanOrEqual(PHYSICS.TERMINAL_VELOCITY);
  });

  it('integrates position from velocity', () => {
    const p = makePlayer();
    p.vel.x = 2;
    p.vel.y = 0;
    const startX = p.pos.x;
    physics.update([p], 16.67);
    expect(p.pos.x).toBeGreaterThan(startX);
  });

  it('wraps entity from left edge to right', () => {
    const p = makePlayer();
    p.pos.x = -10;
    p.vel.x = 0; p.vel.y = 0;
    physics.update([p], 16.67);
    expect(p.pos.x).toBeGreaterThan(PHYSICS.GAME_WIDTH);
  });

  it('wraps entity from right edge to left', () => {
    const p = makePlayer();
    p.pos.x = PHYSICS.GAME_WIDTH + 10;
    p.vel.x = 0; p.vel.y = 0;
    physics.update([p], 16.67);
    expect(p.pos.x).toBeLessThan(0);
  });

  it('movePlayer sets left velocity and facing', () => {
    const p = makePlayer();
    physics.movePlayer(p, true, false);
    expect(p.vel.x).toBeLessThan(0);
    expect(p.facing).toBe(-1);
  });

  it('movePlayer sets right velocity and facing', () => {
    const p = makePlayer();
    physics.movePlayer(p, false, true);
    expect(p.vel.x).toBeGreaterThan(0);
    expect(p.facing).toBe(1);
  });
});
