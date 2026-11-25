import { definePrimitive } from '@ui-sdk/core';
import { mount } from '@ui-sdk/core/testing';
import { expect, test } from 'bun:test';
import { createLinkedHighlight } from './index';

const pair = definePrimitive({
  name: 'pair',
  live: ['highlighted'],
  /** The starting state. */
  state: (): { highlighted: null | string } => ({ highlighted: null }),
  /** Returns what the parts call. */
  api: (context) => ({
    highlight: createLinkedHighlight(context, {
      /** Highlights an item. */
      set: (highlighted) => {
        context.store.set({ highlighted });
        return true;
      },
      /** The highlighted item. */
      value: (state) => state.highlighted
    })
  }),
  /** The parts. */
  slots: (slot) => ({ root: slot({}) })
});

test('createLinkedHighlight: leaving an item clears it, unless another already took over', () => {
  const view = mount(pair, {}, `<root></root>`);
  const details = { reason: 'item-hover' };
  try {
    view.api.highlight.enter('a', details);
    expect(view.state.highlighted).toBe('a');

    // The pointer reaches b before it is reported to have left a.
    view.api.highlight.enter('b', details);
    view.api.highlight.leave('a', details);
    expect(view.state.highlighted).toBe('b');

    view.api.highlight.leave('b', details);
    expect(view.state.highlighted).toBeNull();
  } finally {
    view.unmount();
  }
});
