import type { Story, StoryDefault } from '@ladle/react';
import CarouselButton from './index';

export default {
  title: 'Components/CarouselButton'
} satisfies StoryDefault;

export const Default: Story = () => (
  <div className="pui:flex pui:items-center pui:gap-4">
    <CarouselButton aria-label="Previous" direction="prev" />
    <CarouselButton aria-label="Next" direction="next" />
  </div>
);
