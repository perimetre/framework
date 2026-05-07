---
'@perimetre/ui': patch
---

Drop the top border from the first row of the Acorn brand `Accordion`. The component is almost always nested inside a section or card whose own boundary already provides the top edge, so the `first:border-t` rule was visually doubling up. The `--pui-color-border-accordion-first` semantic token is still exported from `tailwind.css`; consumers who want the top border back can add `pui:first:border-t pui:first:border-t-pui-border-accordion-first` via the Accordion's `className` prop.
