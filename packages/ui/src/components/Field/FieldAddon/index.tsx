import { cva } from '@/lib/cva';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { type VariantProps } from 'cva';
import { Slot } from 'radix-ui';

/**
 * Input addon variants using semantic tokens:
 * - text-pui-fg-subtle: Addon icon/text color
 */
const inputAddonVariants = cva({
  base: 'pui:pointer-events-none pui:col-start-1 pui:row-start-1 pui:self-center pui:text-pui-fg-subtle',
  variants: {
    leading: {
      false: null,
      true: 'pui:ml-3'
    },
    trailing: {
      false: null,
      true: 'pui:mr-3 pui:justify-self-end'
    }
  }
});

export type FieldAddonProps = {
  asChild?: boolean;
} & ForceRequiredProps<
  VariantProps<typeof inputAddonVariants>,
  'leading' | 'trailing'
> &
  React.ComponentPropsWithRef<'span'>;

/**
 * An addon for a Field, such as an icon or text
 */
const FieldAddon: React.FC<FieldAddonProps> = ({
  asChild,
  className,
  leading,
  trailing,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp
      className={inputAddonVariants({ className, leading, trailing })}
      {...props}
    />
  );
};

export default FieldAddon;
