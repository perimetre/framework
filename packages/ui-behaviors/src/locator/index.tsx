'use client';

import { createParts } from '@ui-sdk/react/primitive';
import {
  type ComponentProps,
  createContext,
  type ReactElement,
  use,
  useState
} from 'react';
import {
  createLocatorController,
  locator,
  type LocatorController
} from './primitive';

const parts = createParts(locator, {
  item: 'div',
  'item-trigger': 'button',
  list: 'div',
  map: 'div',
  marker: 'button',
  root: 'div'
});

const LocatorContext = createContext<LocatorController | null>(null);

/**
 * Owns the locator's state and wraps the list and the map.
 * @example
 * <Locator origin={searched} resultsMessage={(count) => `${count} stores`}>
 *   <LocatorList render={<ul />}>
 *     {stores.map((store) => (
 *       <LocatorItem key={store.id} position={store.position} render={<li />} value={store.id}>
 *         <LocatorItemTrigger>{store.name}</LocatorItemTrigger>
 *       </LocatorItem>
 *     ))}
 *   </LocatorList>
 *   <LocatorMap aria-label="Stores on a map">…</LocatorMap>
 * </Locator>
 * @param props - The locator's options, next to the element's own props
 */
export const Locator = (
  props: ComponentProps<typeof parts.Root>
): ReactElement => {
  // Everything inside reaches the locator through a controller: the one the
  // project passed, or one made here.
  const [own] = useState(createLocatorController);
  const controller = props.controller ?? own;

  return (
    <LocatorContext value={controller}>
      <parts.Root {...props} controller={controller} />
    </LocatorContext>
  );
};

/**
 * The controller of the `Locator` this is rendered inside. A map renderer
 * uses it to report the visible area and to follow the selection. Call its
 * methods from effects and event handlers, not while rendering.
 */
export const useLocatorController = (): LocatorController => {
  const controller = use(LocatorContext);
  if (!controller) {
    throw new Error('useLocatorController must be used inside a Locator.');
  }
  return controller;
};

/**
 * Holds the places. When the places in it change, it tells a screen reader
 * how many there are now, with the locator's `resultsMessage`.
 */
export const LocatorList = parts.List;

/**
 * One place in the list. Takes the place's `value` and `position`. Exposes
 * `data-selected`, `data-highlighted` and `data-in-view`, and `distance` in
 * its state when the locator has an `origin`.
 */
export const LocatorItem = parts.Item;

/**
 * A button that selects its place. Leave it out when each place links to a
 * page of its own. Exposes `aria-current` and `data-selected`.
 */
export const LocatorItemTrigger = parts.ItemTrigger;

/**
 * Where the map goes. Render a map inside it and report its visible area
 * with the controller's `setBounds`. Name it with `aria-label`.
 */
export const LocatorMap = parts.Map;

/**
 * A place's marker on the map: a button that selects its place. Takes the
 * place's `value` and `position`; the map renderer positions it. Exposes
 * `aria-current`, `data-selected`, `data-highlighted` and `data-in-view`.
 */
export const LocatorMarker = parts.Marker;

export {
  distanceBetween,
  isInBounds,
  sortByDistance,
  type LocatorBounds,
  type LocatorPosition
} from './geo';
export { useGeolocation, type GeolocationStatus } from './geolocation';
export {
  createLocatorController,
  locator,
  type LocatorBoundsChangeReason,
  type LocatorController,
  type LocatorHighlightedChangeReason,
  type LocatorOptions,
  type LocatorValueChangeReason
} from './primitive';
