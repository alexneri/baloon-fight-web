# Project Brief — Balloon Fight Web

## Executive Summary

Balloon Fight Web is a pixel-faithful browser port of Nintendo's 1984 Famicom title, rebuilt
from the ground up in TypeScript and PixiJS. The original game is inaccessible without
emulators, aging hardware, or copyright-infringing ROM sites — none of which offer a polished
experience on mobile or provide any social hooks. This project delivers the complete original
experience (all levels, enemy types, bonus stage, fish trap) at 60 fps across every modern
browser and screen size, with a serverless global leaderboard that gives players a reason to
return. The MVP is intentionally tight: single-player, no login required, scores submitted
pseudonymously. The architecture is serverless-first so infrastructure cost stays near zero
at zero traffic, and scales gracefully if a Reddit post or YouTube video sends a traffic spike.

---

## Problem Statement

### Current State
Balloon Fight has no official legal way to play it in a browser. Nintendo's Nintendo Switch
Online service includes it, but that requires a paid subscription and a Switch console. ROM
sites exist but carry legal risk for users, serve malware-laced downloads, and offer zero
mobile optimization. Emulators work on desktop but require setup and don't run on iOS at all.

### Pain Points
1. **Inaccessibility**: No frictionless "open browser, play immediately" path exists.
2. **Mobile is a dead end**: Emulators don't support touch controls well; iOS blocks WASM
   emulation outright on the web.
3. **No social layer**: Even if you get it running, there's nowhere to post your score.
4. **Load and lag**: Emulated input has 2–4 frames of added latency. For a game where the
   margin between life and death is one frame, this is fatal.

### Why Existing Solutions Fall Short
- **Nintendo Switch Online**: Subscription paywall, console required, no browser, no mobile.
- **RetroArch web**: Works on desktop Chromium only; terrible UX; no mobile; no scores.
- **Flash-era ports**: Dead. Flash is dead.
- **HTML5 fan ports**: A few exist but none are pixel-accurate, none have leaderboards, most
  are abandoned with broken mobile support.

---

## Proposed Solution

A ground-up TypeScript + PixiJS implementation that doesn't emulate the Famicom — it
*reimplements* the game logic directly in the browser. This sidesteps emulation latency,
enables native touch controls, and produces a codebase that's maintainable and extensible.

### Key Differentiators
- **Zero-friction entry**: URL → playing in under 3 seconds.
- **Native 60 fps**: PixiJS WebGL renderer. No emulation overhead.
- **Mobile-first touch controls**: Virtual D-pad + flap button, designed for thumbs.
- **PWA**: Install to home screen. Offline play after first load.
- **Global leaderboard**: Serverless, no account required, score submission in < 200ms.
- **Pixel authenticity**: Original 256×240 NES resolution upscaled with nearest-neighbor
  filtering. Original color palette. Original sound effects (Web Audio API).

---

## Target Users

### Persona 1 — Marcus, 38, Software Engineer
**Goals**: Quick dopamine hit between meetings. Nostalgic for the NES era. Wants to beat his
personal best and show off his score to a colleague.
**Frustrations**: Doesn't want to set up an emulator just to play a 5-minute game. Hates
being asked to create an account before he's even played.
**Context of use**: Desktop Chrome at work during a 10-minute break. Occasionally on his
phone while commuting.
**What he needs**: Instant load, keyboard controls that feel right, and a score he can
screenshot and share.

### Persona 2 — Yuki, 24, UX Designer
**Goals**: Has heard about classic games but never played them. Wants an accessible intro to
retro gaming without the friction of hardware or emulators.
**Frustrations**: Finds most retro ports visually muddy or controls that feel "off." Bounces
immediately if the UI looks amateur.
**Context of use**: Mobile Safari on iPhone, lying on the couch. Maybe 15 minutes of patience.
**What she needs**: A UI that looks intentional and polished. Touch controls that don't suck.
A clear explanation of what she's doing and why she's dying.

### Persona 3 — Derek, 45, Retro Gaming Collector
**Goals**: Wants the most authentic experience possible. Will notice if the balloon pop
animation is one frame off. Will complain publicly on Reddit if the fish timing is wrong.
**Frustrations**: Fan ports that take creative liberties. Input lag. Wrong color palette.
**Context of use**: Desktop Firefox or Safari. Will test it specifically to find bugs.
**What he needs**: Pixel accuracy. Frame-perfect physics. The correct NES color palette.
No "improvements" he didn't ask for.

---

## Competitive Landscape

| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| **Nintendo Switch Online** | Official, legal, pixel-perfect | Paywall, requires Switch, no browser/mobile |
| **RetroArch Web** | Runs actual ROM, high accuracy | Desktop-only, terrible UX, no scores |
| **BalloonFight.io (fan port)** | Playable in browser, free | Broken mobile, no leaderboard, visually inaccurate, abandoned 2019 |
| **Internet Archive NES Emulator** | Legal gray area, free | Laggy, no touch, no scores, clunky UI |
| **Evercade / Analogue Pocket** | Premium hardware, accurate | Hardware purchase required, not a browser game |

**White space**: No competitor offers all three simultaneously — browser-native, mobile-ready,
with a leaderboard. That's the gap.

---

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame rate | Stable 60 fps | Chrome DevTools, Lighthouse |
| Initial load time | < 3s on 4G (10 Mbps) | WebPageTest |
| Leaderboard read latency | < 200ms p95 | Cloudflare Analytics |
| PWA installability | Passes all Lighthouse PWA checks | Lighthouse CI |
| Accessibility | WCAG 2.1 AA | axe-core automated + manual audit |
| Mobile playability | < 5% touch input drop rate | Custom telemetry |
| Core Web Vitals | LCP < 2.5s, CLS < 0.1, INP < 200ms | Chrome UX Report |

---

## MVP Scope

### In Scope
- All original levels (Phase 1–n with increasing difficulty ramp)
- All enemy types: Balloon Birds (2 variants), Sparky (phase 3+)
- Bonus stage (catching falling balloons)
- Fish trap mechanic (flying too low)
- Bubble/ice mechanic
- Lives system, score system, high-score tracking (localStorage)
- Global leaderboard (top 50, pseudonymous name entry)
- Keyboard controls (arrow keys + Z/Space)
- Touch controls (virtual gamepad overlay)
- Gamepad API support (Xbox/PlayStation controllers)
- PWA manifest + service worker (offline play)
- Sound effects + music toggle (Web Audio API)
- Responsive canvas scaling (all screen sizes)

### Explicitly Out of Scope (MVP)
- Local 2-player co-op
- Online multiplayer
- User accounts / authentication
- Level editor
- Achievements / badge system
- Replay recording
- Social sharing integrations (Twitter/X cards, etc.)

---

## Tech Preferences

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Language | TypeScript | 5.4+ | Strict mode, full type safety |
| Renderer | PixiJS | v8 | WebGL-first, Canvas fallback, 60 fps |
| Build | Vite | 5.x | Fast HMR, excellent PWA plugin |
| Testing | Vitest | 2.x | Native ESM, co-located with Vite |
| Backend | Cloudflare Workers | — | Serverless, zero cold start, global edge |
| Storage | Cloudflare KV | — | Low-latency leaderboard reads |
| Deployment | Cloudflare Pages | — | CDN + Workers in one platform |
| Audio | Web Audio API | native | No dependency, precise timing |

---

## Go-to-Market Considerations

- **Launch**: Post to r/WebGames, r/retrogaming, Hacker News Show HN.
- **Hook**: "Play Balloon Fight in your browser right now, no install required. First to hit
  1,000,000 points gets their name on the leaderboard forever."
- **Retention**: Leaderboard creates return visits. PWA install prompt after first game over.
- **Legal**: This is a clean-room reimplementation. No ROM, no Nintendo assets. Original
  sprites are redrawn pixel-by-pixel. Original music is not included — only sound effect
  approximations via Web Audio synthesis. Legal posture is similar to OpenMW (Morrowind
  engine reimplementation). Not zero risk, but defensible.
