---
'@perimetre/tokens': minor
'@perimetre/ui': minor
---

Implement Stelpro Accordion from the STEL Figma design (Menu/Accordion).

- **tokens**: Stelpro overrides — `fg-default`/`fg-body` → overlay-11 (#2E2E2E, Figma `color/text/primary`), `typo-accordion-title` → Body/lg (Aktiv Grotesk Regular 20 / 150%).
- **ui**: new `Accordion.stelpro.brand.ts` — flat gray (`bg-subtle`) item cards with no dividers and 12px gaps, 12px/16px trigger padding, 24px icon box (dark when closed, brand red when open), and a white answer panel with 12px/32px padding.
