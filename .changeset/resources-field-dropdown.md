---
'@perimetre/ui': minor
---

Add `FieldDropdown` / `FieldBaseDropdown` — a pure select-from-list field built on `@headlessui/react` Listbox (no text input), supporting single- and multi-select. Ships its own brand variants: Acorn matches the existing autocomplete/select fields, and the OIQ Place pour toi brand layers a themed look — square corners, bold 3px borders, brand-purple focus/panel border (no focus glow ring), the panel flush with the trigger, a fade-and-slide-down open animation (tw-animate-css, respecting `prefers-reduced-motion`), a hard offset panel shadow, and purple item hover/selected fills — via dropdown-scoped tokens plus minimal class overrides.

Also teach the `cva`/`twMerge` config about the custom design-token utilities (`rounded-pui-*`, `shadow-pui-*`) so they dedupe against Tailwind built-ins (e.g. `rounded-pui-input` vs `rounded-none`); previously both survived a merge and the winner depended on stylesheet order, so brand overrides couldn't reliably beat the acorn base.
