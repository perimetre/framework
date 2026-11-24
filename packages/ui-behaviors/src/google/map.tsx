'use client';

import { importLibrary } from '@googlemaps/js-api-loader';
import { type PartProps, renderElement } from '@ui-sdk/react/primitive';
import {
  type ComponentProps,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { createPortal } from 'react-dom';
import {
  isInBounds,
  type LocatorBounds,
  LocatorMap,
  type LocatorPosition,
  useLocatorController
} from '../locator';

const MapContext = createContext<google.maps.Map | null>(null);

export type GoogleMapProps = {
  /** The `GoogleMapMarker`s. */
  children?: ReactNode;
  /** Where the map is centred at first. */
  defaultCenter: LocatorPosition;
  /** How far the map is zoomed in at first, as Google's zoom level. */
  defaultZoom: number;
  /**
   * The map ID from the Google Cloud console. Markers need one. It cannot
   * change once the map exists.
   */
  mapId: string;
  /** Runs once with Google's map, for anything this component does not cover. */
  onMapReady?: (map: google.maps.Map) => void;
  /** Google's own map options, passed through when the map is created. */
  options?: Omit<google.maps.MapOptions, 'center' | 'mapId' | 'zoom'>;
} & Omit<ComponentProps<typeof LocatorMap>, 'children'>;

/**
 * A Google map as the locator's map. It reports its visible area to the
 * locator each time it comes to rest, and holds the `GoogleMapMarker`s.
 * Render it inside a `Locator`, give it a size, and name it with
 * `aria-label`.
 *
 * Set the API key once with `setOptions` from `@googlemaps/js-api-loader`
 * before this renders.
 * @example
 * <GoogleMap aria-label="Stores on a map" defaultCenter={{ lat: 45.5, lng: -73.57 }} defaultZoom={10} mapId="…">
 *   {stores.map((store) => (
 *     <GoogleMapMarker key={store.id} position={store.position} title={store.name} value={store.id} />
 *   ))}
 * </GoogleMap>
 * @param props - The map's options, next to `LocatorMap`'s props
 */
export const GoogleMap = (props: GoogleMapProps): ReactElement => {
  const {
    children,
    defaultCenter,
    defaultZoom,
    mapId,
    onMapReady,
    options,
    ...rest
  } = props;
  const controller = useLocatorController();
  const canvas = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Only the first values count: the map is created once.
  const initial = useRef({
    defaultCenter,
    defaultZoom,
    mapId,
    onMapReady,
    options
  });

  useEffect(() => {
    let cancelled = false;
    let idle: google.maps.MapsEventListener | undefined;

    void importLibrary('maps').then(({ Map }) => {
      if (cancelled || !canvas.current) return;
      const first = initial.current;
      const created = new Map(canvas.current, {
        ...first.options,
        center: first.defaultCenter,
        mapId: first.mapId,
        zoom: first.defaultZoom
      });

      // `idle` fires once a pan or zoom has finished, and after the first draw.
      idle = created.addListener('idle', () => {
        controller.setBounds(created.getBounds()?.toJSON() ?? null);
      });

      setMap(created);
      first.onMapReady?.(created);
    });

    return () => {
      cancelled = true;
      idle?.remove();
      controller.setBounds(null);
    };
  }, [controller]);

  return (
    <LocatorMap {...rest}>
      <div
        ref={canvas}
        data-slot="google-map-canvas"
        style={{ height: '100%', width: '100%' }}
      />
      <MapContext value={map}>{children}</MapContext>
    </LocatorMap>
  );
};

export type GoogleMapMarkerProps = {
  /** Where the place is. */
  position: LocatorPosition;
  /**
   * The marker's name for screen readers, and its tooltip. Required: the
   * marker's content is often only a pin.
   */
  title: string;
  /** What identifies the place. The same as its `LocatorItem`. */
  value: string;
} & Omit<PartProps<'div', GoogleMapMarkerState>, 'title'>;

/** What a marker's `className`, `style` and `children` functions can read. */
export type GoogleMapMarkerState = {
  /** Whether this place is highlighted, from the list or the map. */
  highlighted: boolean;
  /** Whether this place is inside the map's visible area. */
  inView: boolean;
  /** Whether this place is the selected one. */
  selected: boolean;
};

/**
 * A place's marker on a `GoogleMap`. Google's marker is the button: it takes
 * focus, arrow keys move between markers and Enter selects, as Google
 * documents for clickable markers. What this renders is the marker's looks,
 * with the same state attributes as `LocatorMarker`: `data-selected`,
 * `data-highlighted` and `data-in-view`.
 *
 * Selecting the place from the list pans the map to it when it is outside
 * the visible area.
 * @param props - The place's `value`, `position` and `title`, and the element's props
 */
export const GoogleMapMarker = (
  props: GoogleMapMarkerProps
): null | ReactElement => {
  const { position, title, value, ...markerProps } = props;
  const controller = useLocatorController();
  const map = use(MapContext);
  const { lat, lng } = position;

  // Google positions this element; React renders the content into it.
  const [container] = useState(() =>
    typeof document === 'undefined' ? null : document.createElement('div')
  );
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  /** The marker's state, as one string so a snapshot compares by value. */
  const snapshot = useCallback(() => {
    // Before the locator is ready a controller's reads return undefined.
    const bounds = controller.getBounds() as LocatorBounds | null | undefined;
    return [
      controller.getValue() === value,
      controller.getHighlighted() === value,
      bounds != null && isInBounds({ lat, lng }, bounds)
    ]
      .map(Number)
      .join('');
  }, [controller, lat, lng, value]);

  const subscribe = useCallback(
    (listener: () => void) => {
      const stop = controller.subscribe(listener) as (() => void) | undefined;
      return stop ?? (() => undefined);
    },
    [controller]
  );

  const flags = useSyncExternalStore(subscribe, snapshot, () => '000');
  const state: GoogleMapMarkerState = {
    highlighted: flags[1] === '1',
    inView: flags[2] === '1',
    selected: flags.startsWith('1')
  };

  useEffect(() => {
    if (!map || !container) return;
    let cancelled = false;
    let created: google.maps.marker.AdvancedMarkerElement | undefined;

    /** Selects the place. Google sends this for a click, a tap and Enter. */
    const select = () => {
      controller.setValue(value);
    };
    /** Highlights the place while the marker is hovered or focused. */
    const highlight = () => {
      controller.setHighlighted(value);
    };
    /** Stops highlighting, unless another place took the highlight. */
    const unhighlight = () => {
      if (controller.getHighlighted() === value)
        controller.setHighlighted(null);
    };

    void importLibrary('marker').then(({ AdvancedMarkerElement }) => {
      if (cancelled) return;
      created = new AdvancedMarkerElement({
        content: container,
        gmpClickable: true,
        map
      });
      created.addEventListener('gmp-click', select);
      created.addEventListener('pointerenter', highlight);
      created.addEventListener('pointerleave', unhighlight);
      created.addEventListener('focusin', highlight);
      created.addEventListener('focusout', unhighlight);
      marker.current = created;
    });

    return () => {
      cancelled = true;
      if (!created) return;
      created.removeEventListener('gmp-click', select);
      created.removeEventListener('pointerenter', highlight);
      created.removeEventListener('pointerleave', unhighlight);
      created.removeEventListener('focusin', highlight);
      created.removeEventListener('focusout', unhighlight);
      created.map = null;
      marker.current = null;
      unhighlight();
    };
  }, [container, controller, map, value]);

  // Kept apart from creation, so moving or renaming a marker does not rebuild it.
  useEffect(() => {
    if (!map) return;
    /** Applies the position and the name once Google's marker exists. */
    const apply = () => {
      if (!marker.current) return false;
      marker.current.position = { lat, lng };
      marker.current.title = title;
      return true;
    };
    if (apply()) return;
    // The marker library is still loading; it resolves within a few frames.
    const timer = setInterval(() => {
      if (apply()) clearInterval(timer);
    }, 50);
    return () => {
      clearInterval(timer);
    };
  }, [lat, lng, map, title]);

  // A place chosen in the list may be off the map: bring it into view.
  useEffect(() => {
    if (!map || !state.selected) return;
    const bounds = map.getBounds();
    if (bounds && !bounds.contains({ lat, lng })) map.panTo({ lat, lng });
  }, [lat, lng, map, state.selected]);

  // Nothing renders until the map exists. That also keeps the first client
  // render the same as the server's, where there is no document to render into.
  if (!container || !map) return null;

  const { children, className, render, style, ...rest } = markerProps;

  return createPortal(
    renderElement(
      'div',
      {
        'data-highlighted': state.highlighted ? '' : undefined,
        'data-in-view': state.inView ? '' : undefined,
        'data-selected': state.selected ? '' : undefined,
        'data-slot': 'locator-marker',
        ...rest,
        children: typeof children === 'function' ? children(state) : children,
        className:
          typeof className === 'function' ? className(state) : className,
        style: typeof style === 'function' ? style(state) : style
      },
      render,
      state
    ),
    container
  );
};
