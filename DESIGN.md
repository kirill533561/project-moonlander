# Design

Visual system for project-moonlander, an 8-bit space-mission personal dashboard. Captured from `src/app/globals.css` and the component layer. Color strategy: **Committed** — a saturated neon palette on near-black space carries the identity, well past a single restrained accent.

## Theme

Dark, always. Physical scene: one person at night or in a dim room, treating their personal dashboard like a glowing arcade cabinet / flight console. The near-black background makes neon accents and pixel art glow. Light mode would break the metaphor and is not supported.

## Color

Near-black space surfaces with neon arcade accents. Values are kept as hex to match the existing token set.

### Surfaces
- `--background` / `space-dark`: `#0a0a1a` — app background
- `space-deeper`: `#060612` — sidebar, header, bottom-nav, deepest panels
- `--card`: `#0f0f2a` — `pixel-card` fill
- `--secondary` / `--muted` / `--input`: `#1a1a3a` — inputs, inner tiles, secondary fills
- `--border`: `#2a2a4a` — default border on cards/inputs (often used as arbitrary `[#2a2a4a]`)

### Neon accents (each maps to a semantic role)
- `pixel-cyan` `#00ffff` — primary / mission / selection / focus ring
- `pixel-green` `#00ff41` — success, income, completion, "go"
- `pixel-gold` `#ffd700` — rewards, savings, the moon, achievement
- `pixel-purple` `#b967ff` — dreams, accent, secondary highlight
- `pixel-red` `#ff4444` — destructive, expenses, overdue, urgent
- `pixel-blue` `#4488ff` — tertiary accent (astronaut visor, etc.)
- `pixel-orange` `#ff8844` — tertiary accent (flames, warnings)

### Foreground & neutrals
- `--foreground`: `#e0e0e0` — primary text
- Secondary-text ramp (retuned for AA legibility on `#0a0a1a`, tinted cool toward the space hue):
  - `gray-400` `#aab0c8` (~7:1) — primary secondary text
  - `gray-500` `#9499b0` (~6.6:1) — most labels and meta
  - `gray-600` `#787f99` (~4.7:1) — dimmest still-AA tier
  - Note: these override Tailwind defaults in the `@theme` block. The dark `gray-700/800/900` keep Tailwind defaults (used as fills, not text).

Never use raw `#000`/`#fff` as a surface. Semi-transparent black scrims (`bg-black/80`) exist on modals; tinting them toward the space hue is the preferred polish.

## Typography

Two pixel fonts, no third family.

- **Display / labels:** `"Press Start 2P", monospace` (`font-pixel`, `--font-heading`). Blocky arcade caps. Used UPPERCASE for headings, labels, chips, nav. **Legible floor ~8px** — never smaller.
- **Body / data / prose:** `"VT323", monospace` (`font-pixel-body`, `--font-sans`, `--font-mono`). A legible pixel font that reads well even small. Body base is `20px`. Use for values, descriptions, longer copy.

Scale is fixed (px / Tailwind steps), not fluid. Hierarchy comes from font choice (Press Start 2P = label, VT323 = content) plus size and the neon color roles. Keep prose to 65–75ch.

## Shape & Elevation

- **Radius: 0 everywhere.** All `--radius-*` tokens are `0`. Sharp pixel corners are mandatory; no rounded cards or buttons (small exceptions like circular toggles/dots are intentional).
- `image-rendering: pixelated` is applied globally so pixel art and scaled sprites stay crisp.
- **Elevation = hard offset shadow**, not blur. `pixel-card` uses `4px 4px 0 #00000080` plus inset bevels and a top cyan gradient hairline. `pixel-btn` uses a `4px 4px 0` colored shadow that collapses on `:active` (the button physically "presses" via `translate`). No soft drop shadows.

## Components

- **`pixel-card`** — primary container: `#0f0f2a` fill, `3px solid #2a2a4a` border, inset bevel + hard offset shadow, and a `::before` top cyan gradient hairline. The default surface for grouped content. Avoid nesting cards.
- **`pixel-btn`** (+ `-gold`, `-green`, `-purple` variants, `-active` state) — bordered neon button on `#1a1a3a`; hover fills with the accent, active presses down. The single button vocabulary across the app.
- **`pixel-progress` / `pixel-progress-fill`** — bordered track with a stepped (`steps(10)`) fill animation; an 8-bit progress bar. Inner `::after` adds a highlight band.
- **Status/label chips** — `font-pixel` UPPERCASE, ~8px, accent color at low-alpha background (e.g. `color + "25"`). Used for priority, labels, progress.
- **Inputs/selects** — `#1a1a3a` fill, `2px #2a2a4a` border, focus border `pixel-cyan`, VT323 text.
- **Custom pixel art** (background layer): box-shadow pixel moon, drifting rocket + floating astronaut, cross-shaped sparkles, animated star field; skeuomorphic cassette **music player**; **reward wheel** (SVG). These carry the personality — keep them bespoke, not clip-art.

## Layout

- **Desktop:** fixed left `SidebarNav` (w-56) + sticky `Header` (h-20) + scrolling main. Multi-column boards/grids.
- **Mobile:** `BottomNav` (h-20) + sticky compact header (h-14); single-column, tabbed buckets on the planner.
- Content max-width ~`max-w-5xl` on the dashboard. Vary padding for rhythm; don't wrap everything in a card.
- Responsive behavior is structural (sidebar↔bottom-nav, multi-column↔single-column, tabbed buckets), not fluid typography.

## Motion

8-bit, stepped, and physical. Use `steps()` easing for the retro feel (twinkle, sparkle, progress fill); smooth `ease-in-out` for ambient float/drift. Hard, snappy button presses via `transform: translate`.

- Functional motion (progress fills, button press, completion) is core.
- Ambient motion (rocket drift, astronaut float, sparkles, star twinkle, quote pulse) is decorative and **should be gated behind `prefers-reduced-motion: reduce`** (current gap).
- Avoid animating layout properties where transform/opacity will do; the one deliberate exception is the stepped `width` progress fill.

## Sound

Click and success sounds (`src/lib/sounds.ts`) reinforce counter increments and goal completion. Sound is part of the reward loop; keep it optional-feeling and never required for comprehension.
