import { cn } from '@perimetre/classnames';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import FieldCheckboxRadio from '../FieldCheckboxRadio';
import FieldLabel from '../FieldLabel';
import FieldLower, { type FieldLowerProps } from '../FieldLower';

export type FieldRadioGroupOption = { label: React.ReactNode; value: string };

export type FieldRadioGroupProps = {
  containerClassName?: string;
  name: string;
  options?: FieldRadioGroupOption[];
} & {
  label?: React.ReactNode;
  required?: boolean;
} & ForceRequiredProps<Partial<FieldLowerProps>, 'error'> &
  Omit<
    React.ComponentPropsWithRef<'input'>,
    'children' | 'name' | 'type' | 'value'
  >;

/**
 * Radio group field. Renders a `<fieldset>` with a `<legend>` label and
 * a list of `FieldCheckboxRadio` inputs sharing the same `name`.
 *
 * Follows the same FieldLabel / FieldLower structure as FieldSelect and
 * FieldInput. Compatible with React Hook Form `register()`.
 *
 * Includes a workaround for the `:indeterminate` CSS bug in Sprig brand
 * where radios with no selection appear visually checked.
 */
const FieldRadioGroup: React.FC<FieldRadioGroupProps> = ({
  containerClassName,
  disabled,
  error,
  hint,
  label,
  name,
  options,
  required,
  ...inputProps
}) => {
  return (
    <fieldset
      className={cn('pui:group/field pui:space-y-2', containerClassName)}
      id={`${name}-group`}
    >
      {label && (
        <FieldLabel asChild name={name} required={!!required}>
          <legend>{label}</legend>
        </FieldLabel>
      )}

      <div className="pui:space-y-3">
        {options?.map((option) => (
          <label
            key={option.value}
            className="pui:flex pui:cursor-pointer pui:items-center pui:gap-3"
          >
            <FieldCheckboxRadio
              {...inputProps}
              className="pui:indeterminate:bg-pui-control-unchecked-bg pui:indeterminate:border-pui-control-unchecked-border"
              disabled={disabled}
              name={name}
              type="radio"
              value={option.value}
            />
            <span className="pui:text-sm pui:font-medium pui:text-pui-fg-default">
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <FieldLower error={error} hint={hint} name={name} />
    </fieldset>
  );
};

export default FieldRadioGroup;
