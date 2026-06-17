---
'@perimetre/tokens': minor
'@perimetre/ui': minor
---

Add a brand-themeable `tone` variant to `Badge` — a generic, project-agnostic semantic color scale (`neutral`, `info`, `success`, `warning`, `danger`). The design system stays domain-neutral; consumer projects alias the tones to their own labels (e.g. `info`="New", `warning`="Coming soon", `danger`="Discontinued", `neutral`="Unavailable").

- **`@perimetre/tokens`** — new semantic `color/badge/*-bg` and `*-fg` tokens (one bg/fg pair per tone: `neutral`, `info`, `success`, `warning`, `danger`). Acorn ships neutral, undesigned defaults; brands recolor per-tone from their own palette. Stelpro overrides `info` and `danger` (from Figma Badges/Tags `554:5225`) and inherits the neutral defaults for `neutral`/`success`/`warning`. Stelpro's `radius.badge: none` override is dropped so its badges inherit the semantic pill (`radius.full`).
- **`@perimetre/ui`** — `Badge` gains an optional `tone` CVA variant wired to the new `--pui-color-badge-*` tokens (themeable per brand). Omit `tone` for the existing color-agnostic badge driven by `className`. Stelpro's brand override adopts the Figma Caption type ramp (14px / regular / 1.5) with fixed 6px/10px padding. Existing usage is unchanged — `tone` is opt-in.
