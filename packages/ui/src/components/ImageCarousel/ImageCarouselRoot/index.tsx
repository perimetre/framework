import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { imageCarouselRootBrandVariants } from './brands';

export type ImageCarouselRootProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselRootBrandVariants.acorn>;

/**
 * Root container for ImageCarousel
 */
const ImageCarouselRoot: React.FC<ImageCarouselRootProps> = ({
  children,
  className,
  layout
}) => {
  const imageCarouselRootVariants = getBrandVariant(
    imageCarouselRootBrandVariants
  );

  return (
    <div className={imageCarouselRootVariants({ className, layout })}>
      {children}
    </div>
  );
};

export default ImageCarouselRoot;
