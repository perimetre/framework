import { type BrandVariants } from '@/lib/brand-registry';
import { imageCarouselViewportAcornVariants } from './ImageCarouselViewport.acorn.brand';

export const imageCarouselViewportBrandVariants = {
  acorn: imageCarouselViewportAcornVariants
  // sprig: compose(
  //   imageCarouselViewportAcornVariants,
  //   imageCarouselViewportSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselViewportAcornVariants,
  //   imageCarouselViewportStelproVariants
  // )
} as const satisfies BrandVariants<typeof imageCarouselViewportAcornVariants>;
