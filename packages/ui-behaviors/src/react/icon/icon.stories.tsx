import type { Story, StoryDefault } from '@ladle/react';
import { Icon, type IconProps } from './index';

export default { title: 'React/Icon' } satisfies StoryDefault;

/**
 * An icon an app declares once. `aria-hidden` and `label` are left to
 * whoever uses it.
 * @param props - `aria-hidden` or a `label`, and props for the svg
 */
const IconStar = (props: IconProps) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24">
      <path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 16.5 5.5 21l2-7.5L2 9h7z" />
    </svg>
  </Icon>
);

/** The first star is decoration. The second means something, so it has a label. */
export const Default: Story = () => (
  <div className="flex gap-2">
    <IconStar aria-hidden className="size-6" />
    <IconStar className="size-6" label="Favourite" />
  </div>
);
