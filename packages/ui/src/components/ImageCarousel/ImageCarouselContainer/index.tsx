import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { imageCarouselContainerBrandVariants } from './brands';

export type ImageCarouselContainerProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselContainerBrandVariants.acorn>;

/**
 * Container for ImageCarousel slides
 */
const ImageCarouselContainer: React.FC<ImageCarouselContainerProps> = ({
  children,
  className
}) => {
  const imageCarouselContainerVariants = getBrandVariant(
    imageCarouselContainerBrandVariants
  );

  return (
    <div className={imageCarouselContainerVariants({ className })}>
      {children}
    </div>
  );
};

export default ImageCarouselContainer;
