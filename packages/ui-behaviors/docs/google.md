# Google Places and Maps

`@perimetre/ui-behaviors/google`

The one entry in this package tied to a product. Google Places is the standard for address entry and is used across Périmètre projects, so its wiring lives here once. Nothing else in the package imports from this entry, and a project that does not use it pulls in nothing from Google.

It holds two things:

- **Places autocomplete**: an address field with Google's suggestions, built on UI SDK's `Autocomplete`.
- **Google Maps for the locator**: a map and markers wired to a [`Locator`](locator.md).

## What was verified

Run against Google's real API on 2026-11-24, in desktop Chrome, with `DEMO_MAP_ID`:

- Suggestions load as you type, the attribution shows, and choosing a suggestion returns the place.
- The map and its markers draw. Each marker is a button named by its `title`, takes focus, and selects on click and on Enter.
- Hovering or focusing a marker highlights its list item, and the reverse.
- Selecting a place in the list pans the map to it.

Not verified: a phone, a screen reader, a map ID of your own, and arrow-key movement between markers.

## Installation

```bash
pnpm add @googlemaps/js-api-loader
pnpm add -D @types/google.maps
```

Set the API key once, before anything from this entry renders, with Google's own loader. Language and region are set here too:

```ts
import { setOptions } from '@googlemaps/js-api-loader';

setOptions({
  key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  language: 'fr',
  region: 'CA'
});
```

There is no provider component. Google's script loads the first time a suggestion or a map is needed.

`setOptions` must run in the browser, and only once. In a Next.js app, put it in a module of its own and call it at the top of the client component that uses the Google parts:

```ts
// google.ts
import { setOptions } from '@googlemaps/js-api-loader';

let configured = false;

export const configureGoogle = () => {
  if (configured || typeof window === 'undefined') return;
  configured = true;
  setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '' });
};
```

The key reaches the browser, as every Google Maps key does. Restrict it to your own origins in the Google Cloud console. It needs the **Maps JavaScript API** for the map and the **Places API (New)** for the suggestions.

## Places autocomplete

```tsx
import {
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteLabel
} from '@ui-sdk/react/autocomplete';
import {
  PlacesAttribution,
  PlacesAutocomplete,
  PlacesAutocompleteList
} from '@perimetre/ui-behaviors/google';

<PlacesAutocomplete
  fields={['location', 'formattedAddress']}
  onPlaceSelect={(place) => setOrigin(place.location?.toJSON() ?? null)}
  request={{ includedRegionCodes: ['ca'] }}
>
  <AutocompleteLabel>Address</AutocompleteLabel>
  <AutocompleteInput />
  <AutocompleteContent>
    <AutocompleteEmpty>No addresses found.</AutocompleteEmpty>
    <PlacesAutocompleteList>
      {(suggestion) => (
        <AutocompleteItem
          key={suggestion.value}
          label={suggestion.label}
          value={suggestion.value}
        >
          {suggestion.mainText} <small>{suggestion.secondaryText}</small>
        </AutocompleteItem>
      )}
    </PlacesAutocompleteList>
    <PlacesAttribution />
  </AutocompleteContent>
</PlacesAutocomplete>;
```

- **`PlacesAutocomplete`** is UI SDK's `Autocomplete` with the suggestions wired in. It takes every `Autocomplete` prop except `items`, `filter` and `status`, which it sets. Use UI SDK's own parts inside it, and style them as any other field.
- **`PlacesAutocompleteList`** is `AutocompleteList` holding the current suggestions. Its child is a function that renders one suggestion as an `AutocompleteItem`. Pass the suggestion's `value` and `label` on to the item.
- **`PlacesAttribution`** is the attribution Google requires. Keep it inside the popup.

The field's value is the text, as with any `Autocomplete`: someone may type an address and never choose a suggestion. `onPlaceSelect` runs only when one is chosen, so validate accordingly if a chosen place is required.

### Props

Added to `Autocomplete`'s:

| Prop            | Type                          |                                                                                                                                                    |
| --------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`        | `string[]`                    | Required. The place fields fetched when a suggestion is chosen. They set the price of the request, so ask only for what is used                    |
| `onPlaceSelect` | `(place, suggestion) => void` | Runs with Google's `Place`, once its fields are fetched                                                                                            |
| `onPlaceError`  | `(error, suggestion) => void` | Runs when fetching the place fails                                                                                                                 |
| `request`       | `PlacesRequest`               | Google's own request options: `includedRegionCodes`, `includedPrimaryTypes`, `locationBias`, `locationRestriction`, `language`, `region`, `origin` |
| `debounce`      | `number`                      | How long typing pauses before suggestions load, in milliseconds. `200` by default                                                                  |
| `minLength`     | `number`                      | How many characters are typed before suggestions load                                                                                              |

### A suggestion

| Field                       |                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `value`                     | The place ID                                                                                      |
| `label`                     | The whole suggestion as text. The field is filled with it when chosen                             |
| `mainText`, `secondaryText` | The two parts Google splits it into                                                               |
| `matches`                   | Where the typed text matches `mainText`, as `{ startOffset, endOffset }` ranges, for highlighting |
| `prediction`                | Google's own prediction object                                                                    |

### Attribution

Google requires its attribution wherever its place content shows without a Google map. `PlacesAttribution` renders the text "Google Maps" with `translate="no"`; Google's terms say that text must not be altered or translated. Pass Google's logo as children to show that instead, which Google prefers where there is room. This is the one piece of fixed text in the package.

### With another component

`usePlacesOptions(request, options)` is the loader on its own, for a `Combobox` or a custom field. It returns what UI SDK's `useAsyncOptions` returns (`items`, `status`, `setQuery` and the rest) plus `select(suggestion, fields)`, which fetches the chosen place.

Always fetch the chosen place through `select`. It is what ends Google's billing session; a session token that is reused afterwards is billed as if there were none.

## Google Maps for the locator

```tsx
import {
  Locator,
  LocatorItem,
  LocatorItemTrigger,
  LocatorList
} from '@perimetre/ui-behaviors/locator';
import { GoogleMap, GoogleMapMarker } from '@perimetre/ui-behaviors/google';

<Locator>
  <LocatorList>…</LocatorList>

  <GoogleMap
    aria-label="Stores on a map"
    className="h-96"
    defaultCenter={{ lat: 45.5, lng: -73.57 }}
    defaultZoom={10}
    mapId="…"
  >
    {stores.map((store) => (
      <GoogleMapMarker
        key={store.id}
        position={store.position}
        title={store.name}
        value={store.id}
      >
        <PinIcon />
      </GoogleMapMarker>
    ))}
  </GoogleMap>
</Locator>;
```

- **`GoogleMap`** renders the locator's `LocatorMap` with a Google map in it. Give it a height. Each time the map comes to rest it reports its visible area to the locator, which is what sets `data-in-view` and fires `onBoundsChange`.
- **`GoogleMapMarker`** is a place's marker. It takes the same `value` and `position` as the place's `LocatorItem`, and a `title`. Its children are the marker's looks.

Selecting a place in the list pans the map to it when it is outside the visible area. Pressing a marker selects the place in the list and scrolls it into view.

**Draw a marker for every place, even when the list is filtered.** If the list shows only the places on the map, filter the list and leave the markers alone. Filter the markers too and a place that leaves the map loses its marker, so panning back can never show it again.

### GoogleMap props

Added to `LocatorMap`'s:

| Prop            | Type                     |                                                                                                                          |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `mapId`         | `string`                 | Required. From the Google Cloud console; markers need one. `DEMO_MAP_ID` works for trying things out, not for production |
| `defaultCenter` | `{ lat, lng }`           | Required. Where the map is centred at first                                                                              |
| `defaultZoom`   | `number`                 | Required. Google's zoom level at first                                                                                   |
| `options`       | `google.maps.MapOptions` | Google's own options, passed through when the map is created                                                             |
| `onMapReady`    | `(map) => void`          | Runs once with Google's map, for anything this does not cover                                                            |

These are read once, when the map is created. To move the map later, keep the map from `onMapReady` and call Google's methods on it.

### GoogleMapMarker props

| Prop       | Type           |                                                                 |
| ---------- | -------------- | --------------------------------------------------------------- |
| `value`    | `string`       | Required. The place, as on its `LocatorItem`                    |
| `position` | `{ lat, lng }` | Required                                                        |
| `title`    | `string`       | Required. The marker's name for screen readers, and its tooltip |

`className`, `style` and `children` may be functions of `{ selected, highlighted, inView }`.

### Styling

| Part                          | `data-slot`         | State                                               |
| ----------------------------- | ------------------- | --------------------------------------------------- |
| `GoogleMap`                   | `locator-map`       |                                                     |
| The element Google draws into | `google-map-canvas` |                                                     |
| `GoogleMapMarker`             | `locator-marker`    | `data-selected`, `data-highlighted`, `data-in-view` |

The marker carries the same `data-slot` and state attributes as `LocatorMarker`, so one set of styles covers both.

### Accessibility

- Google's marker is the interactive element, not the content rendered here. Google documents that a clickable marker takes focus with Tab, that arrow keys move between markers, and that Enter activates it. `GoogleMapMarker` therefore renders no button of its own.
- The marker's name comes from `title`.
- The list remains the accessible equivalent of the map. See [Locator](locator.md#accessibility).

### Not included

Routes, drawing, clustering, info windows, and searching Google's places as results. The places are the project's own data.

## Putting it together

A store locator: an address field, a list sorted from the chosen address, and a map. The link between the two halves is one piece of state. The chosen place's location becomes the locator's `origin`, and the same value sorts the list.

```tsx
'use client';

import {
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteLabel
} from '@ui-sdk/react/autocomplete';
import {
  GoogleMap,
  GoogleMapMarker,
  PlacesAttribution,
  PlacesAutocomplete,
  PlacesAutocompleteList
} from '@perimetre/ui-behaviors/google';
import {
  Locator,
  LocatorItem,
  LocatorItemTrigger,
  LocatorList,
  type LocatorPosition,
  sortByDistance
} from '@perimetre/ui-behaviors/locator';
import { useState } from 'react';
import { configureGoogle } from './google';

export const StoreLocator = ({ stores }: { stores: Store[] }) => {
  configureGoogle();

  const [origin, setOrigin] = useState<LocatorPosition | null>(null);
  const sorted = origin ? sortByDistance(stores, origin) : stores;

  return (
    <Locator
      origin={origin}
      resultsMessage={(count) => `${count} stores shown`}
    >
      <PlacesAutocomplete
        fields={['location']}
        onPlaceSelect={(place) => setOrigin(place.location?.toJSON() ?? null)}
      >
        <AutocompleteLabel>Find stores near</AutocompleteLabel>
        <AutocompleteInput />
        <AutocompleteContent>
          <PlacesAutocompleteList>
            {(suggestion) => (
              <AutocompleteItem
                key={suggestion.value}
                label={suggestion.label}
                value={suggestion.value}
              >
                {suggestion.label}
              </AutocompleteItem>
            )}
          </PlacesAutocompleteList>
          <PlacesAttribution />
        </AutocompleteContent>
      </PlacesAutocomplete>

      <LocatorList render={<ul />}>
        {sorted.map((store) => (
          <LocatorItem
            key={store.id}
            position={store.position}
            render={<li />}
            value={store.id}
          >
            <LocatorItemTrigger>{store.name}</LocatorItemTrigger>
          </LocatorItem>
        ))}
      </LocatorList>

      <GoogleMap
        aria-label="Stores on a map"
        className="h-96"
        defaultCenter={{ lat: 45.5, lng: -73.57 }}
        defaultZoom={8}
        mapId="…"
      >
        {stores.map((store) => (
          <GoogleMapMarker
            key={store.id}
            position={store.position}
            title={store.name}
            value={store.id}
          />
        ))}
      </GoogleMap>
    </Locator>
  );
};
```

The list maps over `sorted`; the markers map over `stores`. The stores are the project's own data: Google suggests the address and draws the map, nothing more.
