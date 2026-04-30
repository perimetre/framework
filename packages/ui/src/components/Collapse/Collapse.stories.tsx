import type { Story, StoryDefault } from '@ladle/react';
import Collapse, {
  CollapseContent,
  CollapseEyebrow,
  CollapseHeading,
  CollapseIcon,
  CollapseTitle,
  CollapseTrigger,
  type CollapseProps
} from './index';

type Props = {
  body?: string;
  eyebrow?: string;
  title?: string;
} & CollapseProps;

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
    },
    defaultOpen: {
      control: { type: 'boolean' },
      defaultValue: false
    }
  }
} satisfies StoryDefault<Props>;

const DefaultComp: Story<Props> = ({
  body,
  defaultOpen,
  eyebrow,
  title,
  ...props
}) => (
  <div className="pui:max-w-2xl">
    <Collapse defaultOpen={defaultOpen} {...props}>
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
  </div>
);

export const Default = DefaultComp.bind({});

export const OpenByDefault = DefaultComp.bind({});
OpenByDefault.args = { defaultOpen: true };

export const RichTextBody: Story<Props> = () => (
  <div className="pui:max-w-2xl">
    <Collapse defaultOpen>
      <CollapseTrigger>
        <CollapseHeading>
          <CollapseEyebrow>Details</CollapseEyebrow>
          <CollapseTitle>What's included in the box?</CollapseTitle>
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
  </div>
);
