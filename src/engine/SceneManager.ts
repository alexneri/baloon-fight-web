import type { Application } from 'pixi.js';
import type { SceneId } from '../types/index.js';

export interface Scene {
  readonly id: SceneId;
  init(app: Application): Promise<void> | void;
  update(delta: number, elapsed: number): void;
  render(alpha: number): void;
  destroy(): void;
  /** Called when scene is covered by another (pause-style push) */
  pause?(): void;
  /** Called when scene is uncovered (pop from above) */
  resume?(): void;
}

type SceneFactory = () => Scene;

export class SceneManager {
  private stack: Scene[] = [];
  private registry = new Map<SceneId, SceneFactory>();

  constructor(private readonly app: Application) {}

  register(id: SceneId, factory: SceneFactory): void {
    this.registry.set(id, factory);
  }

  async push(id: SceneId): Promise<void> {
    const top = this.peek();
    top?.pause?.();

    const scene = this.createScene(id);
    this.stack.push(scene);
    await scene.init(this.app);
  }

  async replace(id: SceneId): Promise<void> {
    const top = this.stack.pop();
    top?.destroy();

    const scene = this.createScene(id);
    this.stack.push(scene);
    await scene.init(this.app);
  }

  pop(): void {
    const top = this.stack.pop();
    top?.destroy();
    this.peek()?.resume?.();
  }

  update(delta: number, elapsed: number): void {
    this.peek()?.update(delta, elapsed);
  }

  render(alpha: number): void {
    this.peek()?.render(alpha);
  }

  peek(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  get currentId(): SceneId | undefined {
    return this.peek()?.id;
  }

  private createScene(id: SceneId): Scene {
    const factory = this.registry.get(id);
    if (!factory) throw new Error(`Scene not registered: ${id}`);
    return factory();
  }

  destroyAll(): void {
    while (this.stack.length > 0) {
      this.stack.pop()?.destroy();
    }
  }
}
