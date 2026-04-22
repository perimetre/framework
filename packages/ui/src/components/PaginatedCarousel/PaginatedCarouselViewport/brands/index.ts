import { type BrandVariants } from '@/lib/brand-registry';
import { paginatedCarouselViewportAcornVariants } from './PaginatedCarouselViewport.acorn.brand';

export const paginatedCarouselViewportBrandVariants = {
  acorn: paginatedCarouselViewportAcornVariants
} as const satisfies BrandVariants<
  typeof paginatedCarouselViewportAcornVariants
>;
