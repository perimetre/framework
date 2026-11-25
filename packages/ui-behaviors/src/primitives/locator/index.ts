import {
  announce,
  type ChangeDetails,
  type ChangeOptions,
  createChange,
  createController,
  definePrimitive,
  elements,
  labelOf,
  live
} from '@ui-sdk/core';
import { createLinkedHighlight } from '../../behaviors/linked-highlight/index.js';
import {
  distanceBetween,
  type GeoBounds,
  type GeoPosition,
  isInBounds
} from '../../utilities/geo/index.js';

/**
 * Why the map's visible area changed. `map-move` isn't in the shared
 * vocabulary: the map was panned, zoomed or resized, as its renderer reports
 * through `setBounds`.
 */
export type LocatorBoundsChangeReason = 'imperative' | 'map-move';

/** Options for a controller's `setBounds`. */
export type LocatorBoundsOptions = ChangeOptions<LocatorBoundsChangeReason>;

export type LocatorController = {
  /** The map's visible area, or `null` before a map reports one. */
  getBounds: () => GeoBounds | null;
  /** The value of the highlighted place, or `null`. */
  getHighlighted: () => null | string;
  /** The value of the selected place, or `null`. */
  getValue: () => null | string;
  /**
   * Reports the map's visible area. A map renderer calls this when the map
   * comes to rest, not on every frame of a pan.
   * @param bounds - The visible area, or `null` when there is no map
   * @param options - The reason and event passed to `onBoundsChange`
   */
  setBounds: (bounds: GeoBounds | null, options?: LocatorBoundsOptions) => void;
  /**
   * Highlights a place in the list and on the map.
   * @param value - The place's value, or `null` for none
   * @param options - The reason and event passed to `onHighlightedChange`
   */
  setHighlighted: (
    value: null | string,
    options?: LocatorHighlightedOptions
  ) => void;
  /**
   * Selects a place in the list and on the map.
   * @param value - The place's value, or `null` for none
   * @param options - The reason and event passed to `onValueChange`
   */
  setValue: (value: null | string, options?: LocatorValueOptions) => void;
  /**
   * Runs a listener whenever the selection, the highlight or the bounds
   * change. Returns a function that stops it. A map renderer uses this to
   * follow the selection.
   * @param listener - What to run
   */
  subscribe: (listener: () => void) => () => void;
};

/**
 * Why a place was highlighted, or stopped being. `item-hover` is shared; the
 * focus and marker reasons aren't in the shared vocabulary.
 */
export type LocatorHighlightedChangeReason =
  | 'imperative'
  | 'item-focus'
  | 'item-hover'
  | 'marker-focus'
  | 'marker-hover';

/** Options for a controller's `setHighlighted`. */
export type LocatorHighlightedOptions =
  ChangeOptions<LocatorHighlightedChangeReason>;

export type LocatorOptions = {
  /** The map's visible area. Pass it to control it. */
  bounds?: GeoBounds | null;
  /** Selects, highlights and follows the locator from anywhere. Create one with `createLocatorController()`. */
  controller?: LocatorController;
  /** The map's visible area before a map reports one, when uncontrolled. */
  defaultBounds?: GeoBounds | null;
  /** The value of the place selected at first, when uncontrolled. */
  defaultValue?: null | string;
  /**
   * Runs when the map's visible area changes. Filter or reload the places
   * for the new area here.
   */
  onBoundsChange?: (
    bounds: GeoBounds | null,
    details: ChangeDetails<LocatorBoundsChangeReason>
  ) => void;
  /** Runs when a place is highlighted from the list or the map, or stops being. */
  onHighlightedChange?: (
    value: null | string,
    details: ChangeDetails<LocatorHighlightedChangeReason>
  ) => void;
  /**
   * Runs when a place wants to be selected. `details.reason` says where
   * from, and `details.cancel()` stops it.
   */
  onValueChange?: (
    value: null | string,
    details: ChangeDetails<LocatorValueChangeReason>
  ) => void;
  /**
   * Where distances are measured from, like a searched address or the
   * user's location. Each list item's state then carries its `distance`.
   */
  origin?: GeoPosition | null;
  /**
   * The message a screen reader hears when the places in the list change,
   * like after a search or a pan. Gets how many places the list now shows.
   * Without it, nothing is announced.
   */
  resultsMessage?: (count: number) => string;
  /** The value of the selected place. Pass it to control it. */
  value?: null | string;
};

/**
 * Why a place was selected. `item-press` is shared; `marker-press` isn't in
 * the shared vocabulary.
 */
export type LocatorValueChangeReason =
  | 'imperative'
  | 'item-press'
  | 'marker-press';

/** Options for a controller's `setValue`. */
export type LocatorValueOptions = ChangeOptions<LocatorValueChangeReason>;

type LocatorState = {
  bounds: GeoBounds | null;
  /** The value of the highlighted place. */
  highlighted: null | string;
  origin: GeoPosition | null;
  /** The value of the selected place. */
  value: null | string;
};

/** What a place's part is given: which place, and where it is. */
type PlaceProps = {
  /** Where the place is. */
  position: GeoPosition;
  /** What identifies the place. The same in the list and on the map. */
  value: string;
};

/** How long the list is left to settle before its new contents are announced, in milliseconds. */
const ANNOUNCE_DELAY = 500;

/**
 * Creates a handle that selects, highlights and follows a locator from
 * outside it. Pass it to the root's `controller` option, and to whatever
 * renders the map.
 */
export const createLocatorController = () =>
  createController<LocatorController>();

/**
 * Links a list of places to their markers on a map. It draws no map: the app
 * puts one in the `map` part and reports its visible area with `setBounds`.
 * `bindGoogleMap`, from `@perimetre/ui-behaviors/behaviors/google-map`, binds a
 * Google map to it.
 *
 * - Hovering or focusing a place in the list highlights its marker, and the
 *   reverse (`createLinkedHighlight`).
 * - Selecting a place in either selects it in both. The list scrolls a place
 *   selected from the map into view; the map renderer brings a place
 *   selected from the list into view.
 * - Each place knows whether it is inside the map's visible area, and how
 *   far it is from an origin.
 *
 * Parts: `root`, `list`, `item`, `item-trigger`, `map` and `marker`.
 *
 * The list is the accessible equivalent of the map: every place with a
 * marker belongs in the list, and the list works with no map at all.
 *
 * Items and markers expose `data-selected`, `data-highlighted` and
 * `data-in-view`. The highlight is `live` state, so a pointer moving down
 * the list re-renders nothing.
 *
 * Story: `src/primitives/locator/locator.stories.tsx`, shipped with the package, shows
 * its parts rendered in React, with a map the app draws.
 */
export const locator = definePrimitive({
  name: 'locator',
  options: {
    bounds: 'value',
    controller: 'value',
    defaultBounds: 'value',
    defaultValue: 'value',
    onBoundsChange: 'callback',
    onHighlightedChange: 'callback',
    onValueChange: 'callback',
    origin: 'value',
    resultsMessage: 'action',
    value: 'value'
  },
  controlled: ['value', 'bounds'],
  live: ['highlighted'],
  /** The starting state, from the first options. */
  state: (options: LocatorOptions): LocatorState => ({
    bounds: options.bounds ?? options.defaultBounds ?? null,
    highlighted: null,
    origin: options.origin ?? null,
    value: options.value ?? options.defaultValue ?? null
  }),
  /** Keeps `origin`, and `value` and `bounds` when controlled, in step with the options. */
  sync: (options) => ({
    origin: options.origin ?? null,
    ...(options.bounds === undefined ? {} : { bounds: options.bounds }),
    ...(options.value === undefined ? {} : { value: options.value })
  }),
  /** Runs once per instance and returns what the parts, a controller and an agent call. */
  api: (context) => {
    const change = createChange(context);

    const highlight = createLinkedHighlight(context, {
      /** Highlights through `onHighlightedChange`. */
      set: (
        value,
        details: { event?: Event; reason: LocatorHighlightedChangeReason }
      ) => change('highlighted', value, details),
      /** The highlighted place. */
      value: (state) => state.highlighted
    });

    /**
     * Asks to select a place, or none.
     * @param value - The place's value, or `null`
     * @param reason - Why, for `onValueChange`
     * @param event - The DOM event behind it
     */
    const select = (
      value: null | string,
      reason: LocatorValueChangeReason,
      event?: Event
    ) =>
      context.store.get().value === value
        ? false
        : change('value', value, { event, reason });

    return {
      /**
       * Tells a screen reader how many places the list now shows, when the
       * app gave a message for it.
       */
      announceResults: () => {
        const message = context.options().resultsMessage;
        if (!message) return;
        announce(message(elements(context, 'item').length));
      },
      /** The map's visible area, or `null` before a map reports one. */
      getBounds: () => context.store.get().bounds,
      /** The value of the highlighted place, or `null`. */
      getHighlighted: () => context.store.get().highlighted,
      /** The value of the selected place, or `null`. */
      getValue: () => context.store.get().value,
      highlight,
      /**
       * The places the list shows, in order, named by their trigger's text
       * or else their own. An agent picks a place from these.
       */
      items: () =>
        elements(context, 'item').map((item) => ({
          label: labelOf(context.element('item-trigger', item.key) ?? item.el),
          value: item.key
        })),
      select,
      /**
       * Reports the map's visible area.
       * @param bounds - The visible area, or `null` when there is no map
       * @param options - The reason and event passed to `onBoundsChange`
       */
      setBounds: (bounds: GeoBounds | null, options?: LocatorBoundsOptions) => {
        const current = context.store.get().bounds;
        const same =
          current === bounds ||
          (current !== null &&
            bounds !== null &&
            current.east === bounds.east &&
            current.north === bounds.north &&
            current.south === bounds.south &&
            current.west === bounds.west);
        if (same) return;
        change('bounds', bounds, {
          event: options?.event,
          reason: options?.reason ?? 'imperative'
        });
      },
      /**
       * Highlights a place from code.
       * @param value - The place's value, or `null` for none
       * @param options - The reason and event passed to `onHighlightedChange`
       */
      setHighlighted: (
        value: null | string,
        options?: LocatorHighlightedOptions
      ) => {
        highlight.set(value, {
          event: options?.event,
          reason: options?.reason ?? 'imperative'
        });
      },
      /**
       * Selects a place from code.
       * @param value - The place's value, or `null` for none
       * @param options - The reason and event passed to `onValueChange`
       */
      setValue: (value: null | string, options?: LocatorValueOptions) => {
        select(value, options?.reason ?? 'imperative', options?.event);
      },
      /**
       * Follows the selection, the highlight and the bounds.
       * @param listener - What to run on every change
       */
      subscribe: (listener: () => void) => context.store.subscribe(listener)
    };
  },
  /** The parts: root, list, item, item trigger, map and marker. */
  slots: (slot) => {
    type PlaceState = {
      /** Whether this place is highlighted, from the list or the map. */
      highlighted: boolean;
      /** Whether this place is inside the map's visible area. `false` before a map reports one. */
      inView: boolean;
      /** Whether this place is the selected one. */
      selected: boolean;
    };

    /**
     * Whether a place is inside the map's visible area.
     * @param state - The locator's state
     * @param position - Where the place is
     */
    const inView = (state: LocatorState, position: GeoPosition) =>
      state.bounds !== null && isInBounds(position, state.bounds);

    /**
     * What a place's part shows, in the list or on the map.
     * @param state - The locator's state
     * @param part - The part, with its value and position
     * @param part.key - The place's value
     * @param part.props - The part's props
     */
    const placeState = (
      state: LocatorState,
      part: { key: string; props: PlaceProps }
    ): PlaceState => ({
      highlighted: state.highlighted === part.key,
      inView: inView(state, part.props.position),
      selected: state.value === part.key
    });

    return {
      /**
       * One place in the list. Hovering it or moving focus into it
       * highlights its marker. It holds whatever the app shows for a place:
       * a trigger to select it, a link to its page, its details.
       */
      item: slot<PlaceProps, { distance: number | undefined } & PlaceState>({
        props: { position: 'value', value: 'string' },
        /** What the item's render functions and class names can read. */
        state: (state, part) => ({
          ...placeState(state, part),
          distance: state.origin
            ? distanceBetween(state.origin, part.props.position)
            : undefined
        }),
        /** Marks the selection and whether the place is on the visible map. */
        attrs: (state, part) => ({
          'data-in-view': inView(state, part.props.position) ? '' : undefined,
          'data-selected': state.value === part.key ? '' : undefined
        }),
        /** Written straight to the element, so a moving pointer re-renders nothing. */
        live: live((state: LocatorState, part) => ({
          'data-highlighted': state.highlighted === part.key ? '' : undefined
        })),
        on: {
          /** Keyboard focus moved into the item. */
          focusin: (event, { api, key }) => {
            api.highlight.enter(key, { event, reason: 'item-focus' });
          },
          /** Keyboard focus left the item, and not for something else inside it. */
          focusout: (event, { api, el, key }) => {
            const next = event.relatedTarget;
            if (el && next instanceof Node && el.contains(next)) return;
            api.highlight.leave(key, { event, reason: 'item-focus' });
          },
          /** A pointer moved onto the item. */
          pointerenter: (event, { api, key }) => {
            api.highlight.enter(key, { event, reason: 'item-hover' });
          },
          /** A pointer left the item. */
          pointerleave: (event, { api, key }) => {
            api.highlight.leave(key, { event, reason: 'item-hover' });
          }
        },
        /** Client only: scrolls the item into view when its place is selected. */
        bind: (el, part) => {
          let selected = part.store.get().value === part.key;

          return part.store.subscribe(() => {
            const now = part.store.get().value === part.key;
            if (now && !selected) {
              // A no-op when the item is already visible, as when it was
              // the thing pressed. It matters for a place chosen on the map.
              el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
            selected = now;
          });
        }
      }),
      /**
       * A button that selects its place, for a list where choosing a place
       * shows it on the map. Leave it out when each place links to a page of
       * its own. Inside an item it takes the item's value.
       */
      'item-trigger': slot<{ value?: string }, { selected: boolean }>({
        props: { value: { from: 'item', kind: 'string' } },
        /** What the trigger's render functions and class names can read. */
        state: (state, part) => ({ selected: state.value === part.key }),
        /** A button that says whether its place is the current one. */
        attrs: (state, part) => ({
          'aria-current': state.value === part.key ? 'true' : undefined,
          'data-selected': state.value === part.key ? '' : undefined,
          type: 'button'
        }),
        /** Click, Enter or Space selects the place. */
        press: ({ api, key }, event) => {
          api.select(key, 'item-press', event);
        }
      }),
      /**
       * Holds the places. When the places in it change, it tells a screen
       * reader how many there are now, with the app's message.
       */
      list: slot({
        /** Client only: watches the places come and go. */
        bind: (el, part) => {
          /** The values of the places the list shows, as one string to compare. */
          const shownNow = () =>
            part.api
              .items()
              .map((item) => item.value)
              .join('\n');

          let timer: ReturnType<typeof setTimeout> | undefined;
          let shown = shownNow();

          const observer = new MutationObserver(() => {
            // A search or a pan swaps many items at once; wait for the last.
            clearTimeout(timer);
            timer = setTimeout(() => {
              const now = shownNow();
              if (now === shown) return;
              shown = now;
              part.api.announceResults();
            }, ANNOUNCE_DELAY);
          });
          observer.observe(el, { childList: true, subtree: true });

          return () => {
            clearTimeout(timer);
            observer.disconnect();
          };
        }
      }),
      /**
       * Where the map goes. The app renders a map inside it and reports the
       * visible area with `setBounds`. Name it with `aria-label`.
       */
      map: slot({}),
      /**
       * A place's marker on a map the app draws itself: a button that
       * selects its place, and highlights it while hovered or focused. The
       * app positions it. A Google map has markers of its own, which
       * `bindGoogleMarker` links to the locator.
       */
      marker: slot<PlaceProps, PlaceState>({
        props: { position: 'value', value: 'string' },
        state: placeState,
        /** A button that says whether its place is the current one. */
        attrs: (state, part) => ({
          'aria-current': state.value === part.key ? 'true' : undefined,
          'data-in-view': inView(state, part.props.position) ? '' : undefined,
          'data-selected': state.value === part.key ? '' : undefined,
          type: 'button'
        }),
        /** Written straight to the element, so a moving pointer re-renders nothing. */
        live: live((state: LocatorState, part) => ({
          'data-highlighted': state.highlighted === part.key ? '' : undefined
        })),
        /** Click, Enter or Space selects the place. */
        press: ({ api, key }, event) => {
          api.select(key, 'marker-press', event);
        },
        on: {
          /** Focus left the marker. */
          blur: (event, { api, key }) => {
            api.highlight.leave(key, { event, reason: 'marker-focus' });
          },
          /** Focus reached the marker. */
          focus: (event, { api, key }) => {
            api.highlight.enter(key, { event, reason: 'marker-focus' });
          },
          /** A pointer moved onto the marker. */
          pointerenter: (event, { api, key }) => {
            api.highlight.enter(key, { event, reason: 'marker-hover' });
          },
          /** A pointer left the marker. */
          pointerleave: (event, { api, key }) => {
            api.highlight.leave(key, { event, reason: 'marker-hover' });
          }
        }
      }),
      /** Owns the state. Wraps the list and the map. */
      root: slot({})
    };
  },
  agent: {
    actions: ['setValue', 'setHighlighted'],
    closed: true,
    /** The places an agent can select, named by their text. */
    items: (api) => api.items()
  }
});
