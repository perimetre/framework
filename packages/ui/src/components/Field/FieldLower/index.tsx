import FieldError from '../FieldError';
import FieldHint from '../FieldHint/input';

export type FieldLowerProps = {
  error: React.ReactNode | undefined;
  hint: React.ReactNode | undefined;
  name: string;
};

/**
 * The lower part of a field, containing the hint and error message
 */
const FieldLower: React.FC<FieldLowerProps> = ({ error, hint, name }) => {
  return (
    <>
      {hint && !error && (
        <FieldHint
          asChild={typeof hint !== 'string'}
          error={!!error}
          name={name}
        >
          {hint}
        </FieldHint>
      )}

      {!!error && (
        <FieldError asChild={typeof error !== 'string'} name={name}>
          {error}
        </FieldError>
      )}
    </>
  );
};

export default FieldLower;
