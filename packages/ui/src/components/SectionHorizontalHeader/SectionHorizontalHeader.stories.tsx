import Button from '@/components/Button';
import type { Story, StoryDefault } from '@ladle/react';
import SectionHorizontalHeader, {
  type SectionHorizontalHeaderProps
} from './index';

export default {
  title: 'Components/SectionHorizontalHeader',
  argTypes: {
    variant: {
      options: ['default', 'compact'],
      control: { type: 'select' },
      defaultValue: 'default'
    }
  }
} satisfies StoryDefault<SectionHorizontalHeaderProps>;

export const H1: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    as="h1"
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

export const Default: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    as="h1"
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

export const WithExtra: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    as="h1"
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
    extra={
      <div className="pui:flex pui:gap-2">
        <Button variant="primary">Primary Action</Button>
        <Button variant="outline">Secondary Action</Button>
      </div>
    }
  />
);

export const Compact: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    as="h3"
    eyebrow="Key Advantages"
    variant="compact"
    content={
      <p>
        Designed for commercial operations that value long-term reliability,
        efficiency, and passenger comfort.
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

export const WithDownload: Story<SectionHorizontalHeaderProps> = () => (
  <SectionHorizontalHeader
    as="h3"
    eyebrow="Key Advantages"
    title="Specifications"
    variant="compact"
    content={
      <div>
        <p>
          Designed for commercial operations that value long-term reliability,
          efficiency, and passenger comfort.
        </p>
        <Button className="pui:mt-4" variant="primary">
          Download Brochure
          <svg
            className="pui:size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    }
  />
);
