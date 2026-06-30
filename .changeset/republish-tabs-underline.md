---
'@perimetre/ui': patch
---

fix(ui): align Tabs active underline across tabs when labels wrap

Stretch tab triggers to equal height and bottom-align their labels so every underline rests on the list baseline, instead of floating above it when a sibling tab's text wraps to two lines.

The source fix landed in #161 but its changeset was consumed without bumping the version, so it never shipped in a published build. This changeset re-triggers a release (16.8.0 → 16.8.1) so the fix reaches consumers.
