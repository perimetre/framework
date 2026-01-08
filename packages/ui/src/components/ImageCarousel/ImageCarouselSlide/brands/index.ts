import { type BrandVariants } from '@/lib/brand-registry';
import { imageCarouselSlideAcornVariants } from './ImageCarouselSlide.acorn.brand';

export const imageCarouselSlideBrandVariants = {
  acorn: imageCarouselSlideAcornVariants
  // sprig: compose(
  //   imageCarouselSlideAcornVariants,
  //   imageCarouselSlideSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselSlideAcornVariants,
  //   imageCarouselSlideStelproVariants
  // )
} as const satisfies BrandVariants<typeof imageCarouselSlideAcornVariants>;
