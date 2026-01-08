import type { Story, StoryDefault } from '@ladle/react';
import ImageCarousel, { type ImageCarouselProps } from './index';

// Sample image data type
type ImageSlide = {
  alt: string;
  src: string;
  title: string;
};

// Sample images using picsum for demo
const sampleImages: ImageSlide[] = [
  {
    src: 'https://picsum.photos/seed/1/800/600',
    alt: 'Landscape 1',
    title: 'Beautiful Mountain View'
  },
  {
    src: 'https://picsum.photos/seed/2/800/600',
    alt: 'Landscape 2',
    title: 'Ocean Sunset'
  },
  {
    src: 'https://picsum.photos/seed/3/800/600',
    alt: 'Landscape 3',
    title: 'Forest Path'
  },
  {
    src: 'https://picsum.photos/seed/4/800/600',
    alt: 'Landscape 4',
    title: 'City Lights'
  },
  {
    src: 'https://picsum.photos/seed/5/800/600',
    alt: 'Landscape 5',
    title: 'Desert Dunes'
  }
];

type Props = {
  isLoop?: boolean;
  showDots?: boolean;
  showNavigation?: boolean;
} & Omit<ImageCarouselProps<ImageSlide>, 'options' | 'renderImage' | 'slides'>;

export default {
  title: 'ImageCarousel',
  argTypes: {
    showNavigation: {
      control: { type: 'boolean' },
      defaultValue: true
    },
    showDots: {
      control: { type: 'boolean' },
      defaultValue: true
    },
    isLoop: {
      control: { type: 'boolean' },
      defaultValue: true
    }
  }
} satisfies StoryDefault<Props>;

/**
 * Default story - basic image carousel with native img tags
 */
export const Default: Story<Props> = ({
  isLoop = true,
  showDots = true,
  showNavigation = true,
  ...props
}) => (
  <div className="pui:max-w-4xl pui:mx-auto pui:p-8">
    <ImageCarousel
      options={{ loop: isLoop }}
      showDots={showDots}
      showNavigation={showNavigation}
      slides={sampleImages}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <img
          alt={slide.alt}
          className="pui:w-full pui:h-100 pui:object-cover pui:rounded-lg"
          loading="lazy"
          src={inView ? slide.src : undefined}
          onLoad={onLoad}
        />
      )}
      {...props}
    />
  </div>
);

/**
 * With captions - demonstrates additional content alongside images
 */
export const WithCaptions: Story<Props> = () => (
  <div className="pui:max-w-4xl pui:mx-auto pui:p-8">
    <ImageCarousel
      options={{ loop: true }}
      slides={sampleImages}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <div className="pui:relative">
          <img
            alt={slide.alt}
            className="pui:w-full pui:h-100 pui:object-cover pui:rounded-lg"
            loading="lazy"
            src={inView ? slide.src : undefined}
            onLoad={onLoad}
          />
          <div className="pui:absolute pui:bottom-0 pui:left-0 pui:right-0 pui:bg-linear-to-t pui:from-black/70 pui:to-transparent pui:p-4 pui:rounded-b-lg">
            <h3 className="pui:text-white pui:text-lg pui:font-bold">
              {slide.title}
            </h3>
            <p className="pui:text-white/80 pui:text-sm">
              Slide {String(index + 1)} of {String(sampleImages.length)}
            </p>
          </div>
        </div>
      )}
    />
  </div>
);

/**
 * Multiple slides visible - shows multiple slides at once
 */
export const MultipleSlidesVisible: Story<Props> = () => (
  <div className="pui:max-w-6xl pui:mx-auto pui:p-8">
    <ImageCarousel
      className="pui:max-w-full"
      slides={sampleImages}
      options={{
        loop: true,
        align: 'start',
        slidesToScroll: 1
      }}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <img
          alt={slide.alt}
          className="pui:w-full pui:h-75 pui:object-cover pui:rounded-lg"
          loading="lazy"
          src={inView ? slide.src : undefined}
          onLoad={onLoad}
        />
      )}
    />
  </div>
);

/**
 * Without navigation arrows
 */
export const WithoutNavigation: Story<Props> = () => (
  <div className="pui:max-w-4xl pui:mx-auto pui:p-8">
    <ImageCarousel
      options={{ loop: true }}
      showNavigation={false}
      slides={sampleImages}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <img
          alt={slide.alt}
          className="pui:w-full pui:h-100 pui:object-cover pui:rounded-lg"
          loading="lazy"
          src={inView ? slide.src : undefined}
          onLoad={onLoad}
        />
      )}
    />
    <p className="pui:text-center pui:mt-4 pui:text-sm pui:text-gray-600">
      Use dots, wheel, or drag to navigate
    </p>
  </div>
);

/**
 * Without dot indicators
 */
export const WithoutDots: Story<Props> = () => (
  <div className="pui:max-w-4xl pui:mx-auto pui:p-8">
    <ImageCarousel
      options={{ loop: true }}
      showDots={false}
      slides={sampleImages}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <img
          alt={slide.alt}
          className="pui:w-full pui:h-100 pui:object-cover pui:rounded-lg"
          loading="lazy"
          src={inView ? slide.src : undefined}
          onLoad={onLoad}
        />
      )}
    />
  </div>
);

/**
 * Minimal controls - no navigation or dots
 */
export const MinimalControls: Story<Props> = () => (
  <div className="pui:max-w-4xl pui:mx-auto pui:p-8">
    <ImageCarousel
      options={{ loop: true }}
      showDots={false}
      showNavigation={false}
      slides={sampleImages}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <img
          alt={slide.alt}
          className="pui:w-full pui:h-100 pui:object-cover pui:rounded-lg"
          loading="lazy"
          src={inView ? slide.src : undefined}
          onLoad={onLoad}
        />
      )}
    />
    <p className="pui:text-center pui:mt-4 pui:text-sm pui:text-gray-600">
      Use wheel or drag to navigate (touch-friendly)
    </p>
  </div>
);

/**
 * Portrait orientation - demonstrates different aspect ratios
 */
export const PortraitOrientation: Story<Props> = () => (
  <div className="pui:max-w-2xl pui:mx-auto pui:p-8">
    <ImageCarousel
      options={{ loop: true }}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <img
          alt={slide.alt}
          className="pui:w-full pui:h-150 pui:object-cover pui:rounded-lg"
          loading="lazy"
          src={inView ? slide.src : undefined}
          onLoad={onLoad}
        />
      )}
      slides={sampleImages.map((img, i) => ({
        ...img,
        src: `https://picsum.photos/seed/${String(i + 10)}/600/800`
      }))}
    />
  </div>
);

/**
 * No loop - demonstrates carousel behavior when loop is disabled
 */
export const NoLoop: Story<Props> = () => (
  <div className="pui:max-w-4xl pui:mx-auto pui:p-8">
    <ImageCarousel
      options={{ loop: false }}
      slides={sampleImages}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <img
          alt={slide.alt}
          className="pui:w-full pui:h-100 pui:object-cover pui:rounded-lg"
          loading="lazy"
          src={inView ? slide.src : undefined}
          onLoad={onLoad}
        />
      )}
    />
    <p className="pui:text-center pui:mt-4 pui:text-sm pui:text-gray-600">
      Navigation buttons will be disabled at the start and end
    </p>
  </div>
);

/**
 * Custom styling - demonstrates className prop usage
 */
export const CustomStyling: Story<Props> = () => (
  <div className="pui:max-w-4xl pui:mx-auto pui:p-8">
    <ImageCarousel
      className="pui:border-4 pui:border-blue-500 pui:rounded-xl pui:p-2 pui:bg-blue-50"
      options={{ loop: true }}
      slides={sampleImages}
      renderImage={(slide, index, inView, hasLoaded, onLoad) => (
        <img
          alt={slide.alt}
          className="pui:w-full pui:h-100 pui:object-cover pui:rounded-lg"
          loading="lazy"
          src={inView ? slide.src : undefined}
          onLoad={onLoad}
        />
      )}
    />
  </div>
);
