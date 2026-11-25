import type { Story, StoryDefault } from '@ladle/react';
import { definePrimitive } from '@ui-sdk/core';
import { createParts } from '@ui-sdk/react/primitive';
import { createAutoProgress } from './index';

export default { title: 'Behaviors/createAutoProgress' } satisfies StoryDefault;

// `sequence` uses this behaviour to turn a product on its own. Here it fills
// a bar once and stops.
const timer = definePrimitive({
  name: 'timer',
  live: ['value'],
  /** The starting state. */
  state: () => ({ playing: false, value: 0 }),
  /** Returns what the parts call. */
  api: (context) => ({
    autoProgress: createAutoProgress(context, {
      /** The bar fills once. */
      loop: () => false,
      /** Whether the bar is filling. */
      playing: (state) => state.playing,
      /** Fills the bar a frame further. */
      set: (value) => {
        context.store.set({ value: Math.min(value, 1) });
      },
      /** Stops at the end. */
      setPlaying: (playing) => {
        context.store.set({ playing });
        return true;
      },
      /** How full the bar is. */
      value: (state) => state.value
    })
  }),
  /** The parts. */
  slots: (slot) => ({
    root: slot({
      /** Runs the frames and writes how full the bar is. */
      bind: (el, part) => {
        /** Writes the progress for CSS. */
        const write = () => {
          el.style.setProperty('--progress', String(part.store.get().value));
        };
        write();
        const unbind = part.api.autoProgress.bind();
        const unsubscribe = part.store.subscribe(write);
        return () => {
          unbind();
          unsubscribe();
        };
      }
    }),
    toggle: slot({
      /** A plain button. */
      attrs: () => ({ type: 'button' }),
      /** Starts or stops the bar. A person asked, so reduced motion allows it. */
      press: ({ api, store }) => {
        api.autoProgress.allow();
        store.set({ playing: !store.get().playing });
      }
    })
  })
});

const { Root, Toggle } = createParts(timer, { root: 'div', toggle: 'button' });

/** Press the button: the bar fills over four seconds and stops. */
export const Timer: Story = () => (
  <Root>
    <div className="h-2 w-64 origin-left scale-x-(--progress) bg-blue-600" />
    <Toggle>Play or pause</Toggle>
  </Root>
);
