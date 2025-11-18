import * as AccessibleIcon from '@radix-ui/react-accessible-icon';
import { Slot } from '@radix-ui/react-slot';
import { type PropsWithChildren } from 'react';

/**
 * Icon props that enforce accessibility requirements.
 * Either `aria-hidden` must be true OR `label` must be provided.
 */
export type IconProps = PropsWithChildren<
  (
    | { 'aria-hidden': true; label?: string }
    | { 'aria-hidden'?: false; label: string }
  ) &
    Omit<React.HTMLAttributes<HTMLElement>, 'aria-hidden' | 'label'>
>;

/**
 * A wrapper for icons that provides accessibility features.
 * Ensures icons are either hidden from screen readers or have proper labels.
 */
const Icon: React.FC<IconProps> = ({ children, label, ...props }) => (
  <AccessibleIcon.Root
    label={props['aria-hidden'] === true ? '' : (label ?? '')}
  >
    <Slot {...props}>{children}</Slot>
  </AccessibleIcon.Root>
);

export default Icon;
