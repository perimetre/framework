---
'@perimetre/ui-behaviors': minor
---

First release. A library of UI behaviours built on UI SDK, for an agent to build an app's own components with. It ships no styles, and everything but `Icon` is framework-free.

- Behaviours shaped like UI SDK's own: `createFollowPoint`, `createScrub`, `createAutoProgress`, `createLinkedHighlight`, and `bindGoogleMap` and `bindGoogleMarker` for a Google map.
- Primitives built from them, rendered in the app with `createParts`: `magnify`, `sequence`, `locator`. Each declares its actions for UI SDK's agent bridge.
- Utilities that run on a server too: `accessibleIcon`, `sortByDistance`, `distanceBetween`, `isInBounds`, `requestGeolocation`, `createPlacesSession`.
- `Icon`, an accessible wrapper for svg icons.
- One entry per folder and no root import, like `@perimetre/ui-behaviors/primitives/magnify`.
- A skill for agents, shipped inside the package at `skills/ui-behaviors/`.
