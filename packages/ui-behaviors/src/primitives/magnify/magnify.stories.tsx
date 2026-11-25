import type { Story, StoryDefault } from '@ladle/react';
import { createParts } from '@ui-sdk/react/primitive';
import { magnify } from './index';

export default { title: 'Primitives/Magnify' } satisfies StoryDefault;

const { Lens, LensContent, Root, Trigger } = createParts(magnify, {
  lens: 'div',
  'lens-content': 'div',
  root: 'div',
  trigger: 'button'
});

const picture = (
  <div className="size-full bg-[repeating-conic-gradient(#94a3b8_0_25%,#fff_0_50%)] bg-size-[40px_40px]" />
);

/** Hover it, hold a finger on it, or press the button and use the arrow keys. */
export const Default: Story = () => (
  <Root className="relative size-80">
    {picture}
    <Trigger className="absolute right-2 bottom-2 bg-white px-2">
      Magnify
    </Trigger>
    <Lens className="size-32 rounded-full bg-white">
      <LensContent>{picture}</LensContent>
    </Lens>
  </Root>
);
