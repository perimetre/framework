import type { Story, StoryDefault } from '@ladle/react';
import { definePrimitive, live } from '@ui-sdk/core';
import { createParts } from '@ui-sdk/react/primitive';
import { createLinkedHighlight } from './index';

export default {
  title: 'Behaviors/createLinkedHighlight'
} satisfies StoryDefault;

type State = { highlighted: null | string };

// `locator` uses this behaviour to link a list to a map. Here it links a
// legend to the bars of a chart.
const chart = definePrimitive({
  name: 'chart',
  live: ['highlighted'],
  /** The starting state. */
  state: (): State => ({ highlighted: null }),
  /** Returns what the parts call. */
  api: (context) => ({
    highlight: createLinkedHighlight(context, {
      /** Highlights a series. */
      set: (highlighted) => {
        context.store.set({ highlighted });
        return true;
      },
      /** The highlighted series. */
      value: (state) => state.highlighted
    })
  }),
  /** The parts. Both slots show the same series, so they share one definition. */
  slots: (slot) => {
    /** A part that shows a series, and highlights it while hovered. */
    const series = () =>
      slot<{ value: string }>({
        props: { value: 'string' },
        /** Written straight to the element, so nothing renders. */
        live: live((state: State, part) => ({
          'data-highlighted': state.highlighted === part.key ? '' : undefined
        })),
        on: {
          /** A pointer moved onto it. */
          pointerenter: (event, { api, key }) => {
            api.highlight.enter(key, { event, reason: 'item-hover' });
          },
          /** A pointer left it. */
          pointerleave: (event, { api, key }) => {
            api.highlight.leave(key, { event, reason: 'item-hover' });
          }
        }
      });
    return { bar: series(), label: series(), root: slot({}) };
  }
});

const { Bar, Label, Root } = createParts(chart, {
  bar: 'div',
  label: 'span',
  root: 'div'
});

const SERIES = ['Chairs', 'Tables', 'Lamps'];

/** Hover a bar or a label: the same series lights up in both. */
export const LegendAndBars: Story = () => (
  <Root>
    <div className="flex h-32 items-end gap-2">
      {SERIES.map((name, index) => (
        <Bar
          key={name}
          className="w-16 bg-slate-400 data-highlighted:bg-blue-600"
          style={{ height: `${String(40 + index * 25)}%` }}
          value={name}
        />
      ))}
    </div>
    <div className="flex gap-2">
      {SERIES.map((name) => (
        <Label
          key={name}
          className="w-16 data-highlighted:text-blue-600"
          value={name}
        >
          {name}
        </Label>
      ))}
    </div>
  </Root>
);
