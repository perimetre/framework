import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { ChevronDown } from 'lucide-react';
import FieldAddon from '../FieldAddon';
import FieldBaseSelect from '../FieldBaseSelect';
import FieldContainer from '../FieldContainer';
import FieldLower, { type FieldLowerProps } from '../FieldLower';
import FieldUpper, { type FieldUpperProps } from '../FieldUpper';

export type FieldSelectOption = { label: string; value: string };

export type FieldSelectProps = {
  containerClassName?: string;
  leading?: React.ReactNode;
  name: string;
  options?: FieldSelectOption[];
  placeholder?: string;
  trailing?: React.ReactNode;
} & ForceRequiredProps<Partial<FieldLowerProps>, 'error'> &
  Omit<
    React.ComponentPropsWithRef<'select'>,
    'children' | 'multiple' | 'name'
  > &
  Partial<FieldUpperProps>;

/**
 * Form select field. Same structure as FieldInput: label, addons, optional,
 * description, error, hint. Uses native <select> styled like FieldBaseInput.
 * Default trailing addon is a chevron; pass trailing to override.
 */
const FieldSelect: React.FC<FieldSelectProps> = ({
  containerClassName,
  corner,
  description,
  error,
  hint,
  id,
  label,
  leading,
  name,
  options,
  placeholder = 'Select…',
  required,
  trailing,
  value,
  ...selectProps
}) => {
  const trailingContent = trailing ?? (
    <ChevronDown
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  );

  return (
    <FieldContainer className={containerClassName} name={name}>
      <FieldUpper
        corner={corner}
        description={description}
        label={label}
        name={name}
        required={!!required}
      />

      <div className="pui:grid pui:grid-cols-1">
        <FieldBaseSelect
          trailing
          aria-invalid={!!error}
          error={!!error}
          id={id}
          leading={!!leading}
          name={name}
          placeholder={value === ''}
          required={!!required}
          value={value}
          aria-describedby={
            error
              ? `${name}-error`
              : description
                ? `${name}-description`
                : hint
                  ? `${name}-hint`
                  : undefined
          }
          {...selectProps}
        >
          {placeholder ? (
            <option disabled value="">
              {placeholder}
            </option>
          ) : null}
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FieldBaseSelect>

        {leading && (
          <FieldAddon
            leading
            asChild={typeof leading !== 'string'}
            trailing={false}
          >
            {leading}
          </FieldAddon>
        )}
        <FieldAddon
          trailing
          asChild={typeof trailingContent !== 'string'}
          leading={!!leading}
        >
          {trailingContent}
        </FieldAddon>
      </div>

      <FieldLower error={error} hint={hint} name={name} />
    </FieldContainer>
  );
};

export default FieldSelect;
