'use client';

import { cva } from '@/lib/cva';
import { cn } from '@perimetre/classnames';
import { type VariantProps } from 'cva';
import { useEffect, useRef } from 'react';

const checkboxRadioVariants = cva({
  base: [
    // Structural styles
    'pui:appearance-none pui:border-2 pui:border-solid',
    // Default colors
    'pui:border-pui-border-default pui:bg-pui-bg-default',
    // Focus state
    'pui:focus-visible:outline-none pui:focus-visible:shadow-pui-input-focus',
    // Disabled state
    'pui:disabled:cursor-not-allowed pui:disabled:border-pui-border-default pui:disabled:bg-pui-bg-subtle',
    // Disabled checked/indeterminate state - override checked colors with gray
    'pui:disabled:checked:border-pui-border-default pui:disabled:indeterminate:border-pui-border-default',
    // Accessibility
    'forced-colors:pui:appearance-auto'
  ],
  variants: {
    variant: {
      default: [
        // Primary icon on white/transparent background (not filled)
        'pui:checked:border-pui-interactive-primary',
        'pui:indeterminate:border-pui-interactive-primary'
      ],
      inverted: [
        // White icon on primary background (filled)
        'pui:checked:border-pui-interactive-primary pui:checked:bg-pui-interactive-primary',
        'pui:indeterminate:border-pui-interactive-primary pui:indeterminate:bg-pui-interactive-primary',
        'pui:disabled:checked:bg-pui-bg-subtle'
      ]
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

const checkboxIconVariants = cva({
  base: [
    // Structural styles
    'pui:pointer-events-none pui:col-start-1 pui:row-start-1 pui:size-3.5 pui:self-center pui:justify-self-center'
  ],
  variants: {
    variant: {
      default: [
        // Primary color icon
        'pui:stroke-pui-interactive-primary',
        'pui:group-has-disabled:stroke-pui-fg-subtle'
      ],
      inverted: [
        // White icon
        'pui:stroke-white',
        'pui:group-has-disabled:stroke-pui-fg-subtle'
      ]
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

const radioIconVariants = cva({
  base: [
    // Inner dot structural styles
    'before:pui:content-[""] before:pui:absolute before:pui:rounded-full',
    // Hide when not checked, show when checked (using custom utility)
    'before:pui:hidden pui:checked:before:block',
    // Accessibility
    'forced-colors:before:pui:hidden'
  ],
  variants: {
    variant: {
      default: [
        // Primary color dot - 10px dot centered in 16px circle
        'before:pui:inset-[3px]',
        'before:pui:bg-pui-interactive-primary'
      ],
      inverted: [
        // White dot - 10px dot for filled background
        'before:pui:inset-[3px]',
        'before:pui:bg-white',
        'pui:disabled:checked:before:bg-pui-fg-subtle'
      ]
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export type FieldCheckboxRadioProps = {
  containerClassName?: string;
  // This is a native input prop, so we don't need to rename it
  // eslint-disable-next-line react/boolean-prop-naming
  indeterminate?: boolean;
  type: 'checkbox' | 'radio';
  variant?: VariantProps<typeof checkboxRadioVariants>['variant'];
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

/**
 * FieldCheckboxRadio component
 *
 * A themeable checkbox/radio input component following Perimetre UI standards.
 * Uses semantic tokens for colors and styling.
 */
const FieldCheckboxRadio: React.FC<FieldCheckboxRadioProps> = ({
  checked,
  className,
  containerClassName,
  indeterminate,
  type,
  variant = 'default',
  ...props
}) => {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // You can't make a checkbox indeterminate through HTML.
    // There is no indeterminate attribute.
    // It is a property of checkboxes though, which you can change via JavaScript.
    if (indeterminate !== undefined && ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate, checked]);

  return type === 'checkbox' ? (
    <div
      className={cn(
        'pui:flex pui:h-6 pui:shrink-0 pui:items-center',
        containerClassName
      )}
    >
      <div className="pui:group pui:grid pui:size-4 pui:grid-cols-1">
        <input
          ref={ref}
          checked={checked}
          type="checkbox"
          className={cn(
            'pui:col-start-1 pui:row-start-1 pui:rounded pui:cursor-pointer',
            checkboxRadioVariants({ variant }),
            className
          )}
          {...props}
        />
        <svg
          className={checkboxIconVariants({ variant })}
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            className="pui:opacity-0 pui:group-has-checked:opacity-100"
            d="M3 8L6 11L11 3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          <path
            className="pui:opacity-0 pui:group-has-indeterminate:opacity-100"
            d="M3 7H11"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </div>
    </div>
  ) : (
    <input
      ref={ref}
      checked={checked}
      type="radio"
      className={cn(
        'pui:relative pui:mt-1 pui:size-4 pui:rounded-full',
        checkboxRadioVariants({ variant }),
        radioIconVariants({ variant }),
        className
      )}
      {...props}
    />
  );
};

export default FieldCheckboxRadio;
