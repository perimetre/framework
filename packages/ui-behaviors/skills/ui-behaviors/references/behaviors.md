# Build a component from the behaviours

These have the shape of UI SDK's own behaviours: `create<Thing>(context, options)`, called once in a primitive's `api`. "Compose Behaviors" and "Customize a Behavior" in UI SDK's `docs/core.md` are the method. This page is the catalogue.

Each reads state through a function and asks for a change through `set`, so your primitive decides what the change means: `set: (value, details) => change('value', value, details)`.

| Behaviour               | Import from `…/behaviors/` | What it does                                                     | Used by    |
| ----------------------- | -------------------------- | ---------------------------------------------------------------- | ---------- |
| `createFollowPoint`     | `follow-point`             | A point on a surface: a mouse hovers, a finger holds, keys nudge | `magnify`  |
| `createScrub`           | `scrub`                    | A sideways drag or scroll as a progress from 0 to 1              | `sequence` |
| `createAutoProgress`    | `auto-progress`            | A progress that moves on its own, frame by frame                 | `sequence` |
| `createLinkedHighlight` | `linked-highlight`         | One highlighted item, shared by every part that shows it         | `locator`  |

Options and return values are in each one's JSDoc. Its story builds something other than the primitive that uses it: a spotlight, a before and after, a timer, a chart with a legend. The primitive's source is the full example: `node_modules/@perimetre/ui-behaviors/src/primitives/sequence/index.ts`.

## What gets missed

**createFollowPoint**

- The point is a pair of fractions from 0 to 1 that changes on every pointer move. List its keys in the primitive's `live`.
- Whatever showed the point is the only thing that hides it. A mouse leaving never hides what the keyboard showed.
- A component needs the trigger (`toggle`, `keydown`, `blur`). Without one a keyboard cannot reach the point.

**createScrub**

- It has no keyboard. Pair it with buttons that step the same value (UI SDK's `bindRepeat`, as `sequence` does), or a slider handle with `stepFromKey` and `stepBy` from `@ui-sdk/core/number`.
- Escape puts the progress back where the drag started. A vertical swipe still scrolls the page.
- It reports `swipe` and `scroll`, the names a carousel uses.

**createAutoProgress**

- It follows the `playing` state. Whatever sets that state starts and stops the frames.
- Call `allow()` when a person asks for playback, in the toggle's `press` and in a controller's `play`. Otherwise reduced motion keeps it stopped.
- `set` gets the next progress before wrapping or clamping. Pass it through `normalizeProgress(value, loop)`.

**createLinkedHighlight**

- `leave` does nothing when another item already took the highlight, so a pointer moving between items never passes through "none".
- The reasons are yours. Use `item-hover` where it fits and declare the others in the `on<Key>Change` type.
- List the key in `live` and write each part's attribute with `live()`.

## Utilities

All of these run on a server.

| Utility                                      | Import from `…/utilities/` | What it does                                                 |
| -------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| `sortByDistance(places, origin, positionOf)` | `geo`                      | A copy of the places, nearest first                          |
| `distanceBetween(from, to)`                  | `geo`                      | Metres between two points, over the sphere                   |
| `isInBounds(position, bounds)`               | `geo`                      | Whether a point is inside a map's area                       |
| `requestGeolocation(options?)`               | `geolocation`              | The user's position as a result value                        |
| `accessibleIcon(props)`                      | `accessible-icon`          | What an icon renders. In React, use `Icon` from `react/icon` |
| `visuallyHidden`                             | `accessible-icon`          | The `style` attribute that hides a part from sight only      |

## A behaviour that is missing

1. Check "All Behaviors" in UI SDK's `docs/core.md` first. The nearest to this package are `bindDrag`, `bindHold`, `bindRepeat`, `createArea`, `createMove`, `createViewport` and `createSwipeActions`.
2. Write it in the app while one component uses it.
3. When a second project needs it, move it here with the `create-ui-behavior` skill in the framework repo.
