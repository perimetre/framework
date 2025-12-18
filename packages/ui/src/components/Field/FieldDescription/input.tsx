import { cn } from '@perimetre/classnames';
import { Slot } from 'radix-ui';

export type FieldDescriptionProps = {
  asChild?: boolean;
  name: string;
} & Omit<React.ComponentPropsWithRef<'p'>, 'name'>;

/**
 * A description for a form field
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
      className={cn('pui:text-background-11 pui:text-sm', className)}
      id={id ?? `${name}-description`}
      {...props}
    />
  );
};

export default FieldDescription;
