import { defineConfig } from 'cva';
import { extendTailwindMerge } from 'tailwind-merge';

const PUI_PREFIX = 'pui:';

const twMerge = extendTailwindMerge({
  /**
   * Strips the `pui:` prefix before parsing so twMerge can resolve all conflicts.
   * Tailwind v4 places variants before the prefix (e.g. `hover:pui:bg-white`).
   * tailwind-merge's built-in `prefix` option only checks the start of the class,
   * so variant-prefixed classes are not recognized without this custom parser.
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  experimentalParseClassName: ({ className, parseClassName }) => {
    const classNameWithoutPrefix = className.includes(PUI_PREFIX)
      ? className.replace(PUI_PREFIX, '')
      : className;
    return parseClassName(classNameWithoutPrefix);
  },
  /**
   * Teach twMerge about our custom design-token utilities so it can dedupe them
   * against Tailwind's built-ins (e.g. `rounded-pui-input` vs `rounded-none`,
   * `shadow-pui-input-focus` vs `shadow-none`). Without this, both survive a
   * merge and the winner is decided by stylesheet order — so brand overrides
   * couldn't reliably beat the acorn base.
   */
  extend: {
    classGroups: {
      rounded: [
        {
          rounded: [
            'pui-button',
            'pui-input',
            'pui-badge',
            'pui-control',
            'pui-dropdown'
          ]
        }
      ],
      shadow: [
        {
          shadow: [
            'pui-button',
            'pui-button-hover',
            'pui-input',
            'pui-input-focus',
            'pui-card',
            'pui-dropdown',
            'pui-dropdown-panel'
          ]
        }
      ]
    }
  }
});

// Ref: https://beta.cva.style/getting-started/installation#handling-style-conflicts
export const { compose, cva, cx } = defineConfig({
  hooks: {
    /**
     * Use `twMerge` to merge Tailwind CSS class names and handle conflicts.
     */
    onComplete: (className) => twMerge(className)
  }
});
