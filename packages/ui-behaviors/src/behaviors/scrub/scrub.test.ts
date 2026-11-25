import { definePrimitive } from '@ui-sdk/core';
import { mount } from '@ui-sdk/core/testing';
import { expect, test } from 'bun:test';
import { createScrub, normalizeProgress } from './index';

const commits: number[] = [];

const strip = definePrimitive({
  name: 'strip',
  options: { loop: 'boolean' },
  /** The starting state. */
  state: (options: { loop?: boolean }) => ({
    loop: options.loop ?? true,
    value: 0.5
  }),
  /** Returns what the parts call. */
  api: (context) => ({
    scrub: createScrub(context, {
      /** One full pass is 100 pixels. */
      distance: () => 100,
      /** Whether the progress goes round. */
      loop: () => context.options().loop ?? true,
      /** Records where an interaction ended. */
      onCommit: (value) => {
        commits.push(value);
      },
      /** Moves the progress. */
      set: (value) => {
        context.store.set({ value });
        return true;
      },
      /** The progress. */
      value: (state) => state.value
    })
  }),
  /** The parts. */
  slots: (slot) => ({
    root: slot({
      on: {
        /** A drag may start. */
        pointerdown: (event, { api, el }) => {
          if (el) api.scrub.pointerdown(event, el);
        }
      }
    })
  })
});

test('createScrub: a sideways drag moves the progress and commits once', async () => {
  commits.length = 0;
  const view = mount(strip, {}, `<root></root>`);
  try {
    await view.drag(view.root, { by: { x: 20, y: 0 } });
    expect(view.state.value).toBeCloseTo(0.7);
    expect(commits).toHaveLength(1);
    expect(commits[0]).toBeCloseTo(0.7);
  } finally {
    view.unmount();
  }
});

test('createScrub: without a loop the progress stops at the end', async () => {
  const view = mount(strip, { loop: false }, `<root></root>`);
  try {
    await view.drag(view.root, { by: { x: 90, y: 0 } });
    expect(view.state.value).toBe(1);
  } finally {
    view.unmount();
  }
});

test('normalizeProgress: wraps round a loop and clamps without one', () => {
  expect(normalizeProgress(1.25, true)).toBeCloseTo(0.25);
  expect(normalizeProgress(-0.25, true)).toBeCloseTo(0.75);
  expect(normalizeProgress(1.25, false)).toBe(1);
  expect(normalizeProgress(Number.NaN, true)).toBe(0);
});
