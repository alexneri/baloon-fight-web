export const PHYSICS = {
  GAME_WIDTH: 256,
  GAME_HEIGHT: 240,
  GRAVITY: 0.18,
  PLAYER_SPEED: 2.0,
  FLAP_IMPULSE: -4.5,
  TERMINAL_VELOCITY: 6.0,
  INVINCIBILITY_FRAMES: 60,
  EXTRA_LIFE_SCORE: 50_000,
  MAX_LIVES: 5,
  BONUS_STAGE_INTERVAL: 3,
  BONUS_STAGE_DURATION_MS: 60_000,
  DIFFICULTY_RAMP_INTERVAL: 3,
  DIFFICULTY_SPEED_MULTIPLIER: 1.15,
  FISH_TRIGGER_DELAY_MS: 500,
  MAX_ENEMIES: 8,
} as const;

export const SCORE = {
  KILL_BASE: 100,
  KILL_CHAIN_BONUS: 500,
  EGG_COLLECT: 500,
  PERFECT_BONUS: 5_000,
  BONUS_CATCH: 500,
  /** Score thresholds for kill chain announcements */
  CHAIN_THRESHOLDS: [2, 3, 4, 5] as const,
} as const;

export const COLORS = {
  SKY: 0x6888FC,
  BG: 0x0A0A1A,
  SURFACE: 0x12122A,
  BORDER: 0x2A2A4A,
  ACCENT: 0xF8B800,
  RED: 0xD82800,
  GREEN: 0x00A800,
  WHITE: 0xFCFCFC,
  GREY: 0xA0A0C0,
  BROWN: 0x783000,
  WATER: 0x4090D0,
  WATER_DEEP: 0x003880,
  CLOUD: 0xD0D0E8,
} as const;

export const WATER_Y = 213;
export const WATER_H = 27;

/** localStorage keys */
export const STORAGE_KEYS = {
  MUTED: 'bfw_muted',
  SFX_VOL: 'bfw_sfxvol',
  MUSIC: 'bfw_music',
  SCALE: 'bfw_scale',
  HI_SCORE: 'bfw_hi',
  LEADERBOARD: 'bfw_lb',
} as const;
