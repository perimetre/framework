import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import {
  imageCarouselImageWrapperBrandVariants,
  imageCarouselLazyLoadContainerBrandVariants,
  imageCarouselLazyLoadSpinnerBrandVariants
} from './brands';

export type ImageCarouselImageWrapperProps = {
  children: React.ReactNode;
  isLoaded: boolean;
} & VariantProps<typeof imageCarouselImageWrapperBrandVariants.acorn>;

export type ImageCarouselLazyLoadContainerProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselLazyLoadContainerBrandVariants.acorn>;

export type ImageCarouselLazyLoadSpinnerProps = {
  isHidden: boolean;
} & VariantProps<typeof imageCarouselLazyLoadSpinnerBrandVariants.acorn>;

/**
 * Container for lazy-loaded image
 */
export const ImageCarouselLazyLoadContainer: React.FC<
  ImageCarouselLazyLoadContainerProps
> = ({ children, className }) => {
  const imageCarouselLazyLoadContainerVariants = getBrandVariant(
    imageCarouselLazyLoadContainerBrandVariants
  );

  return (
    <div className={imageCarouselLazyLoadContainerVariants({ className })}>
      {children}
    </div>
  );
};

/**
 * Loading spinner for lazy-loaded images
 */
export const ImageCarouselLazyLoadSpinner: React.FC<
  ImageCarouselLazyLoadSpinnerProps
> = ({ isHidden }) => {
  const imageCarouselLazyLoadSpinnerVariants = getBrandVariant(
    imageCarouselLazyLoadSpinnerBrandVariants
  );

  return (
    <div
      aria-label="Loading"
      className={imageCarouselLazyLoadSpinnerVariants({ hidden: isHidden })}
    >
      {/* Simple spinner SVG */}
      <svg
        className="pui:animate-spin pui:h-8 pui:w-8 pui:text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="pui:opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="pui:opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

/**
 * Wrapper for the actual image element
 */
export const ImageCarouselImageWrapper: React.FC<
  ImageCarouselImageWrapperProps
> = ({ children, isLoaded }) => {
  const imageCarouselImageWrapperVariants = getBrandVariant(
    imageCarouselImageWrapperBrandVariants
  );

  return (
    <div className={imageCarouselImageWrapperVariants({ loaded: isLoaded })}>
      {children}
    </div>
  );
};
