import { type BrandVariants } from '@/lib/brand-registry';
import { imageCarouselRootAcornVariants } from './ImageCarouselRoot.acorn.brand';

export const imageCarouselRootBrandVariants = {
  acorn: imageCarouselRootAcornVariants
  // sprig: compose(
  //   imageCarouselRootAcornVariants,
  //   imageCarouselRootSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselRootAcornVariants,
  //   imageCarouselRootStelproVariants
  // )
} as const satisfies BrandVariants<typeof imageCarouselRootAcornVariants>;
