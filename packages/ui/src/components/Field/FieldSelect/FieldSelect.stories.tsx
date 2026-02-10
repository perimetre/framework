import type { Story, StoryDefault } from '@ladle/react';
import { AlertTriangle, Package, User } from 'lucide-react';
import FieldSelect, { type FieldSelectOption, type FieldSelectProps } from '.';

const defaultOptions: FieldSelectOption[] = [
  { value: 'small', label: 'Small - 2g (10 x 0.2g)' },
  { value: 'medium', label: 'Medium - 5g (10 x 0.5g)' },
  { value: 'large', label: 'Large - 10g (10 x 1g)' }
];

type Props = {
  label: string;
  options: FieldSelectOption[];
} & Omit<FieldSelectProps, 'options'>;

export default {
  argTypes: {
    corner: {
      control: { type: 'text' }
    },
    description: {
      control: { type: 'text' }
    },
    disabled: {
      control: { type: 'boolean' }
    },
    error: {
      control: { type: 'text' }
    },
    hint: {
      control: { type: 'text' }
    },
    label: {
      control: { type: 'text' },
      defaultValue: 'Label'
    },
    placeholder: {
      control: { type: 'text' }
    },
    required: {
      control: { type: 'boolean' },
      defaultValue: true
    }
  }
} satisfies StoryDefault<Props>;

export const Default: Story<Props> = ({ name, options, ...props }) => (
  <FieldSelect
    containerClassName="pui:max-w-md"
    name={name}
    options={options}
    {...props}
  />
);
Default.args = {
  name: 'field',
  options: defaultOptions,
  placeholder: 'Select an option…'
};

export const Placeholder: Story<Props> = (props) => <Default {...props} />;
Placeholder.args = {
  ...Default.args,
  description: 'Shows placeholder text when no value is selected.',
  value: ''
};

export const Description: Story<Props> = (props) => <Default {...props} />;
Description.args = {
  ...Default.args,
  description: 'Choose the size that fits your needs.'
};

export const Hint: Story<Props> = (props) => <Default {...props} />;
Hint.args = {
  ...Default.args,
  hint: 'You can change this later.'
};

export const WithError: Story<Props> = (props) => <Default {...props} />;
WithError.args = {
  ...Default.args,
  error: 'Please select an option.',
  value: ''
};

export const Corner: Story<Props> = (props) => <Default {...props} />;
Corner.args = {
  ...Default.args,
  corner: 'Optional'
};

export const Disabled: Story<Props> = (props) => <Default {...props} />;
Disabled.args = {
  ...Default.args,
  disabled: true,
  value: 'medium'
};

export const Leading: Story<Props> = (props) => <Default {...props} />;
Leading.args = {
  ...Default.args,
  leading: (
    <Package
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};

export const CustomTrailing: Story<Props> = (props) => <Default {...props} />;
CustomTrailing.args = {
  ...Default.args,
  trailing: (
    <AlertTriangle
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};

export const LeadingAndLabel: Story<Props> = (props) => <Default {...props} />;
LeadingAndLabel.args = {
  ...Default.args,
  label: 'Product size',
  leading: (
    <User
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};

export const ManyOptions: Story<Props> = (props) => <Default {...props} />;
ManyOptions.args = {
  ...Default.args,
  label: 'Country',
  options: [
    { value: 'ca', label: 'Canada' },
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'fr', label: 'France' },
    { value: 'de', label: 'Germany' },
    { value: 'jp', label: 'Japan' },
    { value: 'au', label: 'Australia' },
    { value: 'br', label: 'Brazil' }
  ],
  placeholder: 'Select country…'
};
