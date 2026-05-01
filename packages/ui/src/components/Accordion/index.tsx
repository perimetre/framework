'use client';

import { getBrandVariant } from '@/lib/brand-registry';
import { Accordion as RadixAccordion } from 'radix-ui';
import type { ComponentProps, PropsWithChildren } from 'react';
import {
  accordionBrandVariants,
  accordionContentBrandVariants,
  accordionContentInnerBrandVariants,
  accordionEyebrowBrandVariants,
  accordionHeadingBrandVariants,
  accordionIconBarBrandVariants,
  accordionIconBrandVariants,
  accordionTitleBrandVariants,
  accordionTriggerBrandVariants
} from './brands';

export type AccordionRootProps = ComponentProps<typeof RadixAccordion.Root>;

type HeadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * Wraps a group of Accordion items. Forwards all Radix Accordion.Root props,
 * so consumers control single/multiple, controlled/uncontrolled, and default value.
 * @example
 * <AccordionRoot type="single" collapsible>
 *   <Accordion value="q1">…</Accordion>
 *   <Accordion value="q2">…</Accordion>
 * </AccordionRoot>
 */
export const AccordionRoot: React.FC<PropsWithChildren<AccordionRootProps>> = ({
  children,
  ...props
}) => <RadixAccordion.Root {...props}>{children}</RadixAccordion.Root>;

export type AccordionProps = {
  value: string;
} & Omit<ComponentProps<typeof RadixAccordion.Item>, 'value'>;

/**
 * A single accordion item. Must live inside <AccordionRoot> and have a unique `value`.
 * Built on Radix Accordion.Item — keyboard navigation (Up/Down/Home/End) and ARIA wiring are handled natively.
 */
const Accordion: React.FC<PropsWithChildren<AccordionProps>> = ({
  children,
  className,
  value,
  ...props
}) => {
  const variants = getBrandVariant(accordionBrandVariants);
  return (
    <RadixAccordion.Item
      className={variants({ className })}
      value={value}
      {...props}
    >
      {children}
    </RadixAccordion.Item>
  );
};

export type AccordionTriggerProps = {
  headingLevel?: HeadingLevel;
} & ComponentProps<typeof RadixAccordion.Trigger>;

/**
 * Toggles the accordion item open/closed. Wraps the heading and icon.
 * Rendered inside an Accordion.Header. Pass `headingLevel` to align with
 * the surrounding document outline (defaults to `h4`).
 */
export const AccordionTrigger: React.FC<
  PropsWithChildren<AccordionTriggerProps>
> = ({ children, className, headingLevel = 'h4', ...props }) => {
  const variants = getBrandVariant(accordionTriggerBrandVariants);
  const Heading = headingLevel;
  return (
    <RadixAccordion.Header asChild>
      <Heading>
        <RadixAccordion.Trigger className={variants({ className })} {...props}>
          {children}
        </RadixAccordion.Trigger>
      </Heading>
    </RadixAccordion.Header>
  );
};

export type AccordionHeadingProps = ComponentProps<'span'>;

/**
 * Wrapper for the eyebrow + title pair within an AccordionTrigger.
 */
export const AccordionHeading: React.FC<
  PropsWithChildren<AccordionHeadingProps>
> = ({ children, className, ...props }) => {
  const variants = getBrandVariant(accordionHeadingBrandVariants);
  return (
    <span className={variants({ className })} {...props}>
      {children}
    </span>
  );
};

export type AccordionEyebrowProps = ComponentProps<'span'>;

/**
 * Small label rendered below the title (visually) but ahead of it in source order for screen readers.
 */
export const AccordionEyebrow: React.FC<
  PropsWithChildren<AccordionEyebrowProps>
> = ({ children, className, ...props }) => {
  const variants = getBrandVariant(accordionEyebrowBrandVariants);
  return (
    <span className={variants({ className })} {...props}>
      {children}
    </span>
  );
};

export type AccordionTitleProps = ComponentProps<'span'>;

/**
 * Main heading text for the accordion item.
 */
export const AccordionTitle: React.FC<
  PropsWithChildren<AccordionTitleProps>
> = ({ children, className, ...props }) => {
  const variants = getBrandVariant(accordionTitleBrandVariants);
  return (
    <span className={variants({ className })} {...props}>
      {children}
    </span>
  );
};

export type AccordionIconProps = {
  children?: React.ReactNode;
} & ComponentProps<'span'>;

/**
 * Plus / minus indicator. Reads `data-state` from the parent Accordion.Trigger
 * to morph the vertical bar in/out via CSS. Pass children to override.
 */
export const AccordionIcon: React.FC<AccordionIconProps> = ({
  children,
  className,
  ...props
}) => {
  const variants = getBrandVariant(accordionIconBrandVariants);
  const barVariants = getBrandVariant(accordionIconBarBrandVariants);
  return (
    <span aria-hidden className={variants({ className })} {...props}>
      {children ?? (
        <svg
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 8H13"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <path
            className={barVariants()}
            d="M8 3V13"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </span>
  );
};

export type AccordionContentProps = ComponentProps<
  typeof RadixAccordion.Content
>;

/**
 * Animated content panel. Height animation is driven by tw-animate-css keyframes
 * (`animate-accordion-down` / `animate-accordion-up`) that read
 * --radix-accordion-content-height, so it works with Radix's native mount/unmount
 * and stays accessible. Inner content fades in for additional polish.
 */
export const AccordionContent: React.FC<
  PropsWithChildren<AccordionContentProps>
> = ({ children, className, ...props }) => {
  const wrapperVariants = getBrandVariant(accordionContentBrandVariants);
  const innerVariants = getBrandVariant(accordionContentInnerBrandVariants);
  return (
    <RadixAccordion.Content
      className={wrapperVariants({ className })}
      {...props}
    >
      <div className={innerVariants()}>{children}</div>
    </RadixAccordion.Content>
  );
};

export default Accordion;
