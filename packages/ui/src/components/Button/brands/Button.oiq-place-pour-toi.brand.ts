import { cva } from '@/lib/cva';

/**
 * OIQ - Place pour toi brand button variants
 *
 * Implements Figma OIQ PPT Design System — Button/Primary (node 191:608).
 * The signature OIQ look: square corners, a hard offset drop shadow (solid
 * black, no blur), and a "press-down" interaction — on hover/press/focus the
 * button slides toward its shadow (down-left) while the shadow shrinks, so the
 * shadow's outer corner stays fixed.
 *
 * Color values come from semantic token overrides in `@perimetre/tokens`
 * (`brands/oiq-place-pour-toi.json`); only structural and state-class differences from Acorn
 * live here. Square corners come from the `--pui-radius-button` token (0).
 */
export const buttonOiqVariants = cva({
  base: [
    // Typography per Figma "Body M" bold: 16px / 24px / no uppercase / 0 tracking
    'pui:normal-case pui:leading-6',
    // Animate both the shadow and the press-down translate
    'pui:transition-all',
    // Slotted shadow colour. Defaults to black (the Figma default); a consumer
    // recolours it — e.g. the purple "on black" variant — via the
    // `pui:button-shadow-*` utility or a `[--pui-button-shadow-color:…]`
    // arbitrary property. Every shadow below reads this var.
    'pui:[--pui-button-shadow-color:#000]'
  ],
  variants: {
    variant: {
      primary: [
        // Signature hard offset shadow (bottom-left, solid black, no blur)
        'pui:shadow-[-8px_10px_0px_var(--pui-button-shadow-color)]',
        // Hover: slide into the shadow (down-left) + shrink shadow
        'pui:hover:-translate-x-[3px] pui:hover:translate-y-[4px] pui:hover:shadow-[-5px_6px_0px_var(--pui-button-shadow-color)]',
        'pui:hover:bg-pui-button-hover',
        // Press: same offset, active fill
        'pui:active:-translate-x-[3px] pui:active:translate-y-[4px] pui:active:shadow-[-5px_6px_0px_var(--pui-button-shadow-color)]',
        'pui:active:bg-pui-button-active',
        // Focus: hover fill + settled offset + a solid frame (inset outline so
        // the label doesn't shift). Frame color = button-focus-border token.
        'pui:focus-visible:-translate-x-[3px] pui:focus-visible:translate-y-[4px] pui:focus-visible:shadow-[-5px_6px_0px_var(--pui-button-shadow-color)]',
        'pui:focus-visible:bg-pui-button-hover',
        'pui:focus-visible:[outline:3px_solid_var(--pui-color-button-focus-border)] pui:focus-visible:[outline-offset:-3px]',
        // Disabled: muted fill/label, keep the resting shadow, no press offset
        'pui:disabled:translate-x-0 pui:disabled:translate-y-0 pui:disabled:shadow-[-8px_10px_0px_var(--pui-button-shadow-color)]',
        'pui:disabled:bg-pui-button-inactive pui:disabled:text-pui-button-inactive-label'
      ],
      secondary: [
        // Figma Button/Secondary (node 428:7325): white fill, 3px purple
        // border + purple label; hard offset shadow + the same press-down
        // interaction as primary. Border darkens on hover/press.
        'pui:bg-white pui:text-pui-primary-9',
        'pui:border-[3px] pui:border-pui-interactive-primary',
        'pui:shadow-[-8px_10px_0px_var(--pui-button-shadow-color)]',
        // Hover: settle into the shadow, darken border, keep white fill
        'pui:hover:-translate-x-[3px] pui:hover:translate-y-[4px] pui:hover:shadow-[-5px_6px_0px_var(--pui-button-shadow-color)]',
        'pui:hover:bg-white pui:hover:[border-color:var(--pui-color-button-hover)]',
        // Press: same offset, darker border
        'pui:active:-translate-x-[3px] pui:active:translate-y-[4px] pui:active:shadow-[-5px_6px_0px_var(--pui-button-shadow-color)]',
        'pui:active:bg-white pui:active:[border-color:var(--pui-color-button-active)]',
        // Focus: settled offset + darkened border + solid focus frame
        'pui:focus-visible:-translate-x-[3px] pui:focus-visible:translate-y-[4px] pui:focus-visible:shadow-[-5px_6px_0px_var(--pui-button-shadow-color)]',
        'pui:focus-visible:bg-white pui:focus-visible:[border-color:var(--pui-color-button-hover)]',
        'pui:focus-visible:[outline:3px_solid_var(--pui-color-button-focus-border)] pui:focus-visible:[outline-offset:-3px]',
        // Disabled: gray border + gray label, resting shadow, no offset
        'pui:disabled:translate-x-0 pui:disabled:translate-y-0 pui:disabled:shadow-[-8px_10px_0px_var(--pui-button-shadow-color)]',
        'pui:disabled:bg-white pui:disabled:[border-color:var(--pui-color-button-secondary-outline)] pui:disabled:[color:var(--pui-color-button-secondary-inactive-label)]'
      ],
      // Figma Button/Text (node 720:333): text-only, no fill/border/shadow.
      // Brand-purple label that darkens through hover/press; neutral gray when
      // disabled. `px-0!` drops the size's horizontal padding so the label sits
      // flush (the flat button aligns to content, not a box).
      flat: [
        'pui:bg-transparent pui:border-0 pui:shadow-none',
        'pui:text-pui-primary-9',
        'pui:hover:text-pui-button-hover',
        'pui:active:text-pui-button-active',
        'pui:disabled:text-pui-button-inactive-label',
        'pui:px-0!'
      ],
      outline: '',
      primaryLight: ''
    },
    size: {
      small: '',
      // Figma: padding 32px / 16px, min-height 68px, 16px label, 0 tracking
      default:
        'pui:px-8 pui:py-4 pui:min-h-[68px] pui:text-base pui:tracking-normal'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default'
  }
});
