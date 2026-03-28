# Product Requirements Document — Balloon Fight Web

## Product Goals

1. Deliver a 60 fps, pixel-faithful browser port of Balloon Fight playable with zero friction.
2. Support all input modalities: keyboard, touch, and gamepad.
3. Ship a global leaderboard with sub-200ms read latency.
4. Pass PWA installability checks on iOS and Android.
5. Meet WCAG 2.1 AA accessibility standards.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| 60 fps gameplay | Stable on Snapdragon 888+ and Apple A14+ mobile |
| Load time | < 3s on simulated 4G (WebPageTest) |
| Leaderboard read | < 200ms p95 at Cloudflare edge |
| PWA Lighthouse score | ≥ 90 |
| Accessibility score | axe-core 0 critical violations |

---

## Functional Requirements

### FR1 — Game Engine Core
The game engine shall maintain a fixed-timestep game loop at 60 fps using PixiJS's ticker,
with deterministic physics updates decoupled from rendering.
**Acceptance criteria**:
- [ ] Game loop runs at 60 fps on target hardware
- [ ] Physics updates at fixed 16.67ms intervals regardless of render frame rate
- [ ] No observable frame skipping on 60Hz displays

### FR2 — Player Entity
The player character shall have the following behaviours matching the original game:
flapping (jump + upward velocity), gravity (constant downward acceleration), horizontal
wrapping (exit left → enter right and vice versa), balloon state (1 balloon, 0 balloons = death
on next hit), and walking on platforms.
**Acceptance criteria**:
- [ ] Flap produces correct upward velocity matching original game feel
- [ ] Gravity constant matches original (visually indistinguishable)
- [ ] Player wraps horizontally at screen edges
- [ ] Two-balloon and one-balloon states render correctly
- [ ] Death animation plays when player loses final balloon
- [ ] Player respawns with brief invincibility after death

### FR3 — Enemy AI
The game shall implement three enemy types with their original behaviours:
- **Balloon Bird (Type A)**: Floats upward slowly, flaps occasionally, pursues player loosely.
- **Balloon Bird (Type B)**: More aggressive pursuit, faster flap rate.
- **Sparky**: Appears phase 3+. Moves in a wave pattern along platforms. Cannot be stomped.
**Acceptance criteria**:
- [ ] Type A spawns in phases 1–2, Type B in phases 2+, Sparky in phases 3+
- [ ] Enemy balloons pop when player lands on them from above
- [ ] Enemy falls and bounces after balloon popped; egg spawns after bounce
- [ ] Egg hatches into new enemy after configurable delay
- [ ] Egg can be kicked off screen
- [ ] Sparky kills player on contact regardless of angle

### FR4 — Platform Layout
The game shall render all original platform configurations across the level phases.
**Acceptance criteria**:
- [ ] All original platform positions and shapes reproduced at correct pixel coordinates
  (scaled from 256×240 reference)
- [ ] Platforms have correct solid/pass-through collision behaviour
- [ ] The central platform "cloud" is visually distinct

### FR5 — Water and Fish Trap
The game shall render water at the bottom of the screen and implement the fish trap mechanic.
**Acceptance criteria**:
- [ ] Water renders with animated wave effect
- [ ] Fish jumps from water after player hovers in the fish's column for > 0.5s
- [ ] Fish kills player on contact
- [ ] Fish animation matches original cadence (telegraph → lunge → retract)

### FR6 — Bonus Stage
A bonus stage shall appear every N phases, presenting falling balloons for the player to catch.
**Acceptance criteria**:
- [ ] Bonus stage triggers after every 3rd regular phase
- [ ] Balloons fall from random x positions at varying speeds
- [ ] Score awarded per balloon caught
- [ ] Stage ends after 60 seconds or all balloons collected
- [ ] "PERFECT BONUS" awarded if all balloons caught

### FR7 — Scoring System
The game shall implement the original scoring model.
**Acceptance criteria**:
- [ ] Enemy popped (first time in phase): 800 pts
- [ ] Enemy popped (subsequent): 1000, 1200, 1500 escalating within phase
- [ ] Egg kicked: 500 pts
- [ ] Bonus stage balloon: 1000 pts per catch
- [ ] Score displayed in real-time HUD (top of screen)
- [ ] High score persisted in localStorage across sessions
- [ ] New high score celebration animation on game over

### FR8 — Lives and Game Over
**Acceptance criteria**:
- [ ] Player starts with 3 lives
- [ ] Extra life awarded at configurable score threshold (default: 50,000)
- [ ] Maximum 5 lives at any time
- [ ] Game Over screen displayed when lives reach 0
- [ ] Game Over screen shows final score, high score, and leaderboard CTA

### FR9 — Global Leaderboard
The game shall provide a global top-50 leaderboard backed by Cloudflare Workers + KV.
**Acceptance criteria**:
- [ ] Leaderboard readable without authentication
- [ ] Leaderboard entries: name (3 chars, alphanumeric), score, phase reached, timestamp
- [ ] Scores submitted via POST to `/api/scores` with score + name
- [ ] Basic server-side validation: score must be > 0, name must be 1–3 chars
- [ ] Rate limiting: max 5 submissions per IP per 10 minutes
- [ ] Leaderboard reads cached at edge (Cloudflare KV); invalidated on new top-50 entry
- [ ] Leaderboard screen displayed from Game Over and from main menu
- [ ] p95 read latency < 200ms globally

### FR10 — Keyboard Controls
**Acceptance criteria**:
- [ ] Arrow Left / Arrow Right: move player horizontally
- [ ] Z or Space: flap
- [ ] Enter: confirm / start game
- [ ] Escape: pause / return to menu
- [ ] P: toggle pause
- [ ] M: toggle audio mute
- [ ] Controls displayed on pause screen and help overlay

### FR11 — Touch Controls
**Acceptance criteria**:
- [ ] Virtual D-pad (left/right) rendered bottom-left on touch devices
- [ ] Flap button rendered bottom-right
- [ ] Controls appear only on touch-capable devices
- [ ] Touch targets meet minimum 44×44 CSS px (WCAG 2.5.5)
- [ ] Multi-touch supported: holding left + tapping flap simultaneously
- [ ] Controls are semi-transparent (opacity 0.6) to not obscure gameplay

### FR12 — Gamepad Support
**Acceptance criteria**:
- [ ] Gamepad detected via Gamepad API
- [ ] Left stick or D-pad: horizontal movement
- [ ] Button 0 (A/Cross): flap
- [ ] Button 9 (Start): pause
- [ ] Gamepad connected/disconnected toast notification

### FR13 — Audio
**Acceptance criteria**:
- [ ] Sound effects synthesized via Web Audio API (no sampled audio files)
- [ ] SFX: flap, balloon pop, enemy fall, egg hatch, extra life, game over, menu select
- [ ] Background music toggle (off by default to respect autoplay policies)
- [ ] Audio state persisted in localStorage
- [ ] No audio plays until first user interaction (browser autoplay compliance)

### FR14 — PWA Support
**Acceptance criteria**:
- [ ] Web App Manifest with name, icons (192px, 512px), theme colour, display: standalone
- [ ] Service worker caches all game assets on first load
- [ ] Game fully playable offline after first load
- [ ] Install prompt shown after first game over (once per session)
- [ ] Passes Lighthouse PWA audit with score ≥ 90

### FR15 — Pause and Menu System
**Acceptance criteria**:
- [ ] Main Menu: Play, Leaderboard, How to Play, Settings
- [ ] Pause screen: Resume, Restart, Main Menu, Mute toggle
- [ ] How to Play: animated control diagram, objective summary
- [ ] Settings: mute, control scheme selector, visual scale override
- [ ] All menus navigable by keyboard and touch

---

## Non-Functional Requirements

### NFR1 — Performance
- Game loop: 60 fps stable on Apple A14 and Snapdragon 888 class hardware
- Initial page load: < 3s on simulated 4G (10 Mbps), Lighthouse Performance ≥ 85
- Total asset bundle: < 2MB uncompressed
- Memory: < 150MB peak heap during gameplay
- No memory leaks across 10 consecutive phases

### NFR2 — Accessibility
- WCAG 2.1 Level AA compliance
- All UI text: minimum 4.5:1 contrast ratio
- Focus indicators visible on all interactive elements
- Game pause accessible via keyboard at all times
- Reduced-motion: disable non-essential animations when `prefers-reduced-motion: reduce`
- Semantic HTML for all UI chrome; ARIA labels on interactive canvas elements

### NFR3 — Security
- No user authentication in MVP — no sensitive data stored
- Score submission: server-side validation (score range, name format)
- Rate limiting on `/api/scores`: 5 POSTs per IP per 10 minutes (Cloudflare rate limiting)
- No third-party analytics or tracking scripts
- Content Security Policy header: `script-src 'self'`
- Scores treated as untrusted; no client-side score authority

### NFR4 — Reliability
- API uptime: Cloudflare Workers SLA (99.9%+)
- Game playable offline after first load (service worker)
- Leaderboard read failure: graceful fallback to cached data or empty state
- No unhandled promise rejections in production build

### NFR5 — Browser Compatibility
- Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- iOS Safari 15+ (primary mobile target)
- Android Chrome 100+
- WebGL required; Canvas 2D fallback rendered if WebGL unavailable (with warning)

### NFR6 — Maintainability
- TypeScript strict mode: zero `any` types in source
- ESLint + Prettier enforced in CI
- Test coverage ≥ 80% on game logic modules (physics, scoring, enemy AI)
- All public functions documented with JSDoc
- ADR (Architecture Decision Record) for each major tech choice

---

## Epics

### Epic 1 — Game Engine Foundation (P0)
Stand up the PixiJS application, game loop, scene management, asset pipeline, and input
handling. Nothing playable yet, but the skeleton is running at 60 fps.

**Stories**: 1.1–1.6

### Epic 2 — Core Gameplay (P0)
Implement player entity, enemy AI, platform collisions, water/fish, balloon mechanics,
scoring, and lives. The game is playable end-to-end with all original mechanics.

**Stories**: 2.1–2.9

### Epic 3 — Bonus Stage and Progression (P0)
Implement the bonus stage, phase progression, difficulty ramp, and level transitions.

**Stories**: 3.1–3.4

### Epic 4 — UI and Menus (P1)
Build main menu, pause screen, HUD, game over screen, leaderboard UI, How to Play,
and Settings.

**Stories**: 4.1–4.6

### Epic 5 — Leaderboard Backend (P1)
Implement Cloudflare Workers API, KV storage, rate limiting, score validation, and
CI/CD deployment.

**Stories**: 5.1–5.4

### Epic 6 — PWA, Audio, and Polish (P2)
Service worker, manifest, Web Audio sound effects, touch control refinement,
accessibility audit, performance profiling, and production hardening.

**Stories**: 6.1–6.5

---

## User Stories

### Epic 1 — Game Engine Foundation

**Story 1.1 — PixiJS Application Bootstrap**
As a developer, I want a PixiJS v8 application that initialises with correct canvas dimensions
and a fixed-timestep game loop, so that subsequent game systems have a reliable host.
- [ ] PixiJS app initialises at 256×240 logical resolution
- [ ] Canvas scales to fill viewport while maintaining aspect ratio (nearest-neighbour)
- [ ] Game loop runs at 60 fps using PixiJS Ticker
- [ ] Fixed-timestep physics update at 16.67ms
- [ ] Dev: FPS counter visible in development builds

**Story 1.2 — Scene Management**
As a developer, I want a scene manager that transitions between Menu, Game, Bonus, and
GameOver scenes, so that navigation is decoupled from game logic.
- [ ] SceneManager class handles push/pop/replace of scenes
- [ ] Transitions are instantaneous (no animation in MVP)
- [ ] Each scene manages its own PixiJS containers and cleanup

**Story 1.3 — Asset Pipeline**
As a developer, I want all sprites, tilemaps, and audio descriptors loaded at startup via
PixiJS Assets, so that gameplay never stalls on an asset load.
- [ ] All assets loaded in a preloader scene with progress bar
- [ ] Asset manifest defined in JSON
- [ ] Sprites packed into a single texture atlas (TexturePacker format)
- [ ] Service worker pre-caches asset manifest on install

**Story 1.4 — Input Manager: Keyboard**
As a player, I want keyboard controls to work immediately, so that I can start playing without
touching a settings menu.
- [ ] InputManager singleton handles keydown/keyup events
- [ ] Exposes: `isDown(action)` and `wasPressed(action)` per-frame methods
- [ ] Actions: LEFT, RIGHT, FLAP, PAUSE, CONFIRM, MUTE

**Story 1.5 — Input Manager: Touch**
As a mobile player, I want virtual on-screen controls, so that I can play without a keyboard.
- [ ] Touch controls rendered as PixiJS overlay (not DOM elements)
- [ ] D-pad left/right and flap button
- [ ] Multi-touch supported
- [ ] Visible only when `navigator.maxTouchPoints > 0`

**Story 1.6 — Input Manager: Gamepad**
As a controller user, I want gamepad input supported automatically, so that I can play
with my console controller.
- [ ] Gamepad API polling in game loop
- [ ] D-pad and left stick → LEFT/RIGHT actions
- [ ] Button 0 → FLAP
- [ ] Button 9 → PAUSE
- [ ] Connected/disconnected events forwarded to UI

---

### Epic 2 — Core Gameplay

**Story 2.1 — Player Entity**
As a player, I want my character to flap, glide, and land on platforms, so that the core
movement loop feels like the original game.
- [ ] Player sprite renders in 1-balloon and 0-balloon states
- [ ] Flap applies upward impulse
- [ ] Gravity applies constant downward acceleration
- [ ] Horizontal movement at constant speed while key held
- [ ] Horizontal screen wrapping
- [ ] Platform collision: land on top, pass through from below
- [ ] Invincibility frames after respawn (flashing sprite)

**Story 2.2 — Platform Collision System**
As a developer, I want a collision system for platforms, so that player and enemies
interact correctly with the level geometry.
- [ ] Platforms defined as AABB rectangles in a level data structure
- [ ] Collision resolution: top-only for most platforms, solid for ground
- [ ] Player walks on platform surface
- [ ] Enemy falls through one-way platforms after balloon popped

**Story 2.3 — Enemy: Balloon Bird Type A**
As a player, I want to fight Balloon Bird Type A enemies, so that I have the core combat loop.
- [ ] Spawns at defined positions per phase
- [ ] Floats upward, flaps occasionally
- [ ] Pursues player with loose tracking (not homing)
- [ ] Poppable from above; egg drop sequence; hatch timer

**Story 2.4 — Enemy: Balloon Bird Type B**
As a player, I want more aggressive enemies in later phases, so that difficulty increases.
- [ ] Faster flap rate than Type A
- [ ] Tighter pursuit radius
- [ ] Spawns phase 2+

**Story 2.5 — Enemy: Sparky**
As a player, I want Sparky to appear in late phases, so that there's an unkillable threat
that forces positioning.
- [ ] Spawns on platforms phase 3+
- [ ] Moves horizontally across platform, bounces at edges
- [ ] Contact kills player regardless of angle
- [ ] Cannot be stomped; immune to player balloon collision

**Story 2.6 — Egg and Hatch System**
As a player, I want enemies to drop eggs that I can kick or avoid, so that timing pressure
continues after a balloon pop.
- [ ] Egg spawns at enemy position after bounce
- [ ] Hatch timer counts down (phase-dependent speed)
- [ ] Player can kick egg off screen (collision from side)
- [ ] Kicked egg: 500 pts
- [ ] Hatched egg: spawns Type B enemy

**Story 2.7 — Water and Fish Trap**
As a player, I want the fish trap to punish low flying, so that vertical positioning matters.
- [ ] Water rendered at bottom with wave animation
- [ ] Fish-lurk zone defined per column
- [ ] Fish telegraph animation after 0.5s hover
- [ ] Fish lunge kills player; retracts after 1s

**Story 2.8 — Scoring System**
As a player, I want to see my score update in real time, so that I understand the value of
each action.
- [ ] Score increments per FR7 spec
- [ ] HUD renders score top-centre, lives top-left, high score top-right
- [ ] Extra life at 50,000 pts (configurable constant)
- [ ] localStorage persistence of high score

**Story 2.9 — Lives and Death Sequence**
As a player, I want a death and respawn sequence, so that losing a life feels fair and readable.
- [ ] Death animation (balloon pop, character falls)
- [ ] 2-second pause before respawn
- [ ] Invincibility frames on respawn (60 frames)
- [ ] Life counter decrements
- [ ] Game Over triggered at 0 lives

---

### Epic 3 — Bonus Stage and Progression

**Story 3.1 — Phase Progression**
As a player, I want the game to advance to harder phases as I clear enemies, so that
difficulty escalates.
- [ ] Phase clears when all enemies defeated
- [ ] Phase number displayed on transition screen
- [ ] Enemy count and types per phase defined in level data JSON
- [ ] Phase 3+ introduces Sparky

**Story 3.2 — Difficulty Ramp**
As a player, I want enemies to get faster and smarter over time, so that long sessions
remain challenging.
- [ ] Enemy speed multiplier increases every 3 phases (configurable)
- [ ] Hatch timer decreases every 3 phases
- [ ] Max enemies on screen increases up to cap of 8

**Story 3.3 — Bonus Stage**
As a player, I want a bonus stage between regular phases, so that I have a scoring opportunity
and a change of pace.
- [ ] Bonus stage triggers after every 3rd regular phase
- [ ] Balloons fall from random positions
- [ ] 60-second timer
- [ ] Per-balloon score: 1000 pts
- [ ] PERFECT BONUS if all balloons caught
- [ ] Returns to next regular phase after timer

**Story 3.4 — Level Data Configuration**
As a developer, I want all level data in a JSON file, so that phases are easy to tune
without touching game logic.
- [ ] `levels.json` defines per-phase: enemy types, counts, spawn positions, platform layout
- [ ] Platform layout references a named template (e.g., "classic", "sparse")
- [ ] Hot-reloadable in development via Vite HMR

---

### Epic 4 — UI and Menus

**Story 4.1 — Main Menu**
As a player, I want a main menu on load, so that I can navigate the game's features.
- [ ] Menu items: PLAY, LEADERBOARD, HOW TO PLAY, SETTINGS
- [ ] Animated title screen (balloon floats up and down)
- [ ] Keyboard and touch navigable
- [ ] Focus ring visible on keyboard navigation

**Story 4.2 — HUD**
As a player, I want a game HUD, so that I always know my score, lives, and high score.
- [ ] Score: top-centre
- [ ] High Score: top-right
- [ ] Lives: top-left (balloon icons)
- [ ] Phase number displayed briefly on phase start

**Story 4.3 — Pause Screen**
As a player, I want to pause the game, so that I can take a break without losing progress.
- [ ] Pause triggered by P key, Escape, or Start button
- [ ] Options: RESUME, RESTART, MAIN MENU, MUTE/UNMUTE
- [ ] Game loop frozen (PixiJS ticker paused)

**Story 4.4 — Game Over Screen**
As a player, I want a game over screen that shows my score and prompts leaderboard entry,
so that I'm motivated to replay.
- [ ] Final score displayed
- [ ] Personal high score displayed
- [ ] If score is top-50 worthy: name entry prompt (3 chars)
- [ ] PLAY AGAIN and VIEW LEADERBOARD buttons

**Story 4.5 — Leaderboard Screen**
As a player, I want to see the global top-50 leaderboard, so that I know where I stand.
- [ ] Top-50 entries: rank, name, score, phase
- [ ] Loading state while fetching
- [ ] Error state: "Could not load scores. Try again."
- [ ] Player's own submitted score highlighted
- [ ] Navigable from Main Menu and Game Over

**Story 4.6 — How to Play and Settings**
As a new player, I want a controls reference and settings screen.
- [ ] How to Play: animated diagram of controls for keyboard, touch, gamepad
- [ ] Settings: mute toggle, sound volume (slider), visual scale (1×, 2×, auto)
- [ ] Settings persisted to localStorage

---

### Epic 5 — Leaderboard Backend

**Story 5.1 — Cloudflare Worker: GET /api/scores**
As the client, I want to fetch the top-50 leaderboard via REST, so that scores are displayed.
- [ ] Returns JSON array: `[{rank, name, score, phase, timestamp}]`
- [ ] Response served from Cloudflare KV cache
- [ ] Cache TTL: 60 seconds
- [ ] CORS headers for production domain

**Story 5.2 — Cloudflare Worker: POST /api/scores**
As the client, I want to submit a score after game over, so that it's recorded globally.
- [ ] Accepts JSON body: `{name: string, score: number, phase: number}`
- [ ] Server-side validation: name 1–3 alphanumeric, score > 0 and < 10,000,000
- [ ] Rate limiting: 5 requests / IP / 10 minutes via Cloudflare Rate Limiting
- [ ] If score enters top 50: updates KV, invalidates cache
- [ ] Returns: `{success: true, rank: number}` or error

**Story 5.3 — Data Model and KV Schema**
As a developer, I want a clear KV schema, so that scores are stored and queried efficiently.
- [ ] Key: `scores:global` → JSON array of top-50, sorted descending
- [ ] Entry shape: `{name, score, phase, timestamp, ip_hash}`
- [ ] ip_hash: SHA-256 of IP for rate limit reference (not stored in response)
- [ ] Trimmed to 50 entries on every write

**Story 5.4 — CI/CD: Workers Deployment**
As a developer, I want Workers deployed automatically on merge to main, so that backend
changes ship without manual steps.
- [ ] GitHub Actions workflow: test → build → `wrangler deploy`
- [ ] Staging environment on feature branches
- [ ] Secrets managed via Cloudflare dashboard (not in repo)

---

### Epic 6 — PWA, Audio, and Polish

**Story 6.1 — Service Worker and PWA Manifest**
As a mobile player, I want to install the game to my home screen and play offline.
- [ ] Vite PWA plugin generates manifest and service worker
- [ ] All game assets pre-cached on install
- [ ] Manifest: name, short_name, icons, theme_color, background_color, display: standalone
- [ ] Install prompt shown after first game over
- [ ] Lighthouse PWA score ≥ 90

**Story 6.2 — Web Audio Sound Effects**
As a player, I want audio feedback for my actions, so that the game feels alive.
- [ ] SFX synthesized via Web Audio API oscillators and envelopes
- [ ] Sounds: flap, pop, enemy fall, egg hatch, extra life, game over, menu blip
- [ ] AudioContext created on first user interaction (autoplay compliance)
- [ ] Mute state persisted in localStorage

**Story 6.3 — Accessibility Audit and Remediation**
As a player with accessibility needs, I want the game UI to be keyboard accessible and
contrast-compliant.
- [ ] All menu items reachable by Tab/Enter/Space
- [ ] Focus ring visible and styled
- [ ] All text elements pass 4.5:1 contrast check
- [ ] `prefers-reduced-motion` respected: disables title screen animation
- [ ] ARIA labels on canvas game actions where possible

**Story 6.4 — Performance Profiling and Optimization**
As a developer, I want the game to pass performance budgets, so that it's playable on
mid-range mobile.
- [ ] Lighthouse Performance ≥ 85 on mobile preset
- [ ] Asset bundle < 2MB
- [ ] PixiJS render loop profiled: no object allocation in hot path
- [ ] Sprite batching verified: single draw call for all enemies

**Story 6.5 — Production Hardening**
As a developer, I want the production build to be stable and secure.
- [ ] CSP header: `script-src 'self'`
- [ ] No `console.log` in production (ESLint rule)
- [ ] Error boundary: uncaught errors show "Something went wrong. Reload?" screen
- [ ] Sentry (or equivalent) error reporting configured (optional)
- [ ] All TypeScript `strict` checks passing, zero `any`

---

## Launch Timeline

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| Engine foundation | Week 1–2 | Epic 1 complete, dev server running |
| Playable prototype | Week 3–5 | Epics 2–3 complete, all mechanics working |
| UI and backend | Week 6–8 | Epics 4–5 complete, leaderboard live |
| Polish and launch | Week 9–10 | Epic 6 complete, production deploy |
