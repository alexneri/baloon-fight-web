import { describe, it, expect } from 'vitest';
import { aabbOverlap } from '../../../src/game/systems/CollisionSystem.js';

describe('aabbOverlap', () => {
  it('returns true for overlapping boxes', () => {
    expect(aabbOverlap(
      { x: 0,  y: 0, width: 10, height: 10 },
      { x: 5,  y: 5, width: 10, height: 10 },
    )).toBe(true);
  });

  it('returns false for non-overlapping boxes (horizontal gap)', () => {
    expect(aabbOverlap(
      { x: 0,  y: 0, width: 10, height: 10 },
      { x: 15, y: 0, width: 10, height: 10 },
    )).toBe(false);
  });

  it('returns false for non-overlapping boxes (vertical gap)', () => {
    expect(aabbOverlap(
      { x: 0, y: 0,  width: 10, height: 10 },
      { x: 0, y: 15, width: 10, height: 10 },
    )).toBe(false);
  });

  it('returns false for touching-but-not-overlapping boxes', () => {
    expect(aabbOverlap(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 10, y: 0, width: 10, height: 10 },
    )).toBe(false);
  });

  it('returns true for fully contained box', () => {
    expect(aabbOverlap(
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 10, y: 10, width: 5, height: 5 },
    )).toBe(true);
  });
});
