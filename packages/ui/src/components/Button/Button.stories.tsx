import type { Story, StoryDefault } from '@ladle/react';
import Button, { type ButtonProps } from './index';

type Props = {
  label?: string;
} & ButtonProps;

export default {
  argTypes: {
    label: {
      control: { type: 'text' },
      defaultValue: 'Shop Now'
    },
    size: {
      options: ['small', 'default'],
      control: { type: 'select' },
      defaultValue: 'default'
    }
  }
} satisfies StoryDefault<Props>;

const DefaultComp: Story<Props> = ({ label, ...props }) => (
  <Button {...props}>{label}</Button>
);

export const Default = DefaultComp.bind({});

export const Small = Default.bind({});
Small.args = {
  label: 'Shop',
  size: 'small'
};
