// ─── Primitives ──────────────────────────────────────────────────────────────

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

// ─── Entity types ─────────────────────────────────────────────────────────────

export type BalloonState = 'TWO_BALLOONS' | 'ONE_BALLOON' | 'NONE';

export type EntityState =
  | 'ALIVE'
  | 'POPPED'
  | 'FALLING'
  | 'EGG'
  | 'DEAD'
  | 'INVINCIBLE';

export type EnemyType = 'BALLOON_BIRD_A' | 'BALLOON_BIRD_B' | 'SPARKY';

export interface EntitySnapshot {
  id: string;
  type: 'player' | EnemyType | 'egg' | 'fish';
  position: Vec2;
  velocity: Vec2;
  state: EntityState;
  balloonState?: BalloonState;
  hatchTimer?: number;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface PlayerState {
  position: Vec2;
  velocity: Vec2;
  balloonState: BalloonState;
  entityState: EntityState;
  invincibilityFrames: number;
  score: number;
  lives: number;
  highScore: number;
}

// ─── Level data ───────────────────────────────────────────────────────────────

export interface EnemyDefinition {
  type: EnemyType;
  spawnX: number;
  spawnY: number;
}

export interface PlatformDefinition {
  bounds: AABB;
  solid: 'TOP_ONLY' | 'SOLID';
  passThrough: boolean;
  water?: boolean;
  cloud?: boolean;
}

export interface PlatformLayout {
  name: string;
  platforms: PlatformDefinition[];
}

export interface PhaseDefinition {
  phase: number;
  layoutName: string;
  enemies: EnemyDefinition[];
  hatchDelayMs: number;
  bonusStage: boolean;
}

export interface LevelData {
  layouts: PlatformLayout[];
  phases: PhaseDefinition[];
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  phase: number;
  timestamp: number;
}

export interface ScoreSubmission {
  name: string;
  score: number;
  phase: number;
}

export interface ScoreSubmissionResponse {
  success: boolean;
  rank: number;
  error?: string;
}

export interface KVScoreEntry {
  name: string;
  score: number;
  phase: number;
  timestamp: number;
  ip_hash: string;
}

// ─── Audio ────────────────────────────────────────────────────────────────────

export type SFXId =
  | 'flap'
  | 'balloon_pop'
  | 'enemy_fall'
  | 'egg_hatch'
  | 'extra_life'
  | 'game_over'
  | 'menu_blip'
  | 'menu_confirm'
  | 'bonus_catch'
  | 'fish_lunge';

// ─── Input ────────────────────────────────────────────────────────────────────

export type InputAction =
  | 'LEFT'
  | 'RIGHT'
  | 'FLAP'
  | 'PAUSE'
  | 'CONFIRM'
  | 'MUTE';

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface UserSettings {
  muted: boolean;
  volume: number;
  scale: 'auto' | 1 | 2;
  highScore: number;
  musicEnabled: boolean;
}

// ─── Scenes ───────────────────────────────────────────────────────────────────

export type SceneId =
  | 'MENU'
  | 'GAME'
  | 'BONUS'
  | 'GAME_OVER'
  | 'LEADERBOARD'
  | 'HOW_TO_PLAY'
  | 'SETTINGS';

// ─── Result type ──────────────────────────────────────────────────────────────

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
