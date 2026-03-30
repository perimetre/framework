import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { imageCarouselControlsBrandVariants } from './brands';

export type ImageCarouselControlsProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselControlsBrandVariants.acorn>;

/**
 * Container for navigation controls
 */
export const ImageCarouselControls: React.FC<ImageCarouselControlsProps> = ({
  children,
  className,
  ...props
}) => {
  const imageCarouselControlsVariants = getBrandVariant(
    imageCarouselControlsBrandVariants
  );

  return (
    <div className={imageCarouselControlsVariants({ className })} {...props}>
      {children}
    </div>
  );
};
