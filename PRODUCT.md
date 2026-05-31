# Product

## Register

product

## Users

A single self-directed individual (the app's owner) running their personal life like a space mission. They check in daily or weekly to log money, tick off habit counters, nudge long-range dreams forward, plan tasks, and collect rewards. Context of use: private, personal, often on both phone (bottom-nav, single-column) and desktop (sidebar, multi-column). They are motivated by progress, streaks, and play, not by spreadsheets.

## Product Purpose

A gamified personal dashboard that reframes everyday self-management as a space mission. It unifies five surfaces under one world:

- **Mission Control (dashboard)** — at-a-glance status: mission-day progress, habit counters, finance telemetry, long-range dreams.
- **Finance Log** — income/expense/investment tracking, CSV import, multi-year history.
- **Mission Goals** — counters, dreams, and category goals.
- **Mission Planner** — a kanban board (plans, buckets, tasks, subtasks, recurrence, labels, reminders) modeled on Microsoft/Teams Planner.
- **Trophy Case** — rewards, badges, a reward wheel.

Success is sustained engagement: the owner keeps coming back because tracking feels like play, and the interface makes progress visible and satisfying.

## Brand Personality

Retro, motivating, playful. Voice is upbeat mission-control radio chatter ("MISSION DAY 151 / 365", "TELEMETRY", "TROPHY CASE") rendered in an 8-bit arcade aesthetic. It should feel like a beloved handheld console from the 80s/90s crossed with a NASA flight dashboard: nostalgic, disciplined, and a little adventurous. Emotional goals: motivation, momentum, delight, pride in progress.

## Anti-references

- Generic SaaS dashboards (Linear/Notion/Vercel clones): clean sans-serif, lots of whitespace, restrained grayscale. This product is the opposite by design.
- Flat corporate Material / Bootstrap admin panels.
- Enterprise BI tools (dense, joyless data grids).
- Skeuomorphic "realism" that isn't pixel art. The retro here is deliberately low-res 8-bit, not glossy 3D.

## Design Principles

1. **The theme is the feature.** Commit fully to the 8-bit space-mission world. Half-measures read as a broken SaaS app, not a stylized one.
2. **One coherent world across every screen.** Same vocabulary, same pixel components, same mission metaphor on all five surfaces. Consistency is the identity.
3. **Motivation through play.** Progress bars, badges, counters, sounds, and reward moments exist to make self-management feel rewarding. Gamification is the point, not decoration.
4. **Legibility is non-negotiable, even in retro.** The aesthetic never wins over readability. Pixel fonts stay above their legible floor; secondary text meets WCAG AA contrast.
5. **Personal, not corporate.** It is one person's mission console, not a team tool. Warmth, character, and a sense of ownership beat enterprise polish.

## Accessibility & Inclusion

- **Contrast:** target WCAG AA for text. Secondary-text neutrals are tuned to clear ~4.5:1 on the near-black space background (see DESIGN.md gray ramp).
- **Type floor:** "Press Start 2P" never renders below ~8px (it is illegible smaller); longer prose prefers the more legible "VT323".
- **Zoom:** a built-in 100/125/150% UI zoom control accommodates users who want larger targets.
- **Reduced motion (known gap):** ambient background animation (rocket, astronaut, sparkles, twinkle, pulse) currently runs unconditionally. It should be gated behind `prefers-reduced-motion: reduce` for vestibular-sensitive users.
- **Touch targets:** mobile bottom-nav and counter buttons are sized for thumbs; keep new interactive controls at comfortable tap sizes.
