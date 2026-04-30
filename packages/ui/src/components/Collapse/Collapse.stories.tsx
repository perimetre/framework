import type { Story, StoryDefault } from '@ladle/react';
import Collapse, {
  CollapseContent,
  CollapseEyebrow,
  CollapseHeading,
  CollapseIcon,
  CollapseRoot,
  CollapseTitle,
  CollapseTrigger
} from './index';

type Props = {
  body?: string;
  eyebrow?: string;
  title?: string;
};

export default {
  title: 'Components/Collapse',
  argTypes: {
    title: {
      control: { type: 'text' },
      defaultValue: 'How does the program work?'
    },
    eyebrow: {
      control: { type: 'text' },
      defaultValue: 'Frequently asked'
    },
    body: {
      control: { type: 'text' },
      defaultValue:
        'Sign up online, choose your plan, and we ship your first kit within 48 hours. You can pause or cancel any time from your account dashboard.'
    }
  }
} satisfies StoryDefault<Props>;

const SingleItem: React.FC<{ defaultOpen?: boolean } & Props> = ({
  body,
  defaultOpen,
  eyebrow,
  title
}) => (
  <CollapseRoot
    collapsible
    defaultValue={defaultOpen ? 'item-1' : undefined}
    type="single"
  >
    <Collapse value="item-1">
      <CollapseTrigger>
        <CollapseHeading>
          <CollapseEyebrow>{eyebrow}</CollapseEyebrow>
          <CollapseTitle>{title}</CollapseTitle>
        </CollapseHeading>
        <CollapseIcon />
      </CollapseTrigger>
      <CollapseContent>
        <p>{body}</p>
      </CollapseContent>
    </Collapse>
  </CollapseRoot>
);

export const Default: Story<Props> = (args) => (
  <div className="pui:max-w-2xl">
    <SingleItem {...args} />
  </div>
);

export const OpenByDefault: Story<Props> = (args) => (
  <div className="pui:max-w-2xl">
    <SingleItem {...args} defaultOpen />
  </div>
);

export const RichTextBody: Story<Props> = () => (
  <div className="pui:max-w-2xl">
    <CollapseRoot collapsible defaultValue="item-1" type="single">
      <Collapse value="item-1">
        <CollapseTrigger>
          <CollapseHeading>
            <CollapseEyebrow>Details</CollapseEyebrow>
            <CollapseTitle>{`What's included in the box?`}</CollapseTitle>
          </CollapseHeading>
          <CollapseIcon />
        </CollapseTrigger>
        <CollapseContent>
          <p className="pui:mb-2">Each kit ships with:</p>
          <ul className="pui:list-disc pui:pl-5 pui:flex pui:flex-col pui:gap-1">
            <li>One reusable container</li>
            <li>A 30-day supply of refills</li>
            <li>
              <a className="pui:underline" href="https://example.com/guide">
                A getting-started guide
              </a>
            </li>
          </ul>
        </CollapseContent>
      </Collapse>
    </CollapseRoot>
  </div>
);
