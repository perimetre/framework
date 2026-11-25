import { setOptions } from '@googlemaps/js-api-loader';
import type { Story, StoryDefault } from '@ladle/react';
import { createParts } from '@ui-sdk/react/primitive';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  createLocatorController,
  locator,
  type LocatorController
} from '../../primitives/locator';
import { bindGoogleMap, bindGoogleMarker } from './index';

// Google's loader takes its key once, before the first library loads.
const key: unknown = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (typeof key === 'string') setOptions({ key, v: 'weekly' });

export default {
  decorators: [
    /**
     * Shows the story only when there is a key to load Google with.
     * @param Component - The story
     */
    (Component) =>
      typeof key === 'string' ? (
        <Component />
      ) : (
        <p>Set VITE_GOOGLE_MAPS_API_KEY in .env.local to see this story.</p>
      )
  ],
  title: 'Behaviors/bindGoogleMap'
} satisfies StoryDefault;

const STORES = [
  { id: 'ottawa', name: 'Ottawa', position: { lat: 45.42, lng: -75.7 } },
  { id: 'montreal', name: 'Montréal', position: { lat: 45.5, lng: -73.57 } },
  { id: 'quebec', name: 'Québec', position: { lat: 46.81, lng: -71.21 } }
];

const { Item, ItemTrigger, List, Map, Root } = createParts(locator, {
  item: 'li',
  'item-trigger': 'button',
  list: 'ul',
  map: 'div',
  root: 'div'
});

/**
 * A pin. Google's marker is the button; this renders its looks into the
 * element Google places, styled from the attributes `bindGoogleMarker` writes.
 * @param props - The pin's props
 * @param props.controller - The locator's controller
 * @param props.map - Google's map
 * @param props.store - The store the pin stands for
 */
const Pin = ({
  controller,
  map,
  store
}: {
  controller: LocatorController;
  map: google.maps.Map;
  store: (typeof STORES)[number];
}) => {
  const [el] = useState(() => document.createElement('div'));

  useEffect(
    /** Puts the pin on the map, and takes it off again. */
    () =>
      bindGoogleMarker(map, el, {
        locator: controller,
        position: store.position,
        title: store.name,
        value: store.id
      }),
    [controller, el, map, store]
  );

  return createPortal(
    <span className="block size-4 rounded-full bg-slate-500 in-data-highlighted:scale-150 in-data-selected:bg-blue-600" />,
    el
  );
};

/** The locator with a Google map. The controller links the list to the map. */
export const Maps: Story = () => {
  const [controller] = useState(createLocatorController);
  const canvas = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(
    /** Creates the map once, and lets it go with the story. */
    () => {
      if (!canvas.current) return;
      return bindGoogleMap(canvas.current, {
        center: { lat: 45.5, lng: -73.57 },
        locator: controller,
        mapId: 'DEMO_MAP_ID',
        onReady: setMap,
        zoom: 6
      });
    },
    [controller]
  );

  return (
    <Root aria-label="Stores" className="flex gap-4" controller={controller}>
      <List>
        {STORES.map((store) => (
          <Item
            key={store.id}
            className="data-highlighted:bg-slate-100 data-selected:font-bold"
            position={store.position}
            value={store.id}
          >
            <ItemTrigger>{store.name}</ItemTrigger>
          </Item>
        ))}
      </List>
      <Map aria-label="Stores on a map">
        {/* Google owns this element, so React renders nothing into it. */}
        <div ref={canvas} className="size-96" />
        {map &&
          STORES.map((store) => (
            <Pin
              key={store.id}
              controller={controller}
              map={map}
              store={store}
            />
          ))}
      </Map>
    </Root>
  );
};
