import type { Story, StoryDefault } from '@ladle/react';
import Badge, { type BadgeProps } from './index';

type Props = {
  label?: string;
} & BadgeProps;

export default {
  argTypes: {
    label: {
      control: { type: 'text' },
      defaultValue: 'Badge'
    },
    size: {
      options: ['1', '2', '3'],
      control: { type: 'select' },
      defaultValue: '1'
    },
    variant: {
      options: ['solid', 'soft', 'surface', 'outline'],
      control: { type: 'select' },
      defaultValue: 'soft'
    }
  }
} satisfies StoryDefault<Props>;

const DefaultComp: Story<Props> = ({ label, ...props }) => (
  <Badge {...props}>{label}</Badge>
);

export const Default = DefaultComp.bind({});

// Size variants
export const Size1 = DefaultComp.bind({});
Size1.args = {
  className: 'pui:bg-blue-100 pui:text-blue-700',
  label: 'New',
  size: '1'
};

export const Size2 = DefaultComp.bind({});
Size2.args = {
  className: 'pui:bg-orange-100 pui:text-orange-700',
  label: 'In Progress',
  size: '2'
};

export const Size3 = DefaultComp.bind({});
Size3.args = {
  className: 'pui:bg-green-100 pui:text-green-700',
  label: 'Complete',
  size: '3'
};

// Visual style variants
export const Solid = DefaultComp.bind({});
Solid.args = {
  className: 'pui:bg-blue-600 pui:text-white',
  label: 'Solid',
  size: '2',
  variant: 'solid'
};

export const Soft = DefaultComp.bind({});
Soft.args = {
  className: 'pui:bg-blue-100 pui:text-blue-700',
  label: 'Soft',
  size: '2',
  variant: 'soft'
};

export const Surface = DefaultComp.bind({});
Surface.args = {
  className: 'pui:bg-white pui:border pui:border-blue-200 pui:text-blue-700',
  label: 'Surface',
  size: '2',
  variant: 'surface'
};

export const Outline = DefaultComp.bind({});
Outline.args = {
  className: 'pui:border pui:border-blue-500 pui:text-blue-700',
  label: 'Outline',
  size: '2',
  variant: 'outline'
};

// Color variations
export const ColorVariations: Story<Props> = () => (
  <div className="pui:flex pui:flex-wrap pui:gap-4 pui:items-center">
    <Badge className="pui:bg-blue-100 pui:text-blue-700" variant="soft">
      Blue
    </Badge>
    <Badge className="pui:bg-green-100 pui:text-green-700" variant="soft">
      Green
    </Badge>
    <Badge className="pui:bg-orange-100 pui:text-orange-700" variant="soft">
      Orange
    </Badge>
    <Badge className="pui:bg-red-100 pui:text-red-700" variant="soft">
      Red
    </Badge>
    <Badge className="pui:bg-purple-100 pui:text-purple-700" variant="soft">
      Purple
    </Badge>
    <Badge className="pui:bg-gray-100 pui:text-gray-700" variant="soft">
      Gray
    </Badge>
  </div>
);

// Status badges example
export const StatusBadges: Story<Props> = () => (
  <div className="pui:flex pui:flex-col pui:gap-4">
    <div className="pui:flex pui:gap-3 pui:items-center">
      <span className="pui:w-24 pui:text-sm">Soft:</span>
      <Badge className="pui:bg-orange-100 pui:text-orange-700" variant="soft">
        In progress
      </Badge>
      <Badge className="pui:bg-blue-100 pui:text-blue-700" variant="soft">
        In review
      </Badge>
      <Badge className="pui:bg-green-100 pui:text-green-700" variant="soft">
        Complete
      </Badge>
    </div>
    <div className="pui:flex pui:gap-3 pui:items-center">
      <span className="pui:w-24 pui:text-sm">Solid:</span>
      <Badge className="pui:bg-orange-600 pui:text-white" variant="solid">
        In progress
      </Badge>
      <Badge className="pui:bg-blue-600 pui:text-white" variant="solid">
        In review
      </Badge>
      <Badge className="pui:bg-green-600 pui:text-white" variant="solid">
        Complete
      </Badge>
    </div>
    <div className="pui:flex pui:gap-3 pui:items-center">
      <span className="pui:w-24 pui:text-sm">Outline:</span>
      <Badge
        className="pui:border pui:border-orange-500 pui:text-orange-700"
        variant="outline"
      >
        In progress
      </Badge>
      <Badge
        className="pui:border pui:border-blue-500 pui:text-blue-700"
        variant="outline"
      >
        In review
      </Badge>
      <Badge
        className="pui:border pui:border-green-500 pui:text-green-700"
        variant="outline"
      >
        Complete
      </Badge>
    </div>
  </div>
);

// All sizes comparison
export const AllSizes: Story<Props> = () => (
  <div className="pui:flex pui:gap-4 pui:items-center">
    <Badge className="pui:bg-blue-100 pui:text-blue-700" size="1">
      Size 1
    </Badge>
    <Badge className="pui:bg-blue-100 pui:text-blue-700" size="2">
      Size 2
    </Badge>
    <Badge className="pui:bg-blue-100 pui:text-blue-700" size="3">
      Size 3
    </Badge>
  </div>
);
