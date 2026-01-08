import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import React, { type ForwardedRef } from 'react';
import { imageCarouselViewportBrandVariants } from './brands';

export type ImageCarouselViewportProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselViewportBrandVariants.acorn>;

/**
 * Viewport container for ImageCarousel (holds the embla ref)
 */
const ImageCarouselViewport = React.forwardRef<
  HTMLDivElement,
  ImageCarouselViewportProps
>(({ children, className }, ref: ForwardedRef<HTMLDivElement>) => {
  const imageCarouselViewportVariants = getBrandVariant(
    imageCarouselViewportBrandVariants
  );

  return (
    <div ref={ref} className={imageCarouselViewportVariants({ className })}>
      {children}
    </div>
  );
});

ImageCarouselViewport.displayName = 'ImageCarouselViewport';

export default ImageCarouselViewport;
