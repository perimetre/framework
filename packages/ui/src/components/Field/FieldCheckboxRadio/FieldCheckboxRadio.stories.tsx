import type { Story, StoryDefault } from '@ladle/react';
import FieldCheckboxRadio, { type FieldCheckboxRadioProps } from '.';

type Props = {
  label?: React.JSX.Element | string;
} & FieldCheckboxRadioProps;

export default {
  title: 'Components/Field/FieldCheckboxRadio',
  argTypes: {
    defaultChecked: {
      control: {
        type: 'boolean'
      },
      defaultValue: false
    },
    disabled: {
      control: {
        type: 'boolean'
      },
      defaultValue: false
    },
    indeterminate: {
      control: {
        type: 'boolean'
      },
      defaultValue: false
    },
    label: {
      control: {
        type: 'text'
      }
    },
    type: {
      control: {
        type: 'select'
      },
      options: ['checkbox', 'radio']
    },
    variant: {
      control: {
        type: 'select'
      },
      defaultValue: 'default',
      options: ['default', 'inverted']
    }
  }
} satisfies StoryDefault<Props>;

const Template: Story<Props> = ({ label, name, ...props }) => {
  const inputId = name ? `${name}-input` : 'checkbox-input';

  // Don't pass 'checked' from Ladle controls to keep inputs uncontrolled
  // This allows natural DOM behavior where clicking updates the checked state
  return (
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        id={inputId}
        name={name}
        {...props}
        onBlur={() => {
          console.log('onBlur');
        }}
        onChange={(e) => {
          console.log('onChange', e.target.checked);
        }}
        onFocus={() => {
          console.log('onFocus');
        }}
      />
      {label && (
        <label
          className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export const CheckboxWithLabel: Story<Props> = Template.bind({});
CheckboxWithLabel.args = {
  label: 'Accept terms and conditions',
  type: 'checkbox',
  name: 'terms'
};

export const CheckboxIndeterminate: Story<Props> = Template.bind({});
CheckboxIndeterminate.args = {
  label: 'Select all items',
  type: 'checkbox',
  indeterminate: true,
  name: 'select-all'
};

export const CheckboxNoLabel: Story<Props> = Template.bind({});
CheckboxNoLabel.args = {
  type: 'checkbox',
  name: 'checkbox-no-label',
  'aria-label': 'Checkbox without visible label'
};

export const CheckboxJSXLabel: Story<Props> = ({ variant = 'default' }) => (
  <div className="pui:flex pui:items-center pui:gap-3">
    <FieldCheckboxRadio
      id="terms-jsx-input"
      name="terms-jsx"
      type="checkbox"
      variant={variant}
      onBlur={() => {
        console.log('onBlur');
      }}
      onChange={(e) => {
        console.log('onChange', e.target.checked);
      }}
      onFocus={() => {
        console.log('onFocus');
      }}
    />
    <label
      className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
      htmlFor="terms-jsx-input"
    >
      I agree to the{' '}
      <button
        className="pui:text-pui-interactive-primary hover:pui:underline pui:bg-transparent pui:border-none pui:p-0 pui:cursor-pointer"
        type="button"
      >
        terms and conditions
      </button>
    </label>
  </div>
);

export const CheckboxWithHelp: Story<Props> = ({ variant = 'default' }) => (
  <div className="pui:space-y-2">
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        id="newsletter-input"
        name="newsletter"
        type="checkbox"
        variant={variant}
        onBlur={() => {
          console.log('onBlur');
        }}
        onChange={(e) => {
          console.log('onChange', e.target.checked);
        }}
        onFocus={() => {
          console.log('onFocus');
        }}
      />
      <label
        className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
        htmlFor="newsletter-input"
      >
        Subscribe to newsletter
      </label>
    </div>
    <p className="pui:ml-7 pui:text-sm pui:text-pui-fg-muted">
      Get the latest updates and offers delivered to your inbox
    </p>
  </div>
);

export const CheckboxWithError: Story<Props> = ({ variant = 'default' }) => (
  <div className="pui:space-y-2">
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        aria-describedby="terms-error"
        aria-invalid="true"
        className="pui:border-pui-feedback-error-strong"
        id="terms-error-input"
        name="terms-error"
        type="checkbox"
        variant={variant}
        onBlur={() => {
          console.log('onBlur');
        }}
        onChange={(e) => {
          console.log('onChange', e.target.checked);
        }}
        onFocus={() => {
          console.log('onFocus');
        }}
      />
      <label
        className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
        htmlFor="terms-error-input"
      >
        Accept terms and conditions
      </label>
    </div>
    <p
      className="pui:ml-7 pui:text-sm pui:text-pui-feedback-error-strong"
      id="terms-error"
    >
      You must accept the terms and conditions
    </p>
  </div>
);

export const CheckboxDisabled: Story<Props> = Template.bind({});
CheckboxDisabled.args = {
  label: 'Disabled checkbox',
  type: 'checkbox',
  disabled: true,
  name: 'disabled-checkbox'
};

export const CheckboxCheckedDisabled: Story<Props> = Template.bind({});
CheckboxCheckedDisabled.args = {
  label: 'Checked and disabled',
  type: 'checkbox',
  disabled: true,
  defaultChecked: true,
  name: 'checked-disabled'
};

export const RadioWithLabel: Story<Props> = Template.bind({});
RadioWithLabel.args = {
  label: 'Option 1',
  type: 'radio',
  name: 'radio-option'
};

export const RadioNoLabel: Story<Props> = Template.bind({});
RadioNoLabel.args = {
  type: 'radio',
  name: 'radio-no-label',
  'aria-label': 'Radio button without visible label'
};

export const RadioDisabled: Story<Props> = Template.bind({});
RadioDisabled.args = {
  label: 'Disabled radio',
  type: 'radio',
  disabled: true,
  name: 'disabled-radio'
};

export const RadioGroup: Story<Props> = ({ variant = 'default' }) => (
  <fieldset className="pui:space-y-3">
    <legend className="pui:text-sm pui:font-semibold pui:text-pui-fg-default pui:mb-3">
      Choose your preferred option
    </legend>
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        defaultChecked
        id="radio-option1"
        name="radio-group"
        type="radio"
        value="option1"
        variant={variant}
        onChange={(e) => {
          console.log('onChange', e.target.value);
        }}
      />
      <label
        className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
        htmlFor="radio-option1"
      >
        Option 1
      </label>
    </div>
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        id="radio-option2"
        name="radio-group"
        type="radio"
        value="option2"
        variant={variant}
        onChange={(e) => {
          console.log('onChange', e.target.value);
        }}
      />
      <label
        className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
        htmlFor="radio-option2"
      >
        Option 2
      </label>
    </div>
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        id="radio-option3"
        name="radio-group"
        type="radio"
        value="option3"
        variant={variant}
        onChange={(e) => {
          console.log('onChange', e.target.value);
        }}
      />
      <label
        className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
        htmlFor="radio-option3"
      >
        Option 3
      </label>
    </div>
  </fieldset>
);

export const CheckboxGroup: Story<Props> = ({ variant = 'default' }) => (
  <fieldset className="pui:space-y-3">
    <legend className="pui:text-sm pui:font-semibold pui:text-pui-fg-default pui:mb-3">
      Select your interests
    </legend>
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        defaultChecked
        id="interest-design"
        name="interests"
        type="checkbox"
        value="design"
        variant={variant}
        onChange={(e) => {
          console.log('onChange', e.target.value, e.target.checked);
        }}
      />
      <label
        className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
        htmlFor="interest-design"
      >
        Design
      </label>
    </div>
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        id="interest-development"
        name="interests"
        type="checkbox"
        value="development"
        variant={variant}
        onChange={(e) => {
          console.log('onChange', e.target.value, e.target.checked);
        }}
      />
      <label
        className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
        htmlFor="interest-development"
      >
        Development
      </label>
    </div>
    <div className="pui:flex pui:items-center pui:gap-3">
      <FieldCheckboxRadio
        id="interest-marketing"
        name="interests"
        type="checkbox"
        value="marketing"
        variant={variant}
        onChange={(e) => {
          console.log('onChange', e.target.value, e.target.checked);
        }}
      />
      <label
        className="pui:text-sm pui:font-medium pui:text-pui-fg-default pui:cursor-pointer"
        htmlFor="interest-marketing"
      >
        Marketing
      </label>
    </div>
  </fieldset>
);
