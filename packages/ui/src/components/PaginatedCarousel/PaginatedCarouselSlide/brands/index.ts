import { type BrandVariants } from '@/lib/brand-registry';
import { paginatedCarouselSlideAcornVariants } from './PaginatedCarouselSlide.acorn.brand';

export const paginatedCarouselSlideBrandVariants = {
  acorn: paginatedCarouselSlideAcornVariants
} as const satisfies BrandVariants<typeof paginatedCarouselSlideAcornVariants>;
