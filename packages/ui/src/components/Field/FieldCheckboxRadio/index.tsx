'use client';

import { getBrandVariant } from '@/lib/brand-registry';
import { cn } from '@perimetre/classnames';
import { useEffect, useRef } from 'react';
import {
  fieldCheckboxRadioBoxBrandVariants,
  fieldCheckboxRadioBrandVariants,
  fieldCheckboxRadioCheckboxIconBrandVariants,
  fieldCheckboxRadioRadioIconBrandVariants,
  type FieldCheckboxRadioVariantProps
} from './brands';

export type FieldCheckboxRadioProps = {
  containerClassName?: string;
  // This is a native input prop, so we don't need to rename it
  // eslint-disable-next-line react/boolean-prop-naming
  indeterminate?: boolean;
  type: 'checkbox' | 'radio';
  variant?: FieldCheckboxRadioVariantProps['variant'];
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

  const checkboxRadioVariants = getBrandVariant(
    fieldCheckboxRadioBrandVariants
  );
  const checkboxBoxVariants = getBrandVariant(
    fieldCheckboxRadioBoxBrandVariants
  );
  const checkboxIconVariants = getBrandVariant(
    fieldCheckboxRadioCheckboxIconBrandVariants
  );
  const radioIconVariants = getBrandVariant(
    fieldCheckboxRadioRadioIconBrandVariants
  );

  return type === 'checkbox' ? (
    <div
      className={cn(
        'pui:flex pui:h-6 pui:shrink-0 pui:items-center',
        containerClassName
      )}
    >
      <div className={checkboxBoxVariants()}>
        <input
          ref={ref}
          checked={checked}
          type="checkbox"
          className={cn(
            'pui:col-start-1 pui:row-start-1 pui:rounded-pui-control pui:cursor-pointer',
            checkboxRadioVariants({ type, variant }),
            className
          )}
          {...props}
        />
        <svg
          className={cn(checkboxIconVariants({ variant }), 'pui:sprig:hidden')}
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
        <svg
          fill="none"
          viewBox="0 0 18 18"
          className={cn(
            checkboxIconVariants({ variant }),
            'pui:hidden pui:sprig:block'
          )}
        >
          <path
            className="pui:opacity-0 pui:group-has-checked:opacity-100"
            clipRule="evenodd"
            d="M15.419 4.30806C15.6159 4.50515 15.7266 4.77242 15.7266 5.0511C15.7266 5.32978 15.6159 5.59706 15.419 5.79414L7.54458 13.6716C7.44052 13.7757 7.31697 13.8583 7.181 13.9146C7.04502 13.971 6.89928 14 6.7521 14C6.60492 14 6.45918 13.971 6.3232 13.9146C6.18723 13.8583 6.06368 13.7757 5.95962 13.6716L2.04729 9.75843C1.94695 9.66148 1.86691 9.54551 1.81186 9.41728C1.7568 9.28906 1.72781 9.15115 1.7266 9.0116C1.72539 8.87206 1.75197 8.73366 1.8048 8.6045C1.85762 8.47534 1.93563 8.358 2.03427 8.25932C2.13291 8.16064 2.25021 8.0826 2.37932 8.02976C2.50843 7.97691 2.64677 7.95032 2.78626 7.95153C2.92576 7.95275 3.06361 7.98174 3.19179 8.03682C3.31996 8.0919 3.43589 8.17197 3.5328 8.27235L6.75175 11.4925L13.9328 4.30806C14.0303 4.2104 14.1462 4.13292 14.2737 4.08007C14.4012 4.02721 14.5378 4 14.6759 4C14.8139 4 14.9506 4.02721 15.0781 4.08007C15.2056 4.13292 15.3214 4.2104 15.419 4.30806Z"
            fill="currentColor"
            fillRule="evenodd"
          />
          <path
            className="pui:opacity-0 pui:group-has-indeterminate:opacity-100"
            d="M4 9H14"
            stroke="currentColor"
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
        checkboxRadioVariants({ type, variant }),
        radioIconVariants({ variant }),
        className
      )}
      {...props}
    />
  );
};

export default FieldCheckboxRadio;
