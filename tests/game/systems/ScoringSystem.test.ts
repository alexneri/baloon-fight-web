import { describe, it, expect } from 'vitest';
import { ScoringSystem } from '../../../src/game/systems/ScoringSystem.js';
import { Player } from '../../../src/game/entities/Player.js';
import { SCORE } from '../../../src/game/data/constants.js';

function makePlayer(): Player {
  return new Player(128, 100);
}

describe('ScoringSystem', () => {
  it('awards base kill score for first kill', () => {
    const sc = new ScoringSystem();
    const p = makePlayer();
    const before = p.score;
    sc.recordKill(p, 0);
    expect(p.score - before).toBe(SCORE.KILL_BASE);
  });

  it('awards chain bonus for consecutive kills within window', () => {
    const sc = new ScoringSystem();
    const p = makePlayer();
    sc.recordKill(p, 0);
    const scoreAfterFirst = p.score;
    sc.recordKill(p, 100); // within 3s window
    const delta = p.score - scoreAfterFirst;
    expect(delta).toBeGreaterThan(SCORE.KILL_BASE);
  });

  it('resets chain after resetChain()', () => {
    const sc = new ScoringSystem();
    const p = makePlayer();
    sc.recordKill(p, 0);
    sc.recordKill(p, 100);
    sc.resetChain();
    const p2 = makePlayer();
    sc.recordKill(p2, 200);
    expect(p2.score).toBe(SCORE.KILL_BASE);
  });

  it('awards egg collect score', () => {
    const sc = new ScoringSystem();
    const p = makePlayer();
    sc.recordEggCollect(p);
    expect(p.score).toBe(SCORE.EGG_COLLECT);
  });

  it('awards perfect bonus', () => {
    const sc = new ScoringSystem();
    const p = makePlayer();
    sc.recordPerfectBonus(p);
    expect(p.score).toBe(SCORE.PERFECT_BONUS);
  });

  it('awards bonus catch score', () => {
    const sc = new ScoringSystem();
    const p = makePlayer();
    sc.recordBonusCatch(p);
    expect(p.score).toBe(SCORE.BONUS_CATCH);
  });
});
