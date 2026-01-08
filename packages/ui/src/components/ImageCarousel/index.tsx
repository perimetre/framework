import {
  type EmblaCarouselType,
  type EmblaOptionsType,
  type EmblaPluginType
} from 'embla-carousel';
import EmblaClassNames from 'embla-carousel-class-names';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { useCallback, useEffect, useState } from 'react';
import ImageCarouselContainer from './ImageCarouselContainer';
import {
  ImageCarouselDot,
  ImageCarouselDotsContainer
} from './ImageCarouselDots';
import {
  ImageCarouselImageWrapper,
  ImageCarouselLazyLoadContainer,
  ImageCarouselLazyLoadSpinner
} from './ImageCarouselLazyLoad';
import {
  ImageCarouselControls,
  ImageCarouselNavButton
} from './ImageCarouselNavigation';
import ImageCarouselRoot from './ImageCarouselRoot';
import ImageCarouselSlide from './ImageCarouselSlide';
import ImageCarouselViewport from './ImageCarouselViewport';

export type ImageCarouselProps<T = unknown> = {
  /**
   * Additional className for the root element.
   */
  className?: string;
  /**
   * Embla carousel options to customize how the carousel works.
   */
  options?: EmblaOptionsType;
  /**
   * Embla carousel plugins that extend the carousel with additional features.
   */
  plugins?: EmblaPluginType[];
  /**
   * Render function for each image slide. Receives the slide data and index.
   * This allows consumers to use any image component (img, Next.js Image, Hydrogen Image, etc.)
   * @param slide - The slide data from the slides array
   * @param index - The index of the current slide
   * @param inView - Whether the slide is currently visible (for lazy loading)
   * @param hasLoaded - Whether the image has finished loading
   * @param onLoad - Callback to be called when the image loads
   * @returns The rendered image element
   * @example
   * // Using native img tag
   * renderImage={(slide, index, inView, hasLoaded, onLoad) => (
   *   <img src={inView ? slide.src : PLACEHOLDER_SRC} alt={slide.alt} onLoad={onLoad} />
   * )}
   * @example
   * // Using Next.js Image
   * renderImage={(slide, index, inView) => (
   *   <Image src={slide.src} alt={slide.alt} fill />
   * )}
   */
  renderImage: (
    slide: T,
    index: number,
    inView: boolean,
    hasLoaded: boolean,
    onLoad: () => void
  ) => React.ReactNode;
  /**
   * Whether to show dot indicators. Defaults to true.
   */
  showDots?: boolean;
  /**
   * Whether to show navigation arrows. Defaults to true.
   */
  showNavigation?: boolean;
  /**
   * Array of slide data. Each item will be passed to the renderImage function.
   */
  slides: T[];
};

/**
 * Carousel component to display a set of images with lazy loading support.
 *
 * This component uses embla-carousel under the hood and provides a flexible
 * render function prop to allow any image component to be used (img, Next.js Image, etc.)
 *
 * Features:
 * - Lazy loading with visibility tracking
 * - Navigation arrows (optional)
 * - Dot indicators (optional)
 * - Wheel gesture support
 * - Touch/drag support
 * - Brand-aware styling
 */
const ImageCarousel = <T,>({
  className,
  options,
  plugins,
  renderImage,
  showDots = true,
  showNavigation = true,
  slides
}: ImageCarouselProps<T>) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, ...options }, [
    ...(plugins ?? []),
    EmblaClassNames(),
    WheelGesturesPlugin()
  ]);

  // Track which slides are currently in view for lazy loading
  const [slidesInView, setSlidesInView] = useState<number[]>([]);
  // Track which images have finished loading
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(new Set());
  // Track button disabled states
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  // Track selected slide for dots
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update slides in view for lazy loading
  const updateSlidesInView = useCallback((emblaApi: EmblaCarouselType) => {
    setSlidesInView((prevSlidesInView) => {
      // Stop listening once all slides have been viewed
      if (prevSlidesInView.length === emblaApi.slideNodes().length) {
        emblaApi.off('slidesInView', updateSlidesInView);
        return prevSlidesInView;
      }

      // Get newly visible slides
      const inView = emblaApi
        .slidesInView()
        .filter((index) => !prevSlidesInView.includes(index));

      return prevSlidesInView.concat(inView);
    });
  }, []);

  // Update button disabled states
  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!emblaApi) return;

    // Initialize
    updateSlidesInView(emblaApi);
    onSelect(emblaApi);

    // Listen to events
    emblaApi
      .on('slidesInView', updateSlidesInView)
      .on('reInit', updateSlidesInView)
      .on('reInit', onSelect)
      .on('select', onSelect);

    return () => {
      emblaApi
        .off('slidesInView', updateSlidesInView)
        .off('reInit', updateSlidesInView)
        .off('reInit', onSelect)
        .off('select', onSelect);
    };
  }, [emblaApi, updateSlidesInView, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const handleImageLoad = useCallback((index: number) => {
    setLoadedSlides((prev) => new Set(prev).add(index));
  }, []);

  return (
    <ImageCarouselRoot className={className}>
      <ImageCarouselViewport ref={emblaRef}>
        <ImageCarouselContainer>
          {slides.map((slide, index) => {
            const inView = slidesInView.includes(index);
            const hasLoaded = loadedSlides.has(index);
            /** Handle image load callback */
            const onLoad = () => {
              handleImageLoad(index);
            };

            return (
              <ImageCarouselSlide key={index}>
                <ImageCarouselLazyLoadContainer>
                  {!hasLoaded && (
                    <ImageCarouselLazyLoadSpinner isHidden={hasLoaded} />
                  )}
                  <ImageCarouselImageWrapper isLoaded={hasLoaded}>
                    {renderImage(slide, index, inView, hasLoaded, onLoad)}
                  </ImageCarouselImageWrapper>
                </ImageCarouselLazyLoadContainer>
              </ImageCarouselSlide>
            );
          })}
        </ImageCarouselContainer>
      </ImageCarouselViewport>

      {/* Navigation Controls */}
      {showNavigation && (
        <ImageCarouselControls>
          <ImageCarouselNavButton
            direction="prev"
            disabled={prevBtnDisabled}
            onClick={scrollPrev}
          />
          <ImageCarouselNavButton
            direction="next"
            disabled={nextBtnDisabled}
            onClick={scrollNext}
          />
        </ImageCarouselControls>
      )}

      {/* Dot Indicators */}
      {showDots && (
        <ImageCarouselDotsContainer>
          {slides.map((_, index) => (
            <ImageCarouselDot
              key={index}
              index={index}
              isSelected={index === selectedIndex}
              onClick={() => {
                scrollTo(index);
              }}
            />
          ))}
        </ImageCarouselDotsContainer>
      )}
    </ImageCarouselRoot>
  );
};

export default ImageCarousel;
