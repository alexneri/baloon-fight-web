# Brand Identity — Balloon Fight Web · 2026-03-27

## Brand Strategy

### Archetype
**The Jester** — playful, irreverent, nostalgic. Not trying to be taken seriously.
Knows it's a 40-year-old game about a man with balloons. Leans into it.

### Personality
- Warm and welcoming, never exclusive
- Pixel-authentic, never ironic about it
- Competitive without being toxic
- Nostalgic without being mournful — this is joy, not a museum

### Voice and Tone Matrix

| Situation | Tone | DO | DON'T |
|-----------|------|-----|-------|
| Menu / intro | Inviting, punchy | "Flap. Float. Fight." | "Welcome to the Balloon Fight experience" |
| Game over | Empathetic + competitive | "Game over. Your score: 12,400. Try harder." | "Better luck next time!" |
| New high score | Celebratory | "NEW RECORD!" | "Congratulations on your achievement!" |
| Leaderboard | Direct, factual | "#1 ACE — 987,654" | "Top players of the week" |
| Error | Honest, light | "Couldn't load scores. Our server's napping." | "An unexpected error has occurred." |
| Loading | Playful | "Inflating balloons..." | "Loading, please wait" |

---

## Messaging Hierarchy

**Tagline** (≤ 7 words): **"Float. Flap. Fight. Free."**

**Elevator pitch**: The 1984 Famicom classic, in your browser, right now.

**Positioning statement**: For players who remember Balloon Fight from childhood — or
who never got the chance — Balloon Fight Web is the only way to play it instantly,
anywhere, with a global leaderboard to prove your score.

---

## Positioning Against Competitors

| Competitor | Their position | Our position |
|------------|---------------|--------------|
| Nintendo Switch Online | Official, premium | Free, instant, no hardware |
| RetroArch Web | Purist emulation | Clean-room rewrite, mobile-ready |
| Flash-era fan ports | Nostalgic but broken | Modern, maintained, leaderboard |
| Internet Archive | Archive / research | Actually fun to play |

---

## Logo Directions

### Wordmark
"BALLOON FIGHT WEB" in Press Start 2P typeface. "BALLOON FIGHT" at 24px, "WEB" at 12px
below in `COLORS.ui.textSecondary`. Yellow (#F8B800) for "BALLOON FIGHT", grey for "WEB".
Pixel-perfect alignment; no anti-aliasing.

### Symbol
A single balloon (circle, 24×24px) with a trailing string. Fill: red (`#D82800`).
Rendered as SVG with pixel-art jagged edges — 8-direction only, no smooth curves.
Used as PWA icon and favicon.

### Combination Mark
Symbol left, wordmark right. 40px clearance between symbol and text.
Used in: PWA splash screen, metadata OG image.

---

## Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Sun Yellow | `#F8B800` | Primary CTA, focus rings, high score, logo |
| Balloon Red | `#D82800` | Symbol, danger states, enemy indicator |
| Sky Blue | `#6888FC` | Game background, secondary accents |
| Deep Navy | `#0A0A1A` | UI backgrounds |
| Surface Navy | `#12122A` | Panel backgrounds |
| Pure White | `#FCFCFC` | Primary text |
| Muted Lilac | `#A0A0C0` | Secondary text, metadata |
| Disabled | `#404060` | Disabled elements |
| Grass Green | `#00A800` | Success states, extra life |

**Rationale**: Pulled directly from the NES color palette. Every colour has appeared in
the original game. The UI chrome extends this palette without inventing new colours —
the experience is visually continuous between menu and gameplay.

---

## Typography

**Display**: Press Start 2P (Google Fonts)
- Used for: all game-context text, scores, menu items, HUD, headings
- Sizes: 8px (HUD), 10px (labels), 12px (menu), 16px (titles), 24px (screen headers)
- This font *is* the NES era. No substitutes.

**Body**: Inter (system-ui fallback)
- Used for: How to Play copy, Settings descriptions, leaderboard metadata
- Sizes: 14px (body), 12px (captions)
- Rationale: Press Start 2P is unreadable at paragraph length. Inter provides legibility
  for explanatory copy without breaking the aesthetic.

---

## Application Guidelines

### PWA Icons
- 192×192px: symbol on deep navy background (#0A0A1A)
- 512×512px: same, at higher pixel density
- No rounded corners in source (OS applies its own mask)
- Favicon: 32×32px SVG, balloon symbol

### Metadata / OG Image
- 1200×630px
- Background: deep navy gradient (top: #0A0A1A, bottom: #12122A)
- Combination mark centred, 200px wide
- Tagline below in Press Start 2P, 20px, white
- Bottom strip: 3–4 pixel art sprites (player, enemy) walking across

### Loading Screen
- Background: `#000000`
- Balloon symbol animating (bob up/down, 1s ease-in-out loop)
- "INFLATING BALLOONS..." label in Press Start 2P, 10px, yellow
