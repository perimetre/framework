import { definePrimitive } from '@ui-sdk/core';
import { mount } from '@ui-sdk/core/testing';
import { expect, test } from 'bun:test';
import { createAutoProgress } from './index';

const reasons: string[] = [];

const timer = definePrimitive({
  name: 'timer',
  options: { defaultValue: 'number' },
  live: ['value'],
  /** The starting state, from the first options. */
  state: (options: { defaultValue?: number }) => ({
    playing: false,
    value: options.defaultValue ?? 0
  }),
  /** Returns what the parts call. */
  api: (context) => ({
    autoProgress: createAutoProgress(context, {
      /** A full pass takes 80 milliseconds. */
      duration: () => 80,
      /** The progress runs once. */
      loop: () => false,
      /** Whether it is running. */
      playing: (state) => state.playing,
      /** Moves the progress a frame on. */
      set: (value) => {
        context.store.set({ value: Math.min(value, 1) });
      },
      /** Stops, and records why. */
      setPlaying: (playing, details) => {
        reasons.push(details.reason);
        context.store.set({ playing });
        return true;
      },
      /** The progress. */
      value: (state) => state.value
    }),
    /** Starts running, as a person would. */
    play: () => {
      context.store.set({ playing: true });
    }
  }),
  /** The parts. */
  slots: (slot) => ({
    root: slot({
      /** Runs the frames. */
      bind: (_el, part) => part.api.autoProgress.bind()
    })
  })
});

/**
 * Waits for frames to run.
 * @param ms - How long
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits until something holds, for up to three seconds.
 * @param holds - What to wait for
 */
const until = async (holds: () => boolean) => {
  for (let tries = 0; tries < 150 && !holds(); tries += 1) await wait(20);
};

test('createAutoProgress: it runs to the end, then stops and says why', async () => {
  reasons.length = 0;
  const view = mount(timer, {}, `<root></root>`);
  try {
    view.api.play();
    await until(() => !view.state.playing);
    expect(view.state.value).toBe(1);
    expect(view.state.playing).toBe(false);
    expect(reasons).toEqual(['end']);
  } finally {
    view.unmount();
  }
});

test('createAutoProgress: started at the end, it starts over', async () => {
  const view = mount(timer, { defaultValue: 1 }, `<root></root>`);
  try {
    view.api.play();
    await wait(30);
    expect(view.state.playing).toBe(true);
    expect(view.state.value).toBeLessThan(1);
  } finally {
    view.unmount();
  }
});
