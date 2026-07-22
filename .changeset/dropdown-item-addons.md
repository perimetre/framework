---
'@perimetre/ui': minor
---

FieldDropdown/FieldBaseDropdown: options can now carry per-item leading and trailing slots via the `itemLeading`/`itemTrailing` render props (keyed on the option's `{ selected, focus, disabled }` state), mirroring the field's `leading`/`trailing` addons. Options lay out as a `justify-between` row (leading + label, then trailing). FieldDropdown defaults `itemTrailing` to a check on the selected option (matches the design system); pass your own to override for selected or unselected items.
