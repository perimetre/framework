import { type BrandVariants } from '@/lib/brand-registry';
import { imageCarouselImageWrapperAcornVariants } from './ImageCarouselImageWrapper.acorn.brand';
import { imageCarouselLazyLoadContainerAcornVariants } from './ImageCarouselLazyLoadContainer.acorn.brand';
import { imageCarouselLazyLoadSpinnerAcornVariants } from './ImageCarouselLazyLoadSpinner.acorn.brand';

export const imageCarouselLazyLoadContainerBrandVariants = {
  acorn: imageCarouselLazyLoadContainerAcornVariants
  // sprig: compose(
  //   imageCarouselLazyLoadContainerAcornVariants,
  //   imageCarouselLazyLoadContainerSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselLazyLoadContainerAcornVariants,
  //   imageCarouselLazyLoadContainerStelproVariants
  // )
} as const satisfies BrandVariants<
  typeof imageCarouselLazyLoadContainerAcornVariants
>;

export const imageCarouselLazyLoadSpinnerBrandVariants = {
  acorn: imageCarouselLazyLoadSpinnerAcornVariants
  // sprig: compose(
  //   imageCarouselLazyLoadSpinnerAcornVariants,
  //   imageCarouselLazyLoadSpinnerSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselLazyLoadSpinnerAcornVariants,
  //   imageCarouselLazyLoadSpinnerStelproVariants
  // )
} as const satisfies BrandVariants<
  typeof imageCarouselLazyLoadSpinnerAcornVariants
>;

export const imageCarouselImageWrapperBrandVariants = {
  acorn: imageCarouselImageWrapperAcornVariants
  // sprig: compose(
  //   imageCarouselImageWrapperAcornVariants,
  //   imageCarouselImageWrapperSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselImageWrapperAcornVariants,
  //   imageCarouselImageWrapperStelproVariants
  // )
} as const satisfies BrandVariants<
  typeof imageCarouselImageWrapperAcornVariants
>;
