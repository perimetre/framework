import { type BrandVariants } from '@/lib/brand-registry';
import { imageCarouselContainerAcornVariants } from './ImageCarouselContainer.acorn.brand';

export const imageCarouselContainerBrandVariants = {
  acorn: imageCarouselContainerAcornVariants
  // sprig: compose(
  //   imageCarouselContainerAcornVariants,
  //   imageCarouselContainerSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselContainerAcornVariants,
  //   imageCarouselContainerStelproVariants
  // )
} as const satisfies BrandVariants<typeof imageCarouselContainerAcornVariants>;
