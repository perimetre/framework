import { checkServer, mount } from '@ui-sdk/core/testing';
import { expect, test } from 'bun:test';
import { createLocatorController, locator } from './index';

/**
 * A part's element, or a failed test when the markup has none.
 * @param element - What `view.part` returned
 */
const present = (element: HTMLElement | undefined) => {
  if (!element) throw new Error('The part is missing from the markup.');
  return element;
};

const LOCATOR = `<root>
  <list>
    <item value="a" position='{"lat":45.5,"lng":-73.5}'><item-trigger>Montreal</item-trigger></item>
    <item value="b" position='{"lat":43.6,"lng":-79.3}'><item-trigger>Toronto</item-trigger></item>
  </list>
  <map aria-label="Stores on a map">
    <marker value="a" position='{"lat":45.5,"lng":-73.5}'>Montreal</marker>
    <marker value="b" position='{"lat":43.6,"lng":-79.3}'>Toronto</marker>
  </map>
</root>`;

test('locator: the list and the map share one selection and one highlight', async () => {
  const controller = createLocatorController();
  const view = mount(locator, { controller }, LOCATOR);
  try {
    await view.hover(present(view.part('marker', 'b')));
    expect(view.part('item', 'b')?.hasAttribute('data-highlighted')).toBe(true);
    expect(view.changes.at(-1)).toMatchObject({
      key: 'highlighted',
      reason: 'marker-hover'
    });

    await view.click(present(view.part('item-trigger', 'a')));
    expect(view.state.value).toBe('a');
    expect(view.part('marker', 'a')?.getAttribute('aria-current')).toBe('true');
    expect(view.changes.at(-1)).toMatchObject({ reason: 'item-press' });

    controller.setValue('b', { reason: 'marker-press' });
    expect(view.part('item', 'b')?.hasAttribute('data-selected')).toBe(true);
    expect(view.changes.at(-1)).toMatchObject({ reason: 'marker-press' });

    controller.setBounds(
      { east: -70, north: 46, south: 45, west: -75 },
      { reason: 'map-move' }
    );
    await view.settle();
    expect(view.part('item', 'a')?.hasAttribute('data-in-view')).toBe(true);
    expect(view.part('item', 'b')?.hasAttribute('data-in-view')).toBe(false);
  } finally {
    view.unmount();
  }
});

test('locator: renders on the server', () => {
  expect(checkServer(locator, { defaultValue: 'a' }, LOCATOR)).toContain(
    'data-selected'
  );
});
