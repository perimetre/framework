import type { Story, StoryDefault } from '@ladle/react';
import Button, { type ButtonProps } from './index';

type Props = {
  label?: string;
} & ButtonProps;

export default {
  title: 'Components/Button',
  argTypes: {
    label: {
      control: { type: 'text' },
      defaultValue: 'Shop Now'
    },
    size: {
      options: ['small', 'default'],
      control: { type: 'select' },
      defaultValue: 'default'
    },
    variant: {
      options: ['primary', 'outline', 'primaryLight', 'transparent'],
      control: { type: 'select' },
      defaultValue: 'primary'
    }
  }
} satisfies StoryDefault<Props>;

const DefaultComp: Story<Props> = ({ label, ...props }) => (
  <Button {...props}>{label}</Button>
);

export const Default = DefaultComp.bind({});

export const Primary = DefaultComp.bind({});
Primary.args = {
  label: 'Shop Now',
  variant: 'primary'
};

export const Outline = DefaultComp.bind({});
Outline.args = {
  label: 'Learn More',
  variant: 'outline'
};

export const PrimaryLight = DefaultComp.bind({});
PrimaryLight.args = {
  label: 'View Details',
  variant: 'primaryLight'
};

export const Transparent = DefaultComp.bind({});
Transparent.args = {
  label: 'Cancel',
  variant: 'transparent'
};

export const Small = Default.bind({});
Small.args = {
  label: 'Shop',
  size: 'small'
};

export const AllVariants: Story<Props> = ({ label = 'Shop Now', ...props }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      alignItems: 'flex-start'
    }}
  >
    <Button {...props} variant="primary">
      {label}
    </Button>
    <Button {...props} variant="outline">
      {label}
    </Button>
    <Button {...props} variant="primaryLight">
      {label}
    </Button>
    <Button {...props} variant="transparent">
      {label}
    </Button>
  </div>
);
