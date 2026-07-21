---
'@perimetre/tokens': minor
'@perimetre/ui': minor
---

Align OIQ "Place pour toi" link & icon tokens with the Figma design system, and add the supporting base semantics.

- **OIQ brand**: `fg.link-primary` now resolves to brand purple (`#921acc`) and `fg.icon` to the darkest neutral (`#0b0b0b`, matching Figma's black icons) instead of the near-black / mid-gray Acorn defaults.
- **Base (all brands)**: added `fg.link-hover` (→ `primary-10`) and `fg.icon-active` (→ `interactive-primary`), exposed as the `pui:text-pui-fg-link-hover` and `pui:text-pui-fg-icon-active` utilities via the Tailwind bridge. OIQ inherits these and resolves them to `#801cad` / `#921acc` through its existing primary-scale override — no per-brand override needed.
