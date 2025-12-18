import type { Story, StoryDefault } from '@ladle/react';
import { User } from 'lucide-react';
import FieldPassword, { type FieldPasswordProps } from '.';

type Props = {
  label: string;
} & FieldPasswordProps;

export default {
  argTypes: {
    corner: {
      control: {
        type: 'text'
      }
    },
    description: {
      control: {
        type: 'text'
      }
    },
    disabled: {
      control: {
        type: 'boolean'
      }
    },
    error: {
      control: {
        type: 'text'
      }
    },
    hint: {
      control: {
        type: 'text'
      }
    },
    label: {
      control: {
        type: 'text'
      },
      defaultValue: 'Label'
    },
    readOnly: {
      control: {
        type: 'boolean'
      }
    },
    required: {
      control: {
        type: 'boolean'
      },
      defaultValue: true
    }
  }
} satisfies StoryDefault<Props>;

export const Default: Story<Props> = ({ ...props }) => (
  <FieldPassword containerClassName="pui:max-w-md" {...props} name="field" />
);
Default.args = {
  placeholder: 'Write something...'
};

export const Description = Default.bind({});
Description.args = {
  description: 'This is a field'
};

export const Hint = Default.bind({});
Hint.args = {
  hint: 'You can also add a hint'
};

export const WithError = Default.bind({});
WithError.args = {
  error: 'This is an error'
};

export const Corner = Default.bind({});
Corner.args = {
  corner: 'Optional'
};

export const Disabled = Default.bind({});
Disabled.args = {
  defaultValue: 'I am disabled',
  disabled: true
};

export const ReadOnly = Default.bind({});
ReadOnly.args = {
  defaultValue: 'You cannot change me',
  readOnly: true
};

export const Leading = Default.bind({});
Leading.args = {
  leading: (
    <User
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};
