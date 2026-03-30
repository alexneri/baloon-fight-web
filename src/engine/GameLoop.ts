export type UpdateFn = (delta: number, elapsed: number) => void;
export type RenderFn = (alpha: number) => void;

const FIXED_STEP_MS = 1000 / 60; // 16.667 ms
const MAX_DELTA_MS = 50;          // cap to avoid spiral of death

export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private _elapsed = 0;
  private running = false;

  constructor(
    private readonly onUpdate: UpdateFn,
    private readonly onRender: RenderFn,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  get elapsed(): number {
    return this._elapsed;
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    const raw = now - this.lastTime;
    const delta = Math.min(raw, MAX_DELTA_MS);
    this.lastTime = now;
    this.accumulator += delta;
    this._elapsed += delta;

    while (this.accumulator >= FIXED_STEP_MS) {
      this.onUpdate(FIXED_STEP_MS, this._elapsed);
      this.accumulator -= FIXED_STEP_MS;
    }

    const alpha = this.accumulator / FIXED_STEP_MS;
    this.onRender(alpha);

    this.rafId = requestAnimationFrame(this.loop);
  };
}
