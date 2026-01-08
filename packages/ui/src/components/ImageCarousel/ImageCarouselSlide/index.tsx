import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { imageCarouselSlideBrandVariants } from './brands';

export type ImageCarouselSlideProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselSlideBrandVariants.acorn>;

/**
 * Individual slide for ImageCarousel
 */
const ImageCarouselSlide: React.FC<ImageCarouselSlideProps> = ({
  children,
  className
}) => {
  const imageCarouselSlideVariants = getBrandVariant(
    imageCarouselSlideBrandVariants
  );

  return (
    <div className={imageCarouselSlideVariants({ className })}>{children}</div>
  );
};

export default ImageCarouselSlide;
