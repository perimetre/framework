'use client';

import { getBrandVariant } from '@/lib/brand-registry';
import { AnimatePresence, cubicBezier } from 'motion/react';
import * as m from 'motion/react-m';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useId,
  useState
} from 'react';
import {
  collapseBrandVariants,
  collapseContentBrandVariants,
  collapseContentInnerBrandVariants,
  collapseEyebrowBrandVariants,
  collapseHeadingBrandVariants,
  collapseIconBrandVariants,
  collapseTitleBrandVariants,
  collapseTriggerBrandVariants,
  type CollapseVariantProps
} from './brands';

type CollapseContextProps = {
  contentId: string;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerId: string;
};

const CollapseContext = createContext<CollapseContextProps | null>(null);

/**
 * Internal hook to access CollapseContext. Throws when used outside of Collapse.
 */
const useCollapseContext = () => {
  const ctx = useContext(CollapseContext);
  if (!ctx) {
    throw new Error('Collapse subcomponents must be used within <Collapse>');
  }
  return ctx;
};

export type CollapseProps = {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
} & CollapseVariantProps &
  React.ComponentProps<'div'>;

/**
 * Collapse — a disclosure panel with an eyebrow, title, and rich text body.
 * Animates open/close with motion. Brand-aware via getBrandVariant().
 * @example
 * <Collapse>
 *   <CollapseTrigger>
 *     <CollapseHeading>
 *       <CollapseEyebrow>Section</CollapseEyebrow>
 *       <CollapseTitle>How does it work?</CollapseTitle>
 *     </CollapseHeading>
 *     <CollapseIcon />
 *   </CollapseTrigger>
 *   <CollapseContent>
 *     <p>Rich text body content goes here.</p>
 *   </CollapseContent>
 * </Collapse>
 */
const Collapse: React.FC<PropsWithChildren<CollapseProps>> = ({
  children,
  className,
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  ...props
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  /**
   * Setter that supports controlled and uncontrolled modes and forwards to onOpenChange.
   */
  const setIsOpen: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
    const next = typeof value === 'function' ? value(isOpen) : value;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const id = useId();
  const triggerId = `collapse-trigger-${id}`;
  const contentId = `collapse-content-${id}`;

  const variants = getBrandVariant(collapseBrandVariants);

  return (
    <CollapseContext.Provider
      value={{ isOpen, setIsOpen, contentId, triggerId }}
    >
      <div
        className={variants({ className })}
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </div>
    </CollapseContext.Provider>
  );
};

export type CollapseTriggerProps = React.ComponentProps<'button'>;

/**
 * Toggles the collapse open/closed. Should wrap the heading and icon.
 */
const CollapseTrigger: React.FC<PropsWithChildren<CollapseTriggerProps>> = ({
  children,
  className,
  onClick,
  ...props
}) => {
  const { contentId, isOpen, setIsOpen, triggerId } = useCollapseContext();
  const variants = getBrandVariant(collapseTriggerBrandVariants);

  return (
    <button
      aria-controls={contentId}
      aria-expanded={isOpen}
      className={variants({ className })}
      id={triggerId}
      type="button"
      onClick={(e) => {
        setIsOpen((v) => !v);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export type CollapseHeadingProps = React.ComponentProps<'span'>;

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

export type CollapseEyebrowProps = React.ComponentProps<'span'>;

/**
 * Small label rendered above the title.
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

export type CollapseTitleProps = React.ComponentProps<'span'>;

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
} & React.ComponentProps<'span'>;

/**
 * Chevron indicator that rotates when open. Provide custom children to override the default chevron.
 */
const CollapseIcon: React.FC<CollapseIconProps> = ({
  children,
  className,
  ...props
}) => {
  const { isOpen } = useCollapseContext();
  const variants = getBrandVariant(collapseIconBrandVariants);
  return (
    <span
      aria-hidden
      className={variants({ className })}
      data-state={isOpen ? 'open' : 'closed'}
      {...props}
    >
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
            d="M8 3V13"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
            style={{
              opacity: isOpen ? 0 : 1,
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transformOrigin: 'center',
              transition: 'transform 300ms ease-out, opacity 300ms ease-out'
            }}
          />
        </svg>
      )}
    </span>
  );
};

export type CollapseContentProps = {
  className?: string;
};

/**
 * Animated content panel. Renders rich text/children when open.
 */
const CollapseContent: React.FC<PropsWithChildren<CollapseContentProps>> = ({
  children,
  className
}) => {
  const { contentId, isOpen, triggerId } = useCollapseContext();
  const wrapperVariants = getBrandVariant(collapseContentBrandVariants);
  const innerVariants = getBrandVariant(collapseContentInnerBrandVariants);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <m.div
          animate={{ height: 'auto', opacity: 1 }}
          aria-labelledby={triggerId}
          className={wrapperVariants({ className })}
          exit={{ height: 0, opacity: 0 }}
          id={contentId}
          initial={{ height: 0, opacity: 0 }}
          role="region"
          transition={{
            duration: 0.3,
            ease: cubicBezier(0.215, 0.61, 0.355, 1)
          }}
        >
          <div className={innerVariants()}>{children}</div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default Collapse;
export {
  CollapseContent,
  CollapseEyebrow,
  CollapseHeading,
  CollapseIcon,
  CollapseTitle,
  CollapseTrigger
};
