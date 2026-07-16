import type { Story, StoryDefault } from '@ladle/react';
import Tag, { type TagProps } from './index';

type Props = {
  label?: string;
} & TagProps;

export default {
  title: 'Components/Tag',
  argTypes: {
    label: {
      control: { type: 'text' },
      defaultValue: 'Sec 1'
    },
    size: {
      options: ['small', 'large'],
      control: { type: 'select' },
      defaultValue: 'small'
    },
    selected: {
      control: { type: 'boolean' },
      defaultValue: false
    },
    disabled: {
      control: { type: 'boolean' },
      defaultValue: false
    }
  }
} satisfies StoryDefault<Props>;

const DefaultComp: Story<Props> = ({ label, ...props }) => (
  <Tag {...props}>{label}</Tag>
);

export const Default = DefaultComp.bind({});
Default.args = { label: 'Sec 1' };

export const Selected = DefaultComp.bind({});
Selected.args = { label: 'Sec 1', selected: true };

export const Disabled = DefaultComp.bind({});
Disabled.args = { label: 'Sec 1', disabled: true };

export const Dismissible: Story<Props> = ({ label = 'Sec 1', ...props }) => (
  <Tag {...props} onDismiss={() => undefined}>
    {label}
  </Tag>
);

export const AllStates: Story<Props> = ({ label = 'Sec 1' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      alignItems: 'flex-start'
    }}
  >
    {(['small', 'large'] as const).map((size) => (
      <div
        key={size}
        style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
      >
        <Tag size={size}>{label}</Tag>
        <Tag size={size} onDismiss={() => undefined}>
          {label}
        </Tag>
        <Tag selected size={size}>
          {label}
        </Tag>
        <Tag selected size={size} onDismiss={() => undefined}>
          {label}
        </Tag>
        <Tag disabled size={size}>
          {label}
        </Tag>
        <Tag disabled size={size} onDismiss={() => undefined}>
          {label}
        </Tag>
      </div>
    ))}
  </div>
);
