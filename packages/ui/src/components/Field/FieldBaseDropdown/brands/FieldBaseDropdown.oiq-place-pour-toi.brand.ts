import { cva } from '@/lib/cva';

/**
 * OIQ Place pour toi dropdown overrides.
 *
 * Colors, shadow, and item states come from token overrides
 * (dropdown.field-*, shadow.dropdown-panel) in the tokens package. Only the
 * class-level differences live here:
 * - border-[3px]: OIQ uses a bold 3px trigger/panel border (Figma border weight 3)
 * - rounded-none: OIQ is a square-corner brand (no rounding on trigger/panel)
 * - focus:shadow-none: no focus glow ring; focus is shown by the purple border only
 * - border-pui-interactive-primary: open panel border is OIQ brand purple
 *   (acorn uses dropdown-border = brand blue for OIQ)
 */
export const fieldBaseDropdownInputOiqPlacePourToiVariants = cva({
  base: ['pui:border-[3px] pui:rounded-none', 'pui:focus:shadow-none']
});

export const fieldBaseDropdownOptionsOiqPlacePourToiVariants = cva({
  base: [
    // Square corners, flush with the trigger, bold brand-purple border, no
    // default focus ring on the panel (selection is shown by the item highlight).
    // py-0 drops acorn's vertical panel padding so items sit flush to the border.
    'pui:rounded-none pui:mt-0 pui:py-0 pui:border-[3px] pui:border-pui-interactive-primary pui:focus:outline-none',
    // Open/close transition. Driven by HeadlessUI's `transition` prop (data-closed).
    // We animate the `translate` property (NOT `transform`) so the slide-down
    // survives floating-ui's `anchor`, which owns the inline `transform` for
    // positioning. tw-animate-css keyframes can't be used here — they animate
    // `transform` (clobbered by the anchor) and double-run under `transition`
    // (the blink). box-shadow is delayed so the hard offset shadow eases in
    // after the panel has dropped, mirroring the ResourceListCard lift.
    'pui:transition-[opacity,translate,box-shadow] pui:duration-pui-normal pui:ease-pui-out-cubic',
    'pui:[transition-delay:0ms,0ms,70ms]',
    'pui:data-closed:opacity-0 pui:data-closed:-translate-y-2 pui:data-closed:shadow-none',
    'pui:motion-reduce:transition-none'
  ]
});

export const fieldBaseDropdownOptionOiqPlacePourToiVariants = cva({
  base: [
    // Selection is shown by the purple fill + check only, not weight, so drop
    // acorn's `data-selected:font-semibold`.
    'pui:data-selected:font-normal',
    // No focus outline; the active/focused item is shown by its purple fill
    // only (kills the browser's default blue outline too).
    'pui:outline-none pui:focus-visible:outline-none pui:data-focus:outline-none'
  ]
});
