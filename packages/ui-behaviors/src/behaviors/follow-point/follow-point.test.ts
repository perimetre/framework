import { definePrimitive } from '@ui-sdk/core';
import { mount } from '@ui-sdk/core/testing';
import { expect, test } from 'bun:test';
import { createFollowPoint } from './index';

const surface = definePrimitive({
  name: 'surface',
  live: ['x', 'y'],
  /** The starting state. */
  state: () => ({ active: false, x: 0.5, y: 0.5 }),
  /** Returns what the parts call. */
  api: (context) => ({
    follow: createFollowPoint(context, {
      /** Whether the point shows. */
      active: (state) => state.active,
      /** Where the point is. */
      point: (state) => state,
      /** Shows or hides the point. */
      setActive: (active) => {
        context.store.set({ active });
        return true;
      },
      /** Moves the point. */
      setPoint: (point) => {
        context.store.set(point);
      }
    })
  }),
  /** The parts. */
  slots: (slot) => ({
    root: slot({
      on: {
        /** A mouse arrives. */
        pointerenter: (event, { api, el }) => {
          if (el) api.follow.pointerenter(event, el);
        },
        /** A mouse leaves. */
        pointerleave: (event, { api }) => {
          api.follow.pointerleave(event);
        }
      }
    }),
    trigger: slot({
      /** A plain button. */
      attrs: () => ({ type: 'button' }),
      /** Toggles the point. */
      press: ({ api }, event) => {
        api.follow.toggle(event);
      },
      on: {
        /** Arrow keys and Escape. */
        keydown: (event, { api }) => {
          api.follow.keydown(event);
        }
      }
    })
  })
});

/**
 * Moves a mouse onto an element, or off it.
 * @param el - The element
 * @param type - Which way the mouse went
 */
const mouse = (el: HTMLElement, type: 'pointerenter' | 'pointerleave') =>
  el.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse' }));

test('createFollowPoint: a mouse that arrives starts it, and leaving stops it', () => {
  const view = mount(surface, {}, `<root><trigger>Show</trigger></root>`);
  try {
    mouse(view.root, 'pointerenter');
    expect(view.state.active).toBe(true);
    mouse(view.root, 'pointerleave');
    expect(view.state.active).toBe(false);
  } finally {
    view.unmount();
  }
});

test('createFollowPoint: a mouse passing over never stops what the trigger started', async () => {
  const view = mount(surface, {}, `<root><trigger>Show</trigger></root>`);
  try {
    await view.keys('Tab', 'Enter');
    mouse(view.root, 'pointerenter');
    mouse(view.root, 'pointerleave');
    expect(view.state.active).toBe(true);

    await view.keys('ArrowRight', 'Escape');
    expect(view.state.x).toBeCloseTo(0.55);
    expect(view.state.active).toBe(false);
  } finally {
    view.unmount();
  }
});
