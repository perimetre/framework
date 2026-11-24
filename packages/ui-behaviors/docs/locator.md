# Locator

`@perimetre/ui-behaviors/locator`

Links a list of places to their markers on a map: highlighting, selection, which places the map shows, and how far each is from an origin. It draws no map. The project, or an adapter such as the [Google Maps one](google.md), puts a map in `LocatorMap`.

```tsx
import {
  Locator,
  LocatorItem,
  LocatorItemTrigger,
  LocatorList,
  LocatorMap,
  LocatorMarker,
  sortByDistance
} from '@perimetre/ui-behaviors/locator';

const nearest = sortByDistance(stores, origin);

<Locator origin={origin} resultsMessage={(count) => `${count} stores`}>
  <LocatorList render={<ul />}>
    {nearest.map((store) => (
      <LocatorItem
        key={store.id}
        position={store.position}
        render={<li />}
        value={store.id}
      >
        {(state) => (
          <>
            <LocatorItemTrigger>{store.name}</LocatorItemTrigger>
            {state.distance !== undefined && (
              <span>{formatDistance(state.distance)}</span>
            )}
          </>
        )}
      </LocatorItem>
    ))}
  </LocatorList>

  <LocatorMap aria-label="Stores on a map">
    {/* a map, with a LocatorMarker for each store */}
  </LocatorMap>
</Locator>;
```

## Composition

```text
Locator
├── LocatorList
│   └── LocatorItem            (one per place)
│       └── LocatorItemTrigger (optional)
└── LocatorMap
    └── LocatorMarker          (one per place, positioned by the map)
```

- **`Locator`** owns the state.
- **`LocatorList`** holds the places and announces when they change.
- **`LocatorItem`** is one place in the list. It takes the place's `value` and `position`.
- **`LocatorItemTrigger`** is a button that selects its place. Inside an item it takes the item's `value`.
- **`LocatorMap`** is where the map goes. Name it with `aria-label`.
- **`LocatorMarker`** is a place's marker: a button with the same `value` and `position` as its item. The map positions it.

A place is tied together by its `value`: the item and the marker with the same `value` are the same place.

## What it does

|           | From the list                                                    | From the map                                                |
| --------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Highlight | Hovering an item, or moving focus into it, highlights its marker | Hovering or focusing a marker highlights its item           |
| Select    | Pressing the trigger selects the marker                          | Pressing a marker selects the item and scrolls it into view |

Bringing a place selected from the list into view on the map is the map renderer's job, since only it can move the map. The Google Maps adapter does it.

## Three ways to build the list

**Select in place, with the trigger.** As in the example above. Use it when choosing a place shows it on the map and the item holds other content, like opening hours or a link.

**Select in place, with UI SDK's `Listbox`.** Use it when each item is only a choice. Arrow keys then move through the places and highlight their markers. Render the locator's parts as the listbox's, and share one value:

```tsx
const [selected, setSelected] = useState<string | null>(null);

<Locator onValueChange={setSelected} value={selected}>
  <LocatorList
    render={
      <Listbox
        aria-label="Stores"
        onValueChange={setSelected}
        value={selected}
      />
    }
  >
    {stores.map((store) => (
      <LocatorItem
        key={store.id}
        position={store.position}
        render={<ListboxItem value={store.id} />}
        value={store.id}
      >
        {store.name}
      </LocatorItem>
    ))}
  </LocatorList>
  …
</Locator>;
```

The elements then carry the listbox's `data-slot` values (`listbox`, `listbox-item`), with the locator's state attributes beside them.

**Links.** Use it when each place has a page of its own. Leave the trigger out and put a link in the item. Hovering and focusing still highlight the marker. Pressing a marker selects the place; navigate from `onValueChange` if a marker should go to the page too.

## Options

Props of `Locator`, next to the element's own.

| Prop                  | Type                        |                                                                            |
| --------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `value`               | `string \| null`            | The selected place. Pass it to control it                                  |
| `defaultValue`        | `string \| null`            | The place selected at first, when uncontrolled                             |
| `onValueChange`       | `(value, details) => void`  | Runs when a place wants to be selected                                     |
| `onHighlightedChange` | `(value, details) => void`  | Runs when a place is highlighted, or stops being                           |
| `bounds`              | `LocatorBounds \| null`     | The map's visible area. Pass it to control it                              |
| `defaultBounds`       | `LocatorBounds \| null`     | The visible area before a map reports one                                  |
| `onBoundsChange`      | `(bounds, details) => void` | Runs when the map's visible area changes. Filter or reload the places here |
| `origin`              | `LocatorPosition \| null`   | Where distances are measured from                                          |
| `resultsMessage`      | `(count) => string`         | What a screen reader hears when the places in the list change              |
| `controller`          | `LocatorController`         | From `createLocatorController()`                                           |

`LocatorItem` and `LocatorMarker` take `value: string` and `position: { lat, lng }`.

`details.reason` for the selection is `item-press`, `marker-press` or `imperative`. For the highlight it is `item-hover`, `item-focus`, `marker-hover`, `marker-focus` or `imperative`. For the bounds it is `map-move`.

Types: `LocatorPosition` is `{ lat, lng }` in degrees. `LocatorBounds` is `{ north, south, east, west }` in degrees.

## State in render functions

`className`, `style` and `children` of these parts may be functions of:

| Part                 | State                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `LocatorItem`        | `selected`, `highlighted`, `inView`, `distance` (metres from `origin`, or `undefined` without one) |
| `LocatorItemTrigger` | `selected`                                                                                         |
| `LocatorMarker`      | `selected`, `highlighted`, `inView`                                                                |

## Helpers

Plain functions, for sorting and filtering the data before it is rendered.

```ts
import {
  distanceBetween,
  isInBounds,
  sortByDistance
} from '@perimetre/ui-behaviors/locator';

distanceBetween(a, b); // metres, in a straight line over the earth's surface
isInBounds(position, bounds); // whether a point is in a visible area
sortByDistance(stores, origin); // a copy, nearest first
sortByDistance(stores, origin, (store) => store.coordinates); // when the position has another name
```

To show only the places on the map, keep the bounds from `onBoundsChange` and filter with `isInBounds`. Filter the list only. Keep a marker for every place, or a place that leaves the map loses its marker and panning back can never show it again.

## Controller

```tsx
import {
  createLocatorController,
  useLocatorController
} from '@perimetre/ui-behaviors/locator';

const stores = createLocatorController();

<Locator controller={stores}>…</Locator>;

stores.setValue('montreal');
stores.setHighlighted('quebec');
stores.setBounds({ north: 47, south: 45, east: -70, west: -76 });
stores.getValue();
stores.getHighlighted();
stores.getBounds();
const stop = stores.subscribe(() => {
  /* the selection, highlight or bounds changed */
});
```

Inside a `Locator`, `useLocatorController()` returns its controller without one being passed. This is how a map renderer written as a component reaches the locator.

A controller only works once its `Locator` has rendered. Before that its reads return `undefined` and its other methods do nothing, as with every UI SDK controller.

## The user's position

```tsx
import { useGeolocation } from '@perimetre/ui-behaviors/locator';

const location = useGeolocation();

<button onClick={location.request}>Use my location</button>;
<Locator origin={location.position}>…</Locator>;
```

Nothing is asked until `request` is called. Call it from a button press, since browsers expect a permission prompt to follow a user's action. `status` is `idle`, `loading`, `success`, `denied` or `unavailable`. It takes the browser's own options, like `enableHighAccuracy` and `timeout`.

## Using another map

Any map that can show an HTML element as a marker works:

1. Create the map inside `LocatorMap`.
2. When the map comes to rest, call `setBounds` with its visible area. Not on every frame of a pan.
3. For each place, render a `LocatorMarker` into the element the map positions (in React, with `createPortal`).
4. `subscribe` to the controller, and when the selected place is outside the visible area, pan to it.

## Styling

| Part                 | `data-slot`            | State                                                               |
| -------------------- | ---------------------- | ------------------------------------------------------------------- |
| `Locator`            | `locator`              |                                                                     |
| `LocatorList`        | `locator-list`         |                                                                     |
| `LocatorItem`        | `locator-item`         | `data-selected`, `data-highlighted`, `data-in-view`                 |
| `LocatorItemTrigger` | `locator-item-trigger` | `data-selected`, `aria-current`                                     |
| `LocatorMap`         | `locator-map`          |                                                                     |
| `LocatorMarker`      | `locator-marker`       | `data-selected`, `data-highlighted`, `data-in-view`, `aria-current` |

`data-in-view` is absent everywhere until a map reports its visible area. The behaviour sets no inline styles.

## Accessibility

- The list is the accessible equivalent of the map. Every place with a marker must be in the list, and the list works with no map at all, or before one loads.
- Markers and triggers are native buttons, with `aria-current="true"` on the selected place. Give each marker a name: its text, or an `aria-label` when it holds only an icon.
- When the places in the list change, after a search or a pan, `LocatorList` announces `resultsMessage(count)` through UI SDK's shared live region, once the list has settled. Without `resultsMessage` nothing is announced, so pass it whenever the list can change.

## Not included

- No map, routes, drawing or clustering.
- No search for places. The places are the project's own data.

## Not verified

Tested in desktop Chrome with a stand-in for the map and simulated hover events. Not tested with a screen reader. `useGeolocation` type-checks but was not run in a browser.
