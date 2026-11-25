import type { Story, StoryDefault } from '@ladle/react';
import { createParts } from '@ui-sdk/react/primitive';
import { sequence } from './index';

export default { title: 'Primitives/Sequence' } satisfies StoryDefault;

const { Next, PlayToggle, Previous, Root, Viewport } = createParts(sequence, {
  next: 'button',
  'play-toggle': 'button',
  previous: 'button',
  root: 'div',
  viewport: 'div'
});

/** Drag it, scroll sideways over it, hold a button, or press Play. */
export const Default: Story = () => (
  <Root className="flex flex-col items-start gap-2">
    <Viewport
      aria-label="A card, turning"
      className="grid size-64 place-items-center bg-slate-100"
    >
      <div className="size-32 rotate-y-[calc(var(--sequence-progress)*360deg)] bg-blue-600" />
    </Viewport>
    <div className="flex gap-2">
      <Previous>Turn left</Previous>
      <PlayToggle>{({ playing }) => (playing ? 'Pause' : 'Play')}</PlayToggle>
      <Next>Turn right</Next>
    </div>
  </Root>
);
