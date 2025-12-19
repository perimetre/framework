import { cn } from '@perimetre/classnames';
import { Slot } from 'radix-ui';
import { type PropsWithChildren } from 'react';

export type FieldLabelProps = {
  asChild?: boolean;
  name: string;
  required: boolean;
} & Omit<React.ComponentPropsWithRef<'label'>, 'name'>;

/**
 * A label for a form field
 * Uses semantic tokens for themeable colors:
 * - text-pui-fg-default: Label text color
 * - text-pui-feedback-error-strong: Required indicator
 */
const FieldLabel: React.FC<PropsWithChildren<FieldLabelProps>> = ({
  asChild,
  children,
  className,
  htmlFor,
  id,
  name,
  required,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'label';
  return (
    <Comp
      htmlFor={htmlFor ?? `${name}-input`}
      id={id ?? `${name}-label`}
      className={cn(
        'pui:text-pui-fg-default pui:block pui:text-sm/6 pui:font-medium',
        className
      )}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      {required && (
        <span className="pui:text-pui-feedback-error-strong pui:not-sr-only pui:ml-1">
          *
        </span>
      )}
    </Comp>
  );
};

export default FieldLabel;
