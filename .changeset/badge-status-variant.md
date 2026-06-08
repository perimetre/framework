---
'@perimetre/tokens': minor
'@perimetre/ui': minor
---

Add a brand-themeable `status` variant to `Badge` for product status tags (`new`, `soon`, `discontinued`, `unavailable`).

- **`@perimetre/tokens`** — new semantic `color/badge/*-bg` and `*-fg` tokens (one bg/fg pair per status). Acorn ships neutral, undesigned defaults; brands override per-status from their own palette. Stelpro overrides `new` and `discontinued` (from Figma Badges/Tags `554:5225`) and inherits the neutral defaults for `soon`/`unavailable`. Stelpro's `radius.badge: none` override is dropped so its badges inherit the semantic pill (`radius.full`).
- **`@perimetre/ui`** — `Badge` gains an optional `status` CVA variant wired to the new `--pui-color-badge-*` tokens (themeable per brand). Omit `status` for the existing color-agnostic badge driven by `className`. Stelpro's brand override adopts the Figma Caption type ramp (14px / regular / 1.5) with fixed 6px/10px padding. Existing usage is unchanged — `status` is opt-in.
