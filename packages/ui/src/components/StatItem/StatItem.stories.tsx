import type { Story, StoryDefault } from '@ladle/react';
import { ActivityIcon } from 'lucide-react';
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
        <ActivityIcon className="pui:size-4" />
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
