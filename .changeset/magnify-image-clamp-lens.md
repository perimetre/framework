---
'@perimetre/ui': patch
---

Fix `MagnifyImage` lens being clipped at container edges. The lens center is now clamped to `[lensRadius, size - lensRadius]` so the full circle stays inside the container regardless of cursor position.
