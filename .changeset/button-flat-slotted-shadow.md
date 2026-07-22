---
'@perimetre/ui': minor
---

Button: add a `flat` (text-only) variant and a slotted shadow colour for OIQ.

- New `flat` variant — a text-only button (no fill/border/shadow), implementing
  the OIQ Figma Button/Text spec (node 720:333). Acorn gets a neutral default.
- The OIQ button's hard offset shadow colour is now a slot
  (`--pui-button-shadow-color`, default black). Recolour it — e.g. the "on
  black" purple-shadow variant — with the new `pui:button-shadow-*` functional
  utility (reads the `--color-*` theme; arbitrary `pui:button-shadow-[#…]` also
  works), or from a consumer app via a `[--pui-button-shadow-color:…]`
  arbitrary property.
