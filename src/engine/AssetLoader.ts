import { Assets, type Texture } from 'pixi.js';

export interface AssetManifest {
  bundles: Array<{
    name: string;
    assets: Array<{ alias: string; src: string }>;
  }>;
}

export class AssetLoader {
  private loaded = false;
  private progressCallback: ((p: number) => void) | null = null;

  onProgress(cb: (p: number) => void): void {
    this.progressCallback = cb;
  }

  async loadBundle(name: string): Promise<void> {
    await Assets.loadBundle(name, (p: number) => {
      this.progressCallback?.(p);
    });
    this.loaded = true;
  }

  async init(manifest: AssetManifest): Promise<void> {
    await Assets.init({ manifest });
  }

  getTexture(alias: string): Texture {
    return Assets.get<Texture>(alias);
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
