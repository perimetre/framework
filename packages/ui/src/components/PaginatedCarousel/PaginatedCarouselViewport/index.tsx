import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import React, { type ForwardedRef } from 'react';
import { paginatedCarouselViewportBrandVariants } from './brands';

export type PaginatedCarouselViewportProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof paginatedCarouselViewportBrandVariants.acorn>;

/**
 * Viewport container for PaginatedCarousel (holds the embla ref)
 */
const PaginatedCarouselViewport = React.forwardRef<
  HTMLDivElement,
  PaginatedCarouselViewportProps
>(({ children, className, ...props }, ref: ForwardedRef<HTMLDivElement>) => {
  const paginatedCarouselViewportVariants = getBrandVariant(
    paginatedCarouselViewportBrandVariants
  );

  return (
    <div
      ref={ref}
      className={paginatedCarouselViewportVariants({ className })}
      {...props}
    >
      {children}
    </div>
  );
});

PaginatedCarouselViewport.displayName = 'PaginatedCarouselViewport';

export default PaginatedCarouselViewport;
