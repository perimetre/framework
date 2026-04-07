import Button from '@/components/Button';
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
    title="CT-Series"
    variant="h1"
    content={
      <p>
        The CT-Series combines Ford Transit's proven reliability with Micro
        Bird's purpose-built body design, delivering exceptional fuel economy,
        panoramic visibility, and passenger comfort for commercial fleets.
      </p>
    }
  />
);

export const Default: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    eyebrow="Eyebrow text"
    title="CT-Series"
    variant="default"
    content={
      <p>
        The CT-Series combines Ford Transit's proven reliability with Micro
        Bird's purpose-built body design, delivering exceptional fuel economy,
        panoramic visibility, and passenger comfort for commercial fleets.
      </p>
    }
  />
);

export const WithExtra: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    eyebrow="Eyebrow text"
    title="CT-Series"
    variant="default"
    content={
      <p>
        The CT-Series combines Ford Transit's proven reliability with Micro
        Bird's purpose-built body design, delivering exceptional fuel economy,
        panoramic visibility, and passenger comfort for commercial fleets.
      </p>
    }
    extra={
      <div className="pui:flex pui:gap-2 pui:mt-4">
        <Button className="pui:rounded pui:bg-pui-interactive-primary pui:text-pui-interactive-on-primary pui:px-4 pui:py-2 pui:text-white pui:font-bold pui:hover:bg-[#000] pui:normal-case">
          Primary Action
        </Button>
        <Button className="pui:rounded pui:border pui:hover:bg-pui-interactive-primary pui:text-pui-interactive-primary pui:px-4 pui:py-2 pui:normal-case">
          Secondary Action
        </Button>
      </div>
    }
  />
);
