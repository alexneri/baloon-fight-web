# Architecture Document — Balloon Fight Web

## System Overview

Balloon Fight Web is a client-heavy single-page application. The vast majority of logic —
physics, AI, rendering, input — lives entirely in the browser. The only server-side
component is the leaderboard API: a stateless Cloudflare Worker backed by Cloudflare KV.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Vite /  │  │  PixiJS v8   │  │   Web Audio API       │ │
│  │  PWA SW  │  │  WebGL/2D    │  │   Sound Engine        │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Game Engine (TypeScript)               │   │
│  │                                                     │   │
│  │  SceneManager  │  GameLoop  │  InputManager         │   │
│  │  EntityManager │  Physics   │  AudioManager         │   │
│  │  LevelManager  │  Collision │  AssetLoader          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │ fetch /api/scores
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Edge (global)                       │
│                                                             │
│  ┌─────────────────────────┐    ┌────────────────────────┐ │
│  │  Cloudflare Workers     │    │  Cloudflare Pages      │ │
│  │  /api/scores (GET/POST) │    │  (static assets + SW)  │ │
│  └──────────┬──────────────┘    └────────────────────────┘ │
│             │                                               │
│  ┌──────────▼──────────────┐                               │
│  │  Cloudflare KV          │                               │
│  │  scores:global → JSON   │                               │
│  └─────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Language | TypeScript | 5.4+ | Strict types eliminate entire bug classes; PixiJS has first-class TS support |
| Renderer | PixiJS | 8.x | WebGL-first with Canvas fallback; proven 60 fps on mobile; excellent sprite batching |
| Build tool | Vite | 5.x | Sub-second HMR; built-in PWA plugin; native ESM output |
| PWA | vite-plugin-pwa | 0.20.x | Workbox-backed service worker generation; asset precaching |
| Backend runtime | Cloudflare Workers | — | Zero cold start; global edge deployment; ~$0 cost at low traffic |
| KV store | Cloudflare KV | — | Globally replicated; ideal for read-heavy leaderboard data |
| Static hosting | Cloudflare Pages | — | Integrated with Workers; free tier generous |
| Testing | Vitest | 2.x | Native ESM; shares Vite config; fast watch mode |
| Linting | ESLint + Prettier | 9.x | Enforced in CI; no `any` rule |
| CI/CD | GitHub Actions | — | `wrangler deploy` on main push |
| Audio | Web Audio API | Native | No dependency; precise timing; synthesis-based SFX |
| Texture packing | TexturePacker | 7.x | Optimal atlas generation; Pixi-compatible JSON format |

---

## Repository Structure

```
balloon-fight-web/
├── src/
│   ├── main.ts                    # Entry point: creates PixiJS app, boots engine
│   ├── engine/
│   │   ├── GameLoop.ts            # Fixed-timestep ticker wrapper
│   │   ├── SceneManager.ts        # Scene push/pop/replace
│   │   ├── InputManager.ts        # Keyboard + touch + gamepad
│   │   ├── AssetLoader.ts         # PixiJS Assets wrapper
│   │   ├── AudioManager.ts        # Web Audio context + SFX synthesis
│   │   └── EventBus.ts            # Simple typed event emitter
│   ├── game/
│   │   ├── scenes/
│   │   │   ├── MenuScene.ts
│   │   │   ├── GameScene.ts
│   │   │   ├── BonusScene.ts
│   │   │   ├── GameOverScene.ts
│   │   │   └── LeaderboardScene.ts
│   │   ├── entities/
│   │   │   ├── Entity.ts          # Base class
│   │   │   ├── Player.ts
│   │   │   ├── Enemy.ts           # Base enemy
│   │   │   ├── BalloonBirdA.ts
│   │   │   ├── BalloonBirdB.ts
│   │   │   ├── Sparky.ts
│   │   │   ├── Egg.ts
│   │   │   └── Fish.ts
│   │   ├── systems/
│   │   │   ├── PhysicsSystem.ts   # Gravity, velocity integration
│   │   │   ├── CollisionSystem.ts # AABB collision detection/resolution
│   │   │   ├── EnemyAISystem.ts   # Per-enemy AI updates
│   │   │   ├── ScoringSystem.ts   # Score events, high score persistence
│   │   │   └── ProgressionSystem.ts # Phase transitions, difficulty ramp
│   │   ├── ui/
│   │   │   ├── HUD.ts
│   │   │   ├── MainMenu.ts
│   │   │   ├── PauseMenu.ts
│   │   │   ├── GameOverScreen.ts
│   │   │   ├── LeaderboardView.ts
│   │   │   ├── TouchControls.ts
│   │   │   └── NameEntryDialog.ts
│   │   └── data/
│   │       ├── levels.json        # Phase definitions, enemy data
│   │       ├── sprites.json       # TexturePacker atlas manifest
│   │       └── constants.ts       # Physics constants, score thresholds
│   ├── api/
│   │   └── leaderboard.ts        # Typed fetch client for /api/scores
│   └── types/
│       └── index.ts              # All shared TypeScript interfaces
├── worker/
│   ├── index.ts                  # Cloudflare Worker entry
│   ├── handlers/
│   │   ├── getScores.ts
│   │   └── postScore.ts
│   └── validation.ts
├── public/
│   ├── manifest.webmanifest
│   ├── icons/                    # PWA icons (192, 512)
│   └── assets/                   # Sprite atlas, placeholder
├── tests/
│   ├── engine/
│   ├── game/systems/
│   └── worker/
├── vite.config.ts
├── wrangler.toml
├── tsconfig.json
└── package.json
```

---

## Data Models

```typescript
// types/index.ts

/** Axis-aligned bounding box for collision */
export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 2D vector */
export interface Vec2 {
  x: number;
  y: number;
}

/** Entity states */
export type BalloonState = 'TWO_BALLOONS' | 'ONE_BALLOON' | 'NONE';
export type EntityState =
  | 'ALIVE'
  | 'POPPED'         // balloon just popped
  | 'FALLING'        // falling after pop
  | 'EGG'            // enemy in egg form
  | 'DEAD'           // removed next frame
  | 'INVINCIBLE';    // player post-respawn

export type EnemyType = 'BALLOON_BIRD_A' | 'BALLOON_BIRD_B' | 'SPARKY';

/** Base entity snapshot (used for deterministic replay in future) */
export interface EntitySnapshot {
  id: string;
  type: 'player' | EnemyType | 'egg' | 'fish';
  position: Vec2;
  velocity: Vec2;
  state: EntityState;
  balloonState?: BalloonState;
  hatchTimer?: number;
}

/** Player state */
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

/** Enemy definition in level data */
export interface EnemyDefinition {
  type: EnemyType;
  spawnX: number;
  spawnY: number;
}

/** Platform definition */
export interface PlatformDefinition {
  bounds: AABB;
  solid: 'TOP_ONLY' | 'SOLID';
  /** true = player can pass through from below */
  passThrough: boolean;
}

/** Platform layout template */
export interface PlatformLayout {
  name: string;
  platforms: PlatformDefinition[];
}

/** Single phase definition */
export interface PhaseDefinition {
  phase: number;
  layoutName: string;
  enemies: EnemyDefinition[];
  hatchDelayMs: number;
  bonusStage: boolean;
}

/** levels.json root */
export interface LevelData {
  layouts: PlatformLayout[];
  phases: PhaseDefinition[];
}

/** Leaderboard entry (client-facing) */
export interface LeaderboardEntry {
  rank: number;
  name: string;       // 1–3 chars
  score: number;
  phase: number;
  timestamp: number;  // Unix ms
}

/** POST /api/scores request body */
export interface ScoreSubmission {
  name: string;
  score: number;
  phase: number;
}

/** POST /api/scores response */
export interface ScoreSubmissionResponse {
  success: boolean;
  rank: number;         // rank achieved, -1 if not in top 50
  error?: string;
}

/** KV stored entry (internal, includes ip_hash) */
export interface KVScoreEntry {
  name: string;
  score: number;
  phase: number;
  timestamp: number;
  ip_hash: string;
}

/** Audio SFX identifiers */
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

/** Input actions */
export type InputAction =
  | 'LEFT'
  | 'RIGHT'
  | 'FLAP'
  | 'PAUSE'
  | 'CONFIRM'
  | 'MUTE';

/** Settings persisted to localStorage */
export interface UserSettings {
  muted: boolean;
  volume: number;          // 0.0 – 1.0
  scale: 'auto' | 1 | 2;
  highScore: number;
}

/** Scene identifiers */
export type SceneId =
  | 'MENU'
  | 'GAME'
  | 'BONUS'
  | 'GAME_OVER'
  | 'LEADERBOARD'
  | 'HOW_TO_PLAY'
  | 'SETTINGS';
```

---

## API Specification

### Base URL
- Production: `https://api.balloon-fight.pages.dev`
- Staging: `https://api-staging.balloon-fight.pages.dev`

---

### GET /api/scores

Fetch the global top-50 leaderboard.

**Request**
```
GET /api/scores
Accept: application/json
```

**Response 200**
```json
{
  "entries": [
    {
      "rank": 1,
      "name": "ACE",
      "score": 987654,
      "phase": 42,
      "timestamp": 1711584000000
    }
  ],
  "cached": true,
  "cachedAt": 1711584000000
}
```

**Response headers**
```
Content-Type: application/json
Cache-Control: public, max-age=60
Access-Control-Allow-Origin: https://balloon-fight.pages.dev
```

**Error responses**
| Status | Body | Condition |
|--------|------|-----------|
| 500 | `{"error": "Internal error"}` | KV read failure |

---

### POST /api/scores

Submit a score after game over.

**Request**
```
POST /api/scores
Content-Type: application/json

{
  "name": "ACE",
  "score": 123456,
  "phase": 7
}
```

**Validation**
| Field | Rule |
|-------|------|
| `name` | 1–3 characters, `[A-Z0-9]` only (uppercased server-side) |
| `score` | Integer, 1 – 9,999,999 |
| `phase` | Integer, 1 – 999 |

**Response 200**
```json
{
  "success": true,
  "rank": 12
}
```

**Response — not in top 50**
```json
{
  "success": true,
  "rank": -1
}
```

**Error responses**
| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{"error": "Invalid name"}` | name validation fails |
| 400 | `{"error": "Invalid score"}` | score out of range |
| 429 | `{"error": "Rate limit exceeded"}` | > 5 requests / IP / 10 min |
| 500 | `{"error": "Internal error"}` | KV write failure |

---

## Database Schema (Cloudflare KV)

### Key: `scores:global`

Stores the top-50 leaderboard as a sorted JSON array.

```typescript
// Value type: KVScoreEntry[]
// Serialised as: JSON string
// Max value size: ~5KB (well within KV 25MB limit)
// TTL: none (persistent; cache invalidated on write)

const SCORES_KEY = 'scores:global';

// Read
const raw = await env.SCORES_KV.get(SCORES_KEY);
const entries: KVScoreEntry[] = raw ? JSON.parse(raw) : [];

// Write (after new score)
entries.push(newEntry);
entries.sort((a, b) => b.score - a.score);
const top50 = entries.slice(0, 50);
await env.SCORES_KV.put(SCORES_KEY, JSON.stringify(top50));
```

### Key pattern: `ratelimit:{ip_hash}`

Tracks submission count for rate limiting (TTL: 600 seconds).

```typescript
const RL_KEY = `ratelimit:${ipHash}`;
const count = parseInt(await env.SCORES_KV.get(RL_KEY) ?? '0');
if (count >= 5) return new Response('Rate limit exceeded', { status: 429 });
await env.SCORES_KV.put(RL_KEY, String(count + 1), { expirationTtl: 600 });
```

---

## Physics Constants

```typescript
// constants.ts

export const PHYSICS = {
  /** Logical game resolution (NES native) */
  GAME_WIDTH: 256,
  GAME_HEIGHT: 240,

  /** Gravity applied per frame (pixels/frame²) */
  GRAVITY: 0.18,

  /** Horizontal walk/fly speed (pixels/frame) */
  PLAYER_SPEED: 2.0,

  /** Upward velocity on flap */
  FLAP_IMPULSE: -4.5,

  /** Max fall speed */
  TERMINAL_VELOCITY: 6.0,

  /** Frames of invincibility after respawn */
  INVINCIBILITY_FRAMES: 60,

  /** Score at which extra life is awarded */
  EXTRA_LIFE_SCORE: 50_000,

  /** Max lives player can hold */
  MAX_LIVES: 5,

  /** Phases between bonus stages */
  BONUS_STAGE_INTERVAL: 3,

  /** Duration of bonus stage (ms) */
  BONUS_STAGE_DURATION_MS: 60_000,

  /** Enemy speed multiplier applied every N phases */
  DIFFICULTY_RAMP_INTERVAL: 3,
  DIFFICULTY_SPEED_MULTIPLIER: 1.15,

  /** Fish hover trigger delay (ms) */
  FISH_TRIGGER_DELAY_MS: 500,

  /** Max enemies on screen simultaneously */
  MAX_ENEMIES: 8,
} as const;
```

---

## Authentication Flow

MVP has no authentication. Leaderboard entries are pseudonymous. The only protection is:

1. **Server-side score validation** — range checks on score and name.
2. **Rate limiting** — 5 submissions per IP per 10 minutes via Cloudflare Rate Limiting rules
   (configured in `wrangler.toml`, not application code).
3. **IP hashing** — IP stored as SHA-256 hash in KV only for rate limit reference.
   Never exposed in GET response.

Future: If cheating becomes a problem, add a server-side score plausibility check
(score / phase must not exceed maximum possible score per phase).

---

## Infrastructure and Deployment

### Cloudflare Architecture

```
DNS → Cloudflare Pages (static assets)
           │
           └── /api/* → Cloudflare Worker (leaderboard API)
                              │
                              └── Cloudflare KV (scores:global)
```

### `wrangler.toml`

```toml
name = "balloon-fight-api"
main = "worker/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SCORES_KV"
id = "YOUR_KV_NAMESPACE_ID"

[env.staging]
name = "balloon-fight-api-staging"

[[env.staging.kv_namespaces]]
binding = "SCORES_KV"
id = "YOUR_STAGING_KV_NAMESPACE_ID"

[rate_limiting]
[[rules]]
threshold = 5
period = 600
action = "block"
```

### CI/CD Pipeline (`/.github/workflows/deploy.yml`)

```yaml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test

  deploy-worker:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: deploy

  deploy-pages:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: balloon-fight
          directory: dist
```

---

## Error Handling Strategy

### Client

```typescript
// All async operations wrapped in Result types
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// API calls never throw; return Result
async function fetchLeaderboard(): Promise<Result<LeaderboardEntry[]>> {
  try {
    const res = await fetch('/api/scores');
    if (!res.ok) return { ok: false, error: new Error(`HTTP ${res.status}`) };
    const data = await res.json();
    return { ok: true, value: data.entries };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}

// Uncaught errors caught at top level
window.addEventListener('unhandledrejection', (e) => {
  showErrorOverlay('Something went wrong. Reload the page.');
  console.error(e.reason);
});
```

### Worker

All handler functions return typed `Response` objects. No unhandled exceptions reach the
Cloudflare runtime. KV failures return 500 with a generic error message (never expose
internal details).

---

## Monitoring and Observability

- **Cloudflare Analytics**: Request counts, error rates, cache hit rates for Worker routes.
- **Cloudflare Logpush** (optional): Stream Worker logs to external sink if needed.
- **Client-side**: `window.onerror` and `unhandledrejection` logged to console in dev;
  optionally forwarded to Sentry in production via `VITE_SENTRY_DSN` env var.
- **Performance**: `performance.mark` / `performance.measure` around game loop hot path
  in development builds. Stripped in production.

---

## Architecture Decision Records

### ADR-001: PixiJS over raw Canvas 2D
**Decision**: Use PixiJS v8 with WebGL renderer.
**Rationale**: Raw Canvas 2D cannot maintain 60 fps with 10+ animated sprites on mid-range
mobile. PixiJS provides sprite batching (single draw call), WebGL acceleration, and a mature
API. Canvas fallback handles devices without WebGL.
**Trade-offs**: +100KB bundle; dependency on a third party. Acceptable given the performance
gain.

### ADR-002: Cloudflare Workers over Node.js/Express
**Decision**: Serverless Worker for leaderboard API.
**Rationale**: Zero infra management, zero cold start, global edge deployment, ~$0 cost for
the traffic volumes expected. A Node.js server would require a VPS, uptime monitoring,
and TLS management.
**Trade-offs**: Workers runtime is not full Node.js (no `fs`, limited APIs). Acceptable
for a simple CRUD endpoint.

### ADR-003: No user authentication in MVP
**Decision**: Pseudonymous scores, no login.
**Rationale**: Authentication adds significant complexity (OAuth flow, session management,
token refresh) and friction for a casual game. The cost of cheating is low — a fake high
score on an indie game leaderboard hurts nobody. Rate limiting + server validation is
sufficient deterrence.
**Revisit**: If the leaderboard becomes competitive, add Discord OAuth or similar.

### ADR-004: Web Audio API synthesis over sampled audio
**Decision**: Synthesize all SFX in Web Audio API; no audio files.
**Rationale**: Eliminates ~500KB of audio assets from the bundle. Web Audio oscillators can
convincingly approximate the NES triangle/square wave SFX. No licensing concerns.
**Trade-offs**: Synthesis code adds ~2KB. SFX fidelity is approximate, not exact.
