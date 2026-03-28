# Implementation Roadmap — Balloon Fight Web

> Generated from audit findings on 2026-03-28.
> See [audit summary](#) for the full gap analysis against the engineering artifacts.

## Guiding Principles

1. **Ship working software at each phase boundary.** Every phase ends with a playable,
   deployable build. No phase is purely internal refactoring with nothing to show.
2. **Fix before adding.** Phase 1 corrects bugs in the running code before new features
   are layered on top.
3. **Defer the architecture migration until the game is feature-complete.** The vanilla
   Canvas 2D prototype already plays. Migrating to PixiJS + TypeScript in Phase 3 is a
   rewrite that should happen after all gameplay mechanics are validated, not before.
4. **Backend is independent.** The Cloudflare Worker (Phase 4) can be developed in
   parallel with any phase after Phase 2 and merged when the frontend is ready.

---

## Phase Overview

| Phase | Name | Scope | Exit Condition |
|-------|------|-------|----------------|
| 1 | Bug Fixes & Quick Wins | Fix all identified bugs in `index.html` | Zero known bugs; audit checklist green |
| 2 | Missing Gameplay & UI Features | Gamepad, Settings, PWA manifest, missing menu items | All FR1–FR15 acceptance criteria met on vanilla build |
| 3 | Architecture Migration | TypeScript + PixiJS + Vite, monorepo, tests | `pnpm typecheck && pnpm test && pnpm build` all pass |
| 4 | Leaderboard Backend | Cloudflare Worker, KV, rate limiting, CI/CD | Global top-50 readable/writable; Lighthouse PWA ≥ 90 |
| 5 | PWA, Accessibility & Polish | Service worker, a11y audit, performance budget | Lighthouse Performance ≥ 85, axe 0 critical violations |

---

## Phase 1 — Bug Fixes & Quick Wins

**Scope**: Fixes to the existing `index.html` vanilla implementation.
All items are self-contained and carry no architectural risk.
**Estimated effort**: 1–2 days.

### P1-01 — Fix Type B enemy pursuit radius (FR3 bug)
**File**: `index.html` — `updateEnemies()` (~line 704)
**Problem**: `pursuitRadius` for Type B is `100`, which is *smaller* than Type A's `150`.
Type B is supposed to be more aggressive.
**Fix**: Swap — Type B `pursuitRadius = 60`, Type A `pursuitRadius = 120`.
```js
// Before
const pursuitRadius = e.type === 'B' ? 100 : 150;
// After
const pursuitRadius = e.type === 'B' ? 60 : 120;
```

### P1-02 — Fix fish trigger timer (FR5 bug)
**File**: `index.html` — `updateFish()` (~line 819)
**Problem**: Fish lunges at `f.timer > 600` ms; spec says `> 500` ms (0.5 s).
**Fix**: Change threshold to `500`.
```js
// Before
if (f.timer > 600) {
// After
if (f.timer > 500) {
```

### P1-03 — Fix audio not initialising on touch/click (FR13 bug)
**File**: `index.html` — `setupTouch()` and global click handler
**Problem**: `initAudio()` is called only on `keydown`. Mobile players who never press a
keyboard get no audio.
**Fix**: Call `initAudio()` inside each touch button's `touchstart` handler, and add a
one-time `click` listener on `document`.

### P1-04 — Fix frame-rate-dependent physics (FR1 bug)
**File**: `index.html` — `updateEggs()` (~line 785)
**Problem**: `e.hatchTimer -= 16.67` hard-codes a 60 fps tick. At 120 Hz the timer
runs at double speed; at 30 Hz it halves.
**Fix**: Pass `delta` (elapsed ms since last frame, capped at 50 ms) from the game loop
into `updateEggs()` and use `e.hatchTimer -= delta`. Compute `delta` via
`performance.now()` difference at the top of `gameLoop()`.

### P1-05 — Fix dead-code double-assignment in platform collision
**File**: `index.html` — `resolvePlatformsEnt()` (~line 637)
**Problem**: Two consecutive assignments to `ent.y` — first to `p.y + hh`, then
immediately to `p.y`. The first is a dead write and misleading.
**Fix**: Remove the dead `ent.y = p.y + hh;` line; keep only `ent.y = p.y;`.

### P1-06 — Persist mute state to localStorage (FR13)
**File**: `index.html` — toggle `muted` and `initAudio()`
**Problem**: `muted` is reset to `false` on every page load.
**Fix**: Read `muted = localStorage.getItem('bfw_muted') === '1'` on init;
write `localStorage.setItem('bfw_muted', muted ? '1' : '0')` on every toggle.

### P1-07 — Display "PERFECT BONUS" text on screen (FR6)
**File**: `index.html` — `updateBonus()` and `drawHUD()`
**Problem**: Perfect bonus awards 5000 pts silently; no on-screen text.
**Fix**: Set a `perfectBonusAnnounce` counter (e.g. 180 frames) when `allCaught`,
draw `"PERFECT BONUS!"` centred on canvas while counter > 0.

### P1-08 — Add MUTE toggle to pause menu (FR15)
**File**: `index.html` — `#pause-menu` HTML and `handlePauseMenu()`
**Problem**: Pause menu is missing the Mute/Unmute option required by FR15.
**Fix**: Add `<li data-action="mute">🔇 MUTE</li>` to `#pause-menu`;
handle `action === 'mute'` in `handlePauseMenu()` to toggle `muted`.

### P1-09 — Fix touch control opacity (FR11)
**File**: `index.html` — `.touch-btn` CSS
**Problem**: Touch button background is `rgba(255,255,255,0.12)` — far too faint.
Spec requires overall opacity 0.6.
**Fix**: Change to `rgba(255,255,255,0.25)` background and add `opacity: 0.6` to
`#touch-controls`.

### P1-10 — Show key bindings on pause screen (FR10)
**File**: `index.html` — `#screen-pause` HTML panel
**Problem**: Pause screen does not display control reference; spec requires it.
**Fix**: Add a small static key-mapping summary below the menu list:
`← → Move · Z/SPC Flap · P/ESC Pause · M Mute`.

---

## Phase 2 — Missing Gameplay & UI Features

**Scope**: New features added to the existing vanilla `index.html`.
All P1 fixes must be complete first.
**Estimated effort**: 3–5 days.

### P2-01 — Gamepad support (FR12 — entirely missing)
**File**: `index.html` — `isDown()` and game loop
**Tasks**:
- Poll `navigator.getGamepads()` at the top of `gameLoop()`.
- Map left stick X > 0.3 → RIGHT; < -0.3 → LEFT.
- Map D-pad axes identically.
- Button[0] → FLAP; Button[9] → PAUSE.
- Emit a brief on-screen toast on `gamepadconnected` / `gamepaddisconnected`.

### P2-02 — Settings screen (FR15 — entirely missing)
**File**: `index.html`
**Tasks**:
- Add `#screen-settings` overlay panel with: Mute toggle, Volume slider (0–100),
  Scale selector (Auto / 1× / 2×).
- Wire **SETTINGS** item into `#main-menu`.
- Persist all three settings to localStorage keys `bfw_vol`, `bfw_scale`.
- Apply volume to Web Audio gain node; apply scale in `resize()`.

### P2-03 — Alternate platform layouts (FR4)
**File**: `index.html` — `PLATFORMS` and `PHASE_DATA`
**Tasks**:
- Define a second platform layout (e.g., `PLATFORMS_SPARSE`) matching the
  "sparse" template named in `levels.json` spec.
- Update `PHASE_DATA` entries for phase 4+ to reference the alternate layout.
- Switch active `PLATFORMS` reference in `drawPlatforms()` / `resolvePlatformsEnt()`
  based on the current phase's layout.

### P2-04 — Fish telegraph animation (FR5)
**File**: `index.html` — `drawFish()` and fish idle state
**Problem**: Fish is invisible when `state === 'idle'`. There is no telegraph animation
showing the fish is about to lunge.
**Fix**: When `f.timer > 200` (fish is warming up), draw a partial fish head peeking
above the water line, animating upward as the timer approaches 500 ms.

### P2-05 — Background music toggle (FR13)
**File**: `index.html` — `SFX` and audio section
**Tasks**:
- Synthesize a simple looping chiptune using Web Audio `OscillatorNode` scheduled notes.
- Default: off (autoplay policy compliance).
- Toggle via Settings screen (P2-02) and the M key.
- Persist preference to localStorage.

### P2-06 — Multi-touch reliability fix (FR11)
**File**: `index.html` — `setupTouch()`
**Problem**: Holding one button and touching another may not fire `touchstart` on the
second element if the first touch's `touchmove` doesn't cross element boundaries.
**Fix**: Replace per-element listeners with a single `touchstart`/`touchmove`/`touchend`
listener on `#touch-controls`; use `document.elementFromPoint()` on each touch point to
determine which buttons are pressed.

### P2-07 — Add SETTINGS to main menu (FR15)
**File**: `index.html` — `#main-menu` HTML
**Tasks**: Add `<li data-action="settings">⚙ SETTINGS</li>` and wire to P2-02's screen.

### P2-08 — PWA manifest (FR14 — partial prerequisite)
**File**: new `manifest.webmanifest` in same directory as `index.html`; link from `<head>`
**Tasks**:
- Create `manifest.webmanifest` with `name`, `short_name`, `icons` (placeholder 192 &
  512 px), `theme_color: "#0A0A1A"`, `background_color: "#0A0A1A"`,
  `display: "standalone"`.
- Add `<link rel="manifest" href="manifest.webmanifest">` to `index.html`.
- Add placeholder icon PNGs or SVGs.
- Enables Lighthouse PWA installability check to pass (service worker still needed for
  full score — deferred to Phase 5).

---

## Phase 3 — Architecture Migration

**Scope**: Rewrite `index.html` into the TypeScript + PixiJS + Vite monorepo specified
by the engineering artifacts. Game logic validated in Phase 2 is ported, not rewritten.
**Estimated effort**: 1.5–2 weeks.
**Prerequisite**: Phase 2 complete (all gameplay mechanics verified in vanilla build).

### P3-01 — Task 0.1: Monorepo scaffold
- `pnpm` workspace with `apps/game`, `apps/worker`, `packages/types`.
- `tsconfig.base.json`, `.eslintrc.json`, `.prettierrc`.
- `packages/types/src/index.ts` — all interfaces from `architecture.md`.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass (zero source files yet).

### P3-02 — Task 1.1: PixiJS App Bootstrap
- `apps/game` Vite project; PixiJS v8 installed.
- `Application` at 256×240, `antialias: false`, `backgroundColor: 0x6888FC`.
- Integer-scale canvas CSS + `image-rendering: pixelated`.
- `GameLoop.ts`: fixed-timestep accumulator (16.67 ms physics, uncapped render).
- Dev FPS counter.
- Vitest unit test for `computeCanvasScale()`.

### P3-03 — Task 1.2: Scene Manager
- `SceneManager.ts` with `push()`, `pop()`, `replace()`.
- Abstract `Scene` base class (`init`, `update`, `render`, `destroy`).
- Stub scenes for all 6 scene IDs.
- Vitest: push/pop/replace state machine.

### P3-04 — Task 1.3: Asset Pipeline
- `AssetLoader.ts` wrapping PixiJS Assets.
- `PreloaderScene`: progress bar → auto-advance to `MenuScene`.
- Placeholder `sprites.json` + `sprites.png` atlas.
- BitmapFont pre-render for PressStart2P at sizes 8, 10, 12, 16.

### P3-05 — Tasks 1.4 / 1.5 / 1.6: Input Manager
- `InputManager.ts`: `isDown(action)`, `wasPressed(action)`, `clearFrame()`.
- Keyboard mappings per FR10.
- Touch overlay as PixiJS Graphics (replaces DOM buttons) per FR11.
- Gamepad polling per FR12 (ported from P2-01).
- Vitest: `isDown`/`wasPressed` state transitions.

### P3-06 — Tasks 2.1–2.9: Core Gameplay Port
Port all gameplay logic from vanilla `index.html` into typed TypeScript modules:
- `Player.ts`, `Enemy.ts`, `BalloonBirdA.ts`, `BalloonBirdB.ts`, `Sparky.ts`,
  `Egg.ts`, `Fish.ts`.
- `PhysicsSystem.ts`, `CollisionSystem.ts`, `EnemyAISystem.ts`, `ScoringSystem.ts`.
- All physics constants moved to `data/constants.ts` matching `architecture.md` values
  (`FLAP_IMPULSE: -4.5`, `TERMINAL_VELOCITY: 6.0`).
- Vitest: unit tests for flap impulse, gravity, wrapping, AABB, scoring chain.

### P3-07 — Tasks 3.1–3.4: Progression + Level Data
- `levels.json` per `PhaseDefinition` / `LevelData` schema.
- `ProgressionSystem.ts`: phase clear detection, bonus trigger, difficulty ramp.
- `BonusScene.ts` full implementation.

### P3-08 — Tasks 4.1–4.6: UI & Menus in PixiJS
- All overlay screens rebuilt as PixiJS scenes/containers.
- `HUD.ts`, `MainMenu.ts`, `PauseMenu.ts`, `GameOverScreen.ts`,
  `LeaderboardView.ts`, `NameEntryDialog.ts`, `TouchControls.ts`.
- Design tokens from `front-end-spec.md` applied.

### P3-09 — Task 6.2: Web Audio port
- `AudioManager.ts`: all SFX + background music from Phase 2 ported to a typed class.

---

## Phase 4 — Leaderboard Backend

**Scope**: Implement Epic 5 (Tasks 5.1–5.4). Can run **fully in parallel** with Phase 3.
**Estimated effort**: 3–4 days.

### P4-01 — Task 5.3: KV Schema and Data Model
- `wrangler.toml` with `SCORES_KV` binding.
- KV key `scores:global` → `KVScoreEntry[]` (top 50, sorted descending).
- KV key `ratelimit:{ip_hash}` with 600 s TTL.
- Document local dev via Wrangler `--local` flag.

### P4-02 — Task 5.1: Worker GET /api/scores
- `worker/handlers/getScores.ts`.
- Reads `scores:global` from KV; returns `{ entries, cached, cachedAt }`.
- `Cache-Control: public, max-age=60`.
- CORS header for production domain.
- Vitest (using Miniflare): GET returns correct shape; 500 on KV failure.

### P4-03 — Task 5.2: Worker POST /api/scores
- `worker/handlers/postScore.ts`.
- Validation: name `[A-Z0-9]{1,3}`, score `1–9_999_999`, phase `1–999`.
- Rate limit: read/write `ratelimit:{ip_hash}` KV key.
- If new entry enters top 50: write back to `scores:global`.
- Returns `{ success, rank }`.
- Vitest: validation edge cases, rate limit enforcement, top-50 insertion logic.

### P4-04 — Task 5.4: CI/CD Pipeline
- `.github/workflows/deploy.yml` matching `architecture.md` YAML spec.
- Staging deploy on PRs; production deploy on `main` push.
- Secrets: `CF_API_TOKEN`, `CF_ACCOUNT_ID` stored in GitHub Secrets.

### P4-05 — Frontend: Replace local leaderboard with API client
- `api/leaderboard.ts`: typed `fetchLeaderboard()` and `submitScore()` using the
  `Result<T>` pattern from `architecture.md`.
- `LeaderboardView`: loading state, error state ("Could not load scores. Try again."),
  own-entry highlight.
- `GameOverScreen`: POST score on submit; display returned rank.

---

## Phase 5 — PWA, Accessibility & Polish

**Scope**: Tasks 6.1, 6.3, 6.4, 6.5. Prerequisite: Phase 3 + Phase 4 complete.
**Estimated effort**: 1 week.

### P5-01 — Task 6.1: Full PWA
- `vite-plugin-pwa` configured; Workbox pre-caches all game assets.
- `manifest.webmanifest` finalised (real icons 192 + 512 px).
- Install prompt fired after first Game Over (`BeforeInstallPromptEvent`).
- Lighthouse PWA score ≥ 90 verified in CI.

### P5-02 — Task 6.3: Accessibility Audit
- All menu items reachable by Tab / Enter / Space.
- Focus ring styled using `--accent` colour.
- All text elements: ≥ 4.5:1 contrast ratio (check with Chrome DevTools).
- `prefers-reduced-motion`: disable title screen balloon animation.
- ARIA labels on canvas and interactive elements where applicable.
- axe-core: 0 critical violations (run in CI via `@axe-core/playwright`).

### P5-03 — Task 6.4: Performance Profiling
- Lighthouse Performance ≥ 85 on mobile preset (Throttle 4G, mid-tier CPU).
- Confirm single draw call for all enemies (PixiJS ParticleContainer or batched sprites).
- Verify no object allocation in hot path (Chrome Memory profiler, check for GC spikes).
- Total asset bundle < 2 MB uncompressed (`vite-bundle-visualizer`).

### P5-04 — Task 6.5: Production Hardening
- CSP header: `Content-Security-Policy: script-src 'self'` via Cloudflare Pages headers.
- ESLint rule `no-console` enabled; strip all `console.log` calls.
- Top-level error boundary: `window.onerror` + `unhandledrejection` → show
  "Something went wrong. Reload?" overlay.
- All TypeScript `strict` checks passing; zero `any`.
- `pnpm -r typecheck && pnpm lint && pnpm test` run in CI and must pass before deploy.

---

## Dependency Graph

```
Phase 1 (bug fixes)
    │
    ▼
Phase 2 (missing features)         Phase 4 (backend) ← can start anytime after P2-07
    │                                    │
    ▼                                    │
Phase 3 (architecture migration) ────── ┘
    │
    ▼
Phase 5 (PWA + polish)
```

---

## Known Deferred Items (Post-MVP)

These items appear in the brief's "In Scope" section but are not scheduled above and
should be tracked separately:

| Item | Notes |
|------|-------|
| Bubble/ice mechanic | Mentioned in `brief.md` MVP scope but absent from PRD FRs — needs a new FR before implementation |
| 2P co-op | Explicitly out of scope in brief |
| Background music (full chiptune) | P2-05 adds a basic loop; full NES-accurate music is post-MVP |
| Replay recording | Out of scope |
| Social sharing (OG cards) | Out of scope |

---

## Open Questions

1. **Bubble/ice mechanic**: Listed in `brief.md` MVP scope but has no corresponding FR
   in `prd.md`. Needs a decision: add FR16 or move to post-MVP?
2. **Individual story files** (`docs/stories/*.md`): Referenced in `docs/index.md` but
   missing. Should be created before Phase 3 kicks off so developers have per-story
   acceptance criteria available.
3. **PixiJS sprite atlas**: Placeholder `sprites.png` (1×1) works for engine bootstrap
   but actual pixel-art sprites need to be drawn before Phase 3 can produce a
   visually complete build. Art asset production should start in parallel with Phase 2.
4. **Phase 3 migration strategy**: Full rewrite vs. incremental scene-by-scene migration.
   Recommend full rewrite in a separate branch given the scope difference between the
   vanilla prototype and the PixiJS target.
