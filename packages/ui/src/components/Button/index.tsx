import { cva } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { Slot } from 'radix-ui';
import type { PropsWithChildren } from 'react';

const buttonVariants = cva({
  base: 'pui:bg-primary-500 pui:text-overlay-50 pui:rounded-full pui:leading-[1.335rem] pui:font-bold pui:uppercase',
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5 pui:text-base pui:tracking-widest',
      default: 'pui:px-8 pui:py-2.5 pui:text-lg pui:tracking-[0.1125rem]'
    }
  }
});

export type ButtonProps = {
  asChild?: boolean;
} & React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>;

/**
 * Button component
 */
const Button: React.FC<PropsWithChildren<ButtonProps>> = ({
  asChild,
  children,
  className,
  size,
  ...props
}) => {
  const Comp = asChild ? Slot.Slot : 'button';

  return (
    <Comp className={buttonVariants({ size, className })} {...props}>
      {children}
    </Comp>
  );
};

export default Button;
