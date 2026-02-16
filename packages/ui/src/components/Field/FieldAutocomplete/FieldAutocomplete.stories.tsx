import type { Story, StoryDefault } from '@ladle/react';
import { AlertTriangle, Search, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import FieldAutocomplete, {
  type AutocompleteItem,
  type FieldAutocompleteProps
} from '.';

const defaultItems: AutocompleteItem[] = [
  { id: 1, label: 'Apple' },
  { id: 2, label: 'Banana' },
  { id: 3, label: 'Cherry' },
  { id: 4, label: 'Date' },
  { id: 5, label: 'Elderberry' },
  { id: 6, label: 'Fig' },
  { id: 7, label: 'Grape' },
  { id: 8, label: 'Honeydew' }
];

type Props = FieldAutocompleteProps<AutocompleteItem>;

export default {
  argTypes: {
    corner: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    hint: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } }
  }
} satisfies StoryDefault<Props>;

const FilteredAutocomplete = ({ items: allItems, ...props }: Props) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      query === ''
        ? allItems
        : allItems.filter((item) =>
            item.label.toLowerCase().includes(query.toLowerCase())
          ),
    [allItems, query]
  );

  return (
    <FieldAutocomplete<AutocompleteItem>
      containerClassName="pui:max-w-md"
      items={filtered}
      onQueryChange={setQuery}
      onClose={() => {
        setQuery('');
      }}
      {...props}
    />
  );
};

export const Default: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
Default.args = {
  name: 'fruit',
  placeholder: 'Search fruits…'
};

export const WithLabel: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
WithLabel.args = {
  ...Default.args,
  label: 'Favorite Fruit'
};

export const WithError: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
WithError.args = {
  ...Default.args,
  error: 'Please select a fruit.',
  label: 'Favorite Fruit'
};

export const OpenOnFocus: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
OpenOnFocus.args = {
  ...Default.args,
  label: 'Open on Focus',
  description: 'Click or tab into the input to see all options immediately.',
  openOnFocus: true
};

export const Description: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
Description.args = {
  ...Default.args,
  description: 'Start typing to search for a fruit.',
  label: 'Favorite Fruit'
};

export const Hint: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
Hint.args = {
  ...Default.args,
  hint: 'You can change this later.',
  label: 'Favorite Fruit'
};

export const Corner: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
Corner.args = {
  ...Default.args,
  corner: 'Optional',
  label: 'Favorite Fruit'
};

export const Disabled: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
Disabled.args = {
  ...Default.args,
  disabled: true,
  label: 'Favorite Fruit'
};

export const ReadOnly: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
ReadOnly.args = {
  ...Default.args,
  label: 'Favorite Fruit',
  isReadOnly: true,
  value: { id: 1, label: 'Apple' }
};

export const Leading: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
Leading.args = {
  ...Default.args,
  label: 'Search',
  leading: (
    <Search
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};

export const CustomTrailing: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
CustomTrailing.args = {
  ...Default.args,
  label: 'Fruit',
  trailing: (
    <AlertTriangle
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};

export const CustomRenderItem: Story<Props> = (props) => (
  <FilteredAutocomplete
    {...props}
    renderItem={(item) => (
      <div className="pui:flex pui:items-center pui:gap-2">
        <span className="pui:text-lg">🍎</span>
        <div>
          <div className="pui:font-medium">{item.label}</div>
          <div className="pui:text-xs pui:text-pui-fg-muted">ID: {item.id}</div>
        </div>
      </div>
    )}
  />
);
CustomRenderItem.args = {
  ...Default.args,
  label: 'Custom Render'
};

export const AsyncLoading: Story<Props> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<AutocompleteItem[]>([]);

  const handleQueryChange = (q: string) => {
    if (!q) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    // Simulate async fetch
    setTimeout(() => {
      setItems(
        defaultItems.filter((item) =>
          item.label.toLowerCase().includes(q.toLowerCase())
        )
      );
      setIsLoading(false);
    }, 800);
  };

  return (
    <FieldAutocomplete<AutocompleteItem>
      containerClassName="pui:max-w-md"
      error={undefined}
      isLoading={isLoading}
      items={items}
      label="Async Search"
      name="async-fruit"
      placeholder="Type to search (async)…"
      leading={
        <Search
          aria-hidden
          className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
        />
      }
      onQueryChange={handleQueryChange}
      onClose={() => {
        setItems([]);
      }}
    />
  );
};

export const VirtualScrolling: Story<Props> = () => {
  const manyItems: AutocompleteItem[] = useMemo(
    () =>
      Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        label: `Item ${String(i + 1)}`
      })),
    []
  );
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      query === ''
        ? manyItems
        : manyItems.filter((item) =>
            item.label.toLowerCase().includes(query.toLowerCase())
          ),
    [manyItems, query]
  );

  return (
    <FieldAutocomplete<AutocompleteItem>
      isVirtual
      containerClassName="pui:max-w-md"
      error={undefined}
      items={filtered}
      label="Virtual Scrolling (1000 items)"
      name="virtual-items"
      placeholder="Search items…"
      onQueryChange={setQuery}
      onClose={() => {
        setQuery('');
      }}
    />
  );
};

export const LeadingWithLabel: Story<Props> = (props) => (
  <FilteredAutocomplete {...props} />
);
LeadingWithLabel.args = {
  ...Default.args,
  label: 'Select User',
  leading: (
    <User
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};
