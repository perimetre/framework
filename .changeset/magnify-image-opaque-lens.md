---
'@perimetre/ui': patch
---

Fix MagnifyImage lens revealing the unmagnified image underneath when the source image has transparency. The lens now defaults to a white background, which can be overridden via `magnifierClassName`.
