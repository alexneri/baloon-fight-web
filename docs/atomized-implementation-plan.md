# Atomized Implementation Plan — Balloon Fight Web

## Audit Findings

### Cross-document gaps identified and resolved

1. **BitmapFont vs web font**: front-end-spec uses CSS @font-face for PressStart2P for DOM
   menus, but PixiJS HUD requires BitmapFont pre-render. Both are needed. Task 1.3
   covers asset pipeline including BitmapFont generation.

2. **Leaderboard eligibility check**: Game Over screen (FR story 4.4) needs the current
   50th-place score to determine whether to show NameEntry. This requires either
   (a) caching the last-fetched leaderboard, or (b) a dedicated `GET /api/scores/threshold`
   endpoint. Decision: cache last-fetched leaderboard in-memory during session. Task 4.4
   captures this dependency on Task 5.1.

3. **Worker type sharing**: The API types (`LeaderboardEntry`, `ScoreSubmission`, etc.) are
   defined in `src/types/index.ts` but the Worker (`worker/`) lives outside `src/`.
   Resolution: shared types package in `packages/types/` referenced from both.
   Captured in Task 0.1 (monorepo setup).

4. **Platform layout data**: architecture.md defines `PlatformLayout` types; front-end-spec
   references named templates ("classic", "sparse") but prd.md story 3.4 says levels.json
   defines them. All consistent — levels.json is the source of truth, types are in
   shared types. No gap.

5. **PWA install prompt timing**: story 6.1 says "after first game over." This requires
   GameOverScene to trigger the install prompt — captured in Task 6.1's acceptance criteria.

---

## Parallel Execution Tracks

```
TRACK A: Engine + Game Logic (Weeks 1–5)
  Task 0.1 → Task 1.1 → Task 1.2 → Task 1.3 → Task 1.4+1.5+1.6 (parallel)
            → Task 2.1 → Task 2.2 → Task 2.3+2.4+2.5 (parallel)
            → Task 2.6 → Task 2.7 → Task 2.8 → Task 2.9
            → Task 3.1 → Task 3.2 → Task 3.3 → Task 3.4

TRACK B: UI and Backend (Weeks 5–8, starts after Task 1.2)
  Task 4.1 → Task 4.2 → Task 4.3 → Task 4.4 → Task 4.5 → Task 4.6
  Task 5.1 → Task 5.2 → Task 5.3 → Task 5.4 (can run fully parallel to Track A from Week 3)

TRACK C: PWA, Audio, Polish (Weeks 8–10, after Tracks A+B merge)
  Task 6.1 → Task 6.2 → Task 6.3 → Task 6.4 → Task 6.5
```

---

## Task Index

| ID | Title | Epic | Priority | Depends On |
|----|-------|------|----------|------------|
| 0.1 | Monorepo and project scaffold | — | P0 | — |
| 1.1 | PixiJS app bootstrap | E1 | P0 | 0.1 |
| 1.2 | Scene manager | E1 | P0 | 1.1 |
| 1.3 | Asset pipeline and preloader | E1 | P0 | 1.2 |
| 1.4 | Input: keyboard | E1 | P0 | 1.1 |
| 1.5 | Input: touch | E1 | P0 | 1.1 |
| 1.6 | Input: gamepad | E1 | P0 | 1.4 |
| 2.1 | Player entity | E2 | P0 | 1.4, 1.3 |
| 2.2 | Platform collision system | E2 | P0 | 2.1 |
| 2.3 | Enemy: Balloon Bird A | E2 | P0 | 2.2 |
| 2.4 | Enemy: Balloon Bird B | E2 | P0 | 2.3 |
| 2.5 | Enemy: Sparky | E2 | P0 | 2.2 |
| 2.6 | Egg and hatch system | E2 | P0 | 2.3 |
| 2.7 | Water and fish trap | E2 | P0 | 2.2 |
| 2.8 | Scoring system | E2 | P0 | 2.3, 2.6, 2.7 |
| 2.9 | Lives and death sequence | E2 | P0 | 2.8 |
| 3.1 | Phase progression | E3 | P0 | 2.9 |
| 3.2 | Difficulty ramp | E3 | P0 | 3.1 |
| 3.3 | Bonus stage | E3 | P0 | 3.1 |
| 3.4 | Level data JSON | E3 | P0 | 2.3, 2.4, 2.5 |
| 4.1 | Main menu | E4 | P1 | 1.2, 1.3 |
| 4.2 | HUD | E4 | P1 | 2.8, 1.2 |
| 4.3 | Pause screen | E4 | P1 | 4.1 |
| 4.4 | Game over screen | E4 | P1 | 2.9, 5.1 |
| 4.5 | Leaderboard screen | E4 | P1 | 5.1 |
| 4.6 | How to play + settings | E4 | P1 | 4.1 |
| 5.1 | Worker: GET /api/scores | E5 | P1 | 5.3 |
| 5.2 | Worker: POST /api/scores | E5 | P1 | 5.3 |
| 5.3 | KV schema and data model | E5 | P1 | 0.1 |
| 5.4 | CI/CD: Workers deploy | E5 | P1 | 5.1, 5.2 |
| 6.1 | PWA: service worker + manifest | E6 | P2 | 1.3 |
| 6.2 | Web Audio sound effects | E6 | P2 | 1.2 |
| 6.3 | Accessibility audit | E6 | P2 | 4.1–4.6 |
| 6.4 | Performance profiling | E6 | P2 | 3.3 |
| 6.5 | Production hardening | E6 | P2 | 6.1–6.4 |

---

## Detailed Task Specifications

---

### Task 0.1 — Monorepo and Project Scaffold
**FR/NFR**: NFR6 (maintainability)
**Files to create**:
```
balloon-fight-web/
├── package.json              (pnpm workspace root)
├── pnpm-workspace.yaml
├── packages/
│   └── types/
│       ├── package.json
│       └── src/index.ts      (all shared types from architecture.md)
├── apps/
│   ├── game/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/main.ts
│   └── worker/
│       ├── package.json
│       ├── wrangler.toml
│       ├── tsconfig.json
│       └── src/index.ts
├── .github/workflows/deploy.yml
├── .eslintrc.json
├── .prettierrc
└── tsconfig.base.json
```
**Files to modify**: None (greenfield)
**Integration map**: Upstream: nothing → This: project skeleton → Downstream: all tasks
**Acceptance criteria**:
- [ ] `pnpm install` succeeds from root
- [ ] `pnpm -r typecheck` passes (zero errors)
- [ ] `pnpm -r test` runs Vitest (zero tests, zero failures)
- [ ] `packages/types` exports all types from architecture.md `types/index.ts`
- [ ] ESLint config: `no-explicit-any` rule enabled
- [ ] Prettier config: 2-space indent, single quotes, trailing commas
**Dependencies**: None

---

### Task 1.1 — PixiJS App Bootstrap
**FR**: FR1 (game loop)
**Files to create**:
```
apps/game/src/
├── main.ts
└── engine/
    └── GameLoop.ts
```
**Files to modify**: `apps/game/index.html`
**Integration map**: Upstream: 0.1 → This: PixiJS app instance → Downstream: all game tasks
**Acceptance criteria**:
- [ ] PixiJS v8 Application initialised, `antialias: false`, `backgroundColor: 0x6888FC`
- [ ] Canvas renders at 256×240 logical pixels
- [ ] Canvas CSS: `image-rendering: pixelated`
- [ ] Canvas scales to fit viewport (integer scale, centred)
- [ ] GameLoop runs ticker at 60 fps; `deltaTime` exposed per frame
- [ ] Fixed physics timestep at 16.67ms (accumulator pattern)
- [ ] Dev build: FPS counter rendered in top-right (PixiJS Graphics)
- [ ] Vitest: unit test for `computeCanvasScale()` function
**Dependencies**: 0.1

---

### Task 1.2 — Scene Manager
**FR**: FR15 (menus)
**Files to create**:
```
apps/game/src/engine/
├── SceneManager.ts
└── Scene.ts              (abstract base class)
apps/game/src/game/scenes/
├── PreloaderScene.ts     (stub)
├── MenuScene.ts          (stub)
├── GameScene.ts          (stub)
├── BonusScene.ts         (stub)
├── GameOverScene.ts      (stub)
└── LeaderboardScene.ts   (stub)
```
**Integration map**: Upstream: 1.1 → This: SceneManager → Downstream: all scene tasks
**Acceptance criteria**:
- [ ] `SceneManager.push(scene)`, `.pop()`, `.replace(scene)` implemented
- [ ] Active scene receives `update(dt)` and `render()` calls from GameLoop
- [ ] Scene transition: previous scene's `destroy()` called; containers removed from stage
- [ ] All stub scenes mountable without errors
- [ ] Vitest: unit tests for push/pop/replace state machine
**Dependencies**: 1.1

---

### Task 1.3 — Asset Pipeline and Preloader
**FR**: FR14 (PWA assets), NFR1 (load time)
**Files to create**:
```
apps/game/src/engine/
└── AssetLoader.ts
apps/game/public/assets/
├── sprites.json          (TexturePacker atlas manifest — placeholder)
└── sprites.png           (placeholder 1×1 atlas)
apps/game/src/game/scenes/
└── PreloaderScene.ts     (full implementation)
```
**Files to modify**: `apps/game/src/game/scenes/PreloaderScene.ts`
**Integration map**: Upstream: 1.2 → This: loaded asset textures → Downstream: all entities
**Acceptance criteria**:
- [ ] `AssetLoader.loadAll()` resolves PixiJS Assets with manifest
- [ ] PreloaderScene shows progress bar (0→100%)
- [ ] BitmapFont "PressStart2P" pre-rendered at sizes 8, 10, 12, 16, 20
- [ ] Auto-advances to MenuScene on complete
- [ ] Error state: shows "FAILED TO LOAD. REFRESH." on asset error
- [ ] Bundle: all assets served from `/assets/`; no external CDN assets in critical path
**Dependencies**: 1.2

---

### Task 1.4 — Input Manager: Keyboard
**FR**: FR10
**Files to create**:
```
apps/game/src/engine/InputManager.ts
```
**Integration map**: Upstream: 1.1 → This: InputManager singleton → Downstream: all entity updates
**Acceptance criteria**:
- [ ] `InputManager.isDown(action: InputAction): boolean`
- [ ] `InputManager.wasPressed(action: InputAction): boolean` (true for exactly one frame)
- [ ] `wasPressed` state reset each frame (called by GameLoop)
- [ ] Key mappings: LEFT (←), RIGHT (→), FLAP (Z, Space), PAUSE (P, Escape), CONFIRM (Enter), MUTE (M)
- [ ] Vitest: unit tests for `isDown` / `wasPressed` state transitions
**Dependencies**: 1.1

---

### Task 1.5 — Input Manager: Touch
**FR**: FR11
**Files to create**:
```
apps/game/src/game/ui/TouchControls.ts
```
**Files to modify**: `apps/game/src/engine/InputManager.ts`
**Integration map**: Upstream: 1.4 → This: touch → InputAction merge → Downstream: player update
**Acceptance criteria**:
- [ ] TouchControls renders D-pad and flap button as PixiJS Graphics
- [ ] Visible only when `navigator.maxTouchPoints > 0`
- [ ] Multi-touch: left + flap simultaneously supported
- [ ] Touch events merged into InputManager action state
- [ ] Touch targets: D-pad halves ≥ 60px wide, flap button ≥ 90px wide
- [ ] Active zone: yellow tint `rgba(248,184,0,0.3)`
**Dependencies**: 1.4

---

### Task 1.6 — Input Manager: Gamepad
**FR**: FR12
**Files to modify**: `apps/game/src/engine/InputManager.ts`
**Integration map**: Upstream: 1.4 → This: gamepad polling → InputAction merge → Downstream: player
**Acceptance criteria**:
- [ ] Gamepad API polled each frame in GameLoop
- [ ] Left stick X-axis > 0.3: RIGHT; < -0.3: LEFT
- [ ] D-pad axes: same mapping
- [ ] Button[0] (A/Cross): FLAP
- [ ] Button[9] (Start): PAUSE
- [ ] `gamepadconnected` / `gamepaddisconnected`: emit via EventBus
- [ ] UI: toast notification on connect/disconnect
**Dependencies**: 1.4

---

### Task 2.1 — Player Entity
**FR**: FR2
**Files to create**:
```
apps/game/src/game/entities/
├── Entity.ts
└── Player.ts
apps/game/src/game/systems/PhysicsSystem.ts
```
**Integration map**: Upstream: 1.3, 1.4 → This: Player → Downstream: 2.2, 2.8, 2.9
**Acceptance criteria**:
- [ ] Player sprite renders correct frame per `BalloonState` and walk/fly cycle
- [ ] Flap: applies `PHYSICS.FLAP_IMPULSE` to vy
- [ ] Gravity: adds `PHYSICS.GRAVITY` to vy each frame, capped at `TERMINAL_VELOCITY`
- [ ] Horizontal move: vx = ±`PHYSICS.PLAYER_SPEED` while key held; 0 on release
- [ ] Horizontal wrapping: x < 0 → x = 256; x > 256 → x = 0
- [ ] Invincibility: sprite flashes (alpha alternates) for `INVINCIBILITY_FRAMES` frames
- [ ] Vitest: unit tests for flap impulse, gravity integration, wrapping
**Dependencies**: 1.3, 1.4

---

### Task 2.2 — Platform Collision System
**FR**: FR4
**Files to create**:
```
apps/game/src/game/systems/CollisionSystem.ts
apps/game/src/game/data/platforms.ts   (hard-coded AABB arrays for each layout)
```
**Integration map**: Upstream: 2.1 → This: collision resolution → Downstream: all entity movement
**Acceptance criteria**:
- [ ] AABB overlap detection: `checkAABB(a, b): boolean`
- [ ] Top-only collision: entity lands on platform if falling (vy > 0) and overlapping top edge
- [ ] Solid collision: all-sides block
- [ ] Pass-through: entity can move upward through platform; blocked on way down
- [ ] Enemy falling state bypasses all platform collision
- [ ] Vitest: unit tests for all collision cases (top-only, solid, pass-through, no-hit)
**Dependencies**: 2.1

---

### Task 2.3 — Enemy: Balloon Bird Type A
**FR**: FR3
**Files to create**:
```
apps/game/src/game/entities/
├── Enemy.ts
└── BalloonBirdA.ts
apps/game/src/game/systems/EnemyAISystem.ts
```
**Integration map**: Upstream: 2.2 → This: BalloonBirdA → Downstream: 2.6, 2.8
**Acceptance criteria**:
- [ ] Floats upward with periodic flap (random interval 60–180 frames)
- [ ] Loose horizontal pursuit: moves toward player x at reduced speed
- [ ] Poppable from above: player vy > 0 + player bottom intersects enemy top
- [ ] On pop: enters FALLING state, plays fall animation, bounces on platform
- [ ] After bounce: egg entity spawned, enemy entity removed
- [ ] Vitest: unit tests for pop detection, state transitions
**Dependencies**: 2.2

---

### Task 2.4 — Enemy: Balloon Bird Type B
**FR**: FR3
**Files to create**:
```
apps/game/src/game/entities/BalloonBirdB.ts
```
**Files to modify**: `EnemyAISystem.ts`
**Integration map**: Upstream: 2.3 → This: BalloonBirdB (extends Enemy) → Downstream: 2.6, 2.8
**Acceptance criteria**:
- [ ] Flap interval 30–90 frames (faster than A)
- [ ] Pursuit radius tighter (100px vs 160px)
- [ ] Spawns only in phases 2+
- [ ] All pop/egg behaviour identical to A
**Dependencies**: 2.3

---

### Task 2.5 — Enemy: Sparky
**FR**: FR3
**Files to create**:
```
apps/game/src/game/entities/Sparky.ts
```
**Files to modify**: `EnemyAISystem.ts`
**Integration map**: Upstream: 2.2 → This: Sparky → Downstream: 2.8, 2.9
**Acceptance criteria**:
- [ ] Moves horizontally along platform, bounces at platform edges
- [ ] Contact with player: kills player (reduce lives), regardless of angle
- [ ] Cannot be stomped: player landing on Sparky from above = player death
- [ ] Not affected by player balloon collision
- [ ] Spawns phase 3+
**Dependencies**: 2.2

---

### Task 2.6 — Egg and Hatch System
**FR**: FR3 (egg behaviour)
**Files to create**:
```
apps/game/src/game/entities/Egg.ts
```
**Files to modify**: `apps/game/src/game/systems/EnemyAISystem.ts`
**Integration map**: Upstream: 2.3 → This: Egg entity → Downstream: 2.8, 3.1
**Acceptance criteria**:
- [ ] Egg spawns at enemy bounce position
- [ ] Hatch timer: phase-dependent (see `levels.json`)
- [ ] Hatch warning: sprite flashes at 8fps in final 500ms
- [ ] Player kick (side collision): egg entity destroyed, 500 pts, no new enemy
- [ ] Hatch complete: egg destroyed, BalloonBirdB spawned at egg position
- [ ] Vitest: unit test for hatch timer countdown, kick detection
**Dependencies**: 2.3

---

### Task 2.7 — Water and Fish Trap
**FR**: FR5
**Files to create**:
```
apps/game/src/game/entities/Fish.ts
```
**Files to modify**: `apps/game/src/game/scenes/GameScene.ts`
**Integration map**: Upstream: 2.2 → This: fish trap → Downstream: 2.9
**Acceptance criteria**:
- [ ] Water sprite: 256px wide, bottom of canvas, 4-frame wave animation at 8fps
- [ ] Fish lurk zone: 16px column per fish (3 fish positions in classic layout)
- [ ] Hover trigger: player in column > `PHYSICS.FISH_TRIGGER_DELAY_MS` → telegraph anim
- [ ] Lunge: fish moves up 40px in 200ms, kills player on contact
- [ ] Retract: fish returns after 1000ms
- [ ] Vitest: unit test for trigger timer logic
**Dependencies**: 2.2

---

### Task 2.8 — Scoring System
**FR**: FR7, FR8
**Files to create**:
```
apps/game/src/game/systems/ScoringSystem.ts
```
**Integration map**: Upstream: 2.3, 2.6, 2.7 → This: score events → Downstream: 4.2, 4.4, 5.2
**Acceptance criteria**:
- [ ] ScoringSystem subscribes to: EnemyPopped, EggKicked, BonusCatch events via EventBus
- [ ] Escalating score: first pop in phase = 800, then 1000, 1200, 1500, 1500 (cap)
- [ ] Phase resets escalation counter
- [ ] Extra life awarded at `PHYSICS.EXTRA_LIFE_SCORE` (and multiples), capped at `MAX_LIVES`
- [ ] `getScore()`, `getHighScore()`, `getLives()` accessors
- [ ] High score persisted to `localStorage` on game over
- [ ] Vitest: unit tests for escalation logic, extra life threshold, persistence
**Dependencies**: 2.3, 2.6, 2.7

---

### Task 2.9 — Lives and Death Sequence
**FR**: FR8
**Files to create**:
```
apps/game/src/game/systems/ProgressionSystem.ts  (partial — death handling)
```
**Files to modify**: `apps/game/src/game/scenes/GameScene.ts`
**Integration map**: Upstream: 2.8 → This: death/respawn loop → Downstream: 3.1, 4.4
**Acceptance criteria**:
- [ ] Death animation: balloon pop sprite, character falls off screen
- [ ] 2000ms pause before respawn
- [ ] Respawn: player re-appears at start position with `INVINCIBILITY_FRAMES` frames
- [ ] Lives decremented; if 0 → `SceneManager.replace(GameOverScene)`
- [ ] Vitest: unit test for death→respawn→game-over state machine
**Dependencies**: 2.8

---

### Task 3.1 — Phase Progression
**FR**: FR (story 3.1)
**Files to modify**:
```
apps/game/src/game/systems/ProgressionSystem.ts
apps/game/src/game/scenes/GameScene.ts
```
**Integration map**: Upstream: 2.9, 3.4 → This: phase advance → Downstream: 3.2, 3.3
**Acceptance criteria**:
- [ ] Phase clears when all enemies in `EntityManager` are removed (no eggs pending hatch)
- [ ] Phase transition: brief black screen + "PHASE N" text (1.5s)
- [ ] Next phase loaded from `levels.json` `phases[n]` entry
- [ ] Every 3rd phase → BonusScene before next regular phase
- [ ] Phase number stored in `ProgressionSystem.currentPhase`
**Dependencies**: 2.9, 3.4

---

### Task 3.2 — Difficulty Ramp
**FR**: FR (story 3.2)
**Files to modify**: `apps/game/src/game/systems/EnemyAISystem.ts`, `ProgressionSystem.ts`
**Acceptance criteria**:
- [ ] Every `DIFFICULTY_RAMP_INTERVAL` phases: enemy speed × `DIFFICULTY_SPEED_MULTIPLIER`
- [ ] Hatch delay reduced by 10% per ramp interval (floor: 500ms)
- [ ] Max enemies on screen increases by 1 per 2 phases (cap: `MAX_ENEMIES`)
- [ ] Vitest: unit test for multiplier application
**Dependencies**: 3.1

---

### Task 3.3 — Bonus Stage
**FR**: FR6
**Files to create**:
```
apps/game/src/game/scenes/BonusScene.ts
apps/game/src/game/entities/FallingBalloon.ts
```
**Acceptance criteria**:
- [ ] BonusScene spawns 20 balloons at random x, staggered vertical starts
- [ ] Balloons fall at varying speeds (1.5–3.5 px/frame)
- [ ] Player catches by overlapping balloon AABB
- [ ] 60-second countdown timer displayed
- [ ] Score: 1000 pts per catch
- [ ] PERFECT (all caught): "PERFECT BONUS!" text + 5000 bonus pts
- [ ] End: timer expires or all balloons caught → return to GameScene (next phase)
**Dependencies**: 3.1

---

### Task 3.4 — Level Data JSON
**FR**: FR (story 3.4)
**Files to create**:
```
apps/game/src/game/data/levels.json
```
**Acceptance criteria**:
- [ ] Minimum 10 phase definitions
- [ ] Each phase: `phase`, `layoutName`, `enemies[]`, `hatchDelayMs`, `bonusStage`
- [ ] Layouts: "classic" (original NES layout), "sparse" (fewer platforms, phase 5+)
- [ ] Enemy spawn positions in logical pixel coordinates (256×240 space)
- [ ] File hot-reloads in development via Vite HMR
- [ ] TypeScript: `levels.json` imported with `satisfies LevelData` assertion
**Dependencies**: 2.3, 2.4, 2.5

---

### Task 4.1 — Main Menu
**FR**: FR15
**Files to create**:
```
apps/game/src/game/scenes/MenuScene.ts
apps/game/src/game/ui/MainMenu.ts
```
**Integration map**: Upstream: 1.2, 1.3 → This: MenuScene → Downstream: all scenes
**Acceptance criteria**:
- [ ] Attract mode: enemies animate on canvas behind overlay
- [ ] Menu panel: PLAY, LEADERBOARD, HOW TO PLAY, SETTINGS
- [ ] Keyboard: Up/Down navigate, Enter confirm
- [ ] Touch: tap item
- [ ] Focus ring on all items
- [ ] Hi-score displayed from `ScoringSystem.getHighScore()` (localStorage)
- [ ] ARIA: `role="menu"`, `role="menuitem"`, `aria-selected`
**Dependencies**: 1.2, 1.3

---

### Task 4.2 — HUD
**FR**: FR (story 4.2)
**Files to create**:
```
apps/game/src/game/ui/HUD.ts
```
**Acceptance criteria**:
- [ ] Score: `BitmapText`, PressStart2P 8px, yellow, top-centre
- [ ] Hi-Score: same, white, top-right
- [ ] Lives: balloon icon sprites, top-left, spaced 18px apart
- [ ] Phase announcement: centred BitmapText, fades after 1500ms
- [ ] Updates every frame from `ScoringSystem`
**Dependencies**: 2.8, 1.2

---

### Task 4.3 — Pause Screen
**FR**: FR15
**Files to create**:
```
apps/game/src/game/ui/PauseMenu.ts
```
**Files to modify**: `apps/game/src/game/scenes/GameScene.ts`
**Acceptance criteria**:
- [ ] P / Escape / Start → `app.ticker.stop()` + PauseMenu shown
- [ ] Options: RESUME, RESTART, MAIN MENU, MUTE/UNMUTE
- [ ] RESUME: `app.ticker.start()`, PauseMenu hidden
- [ ] MUTE: toggles `AudioManager.muted`, persists to localStorage
- [ ] Overlay: `rgba(0,0,0,0.75)` on canvas
**Dependencies**: 4.1

---

### Task 4.4 — Game Over Screen
**FR**: FR8, FR9
**Files to create**:
```
apps/game/src/game/scenes/GameOverScene.ts
apps/game/src/game/ui/NameEntryDialog.ts
```
**Integration map**: Upstream: 2.9, 5.1 → This: GameOverScene → Downstream: 5.2
**Acceptance criteria**:
- [ ] Displays: final score, personal high score, phase reached
- [ ] New personal best: animated "★ NEW PERSONAL BEST!" banner (scale spring)
- [ ] Leaderboard eligibility: if score ≥ last-fetched 50th place score, show NameEntry
- [ ] NameEntry: 3-char arcade selector; Up/Down to cycle, Right to advance, Enter to submit
- [ ] Submit: POST /api/scores → show rank or error toast
- [ ] Buttons: PLAY AGAIN (→ GameScene reset), VIEW LEADERBOARD (→ LeaderboardScene)
- [ ] PWA install prompt triggered (once per session) after 2s delay
**Dependencies**: 2.9, 5.1

---

### Task 4.5 — Leaderboard Screen
**FR**: FR9
**Files to create**:
```
apps/game/src/game/scenes/LeaderboardScene.ts
apps/game/src/game/ui/LeaderboardView.ts
apps/game/src/api/leaderboard.ts
```
**Integration map**: Upstream: 5.1 → This: LeaderboardView → Downstream: 4.4
**Acceptance criteria**:
- [ ] Fetches `GET /api/scores` on mount
- [ ] Loading: 5-row skeleton shimmer
- [ ] Error: icon + message + TRY AGAIN button (re-fetches)
- [ ] Empty: "No scores yet. Be first!"
- [ ] Renders top-50: rank, name, score, phase
- [ ] Own entry (if just submitted): highlighted yellow row
- [ ] Scrollable; BACK / Escape → previous scene
**Dependencies**: 5.1

---

### Task 4.6 — How to Play and Settings
**FR**: FR15
**Files to create**:
```
apps/game/src/game/scenes/HowToPlayScene.ts
apps/game/src/game/scenes/SettingsScene.ts
```
**Acceptance criteria**:
- [ ] HowToPlay: tabs KEYBOARD / TOUCH / GAMEPAD, auto-selected by input type
- [ ] Controls diagram: static sprite or simple PixiJS illustration
- [ ] Scoring reference table
- [ ] Settings: mute toggle, volume slider (0–100), scale selector (AUTO/1×/2×)
- [ ] All settings: immediate effect + `localStorage` persist
- [ ] All screens: keyboard accessible, BACK/Escape exits
**Dependencies**: 4.1

---

### Task 5.3 — KV Schema and Data Model
**FR**: FR9 (backend)
**Files to create**:
```
apps/worker/src/
├── types.ts          (re-exports from packages/types)
└── kv.ts             (KV read/write helpers)
wrangler.toml
```
**Acceptance criteria**:
- [ ] `kv.getScores(env): Promise<KVScoreEntry[]>` reads `scores:global`
- [ ] `kv.putScores(env, entries): Promise<void>` writes sorted, trimmed top-50
- [ ] `kv.getRateLimit(env, ipHash): Promise<number>` reads TTL key
- [ ] `kv.incrementRateLimit(env, ipHash): Promise<void>` writes with `expirationTtl: 600`
- [ ] All KV errors caught and re-thrown as typed errors
- [ ] Vitest (worker): unit tests with mock KV binding
**Dependencies**: 0.1

---

### Task 5.1 — Worker: GET /api/scores
**FR**: FR9
**Files to create**:
```
apps/worker/src/handlers/getScores.ts
```
**Files to modify**: `apps/worker/src/index.ts`
**Integration map**: Upstream: 5.3 → This: GET endpoint → Downstream: 4.5, 4.4
**Acceptance criteria**:
- [ ] Route: `GET /api/scores`
- [ ] Returns `{entries: LeaderboardEntry[], cached: boolean, cachedAt: number}`
- [ ] CORS: `Access-Control-Allow-Origin: https://balloon-fight.pages.dev`
- [ ] Cache-Control: `public, max-age=60`
- [ ] KV failure: returns 500 with generic error (no internal details)
- [ ] Vitest: unit test with mock KV returning known data; verifies response shape
**Dependencies**: 5.3

---

### Task 5.2 — Worker: POST /api/scores
**FR**: FR9
**Files to create**:
```
apps/worker/src/handlers/postScore.ts
apps/worker/src/validation.ts
```
**Integration map**: Upstream: 5.3 → This: POST endpoint → Downstream: leaderboard KV update
**Acceptance criteria**:
- [ ] Route: `POST /api/scores`
- [ ] Validates: name (1–3 `[A-Z0-9]`), score (1–9,999,999), phase (1–999)
- [ ] Rate limit check: 5 / IP / 10min via KV TTL key
- [ ] If top-50: insert, sort, trim, write back to KV
- [ ] Returns: `{success: true, rank: number}` (rank = -1 if not top-50)
- [ ] 400 on validation failure; 429 on rate limit; 500 on KV error
- [ ] Vitest: unit tests for all validation branches, rate limit logic
**Dependencies**: 5.3

---

### Task 5.4 — CI/CD Workers Deploy
**FR**: NFR4 (reliability)
**Files to create**:
```
.github/workflows/deploy.yml
```
**Acceptance criteria**:
- [ ] On push to `main`: runs typecheck → lint → test → deploy worker → deploy pages
- [ ] On PR: runs typecheck → lint → test only (no deploy)
- [ ] Secrets: `CF_API_TOKEN`, `CF_ACCOUNT_ID` in GitHub Actions environment
- [ ] Worker deploy: `wrangler deploy` in `apps/worker/`
- [ ] Pages deploy: `pnpm build` in `apps/game/` → Cloudflare Pages action
- [ ] Pipeline fails fast on any step failure
**Dependencies**: 5.1, 5.2

---

### Task 6.1 — PWA: Service Worker and Manifest
**FR**: FR14
**Files to create**:
```
apps/game/public/manifest.webmanifest
apps/game/public/icons/
├── icon-192.png
└── icon-512.png
```
**Files to modify**: `apps/game/vite.config.ts`
**Acceptance criteria**:
- [ ] `vite-plugin-pwa` configured with `generateSW` strategy
- [ ] Manifest: name, short_name, theme_color `#0A0A1A`, background_color `#000000`, `display: standalone`
- [ ] All game assets in precache manifest
- [ ] Offline: game playable after first visit with no network
- [ ] Install prompt: `beforeinstallprompt` captured; shown after first game over
- [ ] Lighthouse PWA score ≥ 90
**Dependencies**: 1.3

---

### Task 6.2 — Web Audio Sound Effects
**FR**: FR13
**Files to create**:
```
apps/game/src/engine/AudioManager.ts
```
**Acceptance criteria**:
- [ ] `AudioManager` creates `AudioContext` on first user interaction
- [ ] `AudioManager.play(sfx: SFXId): void` plays synthesised sound
- [ ] SFX implemented: flap, balloon_pop, enemy_fall, egg_hatch, extra_life, game_over, menu_blip
- [ ] All synthesis via `OscillatorNode` + `GainNode` (no audio files)
- [ ] `muted` state disables output; persists to localStorage
- [ ] Vitest: unit test that `play()` does not throw; muted state skips playback
**Dependencies**: 1.2

---

### Task 6.3 — Accessibility Audit and Remediation
**NFR**: NFR2
**Files to modify**: All UI scene and component files as needed
**Acceptance criteria**:
- [ ] `axe-core` automated scan: 0 critical violations on all screens
- [ ] Manual keyboard test: all screens reachable, no traps
- [ ] `prefers-reduced-motion`: non-game animations disabled
- [ ] Contrast: all UI text verified ≥ 4.5:1 (tooling: contrast-ratio npm or axe)
- [ ] ARIA: `role="menu"` / `role="menuitem"` on all menus verified
- [ ] Touch targets: all ≥ 44×44px verified via DevTools
**Dependencies**: 4.1–4.6

---

### Task 6.4 — Performance Profiling and Optimisation
**NFR**: NFR1
**Files to modify**: Any hot-path files identified in profiling
**Acceptance criteria**:
- [ ] Lighthouse (mobile preset) Performance score ≥ 85
- [ ] Bundle size (JS + assets): < 2MB
- [ ] PixiJS render loop: 0 `new` object allocations in update/render hot path
- [ ] Sprite batching: single draw call confirmed for all enemy sprites (PixiJS DevTools)
- [ ] Memory: < 150MB heap after 10 phases (Chrome Memory profiler)
- [ ] No `console.log` in production (ESLint `no-console` rule)
**Dependencies**: 3.3 (all gameplay complete)

---

### Task 6.5 — Production Hardening
**NFR**: NFR3, NFR4, NFR6
**Files to modify**: Worker and game app files
**Acceptance criteria**:
- [ ] CSP header on Pages: `script-src 'self'; object-src 'none'`
- [ ] TypeScript strict: `pnpm -r typecheck` passes with 0 errors and 0 `any`
- [ ] Error boundary in game: `window.onerror` / `unhandledrejection` → error overlay
- [ ] Worker: all error paths return typed responses (no unhandled rejections)
- [ ] All `TODO` and `FIXME` comments resolved or tracked as GitHub issues
- [ ] README updated with final deploy URL and developer setup instructions
**Dependencies**: 6.1–6.4

---

## Quality Gates

### Gate 1: Engine Ready (after Epic 1)
- [ ] PixiJS canvas renders at 60 fps in Chrome mobile emulation
- [ ] All three input systems (keyboard, touch, gamepad) produce correct actions
- [ ] SceneManager transitions between all stub scenes without error

### Gate 2: Gameplay Complete (after Epic 2)
- [ ] Player can play a full session: move, flap, pop enemies, die, respawn
- [ ] All three enemy types behave correctly
- [ ] Scoring matches spec for all action types
- [ ] All Vitest unit tests pass (game/systems coverage ≥ 80%)

### Gate 3: Full Game Loop (after Epic 3)
- [ ] Phases advance automatically on enemy clear
- [ ] Bonus stage triggers every 3 phases and returns correctly
- [ ] Difficulty ramp observable after phase 3

### Gate 4: UI and Backend Live (after Epics 4–5)
- [ ] All menus navigable by keyboard and touch
- [ ] `GET /api/scores` returns valid JSON from production Worker
- [ ] `POST /api/scores` accepts a valid submission and appears in leaderboard

### Gate 5: Production Launch (after Epic 6)
- [ ] Lighthouse PWA ≥ 90, Performance ≥ 85 (mobile)
- [ ] axe-core: 0 critical violations
- [ ] All TypeScript strict checks passing
- [ ] Game playable offline after first load
- [ ] Bundle < 2MB

---

## Dependency Graph

```
0.1
 └─ 1.1
     ├─ 1.2
     │   └─ 1.3
     │       ├─ 2.1 ──────────────────────────────────┐
     │       │   └─ 2.2                                │
     │       │       ├─ 2.3 ─── 2.6 ─── 2.8 ─── 2.9 ─┤
     │       │       ├─ 2.4 ─────────────────────────  │
     │       │       ├─ 2.5 ─── 2.8 (via events)       │
     │       │       └─ 2.7 ─── 2.9 (via events)       │
     │       │                                          │
     │       └─ 3.4 ──── 3.1 ─── 3.2                   │
     │                    └──── 3.3                      │
     │                                                   │
     ├─ 1.4 ─── 2.1                                     │
     │   ├─ 1.5                                          │
     │   └─ 1.6                                          │
     │                                                   │
     └─ 4.1 ──── 4.3 ──── 4.6                           │
         └─ 4.2 (from 2.8)                               │
         └─ 4.4 (from 2.9 + 5.1)                        │
         └─ 4.5 (from 5.1)                              │
                                                         │
5.3 ─── 5.1 ─── 5.4                                     │
 └───── 5.2 ─── 5.4                                      │
                                                         │
[All epics 1–5] ── 6.1 ── 6.2 ── 6.3 ── 6.4 ── 6.5    │
```
