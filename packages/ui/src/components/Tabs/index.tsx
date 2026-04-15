import { getBrandVariant } from '@/lib/brand-registry';
import { Tabs as RadixTabs } from 'radix-ui';
import { tabsListBrandVariants, tabsTriggerBrandVariants } from './brands';

export type TabsProps = {
  /** Custom class name for the root element */
  className?: string;
  /** Custom class name for each content panel */
  contentClassName?: string;
  /** The default active tab key. Defaults to the first item. */
  defaultValue?: string;
  /** The tab items to render */
  items: TabItem[];
  /** Custom class name for the tab list */
  listClassName?: string;
  /** Custom class name for each trigger */
  triggerClassName?: string;
};

type TabItem = {
  /** The content rendered when this tab is active */
  content: React.ReactNode;
  /** Unique key for the tab */
  key: string;
  /** The tab label */
  label: React.ReactNode;
};

/** Accessible tabs component built on Radix Tabs. All tab content is always rendered in the DOM for SEO. */
function Tabs({
  className,
  contentClassName,
  defaultValue,
  items,
  listClassName,
  triggerClassName
}: TabsProps) {
  const tabsListVariants = getBrandVariant(tabsListBrandVariants);
  const tabsTriggerVariants = getBrandVariant(tabsTriggerBrandVariants);

  return (
    <RadixTabs.Root
      className={className}
      defaultValue={defaultValue ?? items[0]?.key}
    >
      <div className="pui:flex pui:justify-center">
        <RadixTabs.List
          className={tabsListVariants({ className: listClassName })}
        >
          {items.map((item) => (
            <RadixTabs.Trigger
              key={item.key}
              className={tabsTriggerVariants({ className: triggerClassName })}
              value={item.key}
            >
              {item.label}
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>
      </div>

      {items.map((item) => (
        <RadixTabs.Content
          key={item.key}
          forceMount
          className={contentClassName}
          value={item.key}
        >
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

export default Tabs;
