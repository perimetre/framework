'use client';

import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { Eye, EyeOff } from 'lucide-react';
import { unstable_PasswordToggleField as PasswordToggleField } from 'radix-ui';
import FieldAddon from '../FieldAddon';
import FieldBaseInput, { type FieldBaseInputProps } from '../FieldBaseInput';
import FieldContainer from '../FieldContainer';
import FieldLower, { type FieldLowerProps } from '../FieldLower';
import FieldUpper, { type FieldUpperProps } from '../FieldUpper';

export type FieldPasswordProps = {
  containerClassName?: string;
  leading?: React.ReactNode;
  name: string;
} & ForceRequiredProps<Partial<FieldLowerProps>, 'error'> &
  Omit<
    FieldBaseInputProps,
    // Remove conflicting props
    'asChild' | 'error' | 'id' | 'leading' | 'trailing'
  > &
  Partial<FieldUpperProps>;

/**
 * A form password field component
 */
const FieldPassword: React.FC<FieldPasswordProps> = ({
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
  ...props
}) => (
  <PasswordToggleField.Root>
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
          asChild
          trailing
          aria-invalid={!!error}
          error={!!error}
          id={id}
          leading={!!leading}
          name={name}
          required={!!required}
          type="password"
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
        >
          <PasswordToggleField.Input />
        </FieldBaseInput>

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
          asChild
          trailing
          className="pui:pointer-events-auto"
          leading={!!leading}
        >
          <PasswordToggleField.Toggle className="pui:cursor-pointer">
            <PasswordToggleField.Icon
              hidden={<EyeOff aria-label="Hide password" />}
              visible={<Eye aria-label="Show password" />}
            />
          </PasswordToggleField.Toggle>
        </FieldAddon>
      </div>
      <FieldLower error={error} hint={hint} name={name} />
    </FieldContainer>
  </PasswordToggleField.Root>
);

export default FieldPassword;
