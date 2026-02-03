'use client';

import { cn } from '@perimetre/classnames';
import { AnimatePresence, cubicBezier } from 'motion/react';
import * as m from 'motion/react-m';
import { Portal, Slot } from 'radix-ui';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState
} from 'react';

type DrawerContextProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const InitialDrawerContext: DrawerContextProps = {
  isOpen: false,
  /**
   * Throws when used outside of DrawerRoot. Wrap components in DrawerRoot to fix.
   */
  setIsOpen: () => {
    throw new Error('notImplemented');
  }
};

export const DrawerContext = createContext(InitialDrawerContext);

/**
 * Root provider that manages drawer state. Wrap all Drawer components with this.
 * @example
 * <DrawerRoot>
 *   <DrawerTrigger><button>Open</button></DrawerTrigger>
 *   <DrawerContent>Drawer content here</DrawerContent>
 * </DrawerRoot>
 */
export const DrawerRoot: React.FC<PropsWithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DrawerContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DrawerContext.Provider>
  );
};

/**
 * Toggles the drawer open/closed. Merges click handler into child element via Slot.
 * @example
 * <DrawerTrigger>
 *   <button>Toggle Menu</button>
 * </DrawerTrigger>
 */
export const DrawerTrigger: React.FC<PropsWithChildren> = ({ children }) => {
  const { setIsOpen } = useContext(DrawerContext);

  return (
    <Slot.Slot
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        setIsOpen((isOpen) => !isOpen);
      }}
    >
      {children}
    </Slot.Slot>
  );
};

/**
 * Closes the drawer when clicked. Only closes, does not toggle.
 * @example
 * <DrawerClose>
 *   <button>×</button>
 * </DrawerClose>
 */
export const DrawerClose: React.FC<PropsWithChildren> = ({ children }) => {
  const { setIsOpen } = useContext(DrawerContext);

  return (
    <Slot.Slot
      onClick={() => {
        setIsOpen(false);
      }}
    >
      {children}
    </Slot.Slot>
  );
};

/**
 * Renders children only when the drawer is open. Useful for external indicators.
 * @example
 * <DrawerOpened>
 *   <span>Drawer is open!</span>
 * </DrawerOpened>
 */
export const DrawerOpened: React.FC<PropsWithChildren> = ({ children }) => {
  const { isOpen } = useContext(DrawerContext);
  return isOpen && children;
};

type DrawerContentProps = {
  className?: string;
  direction?: 'left' | 'right';
};

/**
 * Animated drawer panel that slides in from left or right. Includes backdrop overlay.
 * @example
 * <DrawerContent direction="left" className="w-80 p-4">
 *   <DrawerClose><button>×</button></DrawerClose>
 *   <nav>Menu items...</nav>
 * </DrawerContent>
 */
export const DrawerContent: React.FC<PropsWithChildren<DrawerContentProps>> = ({
  children,
  className,
  direction = 'right'
}) => {
  const { isOpen, setIsOpen } = useContext(DrawerContext);
  const offset = direction === 'left' ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal.Root>
          <m.div
            animate={{ opacity: 1 }}
            className="pui:fixed pui:inset-0 pui:z-99998"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <m.div
            animate={{ x: 0 }}
            exit={{ x: offset }}
            initial={{ x: offset }}
            className={cn(
              'pui:fixed pui:top-0 pui:bottom-0 pui:z-99999 pui:bg-white pui:shadow-lg',
              direction === 'left' ? 'pui:left-0' : 'pui:right-0',
              className
            )}
            transition={{
              duration: 0.37,
              ease: cubicBezier(0.215, 0.61, 0.355, 1)
            }}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {children}
          </m.div>
        </Portal.Root>
      )}
    </AnimatePresence>
  );
};
