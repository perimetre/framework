import { importLibrary } from '@googlemaps/js-api-loader';
import type { LocatorController } from '../../primitives/locator/index.js';
import { type GeoPosition, isInBounds } from '../../utilities/geo/index.js';

/** How `bindGoogleMap` creates the map. */
export type BindGoogleMapOptions = {
  /** Where the map is centred at first. */
  center: GeoPosition;
  /** The locator to report the visible area to. */
  locator: GoogleMapLocator;
  /**
   * The map ID from the Google Cloud console. Markers need one. It cannot
   * change once the map exists.
   */
  mapId: string;
  /** Runs once with Google's map, to bind markers to it and for anything else. */
  onReady?: (map: google.maps.Map) => void;
  /** Google's own map options, passed through when the map is created. */
  options?: Omit<google.maps.MapOptions, 'center' | 'mapId' | 'zoom'>;
  /** How far the map is zoomed in at first, as Google's zoom level. */
  zoom: number;
};

/**
 * The locator a Google map is linked to: a `LocatorController`. Its reads
 * return `undefined` and its writes do nothing until the locator's root has
 * rendered, which these types say out loud.
 */
export type GoogleMapLocator = {
  [Method in keyof LocatorController]: (
    ...args: Parameters<LocatorController[Method]>
  ) => ReturnType<LocatorController[Method]> | undefined;
};

/**
 * Creates a Google map in an element and links it to a locator: each time
 * the map comes to rest, it reports its visible area with the reason
 * `map-move`. Returns a cleanup. Give the element a size.
 *
 * The element is Google's from here on, so pass one the framework renders
 * nothing into: an empty `div` inside the locator's `map` part.
 *
 * Set the API key once with `setOptions` from `@googlemaps/js-api-loader`
 * before this runs.
 * Story: `src/behaviors/google-map/google-map.stories.tsx`, shipped with the package, shows
 * the locator with a Google map and its markers.
 * @param el - The empty element the map is drawn in
 * @param options - Where the map starts, and the locator it reports to
 */
export const bindGoogleMap = (
  el: HTMLElement,
  options: BindGoogleMapOptions
) => {
  let cancelled = false;
  let idle: google.maps.MapsEventListener | undefined;

  void importLibrary('maps').then(({ Map }) => {
    if (cancelled) return;
    const map = new Map(el, {
      ...options.options,
      center: options.center,
      mapId: options.mapId,
      zoom: options.zoom
    });

    // `idle` fires once a pan or zoom has finished, and after the first draw.
    idle = map.addListener('idle', () => {
      options.locator.setBounds(map.getBounds()?.toJSON() ?? null, {
        reason: 'map-move'
      });
    });

    options.onReady?.(map);
  });

  return () => {
    cancelled = true;
    idle?.remove();
    options.locator.setBounds(null, { reason: 'map-move' });
  };
};

/** Which place a Google marker stands for. */
export type BindGoogleMarkerOptions = {
  /** The locator the marker selects and highlights in. */
  locator: GoogleMapLocator;
  /** Where the place is. */
  position: GeoPosition;
  /**
   * The marker's name for screen readers, and its tooltip. Required: the
   * marker's content is often only a pin.
   */
  title: string;
  /** What identifies the place. The same as its item in the list. */
  value: string;
};

/**
 * Puts an element on a Google map as a place's marker and links it to a
 * locator. Returns a cleanup. Call it again when the place moves or is
 * renamed.
 *
 * Google's marker is the button: it takes focus, arrow keys move between
 * markers and Enter selects, as Google documents for clickable markers. The
 * element is the marker's looks. It gets `data-slot="locator-marker"` and
 * the state attributes the locator's own parts have: `data-selected`,
 * `data-highlighted` and `data-in-view`. They are written straight to the
 * element, so nothing renders when they change.
 *
 * A press reports `marker-press`, and hover and focus report `marker-hover`
 * and `marker-focus`, as the locator's own `marker` part does. Selecting the
 * place from the list pans the map to it when it is outside the visible
 * area.
 *
 * Google moves the element into the map, so pass a detached one and render
 * the pin into it, with a portal in React.
 * @param map - Google's map, from `bindGoogleMap`'s `onReady`
 * @param el - A detached element that holds the marker's looks
 * @param options - The place, and the locator it belongs to
 */
export const bindGoogleMarker = (
  map: google.maps.Map,
  el: HTMLElement,
  options: BindGoogleMarkerOptions
) => {
  const { locator, position, title, value } = options;
  let cancelled = false;
  let marker: google.maps.marker.AdvancedMarkerElement | undefined;
  let selected = false;

  /**
   * Sets or removes a state attribute.
   * @param name - The attribute
   * @param on - Whether the state holds
   */
  const mark = (name: string, on: boolean) => {
    if (on) el.setAttribute(name, '');
    else el.removeAttribute(name);
  };

  /** Brings the element's attributes, and the map, in line with the locator. */
  const write = () => {
    const bounds = locator.getBounds();
    const now = locator.getValue() === value;
    mark('data-selected', now);
    mark('data-highlighted', locator.getHighlighted() === value);
    mark('data-in-view', bounds ? isInBounds(position, bounds) : false);

    // A place chosen in the list may be off the map: bring it into view.
    if (now && !selected) {
      const visible = map.getBounds();
      if (visible && !visible.contains(position)) map.panTo(position);
    }
    selected = now;
  };

  /**
   * Selects the place. Google sends this for a click, a tap and Enter.
   * @param event - Google's click event
   */
  const select = (event: Event) => {
    locator.setValue(value, { event, reason: 'marker-press' });
  };
  /**
   * A pointer moved onto the marker.
   * @param event - The pointerenter event
   */
  const hoverIn = (event: Event) => {
    locator.setHighlighted(value, { event, reason: 'marker-hover' });
  };
  /**
   * Focus reached the marker.
   * @param event - The focusin event
   */
  const focusIn = (event: Event) => {
    locator.setHighlighted(value, { event, reason: 'marker-focus' });
  };
  /**
   * Stops highlighting, unless another place took the highlight.
   * @param reason - Whether a pointer or the focus left
   * @param event - The DOM event behind it
   */
  const leave = (reason: 'marker-focus' | 'marker-hover', event?: Event) => {
    if (locator.getHighlighted() !== value) return;
    locator.setHighlighted(null, { event, reason });
  };
  /**
   * A pointer left the marker.
   * @param event - The pointerleave event
   */
  const hoverOut = (event: Event) => {
    leave('marker-hover', event);
  };
  /**
   * Focus left the marker.
   * @param event - The focusout event
   */
  const focusOut = (event: Event) => {
    leave('marker-focus', event);
  };

  el.setAttribute('data-slot', 'locator-marker');
  write();
  const unsubscribe = locator.subscribe(write);

  void importLibrary('marker').then(({ AdvancedMarkerElement }) => {
    if (cancelled) return;
    marker = new AdvancedMarkerElement({
      content: el,
      gmpClickable: true,
      map,
      position,
      title
    });
    marker.addEventListener('gmp-click', select);
    marker.addEventListener('pointerenter', hoverIn);
    marker.addEventListener('pointerleave', hoverOut);
    marker.addEventListener('focusin', focusIn);
    marker.addEventListener('focusout', focusOut);
  });

  return () => {
    cancelled = true;
    unsubscribe?.();
    leave('marker-hover');
    if (!marker) return;
    marker.removeEventListener('gmp-click', select);
    marker.removeEventListener('pointerenter', hoverIn);
    marker.removeEventListener('pointerleave', hoverOut);
    marker.removeEventListener('focusin', focusIn);
    marker.removeEventListener('focusout', focusOut);
    marker.map = null;
  };
};
