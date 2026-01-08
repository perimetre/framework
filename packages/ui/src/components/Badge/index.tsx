import { getBrandVariant } from '@/lib/brand-registry';
import { Slot } from 'radix-ui';
import type { PropsWithChildren } from 'react';
import { badgeBrandVariants, type BadgeVariantProps } from './brands';

export type BadgeProps = {
  /**
   * When true, merges props onto the immediate child element instead of rendering a span.
   * Useful for composition with other components.
   */
  asChild?: boolean;
} & BadgeVariantProps &
  React.ComponentProps<'span'>;

/**
 * Badge component for labeling and status indicators
 *
 * Automatically uses the correct brand variant based on the active brand.
 * @example
 * // Basic usage with custom colors
 * <Badge className="pui:bg-blue-100 pui:text-blue-700">New</Badge>
 * @example
 * // With size and variant
 * <Badge size="2" variant="solid" className="pui:bg-green-600 pui:text-white">
 *   Active
 * </Badge>
 * @example
 * // Outline variant
 * <Badge variant="outline" className="pui:border-orange-500 pui:text-orange-700">
 *   In Progress
 * </Badge>
 */
const Badge: React.FC<PropsWithChildren<BadgeProps>> = ({
  asChild,
  children,
  className,
  size,
  variant,
  ...props
}) => {
  const Comp = asChild ? Slot.Slot : 'span';

  // Get the pre-composed brand variant (composition happens at module load, not render)
  const badgeVariants = getBrandVariant(badgeBrandVariants);

  return (
    <Comp className={badgeVariants({ size, variant, className })} {...props}>
      {children}
    </Comp>
  );
};

export default Badge;
