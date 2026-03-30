import type { SFXId } from '../types/index.js';

const MUSIC_SEQ = [523, 659, 784, 1047, 784, 659, 523, 392];
const MUSIC_BPM = 150;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private volume = 0.3;
  private musicEnabled = false;
  private musicPlaying = false;
  private musicNoteIdx = 0;
  private musicTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Must be called from a user-gesture handler (click/touch) */
  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume;
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume;
    }
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (enabled) {
      if (!this.musicPlaying) this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  isMuted(): boolean { return this.muted; }
  getVolume(): number { return this.volume; }
  isMusicEnabled(): boolean { return this.musicEnabled; }

  play(id: SFXId): void {
    switch (id) {
      case 'flap':        this.tone(880, 'square', 0.05, 0.15); break;
      case 'balloon_pop': this.tone(220, 'sawtooth', 0.15, 0.4); break;
      case 'enemy_fall':  this.tone(440, 'square', 0.12, 0.3); break;
      case 'egg_hatch':   this.tone(660, 'triangle', 0.08, 0.2); break;
      case 'extra_life':  this.extraLifeJingle(); break;
      case 'game_over':   this.gameOverJingle(); break;
      case 'menu_blip':   this.tone(600, 'square', 0.05, 0.1); break;
      case 'menu_confirm':this.tone(800, 'square', 0.08, 0.15); break;
      case 'bonus_catch': this.tone(1046, 'triangle', 0.1, 0.2); break;
      case 'fish_lunge':  this.tone(180, 'sawtooth', 0.2, 0.3); break;
    }
  }

  private tone(
    freq: number,
    type: OscillatorType,
    duration: number,
    vol = 0.3,
  ): void {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // AudioContext suspended or unavailable
    }
  }

  private extraLifeJingle(): void {
    [523, 659, 784].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 'triangle', 0.12, 0.4), i * 80);
    });
  }

  private gameOverJingle(): void {
    [440, 330, 220].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 'sawtooth', 0.25, 0.5), i * 120);
    });
  }

  startMusic(): void {
    if (!this.ctx || !this.musicEnabled || this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicNoteIdx = 0;
    this.scheduleMusicNote();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimeout !== null) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }

  private scheduleMusicNote(): void {
    if (!this.musicPlaying || !this.musicEnabled) return;
    const freq = MUSIC_SEQ[this.musicNoteIdx % MUSIC_SEQ.length];
    if (freq !== undefined) this.tone(freq, 'square', 0.18, 0.15);
    this.musicNoteIdx++;
    const noteMs = (60 / MUSIC_BPM) * 1000;
    this.musicTimeout = setTimeout(() => this.scheduleMusicNote(), noteMs);
  }
}
