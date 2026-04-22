import type { Story, StoryDefault } from '@ladle/react';
import Tabs, { type TabsProps } from './index';

export default {
  title: 'Components/Tabs'
} satisfies StoryDefault<TabsProps>;

export const Default: Story<TabsProps> = () => (
  <Tabs
    items={[
      {
        key: 'features',
        label: 'Features',
        content: (
          <div className="pui:py-4">
            <h3 className="pui:text-lg pui:font-bold">Key Features</h3>
            <p className="pui:mt-2 pui:text-sm">
              Panoramic visibility, exceptional fuel economy, and purpose-built
              body design for maximum passenger comfort.
            </p>
          </div>
        )
      },
      {
        key: 'specs',
        label: 'Specifications',
        content: (
          <div className="pui:py-4">
            <h3 className="pui:text-lg pui:font-bold">Technical Specs</h3>
            <ul className="pui:mt-2 pui:list-disc pui:pl-5 pui:text-sm">
              <li>Engine: Ford 3.5L V6</li>
              <li>Capacity: Up to 34 passengers</li>
              <li>Wheelbase: 178&quot; extended</li>
            </ul>
          </div>
        )
      },
      {
        key: 'options',
        label: 'Options',
        content: (
          <div className="pui:py-4">
            <h3 className="pui:text-lg pui:font-bold">Available Options</h3>
            <p className="pui:mt-2 pui:text-sm">
              Customize your vehicle with wheelchair accessibility, A/C systems,
              luggage racks, and more.
            </p>
          </div>
        )
      }
    ]}
  />
);

export const WithDefaultTab: Story<TabsProps> = () => (
  <Tabs
    defaultValue="specs"
    items={[
      {
        key: 'features',
        label: 'Features',
        content: (
          <div className="pui:py-4">
            <p className="pui:text-sm">Features content here.</p>
          </div>
        )
      },
      {
        key: 'specs',
        label: 'Specifications',
        content: (
          <div className="pui:py-4">
            <p className="pui:text-sm">
              This tab is active by default via the defaultValue prop.
            </p>
          </div>
        )
      }
    ]}
  />
);
