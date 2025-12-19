import { cn } from '@perimetre/classnames';
import { Slot } from 'radix-ui';

export type FieldDescriptionProps = {
  asChild?: boolean;
  name: string;
} & Omit<React.ComponentPropsWithRef<'p'>, 'name'>;

/**
 * A description for a form field
 * Uses semantic tokens for themeable colors:
 * - text-pui-fg-muted: Description text color
 */
const FieldDescription: React.FC<FieldDescriptionProps> = ({
  asChild,
  className,
  id,
  name,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'p';
  return (
    <Comp
      className={cn('pui:text-pui-fg-muted pui:text-sm', className)}
      id={id ?? `${name}-description`}
      {...props}
    />
  );
};

export default FieldDescription;
