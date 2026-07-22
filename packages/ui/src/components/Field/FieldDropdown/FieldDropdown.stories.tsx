import type { Story, StoryDefault } from '@ladle/react';
import { Check, Package } from 'lucide-react';
import { useState } from 'react';
import FieldDropdown, { type DropdownItem, type FieldDropdownProps } from '.';

const defaultItems: DropdownItem[] = [
  { id: 'small', label: 'Small - 2g (10 x 0.2g)' },
  { id: 'medium', label: 'Medium - 5g (10 x 0.5g)' },
  { id: 'large', label: 'Large - 10g (10 x 1g)' }
];

type Props = {
  items: DropdownItem[];
  label: string;
} & Omit<FieldDropdownProps<DropdownItem>, 'items'>;

export default {
  title: 'Components/Field/FieldDropdown',
  argTypes: {
    corner: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    disabled: { control: { type: 'boolean' } },
    error: { control: { type: 'text' } },
    hint: { control: { type: 'text' } },
    label: { control: { type: 'text' }, defaultValue: 'Label' },
    placeholder: { control: { type: 'text' } }
  }
} satisfies StoryDefault<Props>;

export const Default: Story<Props> = ({ items, name, ...props }) => {
  const [value, setValue] = useState<DropdownItem | null>(null);
  return (
    <FieldDropdown<DropdownItem>
      containerClassName="pui:max-w-md"
      items={items}
      name={name}
      value={value}
      onChange={(next) => {
        setValue(next as DropdownItem | null);
      }}
      {...props}
    />
  );
};
Default.args = {
  name: 'field',
  items: defaultItems,
  label: 'Product size',
  placeholder: 'Select an option…'
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
  error: 'Please select an option.'
};

export const Disabled: Story<Props> = (props) => <Default {...props} />;
Disabled.args = {
  ...Default.args,
  disabled: true
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

export const ItemAddons: Story<Props> = (props) => <Default {...props} />;
ItemAddons.args = {
  ...Default.args,
  label: 'Product size',
  // Leading icon on every option; custom trailing check only on the selected one.
  itemLeading: () => (
    <Package aria-hidden className="pui:size-4 pui:text-pui-fg-subtle" />
  ),
  itemTrailing: (_item, { selected }) =>
    selected ? <Check aria-hidden className="pui:size-4" /> : null
};

export const Multiple: Story<Props> = ({ items, name, ...props }) => {
  const [value, setValue] = useState<DropdownItem[]>([]);
  return (
    <FieldDropdown<DropdownItem>
      multiple
      containerClassName="pui:max-w-md"
      items={items}
      name={name}
      value={value}
      onChange={(next) => {
        setValue(next as DropdownItem[]);
      }}
      {...props}
    />
  );
};
Multiple.args = {
  ...Default.args,
  label: 'Sizes',
  placeholder: 'Select one or more…'
};

export const ManyOptions: Story<Props> = (props) => <Default {...props} />;
ManyOptions.args = {
  ...Default.args,
  label: 'Country',
  items: [
    { id: 'ca', label: 'Canada' },
    { id: 'us', label: 'United States' },
    { id: 'uk', label: 'United Kingdom' },
    { id: 'fr', label: 'France' },
    { id: 'de', label: 'Germany' },
    { id: 'jp', label: 'Japan' },
    { id: 'au', label: 'Australia' },
    { id: 'br', label: 'Brazil' }
  ],
  placeholder: 'Select country…'
};
