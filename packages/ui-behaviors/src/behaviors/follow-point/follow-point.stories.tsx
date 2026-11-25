import type { Story, StoryDefault } from '@ladle/react';
import { definePrimitive } from '@ui-sdk/core';
import { createParts } from '@ui-sdk/react/primitive';
import { createFollowPoint } from './index';

export default { title: 'Behaviors/createFollowPoint' } satisfies StoryDefault;

// `magnify` uses this behaviour for a lens. Here it moves a light. A real
// component also needs a trigger for keyboards: see `magnify`.
const spotlight = definePrimitive({
  name: 'spotlight',
  live: ['x', 'y'],
  /** The starting state. */
  state: () => ({ active: false, x: 0.5, y: 0.5 }),
  /** Returns what the parts call. */
  api: (context) => ({
    follow: createFollowPoint(context, {
      /** Whether the light is on. */
      active: (state) => state.active,
      /** Where the light is. */
      point: (state) => state,
      /** Turns the light on or off. */
      setActive: (active) => {
        context.store.set({ active });
        return true;
      },
      /** Moves the light. */
      setPoint: (point) => {
        context.store.set(point);
      }
    })
  }),
  /** The parts. */
  slots: (slot) => ({
    root: slot({
      /** Marks the surface while the light is on. */
      attrs: (state) => ({ 'data-active': state.active ? '' : undefined }),
      on: {
        /** A mouse or pen turns the light on. */
        pointerenter: (event, { api, el }) => {
          if (el) api.follow.pointerenter(event, el);
        },
        /** A mouse or pen turns the light off. */
        pointerleave: (event, { api }) => {
          api.follow.pointerleave(event);
        },
        /** The light follows the pointer. */
        pointermove: (event, { api, el }) => {
          if (el) api.follow.pointermove(event, el);
        }
      },
      /** Binds the touch hold and writes where the light is. */
      bind: (el, part) => {
        const unbind = part.api.follow.bind(el);
        const unsubscribe = part.store.subscribe(() => {
          const { x, y } = part.store.get();
          el.style.setProperty('--x', `${String(x * 100)}%`);
          el.style.setProperty('--y', `${String(y * 100)}%`);
        });
        return () => {
          unbind();
          unsubscribe();
        };
      }
    })
  })
});

const { Root } = createParts(spotlight, { root: 'div' });

/** Hover the card, or hold a finger on it. */
export const Spotlight: Story = () => (
  <Root className="size-64 bg-slate-900 data-active:bg-[radial-gradient(circle_at_var(--x)_var(--y),#60a5fa,#0f172a_40%)]" />
);
