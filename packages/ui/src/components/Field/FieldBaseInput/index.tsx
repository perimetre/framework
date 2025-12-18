import { cva } from '@/lib/cva';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { type VariantProps } from 'cva';
import { Slot } from 'radix-ui';

const inputVariants = cva({
  base: [
    // Base
    'pui:col-start-1 pui:row-start-1 pui:block pui:w-full pui:rounded-md pui:px-3 pui:py-1.5 pui:text-base pui:border pui:border-solid pui:border-background-5',
    'pui:bg-background-0 pui:text-background-12 pui:placeholder:text-background-8 pui:sm:text-sm/6',
    // Focus
    'pui:focus:outline-2 pui:focus:-outline-offset-2 pui:focus:outline-outline',
    // Disabled
    'pui:disabled:cursor-not-allowed pui:disabled:bg-background-3 pui:disabled:text-background-8 pui:disabled:border-background-3'
  ],
  variants: {
    error: {
      false: null,
      true: 'pui:border-error-strong/50 pui:text-error/80 pui:placeholder:text-error-light/70 pui:focus:outline-error/50'
    },
    leading: {
      false: null,
      true: 'pui:pl-10'
    },
    trailing: {
      false: null,
      true: 'pui:pr-10'
    }
  }
});

export type FieldBaseInputProps = {
  asChild?: boolean;
} & ForceRequiredProps<
  React.ComponentPropsWithRef<'input'>,
  'disabled' | 'name' | 'required'
> &
  ForceRequiredProps<
    VariantProps<typeof inputVariants>,
    'error' | 'leading' | 'trailing'
  >;

/**
 * The base input component for a Field
 */
const FieldBaseInput: React.FC<FieldBaseInputProps> = ({
  asChild,
  className,
  error,
  id,
  leading,
  name,
  trailing,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'input';
  return (
    <Comp
      className={inputVariants({ className, error, leading, trailing })}
      id={id ?? (name ? `${name}-input` : undefined)}
      name={name}
      {...props}
    />
  );
};

export default FieldBaseInput;
