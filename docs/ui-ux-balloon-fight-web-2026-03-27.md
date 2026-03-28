# UI/UX Patterns — Balloon Fight Web · 2026-03-27

## Design Strategy

### Visual Hierarchy
1. **Game canvas** is always the hero — everything else is peripheral.
2. **Score and lives** are the only HUD elements; nothing else competes for attention during play.
3. **Menus** use full-screen overlays — never a sidebar or partial-screen drawer.
4. **Typography** hierarchy: display font (PressStart2P) for all game-context text; body font
   (Inter) only for prose (How to Play, Settings descriptions).

### Information Density
Low. One action per screen. Menus have ≤ 4 items. Leaderboard shows rank, name, score, phase
— nothing else. The game itself is visually busy; UI chrome must not add to that.

### Navigation Structure
Linear with clear back-out. Every non-game screen has a single "BACK" or "EXIT" action.
No breadcrumbs, no tabs, no drawers. Keyboard: Escape always goes back.

### Gesture Map

| Gesture | Context | Action |
|---------|---------|--------|
| Tap left D-pad | Game (touch) | Move left |
| Tap right D-pad | Game (touch) | Move right |
| Tap flap button | Game (touch) | Flap |
| Swipe up | NameEntry slot | Previous character |
| Swipe down | NameEntry slot | Next character |
| Tap outside modal | Pause overlay | No-op (intentional — prevents accidents) |
| Long press | Any | No-op |

---

## Screen Specifications

### Screen 1: Preloader

**Layout zones**:
- Full viewport, black background
- Centre: balloon symbol (64px), animate up/down (1s loop)
- Below symbol: "INFLATING BALLOONS..." label, 10px PressStart2P, yellow, 8px below symbol
- Below label: progress bar (200px × 8px), yellow fill, black border

**Interactions**: None (auto-advances)

**Loading state**: This screen IS the loading state.

**Error state**: Progress bar freezes, label changes to "FAILED TO LOAD." in red, "RELOAD PAGE"
button appears below.

---

### Screen 2: Main Menu

**Layout zones**:
- Background: live game canvas (attract mode — enemies float, no player)
- Foreground: dark overlay `rgba(10,10,26,0.85)` over canvas
- Centre: MenuPanel component

**Component inventory**:
- Title: "BALLOON FIGHT" (PressStart2P 16px, yellow) + "WEB" (12px, grey) below
- Decorative balloon sprite (animated, 24px, floats up/down)
- Menu list: PLAY | LEADERBOARD | HOW TO PLAY | SETTINGS
- Footer: "HI: 0000000" (PressStart2P 10px, grey)

**Interactions**:
- Arrow Up/Down: move cursor (> indicator)
- Enter / Space: activate
- Touch: tap item
- Item hover/focus: background brightens, border turns yellow
- PLAY: → GameScene (reset all state)
- LEADERBOARD: → LeaderboardScene (fetch scores)
- HOW TO PLAY: → HowToPlayScene
- SETTINGS: → SettingsScene

**Empty state**: N/A

**Error state**: N/A (offline-capable; menu has no network dependency)

**Designer note**: The attract-mode canvas behind the menu is a subtle hook — players see
enemies floating and immediately understand the game. No tutorial needed.

---

### Screen 3: Game (Active Play)

**Layout zones**:
- Game canvas: 256×240 logical, scaled to viewport
- HUD strip: top 16px of canvas (rendered in PixiJS, same canvas)
- Touch controls: absolute-positioned overlay bottom of screen (touch devices only)

**Component inventory**:
- HUD: lives icons (top-left), score (top-centre, yellow), hi-score (top-right, white)
- Phase announcement: centred text "PHASE N" appears 1.5s on phase start, fades
- Entities: player, enemies, eggs, fish, water (all PixiJS sprites)
- Touch D-pad (conditional)
- Flap button (conditional)

**Interactions**:
- Keyboard: arrow keys, Z/Space, P, Escape, M
- Touch: D-pad zones, flap button
- Gamepad: D-pad/stick + A button + Start
- P / Start: → PauseOverlay (game loop frozen)
- 0 lives: → GameOverScene (after death animation completes)

**Loading state**: Preloader handles all asset loading; GameScene only mounts when ready.

**Error state**: If PixiJS WebGL init fails: banner "WebGL unavailable. The game may run
slower." + continue with Canvas fallback.

**Empty state**: N/A (game always has content)

**Designer note**: Touch controls are 60% opacity, semi-transparent, to not obscure the 
game. Active touch zones get a yellow tint `rgba(248,184,0,0.3)`.

---

### Screen 4: Pause Overlay

**Layout zones**:
- Full-screen overlay: `rgba(0,0,0,0.75)` over frozen canvas
- Centre: MenuPanel (narrower, 280px)

**Component inventory**:
- Title: "PAUSED" (PressStart2P 16px)
- Menu: RESUME | RESTART | MAIN MENU | MUTE/UNMUTE
- Current score shown below menu

**Interactions**:
- P / Escape / Start: resume (same as RESUME)
- RESUME: dismiss overlay, unpause ticker
- RESTART: confirm? (no confirmation for MVP) → reset GameScene
- MAIN MENU: → MenuScene (score not saved)
- MUTE/UNMUTE: toggle AudioManager, persist to localStorage

**Empty/error state**: N/A

---

### Screen 5: Game Over

**Layout zones**:
- Background: dark overlay or previous game canvas (blurred via CSS filter)
- Centre: GameOverPanel (wider, 380px)

**Component inventory**:
- Title: "GAME OVER" (PressStart2P 20px, red)
- Score row: label + 7-digit score (yellow, large)
- Best row: label + 7-digit hi-score
- Phase row: "REACHED PHASE N"
- Conditional: "★ NEW PERSONAL BEST!" banner (green, animated scale-in)
- Conditional: NameEntry component (if score is top-50 eligible)
- CTA buttons: [PLAY AGAIN] [VIEW LEADERBOARD]

**Interactions**:
- NameEntry (if shown): Up/Down to cycle chars, Right to advance, Enter to submit
- Score submit: POST /api/scores → show rank ("YOU ARE #12!") or "Score saved!"
- PLAY AGAIN: → GameScene (full reset)
- VIEW LEADERBOARD: → LeaderboardScene

**Loading state (score submit)**: Submit button shows spinner; disabled while in-flight.

**Error state (score submit)**: Toast "Score not saved — try again." Submit button re-enables.

**Empty state**: N/A

**Designer note**: NameEntry only appears if the leaderboard fetch during game over indicates
the score is ≥ the current 50th place score. If leaderboard fetch failed, show entry anyway
(optimistic: let the server decide on submit).

---

### Screen 6: Leaderboard

**Layout zones**:
- Full screen on mobile; centred panel (560px) on desktop
- Header: title + "BACK" button (top-left)
- Scrollable list: rank rows
- Footer: timestamp "Updated N seconds ago"

**Component inventory**:
- Title: "🏆 LEADERBOARD" (PressStart2P 14px)
- Back button (top-left corner)
- Table header: RANK | NAME | SCORE | PHASE
- 50 LeaderboardRow components
- Own entry: highlighted in yellow-tinted row
- Footer: last-fetch timestamp

**Interactions**:
- Scroll: native scroll (DOM list, not canvas)
- BACK: → previous scene
- Escape: → previous scene
- Row tap: no action (view only)

**Loading state**: 5 skeleton rows (grey shimmer), header visible.

**Error state**: Icon + "Couldn't load scores." + [TRY AGAIN] button.

**Empty state**: "No scores yet. Be the first!" with a balloon icon.

---

### Screen 7: How to Play

**Layout zones**:
- Scrollable, centred, max-width 560px
- Section: Objective
- Section: Controls (tab-style: KEYBOARD | TOUCH | GAMEPAD)
- Section: Scoring table
- Back button

**Component inventory**:
- Section headers (PressStart2P 12px)
- Control tabs: click/tap to switch view
- Control diagram: animated GIF-equivalent sprite sequence showing input → action
- Scoring table: action | points (DOM table)

**Interactions**:
- Tabs: KEYBOARD / TOUCH / GAMEPAD (default: auto-detect)
- BACK / Escape: → MenuScene

**Empty/error state**: N/A (static content)

---

### Screen 8: Settings

**Layout zones**:
- Centred panel, 340px
- Two sections: Audio, Display

**Component inventory**:
- SOUND: toggle button group [ON] [OFF]
- VOLUME: range input (0–100), styled as pixel slider
- SCALE: button group [AUTO] [1×] [2×]
- BACK button

**Interactions**:
- All changes: immediate effect + persist to localStorage
- BACK: → MenuScene

**Empty/error state**: N/A (defaults always valid)

---

## Component Specifications

### PixelButton (detailed)

| Property | Value |
|----------|-------|
| Font | PressStart2P, 12px |
| Padding | 8px 16px |
| Min touch target | 44 × 44px |
| Border | 2px solid `--color-border` |
| Shadow (default) | 3px 3px 0px #000 |
| Shadow (active) | 1px 1px 0px #000 + translate(2px,2px) |
| Transition | 100ms linear |
| Focus ring | 2px solid `--color-accent`, 2px offset |

### Slider (Settings volume)

```css
input[type=range] {
  appearance:       none;
  width:            100%;
  height:           8px;
  background:       var(--color-border);
  border:           2px solid var(--color-border);
}
input[type=range]::-webkit-slider-thumb {
  appearance:       none;
  width:            16px;
  height:           16px;
  background:       var(--color-accent);
  border:           2px solid #000;
  cursor:           pointer;
}
```

### Loading Skeleton

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-border)  50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}
@keyframes shimmer {
  from { background-position:  200% 0; }
  to   { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; background: var(--color-surface); }
}
```

---

## Accessibility Compliance Summary

| WCAG Criterion | Status | Implementation |
|----------------|--------|----------------|
| 1.4.3 Contrast (AA) | ✓ | All UI text verified ≥ 4.5:1; yellow on black = 9.6:1 |
| 1.4.11 Non-text Contrast | ✓ | Button borders, focus rings ≥ 3:1 |
| 2.1.1 Keyboard | ✓ | All interactive elements reachable via Tab/Enter/Space/Escape |
| 2.1.2 No Keyboard Trap | ✓ | Escape always exits current overlay |
| 2.4.3 Focus Order | ✓ | DOM order matches visual order; no `tabindex > 0` |
| 2.4.7 Focus Visible | ✓ | Custom focus ring on all elements |
| 2.5.5 Target Size (AA) | ✓ | Min 44×44px on all touch targets |
| 1.3.1 Info and Relationships | ✓ | Semantic HTML; ARIA roles on menu, list, row |
| 2.3.1 Three Flashes | ✓ | No rapid flash content in UI chrome |
| 3.2.1 On Focus | ✓ | Focus does not trigger navigation |

---

## Micro-Interactions

| Interaction | Duration | Easing | Animated Properties | Notes |
|-------------|----------|--------|---------------------|-------|
| Button press | 100ms | linear | translateX/Y +2px, shadow shrink | Simulates physical button |
| Menu item select | 200ms | ease-out | background-color, border-color | Colour transition |
| Score digit increment | 150ms | spring | scale 1→1.2→1 per digit | PixiJS tween |
| New high score banner | 500ms | spring | scale 0→1.1→1 + opacity | Punchy celebration |
| Phase announcement | in:200ms, hold:1100ms, out:200ms | ease | opacity | Total 1.5s |
| Invincibility flash | 67ms cycle (60fps) | linear | sprite alpha 0/1 alternating | 60 frames total |
| Fish telegraph | 300ms | ease-in | sprite lean forward | Before lunge |
| Fish lunge | 200ms | ease-in | translateY -40px, scaleX 1.3 | Danger read |
| Egg hatch warning | Flicker at 8fps last 500ms | step | frame switch | Visual urgency |
| PWA install prompt | 300ms | ease-out | slideUp from bottom | After game over |
| Leaderboard row appear | 50ms stagger per row | ease-out | opacity 0→1, translateY 8→0 | Sequential |
| Toast notification | in:200ms, hold:3000ms, out:200ms | ease | opacity, translateY | Error/success feedback |

---

## Responsive Behaviour

### Canvas Scaling by Viewport

| Viewport Width | Scale | Canvas CSS Size |
|---------------|-------|-----------------|
| < 256px | 1× | 256 × 240px (scroll) |
| 256–511px | 1× | 256 × 240px |
| 512–767px | 2× | 512 × 480px |
| 768–1023px | 2× or 3× | Fits height |
| ≥ 1024px | 3× or 4× | Fits viewport |
| "2×" setting | 2× | Always 512 × 480px |

### Orientation

- Portrait mobile: canvas stacks above touch controls; menu panel full-width
- Landscape mobile: canvas left; touch controls flanking; menu panel centred
- Landscape tablet: canvas centred; no layout shift; touch controls repositioned
- No forced orientation lock — layout adapts

### Touch Control Repositioning (landscape)

In landscape on narrow-height devices (height < 400px):
- D-pad: absolute bottom-left, reduced height (48px)
- Flap: absolute bottom-right, reduced height (48px)
- Canvas: vertically centred, full height

---

## Designer Notes: Key Decisions

**Why PixiJS for UI, not HTML/CSS for all of it?**
HUD elements are inside the game canvas — keeping them in PixiJS means a single
rendering context, no z-index juggling, and pixel-perfect alignment with game sprites.
Menu chrome is DOM-based for accessibility. The boundary is deliberate.

**Why no animations on scene transitions?**
In a game where reaction time matters and the user is often bouncing between game and
menu mid-session, even a 200ms transition feels like friction. Instant switches respect
player intent.

**Why no confirmation dialog on RESTART?**
Adds one step to the most common recovery action. The cost of an accidental restart is
low (lost one run). The cost of a confirmation dialog every time is permanent friction.
