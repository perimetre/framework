import type { Story, StoryDefault } from '@ladle/react';
import PaginatedCarousel, { type PaginatedCarouselProps } from './index';

// Sample card content for demos
const sampleItems: PaginatedCarouselProps['items'] = Array.from(
  { length: 8 },
  (_, i) => ({
    key: `item-${String(i)}`,
    content: (
      <div className="pui:rounded-lg pui:border pui:border-pui-overlay-6 pui:bg-white pui:p-8 pui:shadow-sm">
        <div className="pui:flex pui:gap-4 pui:items-start">
          <div className="pui:w-1/3">
            <h3 className="pui:text-xl pui:font-semibold pui:text-pui-overlay-12">
              Product {String(i + 1)}
            </h3>
            <p className="pui:mt-2 pui:text-sm pui:text-pui-overlay-10">
              A short description of this product card in the carousel.
            </p>
            <p className="pui:mt-4 pui:text-lg pui:font-bold pui:text-pui-primary-9">
              ${((i + 1) * 29.99).toFixed(2)}
            </p>
          </div>
          <div className="pui:w-2/3 pui:h-48 pui:bg-pui-overlay-3" />
        </div>
      </div>
    )
  })
);

type Props = {
  actionsAlign?: 'center' | 'end' | 'start';
  showButtons?: boolean;
  showDots?: boolean;
};

export default {
  title: 'Components/PaginatedCarousel',
  argTypes: {
    showDots: {
      control: { type: 'boolean' },
      defaultValue: true
    },
    showButtons: {
      control: { type: 'boolean' },
      defaultValue: true
    }
  }
} satisfies StoryDefault<Props>;

/**
 * Default story - paginated carousel with card content
 */
export const Default: Story<Props> = ({
  showButtons = true,
  showDots = true
}) => (
  <div className="pui:max-w-5xl pui:mx-auto pui:p-8">
    <PaginatedCarousel
      items={sampleItems}
      showButtons={showButtons}
      showDots={showDots}
    />
  </div>
);

/**
 * No actions - both dots and buttons hidden
 */
export const NoActions: Story<Props> = () => (
  <div className="pui:max-w-5xl pui:mx-auto pui:p-8">
    <PaginatedCarousel
      items={sampleItems}
      showButtons={false}
      showDots={false}
    />
    <p className="pui:mt-4 pui:text-center pui:text-sm pui:text-pui-overlay-9">
      Use wheel or drag to navigate
    </p>
  </div>
);

const ALIGN_CLASS_MAP = {
  start: 'pui:justify-start',
  center: 'pui:justify-center',
  end: 'pui:justify-end'
} as const;

/**
 * Align actions - demonstrates actionsClassName for positioning
 */
export const AlignActions: Story<Props> = ({
  actionsAlign = 'center'
}: Props) => (
  <div className="pui:max-w-5xl pui:mx-auto pui:p-8">
    <PaginatedCarousel
      actionsClassName={ALIGN_CLASS_MAP[actionsAlign]}
      items={sampleItems}
    />
    <p className="pui:mt-4 pui:text-center pui:text-sm pui:text-pui-overlay-9">
      Actions aligned: {actionsAlign}
    </p>
  </div>
);

AlignActions.argTypes = {
  actionsAlign: {
    control: { type: 'select' },
    options: ['start', 'center', 'end'],
    defaultValue: 'center'
  }
};
