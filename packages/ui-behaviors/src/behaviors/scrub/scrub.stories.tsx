import type { Story, StoryDefault } from '@ladle/react';
import { css, definePrimitive } from '@ui-sdk/core';
import { createParts } from '@ui-sdk/react/primitive';
import { createScrub } from './index';

export default { title: 'Behaviors/createScrub' } satisfies StoryDefault;

// `sequence` uses this behaviour to turn a product. Here it moves a divider,
// without a loop. A real component also needs a keyboard: see `sequence`.
const compare = definePrimitive({
  name: 'compare',
  /** The starting state. */
  state: () => ({ value: 0.5 }),
  /** Returns what the parts call. */
  api: (context) => ({
    scrub: createScrub(context, {
      /** The divider stops at the edges. */
      loop: () => false,
      /** Moves the divider. */
      set: (value) => {
        context.store.set({ value });
        return true;
      },
      /** Where the divider is. */
      value: (state) => state.value
    })
  }),
  /** The parts. */
  slots: (slot) => ({
    root: slot({
      /** Where the divider is, for CSS, and the styles a drag needs. */
      attrs: (state, { api }) => ({
        style: `${css({ '--position': `${String(state.value * 100)}%` })};${api.scrub.surfaceStyle()}`
      }),
      on: {
        /** A drag may start. */
        pointerdown: (event, { api, el }) => {
          if (el) api.scrub.pointerdown(event, el);
        }
      },
      /** Listens for sideways scrolls. */
      bind: (el, part) => part.api.scrub.bind(el)
    })
  })
});

const { Root } = createParts(compare, { root: 'div' });

/** Drag anywhere on it, or scroll sideways over it. */
export const BeforeAndAfter: Story = () => (
  <Root className="size-64 bg-[linear-gradient(to_right,#0f172a_var(--position),#fde68a_var(--position))]" />
);
