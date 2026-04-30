'use client';

import { getBrandVariant } from '@/lib/brand-registry';
import { Accordion } from 'radix-ui';
import type { ComponentProps, PropsWithChildren } from 'react';
import './Collapse.css';
import {
  collapseBrandVariants,
  collapseContentBrandVariants,
  collapseContentInnerBrandVariants,
  collapseEyebrowBrandVariants,
  collapseHeadingBrandVariants,
  collapseIconBrandVariants,
  collapseTitleBrandVariants,
  collapseTriggerBrandVariants
} from './brands';

export type CollapseRootProps = ComponentProps<typeof Accordion.Root>;

/**
 * Wraps a group of Collapse items. Forwards all Radix Accordion.Root props,
 * so consumers control single/multiple, controlled/uncontrolled, and default value.
 * @example
 * <CollapseRoot type="single" collapsible>
 *   <Collapse value="q1">…</Collapse>
 *   <Collapse value="q2">…</Collapse>
 * </CollapseRoot>
 */
const CollapseRoot: React.FC<PropsWithChildren<CollapseRootProps>> = ({
  children,
  ...props
}) => <Accordion.Root {...props}>{children}</Accordion.Root>;

export type CollapseProps = {
  value: string;
} & Omit<ComponentProps<typeof Accordion.Item>, 'value'>;

/**
 * A single collapsible item. Must live inside <CollapseRoot> and have a unique `value`.
 * Built on Radix Accordion.Item — keyboard navigation (Up/Down/Home/End) and ARIA wiring are handled natively.
 */
const Collapse: React.FC<PropsWithChildren<CollapseProps>> = ({
  children,
  className,
  value,
  ...props
}) => {
  const variants = getBrandVariant(collapseBrandVariants);
  return (
    <Accordion.Item
      className={variants({ className })}
      value={value}
      {...props}
    >
      {children}
    </Accordion.Item>
  );
};

export type CollapseTriggerProps = ComponentProps<typeof Accordion.Trigger>;

/**
 * Toggles the collapse open/closed. Wraps the heading and icon.
 * Rendered inside an Accordion.Header for proper landmark semantics.
 */
const CollapseTrigger: React.FC<PropsWithChildren<CollapseTriggerProps>> = ({
  children,
  className,
  ...props
}) => {
  const variants = getBrandVariant(collapseTriggerBrandVariants);
  return (
    <Accordion.Header asChild>
      <h3>
        <Accordion.Trigger className={variants({ className })} {...props}>
          {children}
        </Accordion.Trigger>
      </h3>
    </Accordion.Header>
  );
};

export type CollapseHeadingProps = ComponentProps<'span'>;

/**
 * Wrapper for the eyebrow + title pair within a CollapseTrigger.
 */
const CollapseHeading: React.FC<PropsWithChildren<CollapseHeadingProps>> = ({
  children,
  className,
  ...props
}) => {
  const variants = getBrandVariant(collapseHeadingBrandVariants);
  return (
    <span className={variants({ className })} {...props}>
      {children}
    </span>
  );
};

export type CollapseEyebrowProps = ComponentProps<'span'>;

/**
 * Small label rendered below the title (visually) but ahead of it in source order for screen readers.
 */
const CollapseEyebrow: React.FC<PropsWithChildren<CollapseEyebrowProps>> = ({
  children,
  className,
  ...props
}) => {
  const variants = getBrandVariant(collapseEyebrowBrandVariants);
  return (
    <span className={variants({ className })} {...props}>
      {children}
    </span>
  );
};

export type CollapseTitleProps = ComponentProps<'span'>;

/**
 * Main heading text for the collapse item.
 */
const CollapseTitle: React.FC<PropsWithChildren<CollapseTitleProps>> = ({
  children,
  className,
  ...props
}) => {
  const variants = getBrandVariant(collapseTitleBrandVariants);
  return (
    <span className={variants({ className })} {...props}>
      {children}
    </span>
  );
};

export type CollapseIconProps = {
  children?: React.ReactNode;
} & ComponentProps<'span'>;

/**
 * Plus / minus indicator. Reads `data-state` from the parent Accordion.Trigger
 * to morph the vertical bar in/out via CSS. Pass children to override.
 */
const CollapseIcon: React.FC<CollapseIconProps> = ({
  children,
  className,
  ...props
}) => {
  const variants = getBrandVariant(collapseIconBrandVariants);
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
            className="pui-collapse-icon-bar"
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

export type CollapseContentProps = ComponentProps<typeof Accordion.Content>;

/**
 * Animated content panel. Height animation is driven by CSS keyframes that
 * read --radix-accordion-content-height, so it works with Radix's native
 * mount/unmount and stays accessible.
 */
const CollapseContent: React.FC<PropsWithChildren<CollapseContentProps>> = ({
  children,
  className,
  ...props
}) => {
  const wrapperVariants = getBrandVariant(collapseContentBrandVariants);
  const innerVariants = getBrandVariant(collapseContentInnerBrandVariants);
  return (
    <Accordion.Content
      className={`pui-collapse-content ${wrapperVariants({ className })}`}
      {...props}
    >
      <div className={innerVariants()}>{children}</div>
    </Accordion.Content>
  );
};

export default Collapse;
export {
  CollapseContent,
  CollapseEyebrow,
  CollapseHeading,
  CollapseIcon,
  CollapseRoot,
  CollapseTitle,
  CollapseTrigger
};
