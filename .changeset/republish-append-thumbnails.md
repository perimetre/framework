---
'@perimetre/ui': minor
---

Publish the `ImageCarousel` `appendThumbnails` prop. The prop was added to the source in 16.9.0, but a version-number collision meant that release never shipped it — this bumps a fresh version so it becomes installable. `appendThumbnails` renders extra content inside the thumbnails container, after the mapped slide thumbnails, so consumers can add a custom inline tile (e.g. a "view in 3D" trigger) alongside the thumbnails without it becoming a swipeable slide. Rendered only when `showThumbnails` is true; carries no `scrollTo` behavior (the consumer wires its own `onClick`). Backward-compatible — callers that don't pass it are unaffected.
