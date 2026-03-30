import { cva } from '@/lib/cva';

/**
 * Sprig brand CarouselButton variant overrides
 */
export const carouselButtonSprigVariants = cva({
  base: [
    'pui:w-12',
    'pui:h-12',
    'pui:bg-white',
    'pui:text-gray-400',
    'pui:shadow-none',
    'pui:border',
    'pui:border-gray-300',
    'pui:transition-[border-color,color]',
    'pui:duration-150',
    'pui:ease-[ease]',
    'hover:pui:bg-white',
    'hover:pui:shadow-none',
    'hover:pui:border-pui-interactive-primary',
    'hover:pui:text-pui-interactive-primary',
    'disabled:hover:pui:bg-white',
    'disabled:hover:pui:shadow-none',
    'disabled:hover:pui:border-gray-300',
    'disabled:hover:pui:text-gray-400',
    'pui:motion-reduce:transition-none'
  ]
});
