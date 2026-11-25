import { createAgent } from '@ui-sdk/core/agent';
import { mount } from '@ui-sdk/core/testing';
import { expect, test } from 'bun:test';
import { locator } from './locator';
import { sequence } from './sequence';

test('an agent finds each primitive by name and calls its actions', async () => {
  const agent = createAgent();
  const turning = mount(
    sequence,
    {},
    `<root aria-label="Chair, all sides"><viewport aria-label="The chair, turning"></viewport><previous>Turn left</previous><next>Turn right</next></root>`
  );
  const stores = mount(
    locator,
    {},
    `<root aria-label="Stores"><list>
      <item value="a" position='{"lat":45.5,"lng":-73.5}'><item-trigger>Montreal</item-trigger></item>
      <item value="b" position='{"lat":43.6,"lng":-79.3}'><item-trigger>Toronto</item-trigger></item>
    </list></root>`
  );
  try {
    expect(agent.snapshot()).toMatchObject([
      {
        actions: ['pause', 'play', 'setValue', 'stepBy'],
        component: 'sequence'
      },
      {
        actions: ['setHighlighted', 'setValue'],
        component: 'locator',
        items: [
          { label: 'Montreal', value: 'a' },
          { label: 'Toronto', value: 'b' }
        ]
      }
    ]);
    const result = await agent.act({
      steps: [
        { action: 'setValue', args: [0.5], ref: 'Chair, all sides' },
        { action: 'setValue', args: ['Toronto'], ref: 'Stores' }
      ]
    });
    expect(result.ok, result.error?.message).toBe(true);
    expect(turning.state.value).toBe(0.5);
    expect(stores.state.value).toBe('b');
    expect(stores.changes.at(-1)).toMatchObject({ source: 'agent' });
  } finally {
    turning.unmount();
    stores.unmount();
  }
});
