import type { Story, StoryDefault } from '@ladle/react';
import FieldRadioGroup, { type FieldRadioGroupProps } from '.';

export default {
  title: 'Components/Field/FieldRadioGroup',
  argTypes: {
    disabled: {
      control: {
        type: 'boolean'
      },
      defaultValue: false
    },
    required: {
      control: {
        type: 'boolean'
      },
      defaultValue: false
    }
  }
} satisfies StoryDefault<FieldRadioGroupProps>;

const options = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' }
];

export const Default: Story<FieldRadioGroupProps> = (props) => (
  <FieldRadioGroup
    {...props}
    label="Choose your preferred option"
    name="radio-default"
    options={options}
    onChange={(e) => {
      console.log('onChange', e.target.value);
    }}
  />
);

export const Required: Story<FieldRadioGroupProps> = (props) => (
  <FieldRadioGroup
    {...props}
    required
    label="Choose your preferred option"
    name="radio-required"
    options={options}
    onChange={(e) => {
      console.log('onChange', e.target.value);
    }}
  />
);

export const WithError: Story<FieldRadioGroupProps> = (props) => (
  <FieldRadioGroup
    {...props}
    required
    error="Please select an option"
    label="Choose your preferred option"
    name="radio-error"
    options={options}
    onChange={(e) => {
      console.log('onChange', e.target.value);
    }}
  />
);

export const WithHint: Story<FieldRadioGroupProps> = (props) => (
  <FieldRadioGroup
    {...props}
    hint="Select the option that best fits your needs"
    label="Choose your preferred option"
    name="radio-hint"
    options={options}
    onChange={(e) => {
      console.log('onChange', e.target.value);
    }}
  />
);

export const Disabled: Story<FieldRadioGroupProps> = (props) => (
  <FieldRadioGroup
    {...props}
    disabled
    label="Choose your preferred option"
    name="radio-disabled"
    options={options}
  />
);

export const WithRichLabels: Story<FieldRadioGroupProps> = (props) => (
  <FieldRadioGroup
    {...props}
    required
    label="Hotel Accommodations Needed"
    name="hotel-accommodations"
    options={[
      {
        label:
          'Yes: A representative from Sprig will contact you regarding hotel accommodations.',
        value: 'Yes'
      },
      { label: 'No', value: 'No' }
    ]}
    onChange={(e) => {
      console.log('onChange', e.target.value);
    }}
  />
);
