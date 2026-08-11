---
'@perimetre/ui': patch
---

fix(FieldBaseDropdown): give the options panel a z-index so it can be tapped

The panel is portalled to the end of `<body>` and carried `z-index: auto`, so
any page section with an explicit z-index painted over it — the options were
visible but not hit-testable, and taps landed on the section instead. It only
surfaced on short viewports, where floating-ui has no room below the trigger and
flips the panel up into the content above it, so it read as a mobile/touch-only
bug.
