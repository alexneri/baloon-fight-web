import { Application } from 'pixi.js';
import { SceneManager } from './engine/SceneManager.js';
import { AudioManager } from './engine/AudioManager.js';
import { InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { MenuScene } from './game/scenes/MenuScene.js';
import { GameScene } from './game/scenes/GameScene.js';
import { GameOverScene } from './game/scenes/GameOverScene.js';
import type { GameOverData } from './game/scenes/GameOverScene.js';
import { LeaderboardScene } from './game/scenes/LeaderboardScene.js';
import { HowToPlayScene } from './game/scenes/HowToPlayScene.js';
import { SettingsScene } from './game/scenes/SettingsScene.js';
import { BonusScene } from './game/scenes/BonusScene.js';
import { PHYSICS, STORAGE_KEYS } from './game/data/constants.js';
import type { SceneId } from './types/index.js';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  const W = PHYSICS.GAME_WIDTH;
  const H = PHYSICS.GAME_HEIGHT;

  // Compute integer pixel scale
  function computeScale(scaleMode: string): number {
    const autoScale = Math.max(
      1,
      Math.min(Math.floor(window.innerWidth / W), Math.floor(window.innerHeight / H)),
    );
    if (scaleMode === '1') return 1;
    if (scaleMode === '2') return Math.min(2, autoScale);
    return autoScale;
  }

  const scaleMode = localStorage.getItem(STORAGE_KEYS.SCALE) ?? 'auto';
  const scale = computeScale(scaleMode);

  const app = new Application();
  await app.init({
    width: W,
    height: H,
    antialias: false,
    backgroundColor: COLORS_SKY,
    resolution: 1,
  });

  // Size canvas with integer scaling
  const canvas = app.canvas;
  canvas.style.width  = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
  canvas.style.imageRendering = 'pixelated';

  const wrapper = document.getElementById('app')!;
  wrapper.style.display       = 'flex';
  wrapper.style.alignItems    = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.width         = '100%';
  wrapper.style.height        = '100%';
  wrapper.appendChild(canvas);

  // Resize handler
  window.addEventListener('resize', () => {
    const s = computeScale(localStorage.getItem(STORAGE_KEYS.SCALE) ?? 'auto');
    canvas.style.width  = `${W * s}px`;
    canvas.style.height = `${H * s}px`;
  });

  // ─── Services ──────────────────────────────────────────────────────────────
  const audio = new AudioManager();
  const input = new InputManager();

  // Restore audio settings
  audio.setMuted(localStorage.getItem(STORAGE_KEYS.MUTED) === '1');
  audio.setVolume(parseFloat(localStorage.getItem(STORAGE_KEYS.SFX_VOL) ?? '0.3'));
  audio.setMusicEnabled(localStorage.getItem(STORAGE_KEYS.MUSIC) === '1');

  // Init audio on first user interaction
  const initOnce = (): void => {
    audio.init();
    window.removeEventListener('click', initOnce);
    window.removeEventListener('keydown', initOnce);
    window.removeEventListener('touchstart', initOnce);
  };
  window.addEventListener('click', initOnce, { once: true });
  window.addEventListener('keydown', initOnce, { once: true });
  window.addEventListener('touchstart', initOnce, { once: true, passive: true });

  // ─── Scene manager ─────────────────────────────────────────────────────────
  const scenes = new SceneManager(app);

  // Shared navigate function — navigate to a scene, optionally passing data
  let pendingGameOverData: GameOverData | undefined;

  const navigate = (to: SceneId, data?: unknown): void => {
    if (to === 'GAME_OVER' && data) {
      pendingGameOverData = data as GameOverData;
    }
    void scenes.replace(to);
  };

  // Register all scenes
  scenes.register('MENU',        () => new MenuScene(navigate));
  scenes.register('GAME',        () => new GameScene(input, audio, navigate));
  scenes.register('GAME_OVER',   () => {
    const d = pendingGameOverData ?? { score: 0, hiScore: 0, phase: 1, isNewHi: false };
    pendingGameOverData = undefined;
    return new GameOverScene(d, navigate);
  });
  scenes.register('LEADERBOARD', () => new LeaderboardScene(navigate));
  scenes.register('HOW_TO_PLAY', () => new HowToPlayScene(navigate));
  scenes.register('SETTINGS',    () => new SettingsScene(audio, navigate));
  scenes.register('BONUS',       () => new BonusScene(audio, navigate, () => {}));

  // ─── Game loop ─────────────────────────────────────────────────────────────
  const loop = new GameLoop(
    (delta, elapsed) => scenes.update(delta, elapsed),
    (alpha)          => scenes.render(alpha),
  );

  // ─── Start ─────────────────────────────────────────────────────────────────
  await scenes.push('MENU');
  loop.start();

  // Global error boundary
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
  });
}

const COLORS_SKY = 0x000000;

bootstrap().catch(console.error);
