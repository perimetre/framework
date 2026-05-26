---
'@perimetre/ui': patch
---

Fix MagnifyImage lens revealing the unmagnified image underneath when the source image has transparency — the lens now defaults to a white background, overridable via `magnifierClassName`. Also restore free cursor movement: the lens follows the cursor all the way to the container edges and is allowed to visually extend beyond the container instead of being clamped and clipped.
