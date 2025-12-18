import { type ForceRequiredProps } from '@perimetre/helpers/types';
import FieldAddon from '../FieldAddon';
import FieldBaseInput, { type FieldBaseInputProps } from '../FieldBaseInput';
import FieldContainer from '../FieldContainer';
import FieldLower, { type FieldLowerProps } from '../FieldLower';
import FieldUpper, { type FieldUpperProps } from '../FieldUpper';

export type FieldInputProps = {
  containerClassName?: string;
  leading?: React.ReactNode;
  name: string;
  trailing?: React.ReactNode;
} & ForceRequiredProps<Partial<FieldLowerProps>, 'error'> &
  Omit<
    FieldBaseInputProps,
    // Remove conflicting props
    'asChild' | 'error' | 'id' | 'leading' | 'trailing'
  > &
  Partial<FieldUpperProps>;

/**
 * A form field component
 */
const FieldInput: React.FC<FieldInputProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
  containerClassName,
  corner,
  description,
  error,
  hint,
  id,
  label,
  leading,
  name,
  required,
  trailing,
  ...props
}) => (
  <FieldContainer className={containerClassName} name={name}>
    <FieldUpper
      corner={corner}
      description={description}
      label={label}
      name={name}
      required={!!required}
    />

    <div className="pui:grid pui:grid-cols-1">
      <FieldBaseInput
        aria-invalid={!!error}
        error={!!error}
        id={id}
        leading={!!leading}
        name={name}
        required={!!required}
        trailing={!!trailing}
        aria-describedby={
          error
            ? `${name}-error`
            : description
              ? `${name}-description`
              : hint
                ? `${name}-hint`
                : undefined
        }
        {...props}
      />

      {leading && (
        <FieldAddon
          leading
          asChild={typeof leading !== 'string'}
          trailing={!!trailing}
        >
          {leading}
        </FieldAddon>
      )}
      {trailing && (
        <FieldAddon
          trailing
          asChild={typeof trailing !== 'string'}
          leading={!!leading}
        >
          {trailing}
        </FieldAddon>
      )}
    </div>
    <FieldLower error={error} hint={hint} name={name} />
  </FieldContainer>
);

export default FieldInput;
