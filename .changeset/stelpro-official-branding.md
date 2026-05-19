---
'@perimetre/tokens': minor
'@perimetre/ui': patch
---

Update Stelpro brand tokens to official branding (replacing the manual testing values) and add a new `typo.display-xl` semantic token.

**`@perimetre/tokens`**

- **Stelpro primitive color scales** rebuilt from official Figma variables:
  - `primitive.color.primary.1–12` — full 12-step Stelpro Red scale (`#cc0000` at step 9 / hero)
  - `primitive.color.overlay.1–12` — Stelpro neutral grayscale (pure grays, replacing acorn's sand-tinted neutrals)
- **Stelpro typography** wired from Figma Design System node 11:209:
  - `primitive.font.sans` switched to Aktiv Grotesk
  - Full overrides for `typo.display-xl`, `typo.heading-1..4`, `typo.label`, `typo.large`, `typo.base`, `typo.small`, `typo.tagline` (Eyebrow), and `typo.navbar`
- **New semantic token** `typo.display-xl` added to the base set for hero/display headings larger than `heading-1`. Defaults to existing `heading-1` dimensions, so other brands inherit safely without behavior change.

**`@perimetre/ui`**

- Added `@utility typo-display-xl` so `pui:typo-display-xl` resolves the new token. Falls back to `pui-primitive-font-display` then `pui-primitive-font-sans`.
