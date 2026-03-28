# Front-End Specification — Balloon Fight Web

## Design Philosophy

Pixel authenticity meets modern UX polish. The game canvas is sacrosanct — 256×240 NES
resolution, nearest-neighbour scaling, original colour palette. Everything outside the
canvas (menus, HUD chrome, leaderboard) uses a retro-pixel aesthetic executed with
modern clarity: readable at any screen size, keyboard and touch accessible.

---

## Design Tokens

### Colour Palette

```typescript
// tokens/colors.ts

export const COLORS = {
  // NES system palette (subset used)
  nes: {
    black:        '#000000',
    white:        '#FCFCFC',
    skyBlue:      '#6888FC',    // game background
    midnightBlue: '#000088',    // water deep
    waterBlue:    '#3CBCFC',    // water surface
    grassGreen:   '#00A800',    // platform tops
    earthBrown:   '#884000',    // platform sides
    cloudGrey:    '#BCBCBC',    // cloud platform
    sunYellow:    '#F8B800',    // balloon yellow
    balloonRed:   '#D82800',    // balloon red
    skinTone:     '#FCBCB0',    // player skin
  },

  // UI chrome (outside game canvas)
  ui: {
    bg:           '#0A0A1A',    // menu background
    surface:      '#12122A',    // card / panel background
    border:       '#2A2A4A',    // panel border
    accent:       '#F8B800',    // primary CTA, focus ring
    accentDim:    '#C89600',    // hover state
    textPrimary:  '#FCFCFC',    // body text
    textSecondary:'#A0A0C0',    // secondary labels
    textDisabled: '#404060',    // disabled state
    danger:       '#D82800',    // destructive actions
    success:      '#00A800',    // success states
    overlay:      'rgba(0,0,0,0.75)', // pause overlay
  },
} as const;
```

### Typography

```typescript
export const TYPOGRAPHY = {
  // Pixel font for game-feel headings (loaded via @font-face)
  fontDisplay: '"Press Start 2P", monospace',  // Google Fonts
  // System stack for readable body text
  fontBody: '"Inter", system-ui, sans-serif',

  scale: {
    xs:   '10px',   // labels, metadata
    sm:   '12px',   // secondary UI text
    base: '16px',   // menu items
    lg:   '20px',   // section headers
    xl:   '28px',   // screen titles
    xxl:  '40px',   // score display
  },

  weight: {
    regular: 400,
    bold:    700,
  },

  lineHeight: {
    tight:   1.2,
    normal:  1.5,
    relaxed: 1.8,
  },
} as const;
```

### Spacing

```typescript
export const SPACING = {
  // Base-4 scale
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
} as const;
```

### Sizing and Radius

```typescript
export const RADIUS = {
  none: '0px',
  sm:   '2px',   // pixel-exact rounding
  md:   '4px',
  lg:   '8px',
  full: '9999px',
} as const;

export const ELEVATION = {
  // Box shadows with NES pixel-border aesthetic
  panel: '4px 4px 0px #000000',
  button: '3px 3px 0px #000000',
  buttonActive: '1px 1px 0px #000000',
} as const;
```

### Animation

```typescript
export const ANIMATION = {
  // Durations (ms)
  instant:  0,
  fast:     100,
  normal:   200,
  slow:     400,

  // Easing
  easeOut:  'cubic-bezier(0.0, 0.0, 0.2, 1)',
  spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear:   'linear',

  // PixiJS ticker — all game animations run here, not CSS
} as const;
```

---

## Navigation Structure

```
App
├── PreloaderScene        (asset loading; auto-advances)
├── MenuScene             (main landing)
│   ├── → GameScene       (PLAY)
│   ├── → LeaderboardScene (LEADERBOARD)
│   ├── → HowToPlayScene  (HOW TO PLAY)
│   └── → SettingsScene   (SETTINGS)
├── GameScene             (active gameplay)
│   ├── → PauseOverlay    (modal overlay; game loop frozen)
│   │   ├── → GameScene   (RESUME)
│   │   ├── → GameScene   (RESTART; reset state)
│   │   └── → MenuScene   (MAIN MENU)
│   └── → GameOverScene   (on death with 0 lives)
├── BonusScene            (triggered by ProgressionSystem; returns to GameScene)
├── GameOverScene
│   ├── → NameEntryDialog (if score is top-50 candidate)
│   ├── → GameScene       (PLAY AGAIN)
│   └── → LeaderboardScene (VIEW LEADERBOARD)
└── LeaderboardScene
    └── → MenuScene / GameOverScene (BACK)
```

---

## Screen Specifications

### 1. Preloader Screen

**Layout**: Centred logo + progress bar on black background.

**Elements**:
- Balloon Fight Web logo (pixel art text, 140px wide)
- Animated balloon sprite floating up/down (32×32px)
- Progress bar: 200px wide, 8px tall, NES yellow fill, black border, 4px radius
- Loading text: "LOADING..." in Press Start 2P, 10px, white

**States**:
- Progress bar fills 0→100% as assets load
- On complete: fade to black (100ms) → MenuScene

**Empty/error state**: If assets fail after 10s: "FAILED TO LOAD. REFRESH." in red.

---

### 2. Main Menu Screen

**Layout**: Full-screen. Game canvas preview (animated, non-interactive) behind a centred
menu panel.

**Canvas preview**: Game loop running with enemies floating — no player, no input.
Serves as a live "attract mode."

**Panel** (320px wide on desktop, 90vw on mobile):
```
┌──────────────────────────────────────────┐
│  🎈 BALLOON FIGHT                        │
│  ─────────────────────────────────────── │
│  > PLAY                                  │
│    LEADERBOARD                           │
│    HOW TO PLAY                           │
│    SETTINGS                              │
│                                          │
│  HIGH SCORE: 0                           │
└──────────────────────────────────────────┘
```
- Arrow (>) indicates focused item
- Keyboard: Arrow Up/Down to navigate, Enter to confirm
- Touch: tap item directly
- Focus ring: 2px solid yellow, 2px offset

**States**: Selected item background: `COLORS.ui.surface`, border: yellow.

---

### 3. Game Screen (HUD)

**Canvas**: 256×240 game area, scaled to fit viewport (integer or sub-pixel scaling with
CSS `image-rendering: pixelated`).

**HUD overlay** (rendered in PixiJS, same canvas):
```
┌──────────────────────────────────────────────────┐
│  ♥ ♥ ♥            SCORE              HI-SCORE    │
│  (lives)          0000000             0000000     │
│                                                  │
│         [GAME CANVAS 256×240]                    │
│                                                  │
│                                                  │
│                  ~~WATER~~                       │
└──────────────────────────────────────────────────┘
```
- Lives: balloon emoji icons, 16×16px each, top-left
- Score: Press Start 2P, 8px (scaled), top-centre, yellow
- Hi-Score: same, top-right, white
- Phase number: displayed centre-screen for 1.5s on phase start ("PHASE 3"), then fades

**Touch controls overlay** (rendered on top, touch devices only):
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│  ┌──────────────────┐          ┌────────────────────┐   │
│  │   ◄   ·   ►      │          │       FLAP         │   │
│  └──────────────────┘          └────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```
- D-pad: 120×60px, bottom-left, 16px margin
- Flap: 90×60px, bottom-right, 16px margin
- Both: `rgba(255,255,255,0.15)` background, `rgba(255,255,255,0.4)` border
- Active state: `rgba(248,184,0,0.3)` background

---

### 4. Pause Screen (Overlay)

**Layout**: Semi-transparent overlay (`rgba(0,0,0,0.75)`) on top of frozen game canvas.
Centred panel.

```
┌──────────────────────────────┐
│          PAUSED              │
│  ──────────────────────────  │
│  > RESUME                    │
│    RESTART                   │
│    MAIN MENU                 │
│    MUTE / UNMUTE             │
└──────────────────────────────┘
```
- Same panel component as Main Menu
- Pressing P, Escape, or Start resumes

---

### 5. Game Over Screen

**Layout**: Centred on dark overlay or black screen.

```
┌────────────────────────────────────┐
│            GAME OVER               │
│                                    │
│  SCORE         00012400            │
│  BEST          00045000            │
│  PHASE         7                   │
│                                    │
│  ── NEW PERSONAL BEST! ──          │  (conditional)
│                                    │
│  [ENTER YOUR NAME]                 │  (if top-50 eligible)
│    A _ _                           │
│                                    │
│  [ PLAY AGAIN ]  [ LEADERBOARD ]   │
└────────────────────────────────────┘
```

**Name entry sub-component** (3 character arcade-style selector):
- 3 character slots, each cycling A–Z, 0–9
- Arrow Up/Down to change character, Right to advance slot
- Touch: tap slot to focus, swipe up/down to change character

---

### 6. Leaderboard Screen

**Layout**: Full screen, scrollable list.

```
┌────────────────────────────────────────┐
│         🏆 LEADERBOARD                 │
│  ────────────────────────────────────  │
│  #   NAME    SCORE     PHASE           │
│  ────────────────────────────────────  │
│  1   ACE    987,654    42              │
│  2   ZAP    543,210    31              │
│  ...                                  │
│  ────────────────────────────────────  │
│              [ BACK ]                  │
└────────────────────────────────────────┘
```
- Player's own entry highlighted in yellow
- Alternating row backgrounds for readability
- Loading skeleton: 5 grey placeholder rows animate
- Error state: icon + "Couldn't load scores." + retry button

---

### 7. How to Play Screen

**Layout**: Scrollable, two sections: Objective + Controls.

```
OBJECTIVE
─────────
Pop enemy balloons by landing on them from above.
Avoid Sparky. Watch out for the fish at the bottom.

CONTROLS
─────────
┌────────────────────┬──────────────────────┐
│   KEYBOARD         │   TOUCH              │
├────────────────────┼──────────────────────┤
│ ← → Move           │ D-pad left/right     │
│ Z / SPACE Flap     │ FLAP button          │
│ P Pause            │ —                    │
│ M Mute             │ —                    │
└────────────────────┴──────────────────────┘

SCORING
───────
Pop balloon (first): 800 pts
Pop balloon (chain):  1,000 / 1,200 / 1,500
Kick egg:             500 pts
Bonus balloon:        1,000 pts
```

---

### 8. Settings Screen

```
┌────────────────────────────────┐
│          SETTINGS              │
│  ─────────────────────────────  │
│  SOUND        [ ON  ]  [ OFF ] │
│  VOLUME       ────●──────────  │  (slider)
│  SCALE        [AUTO] [ 1× ] [2×]│
│  ─────────────────────────────  │
│  [ BACK ]                      │
└────────────────────────────────┘
```

---

## Component Specifications

### PixelButton

```typescript
interface PixelButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  focused?: boolean;
  disabled?: boolean;
  onClick: () => void;
}
```

**States**:
- Default: border 2px `COLORS.ui.border`, shadow `ELEVATION.button`
- Focused: border `COLORS.ui.accent`, shadow yellow offset
- Active (press): shadow `ELEVATION.buttonActive`, translate(2px, 2px)
- Disabled: opacity 0.4, no interaction

---

### MenuPanel

Container for all menu screens. Width: 320px (desktop), 90vw (mobile, max 380px).
Background: `COLORS.ui.surface`. Border: 2px solid `COLORS.ui.border`.
Shadow: `ELEVATION.panel`. Padding: `SPACING[6]`.

---

### LeaderboardRow

| Element | Style |
|---------|-------|
| Rank | `TYPOGRAPHY.fontDisplay`, 10px, `COLORS.ui.textSecondary` |
| Name | `TYPOGRAPHY.fontDisplay`, 12px, `COLORS.ui.textPrimary` |
| Score | `TYPOGRAPHY.fontDisplay`, 12px, yellow if player's own entry |
| Phase | `TYPOGRAPHY.fontBody`, 12px, `COLORS.ui.textSecondary` |
| Own row | Background: `rgba(248,184,0,0.1)`, border-left: 3px yellow |

---

### TouchDPad

Rendered in PixiJS as a Graphics object (not DOM). Two hit zones: left half → LEFT action,
right half → RIGHT action. Visual: rounded rectangle with left/right triangles.

---

### LoadingSkeleton

Three variants: row (for leaderboard), card, and text-line. All use a shimmer animation
(`background-position` CSS animation, 1.5s loop). Disabled when `prefers-reduced-motion`.

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|---------------|
| 1.4.3 Contrast (AA) | All text meets 4.5:1; UI backgrounds verified with axe-core |
| 2.1.1 Keyboard | All menus fully keyboard navigable; no keyboard traps |
| 2.4.7 Focus Visible | Custom focus ring: 2px solid yellow, 2px offset on all elements |
| 2.5.5 Target Size | Touch targets ≥ 44×44 CSS px |
| 1.2.2 Captions | N/A (no video content) |
| 2.3.1 Flashing | No content flashes > 3 times/sec |

### Reduced Motion

When `prefers-reduced-motion: reduce`:
- Title screen balloon float animation: disabled
- Leaderboard shimmer: replaced with static grey
- Phase transition text: instant appear instead of fade
- All CSS `transition` durations: 0ms
- PixiJS non-game animations (menu effects): disabled

### Screen Reader

Game canvas itself is not screen-reader navigable (inherent limitation). All menu chrome
uses semantic HTML rendered in the DOM (not canvas). ARIA roles:
- `role="menu"` on menu containers
- `role="menuitem"` on each menu option
- `aria-selected="true"` on focused item
- `aria-live="polite"` on score display (updates announced)
- `aria-label="Flap button"` / `aria-label="Move left"` on touch controls

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Behaviour |
|------------|-------|-----------|
| Mobile | < 640px | Canvas fills width; touch controls shown; menu panel 90vw |
| Tablet | 640–1024px | Canvas centred with side margin; touch controls shown |
| Desktop | > 1024px | Canvas centred at 2× or auto scale; touch controls hidden |

### Canvas Scaling

```typescript
function computeCanvasScale(
  viewportWidth: number,
  viewportHeight: number,
  setting: 'auto' | 1 | 2
): number {
  if (setting === 1) return 1;
  if (setting === 2) return 2;
  // auto: largest integer scale that fits viewport
  const scaleX = Math.floor(viewportWidth / 256);
  const scaleY = Math.floor(viewportHeight / 240);
  return Math.max(1, Math.min(scaleX, scaleY));
}
```

CSS on canvas element:
```css
canvas {
  image-rendering: pixelated;   /* Chrome, Edge */
  image-rendering: crisp-edges; /* Firefox */
  display: block;
  margin: 0 auto;
}
```

---

## Empty, Loading, and Error States

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| Leaderboard | 5-row skeleton shimmer | "No scores yet. Be first!" | Icon + message + retry button |
| Preloader | Progress bar | N/A | "Failed to load. Refresh page." |
| Game Over score submission | Button spinner | N/A | Toast: "Score not saved. Try again." |
| Name entry | N/A | Placeholder `_ _ _` | Flash red on invalid character |

---

## Asset Manifest

```json
{
  "bundles": [
    {
      "name": "game",
      "assets": [
        { "alias": "atlas", "src": "/assets/sprites.json" },
        { "alias": "font-display", "src": "https://fonts.googleapis.com/css2?family=Press+Start+2P" }
      ]
    }
  ]
}
```

Sprite atlas contents (TexturePacker, Pixi format):
- `player_2balloon_0` – `player_2balloon_3` (walk/fly cycle)
- `player_1balloon_0` – `player_1balloon_3`
- `player_death_0` – `player_death_2`
- `enemy_a_0` – `enemy_a_3`
- `enemy_b_0` – `enemy_b_3`
- `sparky_0` – `sparky_3`
- `egg_0`, `egg_1` (hatch warning flash)
- `fish_0` – `fish_3` (lurk, lunge, retract)
- `platforms_tileset`
- `water_0` – `water_3` (wave animation)
- `balloon_yellow`, `balloon_red`
- `icon_heart`, `icon_balloon`
- `ui_panel`, `ui_button_*`
