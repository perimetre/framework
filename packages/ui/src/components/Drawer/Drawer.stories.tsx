import type { Story, StoryDefault } from '@ladle/react';
import {
  DrawerClose,
  DrawerContent,
  DrawerOpened,
  DrawerRoot,
  DrawerTrigger
} from './index';

type Props = {
  direction?: 'left' | 'right';
};

export default {
  title: 'Components/Drawer',
  argTypes: {
    direction: {
      options: ['left', 'right'],
      control: { type: 'select' },
      defaultValue: 'right'
    }
  }
} satisfies StoryDefault<Props>;

export const Default: Story<Props> = ({ direction }) => (
  <DrawerRoot>
    <DrawerTrigger>
      <button className="pui:rounded pui:bg-blue-600 pui:px-4 pui:py-2 pui:text-white">
        Open Drawer
      </button>
    </DrawerTrigger>
    <DrawerContent className="pui:w-80 pui:p-6" direction={direction}>
      <div className="pui:flex pui:items-center pui:justify-between pui:mb-4">
        <h2 className="pui:text-lg pui:font-semibold">Drawer Title</h2>
        <DrawerClose>
          <button className="pui:text-gray-500 hover:pui:text-gray-700 pui:text-xl">
            ×
          </button>
        </DrawerClose>
      </div>
      <p className="pui:text-gray-600">
        This is the drawer content. Click the backdrop or the close button to
        dismiss.
      </p>
    </DrawerContent>
  </DrawerRoot>
);

export const LeftDirection: Story<Props> = () => (
  <DrawerRoot>
    <DrawerTrigger>
      <button className="pui:rounded pui:bg-blue-600 pui:px-4 pui:py-2 pui:text-white">
        Open Left Drawer
      </button>
    </DrawerTrigger>
    <DrawerContent className="pui:w-80 pui:p-6" direction="left">
      <div className="pui:flex pui:items-center pui:justify-between pui:mb-4">
        <h2 className="pui:text-lg pui:font-semibold">Left Drawer</h2>
        <DrawerClose>
          <button className="pui:text-gray-500 hover:pui:text-gray-700 pui:text-xl">
            ×
          </button>
        </DrawerClose>
      </div>
      <p className="pui:text-gray-600">This drawer slides in from the left.</p>
    </DrawerContent>
  </DrawerRoot>
);

export const WithNavigation: Story<Props> = () => (
  <DrawerRoot>
    <DrawerTrigger>
      <button className="pui:rounded pui:bg-gray-800 pui:px-4 pui:py-2 pui:text-white">
        ☰ Menu
      </button>
    </DrawerTrigger>
    <DrawerContent className="pui:w-64 pui:p-0" direction="left">
      <div className="pui:flex pui:items-center pui:justify-between pui:p-4 pui:border-b">
        <span className="pui:font-semibold">Navigation</span>
        <DrawerClose>
          <button className="pui:text-gray-500 hover:pui:text-gray-700">
            ×
          </button>
        </DrawerClose>
      </div>
      <nav className="pui:flex pui:flex-col">
        <DrawerClose>
          <button className="pui:px-4 pui:py-3 pui:text-left hover:pui:bg-gray-100 pui:cursor-pointer">
            Home
          </button>
        </DrawerClose>
        <DrawerClose>
          <button className="pui:px-4 pui:py-3 pui:text-left hover:pui:bg-gray-100 pui:cursor-pointer">
            Products
          </button>
        </DrawerClose>
        <DrawerClose>
          <button className="pui:px-4 pui:py-3 pui:text-left hover:pui:bg-gray-100 pui:cursor-pointer">
            About
          </button>
        </DrawerClose>
        <DrawerClose>
          <button className="pui:px-4 pui:py-3 pui:text-left hover:pui:bg-gray-100 pui:cursor-pointer">
            Contact
          </button>
        </DrawerClose>
      </nav>
    </DrawerContent>
  </DrawerRoot>
);

export const WithOpenedIndicator: Story<Props> = () => (
  <DrawerRoot>
    <div className="pui:flex pui:items-center pui:gap-4">
      <DrawerTrigger>
        <button className="pui:rounded pui:bg-blue-600 pui:px-4 pui:py-2 pui:text-white">
          Toggle Drawer
        </button>
      </DrawerTrigger>
      <DrawerOpened>
        <span className="pui:text-green-600 pui:font-medium">
          ● Drawer is open
        </span>
      </DrawerOpened>
    </div>
    <DrawerContent className="pui:w-80 pui:p-6">
      <div className="pui:flex pui:items-center pui:justify-between pui:mb-4">
        <h2 className="pui:text-lg pui:font-semibold">Drawer</h2>
        <DrawerClose>
          <button className="pui:text-gray-500 hover:pui:text-gray-700 pui:text-xl">
            ×
          </button>
        </DrawerClose>
      </div>
      <p className="pui:text-gray-600">
        Notice the indicator next to the button shows the drawer state.
      </p>
    </DrawerContent>
  </DrawerRoot>
);
