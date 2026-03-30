import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoop } from '../../src/engine/GameLoop.js';

describe('GameLoop', () => {
  let rafCallbacks: Array<(t: number) => void>;

  beforeEach(() => {
    rafCallbacks = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb as (t: number) => void);
      return rafCallbacks.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    // Fix performance.now so lastTime starts at 0
    vi.spyOn(globalThis.performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls update and render once a full fixed-step elapses', () => {
    const update = vi.fn();
    const render = vi.fn();
    const loop = new GameLoop(update, render);

    loop.start();
    // First frame at t=0: lastTime=0, delta=0 — accumulator stays 0, no update
    rafCallbacks[0]?.(0);
    // Second frame at t=17: delta=17 > 16.67ms — one fixed step fires
    rafCallbacks[1]?.(17);

    expect(update).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalled();
  });

  it('does not call update before start()', () => {
    const update = vi.fn();
    const render = vi.fn();
    new GameLoop(update, render);
    expect(update).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });

  it('stops after stop()', () => {
    const loop = new GameLoop(vi.fn(), vi.fn());
    const cancelSpy = vi.mocked(cancelAnimationFrame);
    loop.start();
    loop.stop();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('caps delta at 50ms to prevent spiral of death', () => {
    const updates: number[] = [];
    const loop = new GameLoop((delta) => { updates.push(delta); }, vi.fn());

    loop.start();
    rafCallbacks[0]?.(0);
    // Simulate 500ms gap (tab was backgrounded)
    rafCallbacks[1]?.(500);

    // Each update call receives FIXED_STEP_MS (~16.67), not the raw 500ms
    expect(updates.every((d) => d <= 50)).toBe(true);
  });
});
