import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { imageCarouselViewportAcornVariants } from './ImageCarouselViewport.acorn.brand';
import { imageCarouselViewportSprigVariants } from './ImageCarouselViewport.sprig.brand';

export const imageCarouselViewportBrandVariants = {
  acorn: imageCarouselViewportAcornVariants,
  sprig: compose(
    imageCarouselViewportAcornVariants,
    imageCarouselViewportSprigVariants
  )
  // stelpro: compose(
  //   imageCarouselViewportAcornVariants,
  //   imageCarouselViewportStelproVariants
  // )
} as const satisfies BrandVariants<typeof imageCarouselViewportAcornVariants>;
