import type { Story, StoryDefault } from '@ladle/react';
import StatItem from './index';

export default {
  title: 'Components/StatItem'
} satisfies StoryDefault;

export const BasicEyebrow: Story = () => (
  <StatItem content="10,000+" eyebrow="Total Users" />
);

export const EyebrowWithIcon: Story = () => (
  <StatItem
    content="1,284"
    eyebrow={
      <span className="pui:flex pui:items-center pui:gap-1">
        <svg
          className="pui:size-4"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-5h2v2h-2zm0-8h2v6h-2z" />
        </svg>
        Active Sessions
      </span>
    }
  />
);

export const WithPrepend: Story = () => (
  <StatItem content="10,000" eyebrow="Distance Covered" prepend="km" />
);

export const WithExtra: Story = () => (
  <StatItem
    content="$1.2M"
    extra="Compared to last year's $980K"
    eyebrow="Revenue"
  />
);
