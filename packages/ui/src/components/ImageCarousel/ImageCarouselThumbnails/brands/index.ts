import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { imageCarouselThumbnailAcornVariants } from './ImageCarouselThumbnail.acorn.brand';
import { imageCarouselThumbnailSprigVariants } from './ImageCarouselThumbnail.sprig.brand';
import { imageCarouselThumbnailStelproVariants } from './ImageCarouselThumbnail.stelpro.brand';
import { imageCarouselThumbnailsContainerAcornVariants } from './ImageCarouselThumbnailsContainer.acorn.brand';

export const imageCarouselThumbnailsContainerBrandVariants = {
  acorn: imageCarouselThumbnailsContainerAcornVariants
  // sprig: compose(
  //   imageCarouselThumbnailsContainerAcornVariants,
  //   imageCarouselThumbnailsContainerSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselThumbnailsContainerAcornVariants,
  //   imageCarouselThumbnailsContainerStelproVariants
  // )
} as const satisfies BrandVariants<
  typeof imageCarouselThumbnailsContainerAcornVariants
>;

export const imageCarouselThumbnailBrandVariants = {
  acorn: imageCarouselThumbnailAcornVariants,
  sprig: compose(
    imageCarouselThumbnailAcornVariants,
    imageCarouselThumbnailSprigVariants
  ),
  stelpro: compose(
    imageCarouselThumbnailAcornVariants,
    imageCarouselThumbnailStelproVariants
  )
} as const satisfies BrandVariants<typeof imageCarouselThumbnailAcornVariants>;
