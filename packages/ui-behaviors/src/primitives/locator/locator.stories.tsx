import type { Story, StoryDefault } from '@ladle/react';
import { createParts } from '@ui-sdk/react/primitive';
import { locator } from './index';

export default { title: 'Primitives/Locator' } satisfies StoryDefault;

const { Item, ItemTrigger, List, Map, Marker, Root } = createParts(locator, {
  item: 'li',
  'item-trigger': 'button',
  list: 'ul',
  map: 'div',
  marker: 'button',
  root: 'div'
});

const STORES = [
  { id: 'ottawa', name: 'Ottawa', position: { lat: 45.42, lng: -75.7 } },
  { id: 'montreal', name: 'Montréal', position: { lat: 45.5, lng: -73.57 } },
  { id: 'quebec', name: 'Québec', position: { lat: 46.81, lng: -71.21 } }
];

/**
 * A list next to a map the app draws itself. Hover or select on either side.
 * For a Google map, see the Google story.
 */
export const Default: Story = () => (
  <Root aria-label="Stores" className="flex gap-4">
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
    <Map
      aria-label="Stores on a map"
      className="relative size-64 bg-emerald-50"
    >
      {STORES.map((store, index) => (
        <Marker
          key={store.id}
          aria-label={store.name}
          className="absolute size-4 rounded-full bg-slate-500 data-highlighted:scale-150 data-selected:bg-blue-600"
          position={store.position}
          style={{ left: `${String(20 + index * 30)}%`, top: '50%' }}
          value={store.id}
        />
      ))}
    </Map>
  </Root>
);
