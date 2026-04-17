import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { paginatedCarouselSlideBrandVariants } from './brands';

export type PaginatedCarouselSlideProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof paginatedCarouselSlideBrandVariants.acorn>;

/**
 * Individual slide for PaginatedCarousel
 */
const PaginatedCarouselSlide: React.FC<PaginatedCarouselSlideProps> = ({
  children,
  className,
  ...props
}) => {
  const paginatedCarouselSlideVariants = getBrandVariant(
    paginatedCarouselSlideBrandVariants
  );

  return (
    <div className={paginatedCarouselSlideVariants({ className })} {...props}>
      {children}
    </div>
  );
};

export default PaginatedCarouselSlide;
