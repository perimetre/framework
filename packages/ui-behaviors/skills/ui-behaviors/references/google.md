# Google Places and Google Maps

| Function                             | Import from `@perimetre/ui-behaviors/…` | What it does                                                                 |
| ------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------- |
| `createPlacesSession(request?)`      | `utilities/google-places`               | Loads place suggestions and keeps Google's session tokens right              |
| `bindGoogleMap(el, options)`         | `behaviors/google-map`                  | Creates a Google map in an element and reports its visible area to a locator |
| `bindGoogleMarker(map, el, options)` | `behaviors/google-map`                  | Puts an element on the map as a place's marker, linked to the locator        |

## Set up

1. Install the optional peers in the app: `@googlemaps/js-api-loader` and, for types, `@types/google.maps`.
2. Set the key once, in client code, before anything loads:

   ```ts
   import { setOptions } from '@googlemaps/js-api-loader';

   setOptions({
     key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
     v: 'weekly'
   });
   ```

   The key is public by design. Restrict it by HTTP referrer in the Google Cloud console.

3. A map with markers needs a map ID from the Google Cloud console.

## An address field

UI SDK's `Autocomplete` is the field, its `useAsyncOptions` debounces the typing, and `createPlacesSession` is the loader. The story is the whole pattern: `src/utilities/google-places/google-places.stories.tsx`.

- **Create the session once per field:** `useState(() => createPlacesSession(() => ({ includedRegionCodes: ['ca'] })))`.
- **Pass `places.load` to `useAsyncOptions`**, and give `Autocomplete` `filter={false}`. Google ranks the results.
- **In `onValueChange`, `details.item` is set when a suggestion was chosen.** Then call `places.select(suggestion, fields)` and do not search again. Otherwise call `setQuery(value)`.
- **`select` returns `{ ok: true, place }` or a `PlaceDetailsError`, never a throw.** Narrow with `'ok' in result`; the error's `cause` holds Google's error. It ends Google's billing session, so call it once per chosen suggestion.
- **`fields` set the price of the request.** Ask only for what the app uses.
- **The field's value is the text.** Someone may type an address and never choose a suggestion. Validate for that.
- **Render "Google Maps" inside the popup**, in an element with `translate="no"`. Google's terms require it wherever suggestions show without a Google map.

## A Google map for the locator

The story is the whole pattern: `src/behaviors/google-map/google-map.stories.tsx`.

- **One controller links both sides.** Create it with `createLocatorController()`, and pass it to the locator root, to `bindGoogleMap` and to each `bindGoogleMarker`.
- **Google owns the element it draws in.** Render an empty element inside the locator's `map` part, give it a size, and render nothing into it.
- **Google's marker is the button.** It takes focus and Enter selects. Never render a `button` inside it, and never use the locator's own `marker` part on a Google map.
- **The pin goes in a detached element.** Create one with `document.createElement('div')`, pass it to `bindGoogleMarker`, and render the pin into it with a portal, once `onReady` has given you the map.
- **Style the pin from that element's attributes:** `data-selected`, `data-highlighted` and `data-in-view`. With Tailwind, `in-data-selected:bg-primary` on a child.
- **`title` is required.** It is the marker's name for screen readers.
- **Pass `onError`** to `bindGoogleMap` and `bindGoogleMarker` to handle a bad key or a blocked script. Without it the failure is reported as an uncaught error, and `onReady` never runs.
- **Bind the marker again when the place moves or is renamed.** In React, an effect that depends on `lat`, `lng`, `title` and `value`.

There is no clustering, no info window and no directions. Use Google's map from `onReady` for those.
