import { getBrandVariant } from '@/lib/brand-registry';
import { Slot } from 'radix-ui';
import type { PropsWithChildren } from 'react';
import { buttonBrandVariants, type ButtonVariantProps } from './brands';

export type ButtonProps = {
  asChild?: boolean;
} & ButtonVariantProps &
  React.ComponentProps<'button'>;

/**
 * Button component
 *
 * Automatically uses the correct brand variant based on the active brand
 * set via setActiveBrand() or defaults to 'acorn'.
 */
const Button: React.FC<PropsWithChildren<ButtonProps>> = ({
  asChild,
  children,
  className,
  size,
  ...props
}) => {
  const Comp = asChild ? Slot.Slot : 'button';

  // Get the pre-composed brand variant (composition happens at module load, not render)
  const buttonVariants = getBrandVariant(buttonBrandVariants);

  return (
    <Comp className={buttonVariants({ size, className })} {...props}>
      {children}
    </Comp>
  );
};

export default Button;
