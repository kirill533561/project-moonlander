---
target: project-moonlander app UI
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-05-31T17-54-03Z
slug: project-moonlander-app-ui
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No skeleton/loading states for cloud-synced data; no save confirmation |
| 2 | Match System / Real World | 4 | Space/mission metaphor is consistent and excellent (Mission Control, Telemetry, Trophy Case) |
| 3 | User Control and Freedom | 3 | No undo for task/bucket delete; relies on native confirm() |
| 4 | Consistency and Standards | 3 | Native confirm()/alert() break theme; micro-type scale (5–10px) is erratic |
| 5 | Error Prevention | 2 | Destructive deletes guarded only by confirm(); no input validation messaging |
| 6 | Recognition Rather Than Recall | 3 | Good icon+label nav, but tiny labels and icon-only ×/✕ controls force squinting |
| 7 | Flexibility and Efficiency | 3 | Zoom, demo mode, recurrence, DnD are great; no keyboard shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Bold committed aesthetic (strength), but density + 5px text + always-on background motion compete with content |
| 9 | Error Recovery | 2 | alert("Invalid backup file"); no inline error states or recovery guidance |
| 10 | Help and Documentation | 2 | Empty states exist, but no first-run onboarding or tooltips for dense iconography |
| **Total** | | **28/40** | **Good — strong identity, held back by legibility & accessibility** |

## Anti-Patterns Verdict

**LLM assessment: NOT AI slop.** This is the opposite of generic. The 8-bit pixel-art system is committed and hand-built: a box-shadow pixel moon, a drifting rocket + floating astronaut, cross-shaped sparkles, VT323/Press Start 2P pairing, zero border-radius everywhere. Nobody would say "an AI defaulted to this." The risk here is the inverse of slop: legibility and accessibility were sacrificed to push the theme.

**Deterministic scan: 21 findings, but only ~3 are genuine for the app UI.**
- `side-tab` (11): only the **dashboard best/worst-month cards** (`border-l-4`, dashboard/page.tsx:426,432) are the real banned side-stripe. The rest are false positives: `reward-wheel.tsx:118` is a CSS-triangle pointer; `music-player.tsx` borders are skeuomorphic 3D bevels on the cassette deck; the `api/.../route.ts` hits are HTML **email** templates (out of scope).
- `pure-black-white` (9): semi-transparent modal/lightbox scrims (`bg-black/80`, `bg-black/90`) and the music-player "screen." Minor — tint toward space hue for polish.
- `layout-transition` (1): `.pixel-progress-fill { transition: width }` (globals.css:217). Real, but it's a thin bar with a deliberate `steps(10)` chunky fill; negligible impact.

## Overall Impression

A genuinely characterful personal-mission dashboard with a rare, fully-committed aesthetic. It works. The single biggest opportunity is legibility: Press Start 2P rendered at 5–6px is effectively unreadable, and that undercuts the polish everywhere else. Fix the type floor and the secondary-text contrast and the whole thing jumps a tier without touching the identity.

## What's Working

- **Thematic coherence (heuristic 2 = 4/4).** Every label, color, and motion serves one consistent space-mission world. This is the hardest thing to do and it's done well.
- **Custom craft.** The pixel moon, rocket, astronaut, and cassette music player are bespoke box-shadow art, not clip-art. Real personality.
- **Solid component vocabulary.** `pixel-card` / `pixel-btn` variants give consistent affordances across all five pages.

## Priority Issues

- **[P1] Microscopic pixel type.** `font-pixel text-[5px]` and `text-[6px]` (Press Start 2P) appear throughout the planner and on cards. Press Start 2P needs ~8px+ to resolve; at 5px it's a gray smear.
  - **Why it matters:** primary metadata (due dates, recurrence, status) is unreadable. Fails low-vision users outright.
  - **Fix:** raise the Press Start 2P floor to 8px; move sub-8px text to VT323 (legible small) and bump it. Define a fixed micro-scale instead of ad-hoc 5/6/7px.
  - **Suggested command:** `/impeccable typeset`

- **[P1] Low-contrast secondary text.** Pervasive `text-gray-500` / `text-gray-600` on `#0a0a1a` falls below WCAG AA (~3:1 or worse).
  - **Why it matters:** labels, counts, and helper text are hard to read for everyone, impossible for some.
  - **Fix:** introduce a tinted-neutral token (cool gray toward the brand hue) that hits ≥4.5:1 for body and ≥3:1 for large text; replace bare gray-500/600.
  - **Suggested command:** `/impeccable colorize` (or `polish`)

- **[P2] Side-stripe accent on best/worst cards.** `border-l-4 border-pixel-green` / `border-pixel-red` (dashboard) is the one true AI-tell the detector caught.
  - **Why it matters:** it's the cliché the rest of the design avoids; inconsistent with the full-border `pixel-card` language.
  - **Fix:** use a full pixel border in the accent color, or a leading status glyph + colored value, not a left rail.
  - **Suggested command:** `/impeccable polish`

- **[P2] Native confirm()/alert() dialogs.** Task/bucket/plan delete and import errors use browser-native dialogs.
  - **Why it matters:** they shatter the immersive theme and provide no styled error recovery (heuristics 4 & 9).
  - **Fix:** themed inline confirm (pixel-card) and inline error toasts.
  - **Suggested command:** `/impeccable harden`

- **[P3] Always-on decorative motion ignores reduced-motion.** Rocket drift, astronaut float, twinkle, sparkles, and `animate-pulse` run continuously with no `prefers-reduced-motion` guard.
  - **Why it matters:** vestibular-sensitivity accessibility gap; also competes with content for attention.
  - **Fix:** wrap ambient animations in `@media (prefers-reduced-motion: reduce)` to pause/disable.
  - **Suggested command:** `/impeccable animate` (or `polish`)

## Persona Red Flags

**Alex (Power User):** No keyboard shortcuts anywhere (board, modals, nav). Every destructive action stops flow with a native confirm(). Marking many tasks done is click-only.

**Jordan (First-Timer):** 5–6px labels and icon-only ×/✕/✕ controls give no affordance hints. No first-run guidance on what a "counter," "bucket," or "dream" is. Lands on empty pages with minimal teaching.

**Maya (Low-vision, project a11y persona):** 5px Press Start 2P and gray-600-on-near-black are hard blockers. Zoom control helps, but it's a workaround for a contrast/size problem that shouldn't exist.

## Minor Observations

- Modal scrims use literal `bg-black/80`; tint to a deep space hue for consistency.
- `.pixel-progress-fill` animates `width`; fine here but worth a comment noting the deliberate tradeoff.
- Sidebar active state uses `border-l-2` (under detector threshold) — consistent with the theme, leave it.
- Empty states are good but state the absence ("No counters yet"); they could teach the first action more actively.

## Questions to Consider

- Is the 5–6px text a deliberate "you're meant to zoom" choice, or an oversight? (It reads as oversight.)
- Could the ambient rocket/astronaut motion become a reward moment instead of a constant, so it lands harder and respects reduced-motion?
- What would a confident, themed delete-confirmation look like instead of the browser's gray box?
