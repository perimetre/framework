---
'@perimetre/tokens': minor
'@perimetre/ui': minor
---

Implement Stelpro primary and secondary buttons from the STEL Figma design system.

- **tokens**: new semantic tokens `--pui-color-button-inactive-label` (disabled button label), `--pui-color-button-secondary-hover`, `--pui-color-button-secondary-active`, and `--pui-color-button-secondary-label` (all default to existing Acorn values). Stelpro overrides: slate primary fills for default/hover/active/disabled states, white `on-primary` label, navy secondary hover/active fills with dark `text-primary` label, `radius-button: 0`, and `typo-button` weight/tracking/transform (Aktiv Grotesk Regular, no uppercase).
- **ui**: bridge the new button tokens to Tailwind; Stelpro Button brand variants now implement the Figma spec — min-height 44px, 8px/20px padding, 10px gap, Body/md typography, a 1px red inset focus frame, full hover/active/disabled state classes for `primary`, and a `secondary` variant (white fill, navy hover/active with white frame, focus state inverting to the primary dark fill).
