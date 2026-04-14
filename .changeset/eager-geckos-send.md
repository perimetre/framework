---
'@perimetre/ui': minor
---

Add MagnifyImage component — wraps any image element and overlays a circular magnifying lens on hover/tap. Supports lensRadius, scale, className, and magnifierClassName props. Lens position is driven by CSS custom properties updated via rAF, bypassing React state for smooth per-frame tracking.
