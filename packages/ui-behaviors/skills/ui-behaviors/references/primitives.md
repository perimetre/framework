# Build a component from a primitive

Render a primitive's parts in the app with `createParts`, as UI SDK's `docs/rendering.md` describes. The only difference is where the primitive comes from:

```tsx
'use client';

import { sequence } from '@perimetre/ui-behaviors/primitives/sequence';
import { createParts } from '@ui-sdk/react/primitive';

const {
  Next: ProductSpinNext,
  Previous: ProductSpinPrevious,
  Root: ProductSpin,
  Viewport: ProductSpinViewport
} = createParts(sequence, {
  next: 'button',
  previous: 'button',
  root: 'div',
  viewport: 'div'
});
```

Options, reasons, state attributes and CSS variables are in each primitive's JSDoc. This page lists the parts and what gets missed.

## magnify

A lens that magnifies whatever is on a surface. A mouse hovers, a finger holds, and the trigger gives keyboards the same lens.

| Slot           | Tag      | What it is                                               |
| -------------- | -------- | -------------------------------------------------------- |
| `root`         | any      | The surface                                              |
| `trigger`      | `button` | Shows and hides the lens for keyboards                   |
| `lens`         | any      | Present only while active                                |
| `lens-content` | any      | A copy of the surface's content, scaled by the primitive |

- Give the root `position: relative`, and the lens a size, a shape and a background.
- Render the same content twice: on the surface and inside `lens-content`. The lens is `aria-hidden` and `inert`, so nothing is read twice.
- The trigger is required and needs a name. Without it a keyboard has no lens.

Story: `src/primitives/magnify/magnify.stories.tsx`.

## sequence

A dense run of frames, like a product turning, as one progress from 0 to 1. It draws nothing. The app draws the frame in one of two ways:

- **In CSS**, from `--sequence-progress` on the root. The server's HTML is already right.
- **In `onValueChange`**, for a canvas or a frame picked by index: `Math.round(value * (frames - 1))`. Load a sharper frame in `onValueCommit`, which runs once an interaction ends.

| Slot          | Tag      | What it is                                        |
| ------------- | -------- | ------------------------------------------------- |
| `root`        | any      | Owns the state                                    |
| `viewport`    | any      | What a pointer drags. One image to assistive tech |
| `previous`    | `button` | Steps back, and keeps stepping while held         |
| `next`        | `button` | Steps forward, and keeps stepping while held      |
| `play-toggle` | `button` | Starts and stops playback                         |

- `previous` and `next` are required. They are the only way through the sequence for keyboards and screen readers.
- Give the viewport an `aria-label`.
- Label `play-toggle` from `playing` in its state: `{({ playing }) => (playing ? t('pause') : t('play'))}`.
- Playback set to start stays stopped when the user prefers reduced motion. The toggle still starts it.
- For a handful of distinct stills, use UI SDK's looping `Carousel`.

Story: `src/primitives/sequence/sequence.stories.tsx`.

## locator

A list of places linked to their markers on a map. Hover or focus on one side highlights the other, and selecting on one side selects on both. It draws no map.

| Slot           | Tag      | What it is                                                           |
| -------------- | -------- | -------------------------------------------------------------------- |
| `root`         | any      | Owns the state                                                       |
| `list`         | any      | Holds the places. Announces `resultsMessage(count)` when they change |
| `item`         | any      | One place. Props: `value`, `position`                                |
| `item-trigger` | `button` | Selects its place                                                    |
| `map`          | any      | Where the map goes                                                   |
| `marker`       | `button` | A marker on a map the app draws. Props: `value`, `position`          |

- Name the root and the map.
- Every place with a marker belongs in the list. The list is the map's accessible equivalent.
- Leave `item-trigger` out when each place links to a page of its own.
- An item's `children` function gets `{ selected, highlighted, inView, distance }`. `distance` is metres from `origin`.
- Sort the places before rendering, on the server when the origin is known there: `sortByDistance(stores, origin, (store) => store.position)` from `utilities/geo`.
- For the user's position, call `requestGeolocation()` from `utilities/geolocation` in a press handler. It resolves `{ ok: true, position }` or a `GeolocationError` with a `reason`, and never throws. Narrow with `'ok' in result`.
- Whatever draws the map gets the locator's controller: `createLocatorController()`, passed to the root's `controller` and to the map code. It reports the visible area with `controller.setBounds(bounds, { reason: 'map-move' })` each time the map comes to rest. [google.md](google.md) does this for Google Maps.

Story: `src/primitives/locator/locator.stories.tsx`.
