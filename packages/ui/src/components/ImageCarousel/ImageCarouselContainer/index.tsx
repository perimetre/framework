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
  className,
  ...props
}) => {
  const imageCarouselContainerVariants = getBrandVariant(
    imageCarouselContainerBrandVariants
  );

  return (
    <div className={imageCarouselContainerVariants({ className })} {...props}>
      {children}
    </div>
  );
};

export default ImageCarouselContainer;
