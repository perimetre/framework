import FieldDescription from '../FieldDescription/input';
import FieldLabel, { type FieldLabelProps } from '../FieldLabel';

export type FieldUpperProps = {
  corner: React.ReactNode | undefined;
  description: React.ReactNode | undefined;
  label: React.ReactNode | undefined;
  name: string;
} & FieldLabelProps;

/**
 * The upper part of a form field, including the label, corner content, and description
 * Uses semantic tokens for themeable colors:
 * - text-pui-fg-muted: Corner text color
 */
const FieldUpper: React.FC<FieldUpperProps> = ({
  corner,
  description,
  id,
  label,
  name,
  required
}) => {
  return (
    <>
      {(label ?? corner) && (
        <div className="pui:flex pui:items-center">
          {label && (
            <FieldLabel
              className="pui:flex-grow"
              htmlFor={id}
              name={name}
              required={required}
            >
              {label}
            </FieldLabel>
          )}

          {corner && (
            <span className="pui:text-pui-fg-muted pui:justify-self-end pui:text-sm/6">
              {corner}
            </span>
          )}
        </div>
      )}

      {description && (
        <FieldDescription asChild={typeof description !== 'string'} name={name}>
          {description}
        </FieldDescription>
      )}
    </>
  );
};

export default FieldUpper;
