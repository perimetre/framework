---
'@perimetre/ui': minor
---

Add an optional `appendThumbnails` prop to `ImageCarousel`. It renders extra content inside the thumbnails container, after the mapped slide thumbnails, so consumers can add a custom inline tile (e.g. a "view in 3D" trigger) alongside the thumbnails without it becoming a swipeable slide. Rendered only when `showThumbnails` is true; carries no `scrollTo` behavior (the consumer wires its own `onClick`). Backward-compatible — callers that don't pass it are unaffected.
