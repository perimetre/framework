import { cn } from '@perimetre/classnames';
import { Slot } from 'radix-ui';

export type FieldErrorProps = {
  asChild?: boolean;
  name: string;
} & Omit<React.ComponentPropsWithRef<'p'>, 'name'>;

/**
 * An error message for a form field
 */
const FieldError: React.FC<FieldErrorProps> = ({
  asChild,
  className,
  id,
  name,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'p';
  return (
    <Comp
      aria-live="polite"
      id={id ?? `${name}-error`}
      role="alert"
      className={cn(
        'pui:animate-in pui:fade-in pui:slide-in-from-bottom-25 pui:text-error pui:text-sm',
        className
      )}
      {...props}
    />
  );
};

export default FieldError;
