import { describe, it, expect, vi } from 'vitest';
import { SceneManager } from '../../src/engine/SceneManager.js';
import type { Scene } from '../../src/engine/SceneManager.js';
import type { SceneId } from '../../src/types/index.js';
import type { Application } from 'pixi.js';

// Minimal Application stub
const fakeApp = {
  stage: { addChild: vi.fn(), removeChild: vi.fn() },
  screen: { width: 256, height: 240 },
} as unknown as Application;

function makeScene(id: SceneId): Scene & {
  initCalled: boolean;
  destroyCalled: boolean;
  pauseCalled: boolean;
  resumeCalled: boolean;
} {
  return {
    id,
    initCalled: false,
    destroyCalled: false,
    pauseCalled: false,
    resumeCalled: false,
    init() { this.initCalled = true; },
    update() {},
    render() {},
    destroy() { this.destroyCalled = true; },
    pause() { this.pauseCalled = true; },
    resume() { this.resumeCalled = true; },
  };
}

describe('SceneManager', () => {
  it('push() initialises the scene and sets it as current', async () => {
    const sm = new SceneManager(fakeApp);
    const scene = makeScene('MENU');
    sm.register('MENU', () => scene);

    await sm.push('MENU');
    expect(scene.initCalled).toBe(true);
    expect(sm.currentId).toBe('MENU');
  });

  it('replace() destroys the old scene and inits the new one', async () => {
    const sm = new SceneManager(fakeApp);
    const menuScene = makeScene('MENU');
    const gameScene = makeScene('GAME');
    sm.register('MENU', () => menuScene);
    sm.register('GAME', () => gameScene);

    await sm.push('MENU');
    await sm.replace('GAME');

    expect(menuScene.destroyCalled).toBe(true);
    expect(gameScene.initCalled).toBe(true);
    expect(sm.currentId).toBe('GAME');
  });

  it('pop() destroys top scene and resumes the one below', async () => {
    const sm = new SceneManager(fakeApp);
    const menuScene = makeScene('MENU');
    const gameScene = makeScene('GAME');
    sm.register('MENU', () => menuScene);
    sm.register('GAME', () => gameScene);

    await sm.push('MENU');
    await sm.push('GAME');
    sm.pop();

    expect(gameScene.destroyCalled).toBe(true);
    expect(menuScene.resumeCalled).toBe(true);
    expect(sm.currentId).toBe('MENU');
  });

  it('push() pauses the previous top scene', async () => {
    const sm = new SceneManager(fakeApp);
    const menuScene = makeScene('MENU');
    const gameScene = makeScene('GAME');
    sm.register('MENU', () => menuScene);
    sm.register('GAME', () => gameScene);

    await sm.push('MENU');
    await sm.push('GAME');

    expect(menuScene.pauseCalled).toBe(true);
  });

  it('throws when an unregistered scene is requested', async () => {
    const sm = new SceneManager(fakeApp);
    await expect(sm.push('GAME')).rejects.toThrow('Scene not registered: GAME');
  });
});
