import type { Story, StoryDefault } from '@ladle/react';
import SectionCenteredHeader, {
  type SectionCenteredHeaderProps
} from './index';

export default {
  title: 'Components/SectionCenteredHeader',
  argTypes: {
    variant: {
      options: ['default', 'h1'],
      control: { type: 'select' },
      defaultValue: 'default'
    }
  }
} satisfies StoryDefault<SectionCenteredHeaderProps>;

export const Default: Story<SectionCenteredHeaderProps> = () => (
  <SectionCenteredHeader
    eyebrow="Built on Ford Transit Chassis"
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

export const WithExtra: Story<SectionCenteredHeaderProps> = () => (
  <SectionCenteredHeader
    as="h1"
    eyebrow="Built on Ford Transit Chassis"
    variant="h1"
    content={
      <p>
        The CT-Series combines Ford Transit's proven reliability with Micro
        Bird's purpose-built body design, delivering exceptional fuel economy,
        panoramic visibility, and passenger comfort for commercial fleets.
      </p>
    }
    title={
      <>
        Why Operators Choose
        <br />
        <span className="pui:text-pui-primary-9">The CT-Series</span>
      </>
    }
  />
);
