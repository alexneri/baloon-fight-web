# Design System — Balloon Fight Web · 2026-03-27

## Design Tokens (TypeScript)

```typescript
// src/ui/tokens.ts

export const tokens = {
  color: {
    // Game palette (NES-accurate)
    nes: {
      black:        '#000000',
      white:        '#FCFCFC',
      skyBlue:      '#6888FC',
      midnightBlue: '#000088',
      waterBlue:    '#3CBCFC',
      grassGreen:   '#00A800',
      earthBrown:   '#884000',
      cloudGrey:    '#BCBCBC',
      sunYellow:    '#F8B800',
      balloonRed:   '#D82800',
    },
    // UI chrome
    ui: {
      bg:           '#0A0A1A',
      surface:      '#12122A',
      border:       '#2A2A4A',
      accent:       '#F8B800',
      accentHover:  '#C89600',
      textPrimary:  '#FCFCFC',
      textSecondary:'#A0A0C0',
      textDisabled: '#404060',
      danger:       '#D82800',
      success:      '#00A800',
      overlay:      'rgba(0,0,0,0.75)',
    },
  },

  font: {
    display: '"Press Start 2P", monospace',
    body:    '"Inter", system-ui, sans-serif',
  },

  fontSize: {
    xs:   10,  // px — HUD small labels
    sm:   12,  // menu secondary
    base: 16,  // menu items
    lg:   20,  // section headers
    xl:   28,  // screen titles
    score:40,  // score big display
  },

  spacing: {
    1:  4,
    2:  8,
    3:  12,
    4:  16,
    6:  24,
    8:  32,
    10: 40,
    12: 48,
  },

  radius: {
    none: 0,
    sm:   2,
    md:   4,
    lg:   8,
  },

  shadow: {
    panel:       '4px 4px 0px #000000',
    button:      '3px 3px 0px #000000',
    buttonPress: '1px 1px 0px #000000',
  },

  animation: {
    fast:   100,   // ms
    normal: 200,
    slow:   400,
    ease:   'cubic-bezier(0.0, 0.0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  game: {
    width:  256,   // logical px
    height: 240,
  },
} as const;

export type ColorToken = typeof tokens.color;
export type SpacingKey = keyof typeof tokens.spacing;
```

---

## CSS Custom Properties (global.css)

```css
:root {
  /* Colors */
  --color-bg:             #0A0A1A;
  --color-surface:        #12122A;
  --color-border:         #2A2A4A;
  --color-accent:         #F8B800;
  --color-accent-hover:   #C89600;
  --color-text-primary:   #FCFCFC;
  --color-text-secondary: #A0A0C0;
  --color-text-disabled:  #404060;
  --color-danger:         #D82800;
  --color-success:        #00A800;
  --color-overlay:        rgba(0,0,0,0.75);

  /* Typography */
  --font-display: "Press Start 2P", monospace;
  --font-body:    "Inter", system-ui, sans-serif;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radius */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;

  /* Shadows */
  --shadow-panel:        4px 4px 0px #000000;
  --shadow-button:       3px 3px 0px #000000;
  --shadow-button-press: 1px 1px 0px #000000;
}

/* Base */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--color-bg); color: var(--color-text-primary); }
body { font-family: var(--font-body); font-size: 16px; line-height: 1.5; }

/* Canvas */
canvas {
  display: block;
  margin: 0 auto;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Focus ring */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}
```

---

## Custom Components

### MenuPanel

```typescript
// Rendered as DOM element (not canvas) for accessibility

interface MenuPanelProps {
  title?: string;
  width?: number;   // default 320
  children: HTMLElement[];
}

// CSS
.menu-panel {
  background:   var(--color-surface);
  border:       2px solid var(--color-border);
  box-shadow:   var(--shadow-panel);
  padding:      var(--space-6);
  width:        320px;
  max-width:    90vw;
  font-family:  var(--font-display);
}
```

---

### PixelButton

```typescript
interface PixelButtonProps {
  label:    string;
  variant:  'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}
```

```css
.pixel-btn {
  font-family:  var(--font-display);
  font-size:    12px;
  padding:      var(--space-2) var(--space-4);
  border:       2px solid var(--color-border);
  background:   var(--color-surface);
  color:        var(--color-text-primary);
  box-shadow:   var(--shadow-button);
  cursor:       pointer;
  transition:   box-shadow 100ms, transform 100ms;
}
.pixel-btn:hover:not(:disabled)  { border-color: var(--color-accent); }
.pixel-btn:focus-visible          { border-color: var(--color-accent); }
.pixel-btn:active:not(:disabled) {
  box-shadow: var(--shadow-button-press);
  transform:  translate(2px, 2px);
}
.pixel-btn:disabled { opacity: 0.4; cursor: default; }
.pixel-btn.primary  { background: var(--color-accent); color: #000; }
.pixel-btn.danger   { border-color: var(--color-danger); }
```

---

### HUD (PixiJS Container)

```typescript
class HUD extends Container {
  private scoreText:   BitmapText;
  private hiScoreText: BitmapText;
  private livesIcons:  Sprite[];

  constructor() {
    super();
    // Press Start 2P loaded as BitmapFont for GPU text rendering
    this.scoreText   = new BitmapText({ style: { fontFamily: 'PressStart2P', fontSize: 8, fill: 0xF8B800 } });
    this.hiScoreText = new BitmapText({ style: { fontFamily: 'PressStart2P', fontSize: 8, fill: 0xFCFCFC } });
    this.scoreText.position.set(128, 4);   // centre top
    this.hiScoreText.position.set(200, 4); // top right
    this.addChild(this.scoreText, this.hiScoreText);
  }

  update(score: number, hiScore: number, lives: number): void {
    this.scoreText.text   = String(score).padStart(7, '0');
    this.hiScoreText.text = String(hiScore).padStart(7, '0');
    // rebuild life icons if lives changed
  }
}
```

---

### LeaderboardRow (DOM)

```css
.lb-row {
  display:       grid;
  grid-template: "rank name score phase" / 40px 80px 1fr 60px;
  align-items:   center;
  padding:       var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-family:   var(--font-display);
  font-size:     10px;
}
.lb-row.own {
  background:    rgba(248,184,0,0.1);
  border-left:   3px solid var(--color-accent);
}
.lb-row .rank   { color: var(--color-text-secondary); }
.lb-row .score  { text-align: right; color: var(--color-text-primary); }
.lb-row .phase  { text-align: right; color: var(--color-text-secondary); }
```

---

### TouchControls (PixiJS Graphics)

```typescript
class TouchControls extends Container {
  private dpad:  Graphics;
  private flapBtn: Graphics;

  draw(viewW: number, viewH: number): void {
    const margin = 16;
    const dpadW  = 120, dpadH = 60;
    const flapW  = 90,  flapH = 60;
    const y      = viewH - dpadH - margin;

    this.dpad.clear();
    this.dpad.roundRect(margin, y, dpadW, dpadH, 8)
              .fill({ color: 0xffffff, alpha: 0.15 })
              .stroke({ color: 0xffffff, alpha: 0.4, width: 2 });

    this.flapBtn.clear();
    this.flapBtn.roundRect(viewW - flapW - margin, y, flapW, flapH, 8)
                 .fill({ color: 0xffffff, alpha: 0.15 })
                 .stroke({ color: 0xffffff, alpha: 0.4, width: 2 });
  }

  /** Returns LEFT, RIGHT, or null based on touch x within dpad bounds */
  resolveAction(localX: number): 'LEFT' | 'RIGHT' | null {
    const mid = this.dpad.x + 60; // half of 120
    if (localX < mid) return 'LEFT';
    if (localX > mid) return 'RIGHT';
    return null;
  }
}
```

---

### NameEntry (3-character arcade selector)

```typescript
class NameEntry extends Container {
  private slots: BitmapText[] = [];
  private currentSlot = 0;
  private chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private values = [0, 0, 0];

  getName(): string {
    return this.values.map(i => this.chars[i]).join('');
  }

  onUp():    void { this.values[this.currentSlot] = (this.values[this.currentSlot] - 1 + 36) % 36; this.render(); }
  onDown():  void { this.values[this.currentSlot] = (this.values[this.currentSlot] + 1) % 36; this.render(); }
  onRight(): void { if (this.currentSlot < 2) { this.currentSlot++; this.render(); } }
  onConfirm(): string { return this.getName(); }
}
```

---

## Layout Patterns

### Game Canvas Centred

```css
.game-root {
  display:        flex;
  flex-direction: column;
  align-items:    center;
  justify-content: center;
  min-height:     100dvh;
  background:     var(--color-bg);
}
```

### Menu Screen Layout

```css
.menu-screen {
  position:        fixed;
  inset:           0;
  display:         flex;
  align-items:     center;
  justify-content: center;
  background:      var(--color-overlay);
  z-index:         100;
}
```

---

## Animation Presets

| Name | Duration | Easing | Properties |
|------|----------|--------|------------|
| `panelEnter` | 200ms | `ease-out` | `opacity 0→1`, `translateY 8→0px` |
| `buttonPress` | 100ms | `linear` | `translateX/Y +2px`, shadow reduce |
| `scoreIncrement` | 150ms | `spring` | `scale 1→1.2→1` on score digit |
| `newHighScore` | 500ms | `spring` | Full score display scale bounce |
| `balloonFloat` | 1000ms | `ease-in-out`, infinite | `translateY 0→-8→0px` |
| `shimmerLoad` | 1500ms | `linear`, infinite | `background-position` sweep |
| `invincFlash` | 67ms | `linear`, repeating | sprite `alpha` 1→0→1 |
| `fishLunge` | 200ms | `ease-in` | enemy Y translate, scale X |

---

## Accessibility Checklist per Component

| Component | Keyboard | Focus Ring | Contrast | ARIA | Reduced Motion |
|-----------|----------|------------|----------|------|----------------|
| PixelButton | Enter/Space | ✓ yellow | ✓ 4.5:1+ | role=button | No transition |
| MenuPanel | Tab navigation | ✓ | ✓ | role=menu | N/A |
| LeaderboardRow | Tab row | ✓ | ✓ | role=row | N/A |
| TouchControls | N/A (game input) | N/A | N/A | aria-label | N/A |
| NameEntry | ↑↓→ Enter | ✓ | ✓ | role=spinbutton | Instant |
| HUD | N/A (game) | N/A | ✓ yellow on dark | aria-live=polite | N/A |
| LoadingSkeleton | N/A | N/A | N/A | aria-busy=true | Static grey |

---

## Theme Configuration

```typescript
// vite.config.ts — no CSS framework; tokens are vanilla CSS custom properties

// pixi-app config
const app = new Application();
await app.init({
  width:            256,
  height:           240,
  resolution:       computeCanvasScale(window.innerWidth, window.innerHeight, 'auto'),
  autoDensity:      true,
  antialias:        false,   // nearest-neighbour is intentional
  backgroundColor:  0x6888FC, // NES sky blue
  roundPixels:      true,    // prevent sub-pixel jitter
});
```
