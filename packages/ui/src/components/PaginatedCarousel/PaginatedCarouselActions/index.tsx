import { getBrandVariant } from '@/lib/brand-registry';
import { cn } from '@perimetre/classnames';
import { type VariantProps } from 'cva';
import { paginatedCarouselActionsBrandVariants } from './brands';

export type PaginatedCarouselActionsProps = {
  actionsClassName?: string;
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof paginatedCarouselActionsBrandVariants.acorn>;

/**
 * Container for dots and navigation buttons, positioned below the carousel.
 */
export const PaginatedCarouselActions: React.FC<
  PaginatedCarouselActionsProps
> = ({ actionsClassName, children, className, ...props }) => {
  const paginatedCarouselActionsVariants = getBrandVariant(
    paginatedCarouselActionsBrandVariants
  );

  return (
    <div
      className={cn(
        paginatedCarouselActionsVariants({ className }),
        actionsClassName
      )}
      {...props}
    >
      {children}
    </div>
  );
};
