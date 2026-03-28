# Documentation Index — Balloon Fight Web

## Core Documents

| Document | Description | Lines |
|----------|-------------|-------|
| [brief.md](brief.md) | Project brief: personas, competitive landscape, MVP scope | ✅ |
| [prd.md](prd.md) | PRD: 15 FRs, 6 NFRs, 6 epics, 28 user stories | ✅ |
| [architecture.md](architecture.md) | System design, tech stack, API spec, data models, ADRs | ✅ |
| [front-end-spec.md](front-end-spec.md) | Design tokens, 8 screens, components, accessibility | ✅ |
| [atomized-implementation-plan.md](atomized-implementation-plan.md) | 29 atomized tasks, 3 workstreams, dependency graph | ✅ |

## Design Artifacts

| Document | Description |
|----------|-------------|
| [brand-identity-balloon-fight-web-2026-03-27.md](brand-identity-balloon-fight-web-2026-03-27.md) | Brand strategy, palette, typography, application guidelines |
| [design-trends-retro-browser-gaming-2026-03-27.md](design-trends-retro-browser-gaming-2026-03-27.md) | 5 macro trends, competitive matrix, 6-month roadmap |
| [design-system-balloon-fight-web-2026-03-27.md](design-system-balloon-fight-web-2026-03-27.md) | Tokens, CSS custom properties, all components, animation presets |
| [ui-ux-balloon-fight-web-2026-03-27.md](ui-ux-balloon-fight-web-2026-03-27.md) | 8 screen specs, micro-interactions, responsive behaviour |

## Stories

### Epic 1 — Game Engine Foundation (P0)
- [1.1 PixiJS App Bootstrap](stories/1.1.pixi-app-bootstrap.md)
- [1.2 Scene Manager](stories/1.2.scene-manager.md)
- [1.3 Asset Pipeline](stories/1.3.asset-pipeline.md)
- [1.4 Input: Keyboard](stories/1.4.input-keyboard.md)
- [1.5 Input: Touch](stories/1.5.input-touch.md)
- [1.6 Input: Gamepad](stories/1.6.input-gamepad.md)

### Epic 2 — Core Gameplay (P0)
- [2.1 Player Entity](stories/2.1.player-entity.md)
- [2.2 Platform Collision](stories/2.2.platform-collision.md)
- [2.3 Enemy Balloon Bird A](stories/2.3.enemy-balloon-bird-a.md)
- [2.4 Enemy Balloon Bird B](stories/2.4.enemy-balloon-bird-b.md)
- [2.5 Enemy Sparky](stories/2.5.enemy-sparky.md)
- [2.6 Egg and Hatch System](stories/2.6.egg-hatch-system.md)
- [2.7 Water and Fish Trap](stories/2.7.water-fish-trap.md)
- [2.8 Scoring System](stories/2.8.scoring-system.md)
- [2.9 Lives and Death Sequence](stories/2.9.lives-death-sequence.md)

### Epic 3 — Bonus Stage and Progression (P0)
- [3.1 Phase Progression](stories/3.1.phase-progression.md)
- [3.2 Difficulty Ramp](stories/3.2.difficulty-ramp.md)
- [3.3 Bonus Stage](stories/3.3.bonus-stage.md)
- [3.4 Level Data JSON](stories/3.4.level-data-json.md)

### Epic 4 — UI and Menus (P1)
- [4.1 Main Menu](stories/4.1.main-menu.md)
- [4.2 HUD](stories/4.2.hud.md)
- [4.3 Pause Screen](stories/4.3.pause-screen.md)
- [4.4 Game Over Screen](stories/4.4.game-over-screen.md)
- [4.5 Leaderboard Screen](stories/4.5.leaderboard-screen.md)
- [4.6 How to Play + Settings](stories/4.6.how-to-play-settings.md)

### Epic 5 — Leaderboard Backend (P1)
- [5.1 Worker: GET /api/scores](stories/5.1.worker-get-scores.md)
- [5.2 Worker: POST /api/scores](stories/5.2.worker-post-scores.md)
- [5.3 KV Schema](stories/5.3.kv-schema.md)
- [5.4 CI/CD Deploy](stories/5.4.cicd-deploy.md)

### Epic 6 — PWA, Audio, Polish (P2)
- [6.1 PWA Service Worker](stories/6.1.pwa-service-worker.md)
- [6.2 Web Audio SFX](stories/6.2.web-audio.md)
- [6.3 Accessibility Audit](stories/6.3.accessibility-audit.md)
- [6.4 Performance Profiling](stories/6.4.performance-profiling.md)
- [6.5 Production Hardening](stories/6.5.production-hardening.md)

---

## Cross-Reference Integrity

| Check | Status |
|-------|--------|
| Every FR (15) has ≥1 story | ✅ |
| Every story maps to ≥1 task | ✅ |
| Tech stack in architecture matches brief | ✅ TypeScript + PixiJS + CF Workers |
| Design tokens in design-system match front-end-spec | ✅ |
| Component names in ui-ux match front-end-spec | ✅ |
| Competitors in brief appear in design-trends matrix | ✅ |
| Shared types referenced by both game and worker | ✅ packages/types |
