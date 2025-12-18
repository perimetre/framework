import { cva } from '@/lib/cva';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { type VariantProps } from 'cva';
import { Slot } from 'radix-ui';

const fieldHintVariants = cva({
  base: 'pui:text-sm pui:text-background-11',
  variants: {
    error: {
      false: null,
      true: 'pui:animate-out pui:fade-out pui:hidden' // Hide the hint when there's an error
    }
  }
});

export type FieldHintProps = {
  asChild?: boolean;
  name: string;
} & ForceRequiredProps<VariantProps<typeof fieldHintVariants>, 'error'> &
  Omit<React.ComponentPropsWithRef<'p'>, 'name'>;

/**
 * The hind under a field input
 */
const FieldHint: React.FC<FieldHintProps> = ({
  asChild,
  className,
  error,
  id,
  name,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'p';
  return (
    <Comp
      className={fieldHintVariants({ className, error })}
      id={id ?? `${name}-hint`}
      {...props}
    />
  );
};

export default FieldHint;
