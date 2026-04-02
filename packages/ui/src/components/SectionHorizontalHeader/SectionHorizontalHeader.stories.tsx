import type { Story, StoryDefault } from '@ladle/react';
import SectionHorizontalHeader, {
  type SectionHorizontalHeaderProps
} from './index';

export default {
  title: 'Components/SectionHorizontalHeader',
  argTypes: {
    variant: {
      options: ['default', 'h1'],
      control: { type: 'select' },
      defaultValue: 'default'
    }
  }
} satisfies StoryDefault<SectionHorizontalHeaderProps>;

export const H1: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    eyebrow="Eyebrow text"
    title="Page Title as H1"
    variant="h1"
    content={
      <p>This is the content displayed on the right side of the header.</p>
    }
  />
);

export const Default: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    eyebrow="Eyebrow text"
    title="Section Title as H2"
    variant="default"
    content={
      <p>This is the content displayed on the right side of the header.</p>
    }
  />
);

export const WithExtra: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    eyebrow="Eyebrow text"
    title="Section Title with Extra"
    variant="default"
    content={
      <p>This is the content displayed on the right side of the header.</p>
    }
    extra={
      <div className="pui:flex pui:gap-2 pui:mt-4">
        <button className="pui:rounded pui:bg-pui-interactive-primary pui:px-4 pui:py-2 pui:text-pui-interactive-on-primary pui:font-bold">
          Primary Action
        </button>
        <button className="pui:rounded pui:border pui:border-pui-interactive-primary pui:px-4 pui:py-2">
          Secondary Action
        </button>
      </div>
    }
  />
);
