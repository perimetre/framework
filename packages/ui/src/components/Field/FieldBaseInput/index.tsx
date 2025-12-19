import { cva } from '@/lib/cva';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { type VariantProps } from 'cva';
import { Slot } from 'radix-ui';

/**
 * Input variants using semantic tokens for themeable properties:
 * - bg-pui-bg-default: Input background (--pui-color-bg-default)
 * - text-pui-fg-default: Input text (--pui-color-fg-default)
 * - border-pui-border-default: Input border (--pui-color-border-default)
 * - rounded-pui-input: Input radius (--pui-radius-input)
 * - shadow-pui-input-focus: Input focus ring (--pui-shadow-input-focus)
 */
const inputVariants = cva({
  base: [
    // Structural styles - hardcoded
    'pui:col-start-1 pui:row-start-1 pui:block pui:w-full pui:px-3 pui:py-1.5 pui:text-base pui:border pui:border-solid pui:sm:text-sm/6',
    // Semantic color tokens - themeable
    'pui:bg-pui-bg-default pui:text-pui-fg-default pui:border-pui-border-default',
    // Semantic shape tokens - themeable
    'pui:rounded-pui-input',
    // Placeholder uses semantic muted token
    'pui:placeholder:text-pui-fg-subtle',
    // Focus uses semantic tokens
    'pui:focus:outline-none pui:focus:shadow-pui-input-focus',
    // Semantic motion tokens - themeable
    'pui:transition-shadow pui:duration-pui-normal',
    // Disabled state using semantic tokens
    'pui:disabled:cursor-not-allowed pui:disabled:bg-pui-bg-subtle pui:disabled:text-pui-fg-subtle pui:disabled:border-pui-bg-subtle'
  ],
  variants: {
    error: {
      false: null,
      true: 'pui:border-pui-feedback-error-strong/50 pui:text-pui-feedback-error/80 pui:placeholder:text-pui-feedback-error-light/70 pui:focus:shadow-[0_0_0_2px_var(--color-pui-feedback-error)]'
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
