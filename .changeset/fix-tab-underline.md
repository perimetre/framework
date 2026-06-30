---
'@perimetre/ui': patch
---

fix(ui): align Tabs active underline across tabs when labels wrap

Stretch tab triggers to equal height and bottom-align their labels so every underline rests on the list baseline, instead of floating above it when a sibling tab's text wraps to two lines.
