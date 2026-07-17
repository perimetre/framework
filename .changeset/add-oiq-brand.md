---
'@perimetre/tokens': minor
'@perimetre/ui': minor
---

Add "OIQ - Place pour toi" (`oiq-place-pour-toi`) brand with its color system.

Introduces the OIQ brand across the token and component packages: a purple
12-step primary scale (hero `#921acc`), an OIQ neutral scale, brand-blue
borders/headings, red eyebrows, pale-green secondary buttons, OIQ's background
palette (page, dark, accent-light), square button corners, and a two-family
type system (Antique Olive Nord D for headings H1–H5, Roboto for H6 and body) —
all sourced from the OIQ PPT Design System Figma. Registered in the token build,
`$themes`/`$metadata`, the `@perimetre/ui` brand registry, the Tailwind
`pui-oiq-place-pour-toi` custom variant, and Ladle.

Adds a `Button.oiq-place-pour-toi.brand.ts` variant implementing the OIQ primary and
secondary buttons (Figma nodes 191:608 and 428:7325): square corners, the
signature hard offset drop shadow (solid black, no blur), and a press-down
interaction on hover/press/focus (the button slides toward its shadow while the
shadow shrinks), plus a solid focus frame and disabled styling. Primary is a
filled purple button; secondary is white with a 3px purple border and purple
label whose border darkens on hover/press.

Adds a new brand-aware `Tag` component (`@perimetre/ui/Tag`) — a compact chip
for filters/selections with `small`/`large` sizes, `selected`/`disabled`
visual states, and an optional dismiss (×) button (Figma node 644:452). Fully
token-driven via new semantic `tag-*` color tokens (`--pui-color-tag-bg`,
`-bg-selected`, `-bg-disabled`, `-fg`, `-fg-disabled`) with Acorn defaults;
OIQ recolors them (pale-lime default, brand-green selected) and renders square
via its badge radius — no per-brand CVA needed.

Also adds new semantic tokens to the shared token API, each with a neutral
Acorn default that brands can override:

- Surfaces: `--pui-color-surface-dark`, `--pui-color-surface-accent`
- Foreground: `--pui-color-fg-heading`, `--pui-color-fg-eyebrow`,
  `--pui-color-fg-inverse`
- Border: `--pui-color-border-dark`
- Button states: `--pui-color-button-focus`, `--pui-color-button-focus-border`,
  `--pui-color-button-secondary-focus`,
  `--pui-color-button-secondary-focus-border`,
  `--pui-color-button-secondary-inactive`,
  `--pui-color-button-secondary-inactive-label`

Note: these button focus/disabled tokens are wired into the token layer, but
the `Button` component does not yet render focus/active/disabled states — a
follow-up component change is needed for them to take visual effect.

All are bridged to Tailwind (`pui:bg-pui-surface-dark`, `pui:text-pui-fg-heading`,
`pui:border-pui-border-dark`, etc.).
