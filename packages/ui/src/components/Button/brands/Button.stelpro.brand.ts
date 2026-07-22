import { cva } from '@/lib/cva';

/**
 * Stelpro brand button variants
 *
 * Implements Figma STEL Design System — Button/Primary (node 1:255).
 * Color values come from semantic token overrides in
 * `@perimetre/tokens` (`brands/stelpro.json`); only structural and
 * state-class differences from Acorn live here.
 */
export const buttonStelproVariants = cva({
  base: [
    // Structure per Figma: min-height 44px, icon gap 10px
    'pui:min-h-11 pui:gap-2.5',
    // Typography "Body/md": 16px / 150% / regular — no uppercase, no tracking
    'pui:text-base pui:leading-normal pui:font-normal pui:normal-case pui:tracking-normal',
    // Focus: 1px frame in border-focus (Stelpro red), drawn as an inset
    // outline so the label doesn't shift
    'pui:focus-visible:outline-1 pui:focus-visible:-outline-offset-1 pui:focus-visible:outline-pui-border-focus'
  ],
  variants: {
    variant: {
      primary: [
        // Slate fill scale, not the red primary scale
        'pui:bg-pui-button-primary-fill',
        'pui:text-pui-interactive-on-primary',
        'pui:hover:bg-pui-button-hover',
        'pui:active:bg-pui-button-active',
        'pui:disabled:bg-pui-button-inactive',
        'pui:disabled:text-pui-button-inactive-label'
      ],
      secondary: [
        // White page fill with dark text-primary label
        'pui:bg-pui-button-secondary-fill',
        'pui:text-pui-button-secondary-label',
        // Constant transparent border so the white hover/active frame
        // doesn't shift layout
        'pui:border pui:border-transparent',
        'pui:hover:bg-pui-button-secondary-hover pui:hover:border-pui-overlay-1',
        'pui:active:bg-pui-button-secondary-active pui:active:border-pui-overlay-1',
        // Focus inverts to the primary dark fill with white label;
        // the red focus frame comes from the shared base styles
        'pui:focus-visible:bg-pui-button-primary-fill pui:focus-visible:text-pui-interactive-on-primary',
        'pui:disabled:bg-pui-button-inactive',
        'pui:disabled:text-pui-button-inactive-label'
      ],
      outline: '',
      primaryLight: '',
      flat: ''
    },
    size: {
      small: '',
      // Figma: padding 8px 20px
      default: 'pui:px-5 pui:py-2'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default'
  }
});
