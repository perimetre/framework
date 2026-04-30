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

export const StackedList: Story<Props> = () => (
  <div className="pui:max-w-2xl pui:flex pui:flex-col">
    {[
      {
        eyebrow: 'Shipping',
        title: 'When will my order arrive?',
        body: 'Orders ship within 1–2 business days and arrive in 3–5 business days.'
      },
      {
        eyebrow: 'Returns',
        title: 'What is your return policy?',
        body: 'Free returns within 30 days of delivery. Items must be unworn with tags attached.'
      },
      {
        eyebrow: 'Account',
        title: 'How do I update my subscription?',
        body: 'Sign in to your account and visit the Subscription page to pause, skip, or cancel.'
      },
      {
        eyebrow: 'Support',
        title: 'How do I contact customer service?',
        body: 'Reach our team 7 days a week via the chat widget, or email support@example.com — we typically reply within a few hours.'
      }
    ].map((item) => (
      <Collapse key={item.title}>
        <CollapseTrigger>
          <CollapseHeading>
            <CollapseEyebrow>{item.eyebrow}</CollapseEyebrow>
            <CollapseTitle>{item.title}</CollapseTitle>
          </CollapseHeading>
          <CollapseIcon />
        </CollapseTrigger>
        <CollapseContent>
          <p>{item.body}</p>
        </CollapseContent>
      </Collapse>
    ))}
  </div>
);

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
