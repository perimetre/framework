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
      options: ['primary', 'secondary', 'outline', 'primaryLight', 'flat'],
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

export const Secondary = DefaultComp.bind({});
Secondary.args = {
  label: 'Shop Now',
  variant: 'secondary'
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

export const Flat = DefaultComp.bind({});
Flat.args = {
  label: 'Learn More',
  variant: 'flat'
};

export const Small = Default.bind({});
Small.args = {
  label: 'Shop',
  size: 'small'
};

/**
 * Slotted shadow colour: the OIQ button's hard offset shadow defaults to
 * black, but a consumer recolours it with the `pui:button-shadow-*` utility
 * (or a `[--pui-button-shadow-color:…]` arbitrary property from an app).
 */
export const SlottedShadow: Story<Props> = ({
  label = 'Shop Now',
  ...props
}) => (
  <div
    style={{
      display: 'flex',
      gap: '3rem',
      alignItems: 'flex-start',
      background: '#f5f5f5',
      padding: '2.5rem'
    }}
  >
    <Button {...props} variant="primary">
      {label} (default)
    </Button>
    <Button
      {...props}
      className="pui:button-shadow-primary-9"
      variant="primary"
    >
      {label} (slot)
    </Button>
    <Button
      {...props}
      className="pui:button-shadow-[#490368]"
      variant="primary"
    >
      {label} (arbitrary)
    </Button>
  </div>
);

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
    <Button {...props} variant="secondary">
      {label}
    </Button>
    <Button {...props} variant="outline">
      {label}
    </Button>
    <Button {...props} variant="primaryLight">
      {label}
    </Button>
    <Button {...props} variant="flat">
      {label}
    </Button>
  </div>
);
