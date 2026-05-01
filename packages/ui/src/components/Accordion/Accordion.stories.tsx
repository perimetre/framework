import type { Story, StoryDefault } from '@ladle/react';
import Accordion, {
  AccordionContent,
  AccordionEyebrow,
  AccordionHeading,
  AccordionIcon,
  AccordionRoot,
  AccordionTitle,
  AccordionTrigger
} from './index';

type Props = {
  body?: string;
  eyebrow?: string;
  title?: string;
};

export default {
  title: 'Components/Accordion',
  args: {
    eyebrow: 'How it works',
    title: 'How does the subscription work?',
    body: 'Sign up online, choose your plan, and we ship your first kit within 48 hours. You can pause or cancel any time from your account dashboard.'
  },
  argTypes: {
    eyebrow: { control: { type: 'text' }, defaultValue: 'How it works' },
    title: {
      control: { type: 'text' },
      defaultValue: 'How does the subscription work?'
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
  <AccordionRoot
    collapsible
    defaultValue={defaultOpen ? 'item-1' : undefined}
    type="single"
  >
    <Accordion value="item-1">
      <AccordionTrigger>
        <AccordionHeading>
          <AccordionEyebrow>{eyebrow}</AccordionEyebrow>
          <AccordionTitle>{title}</AccordionTitle>
        </AccordionHeading>
        <AccordionIcon />
      </AccordionTrigger>
      <AccordionContent>
        <p>{body}</p>
      </AccordionContent>
    </Accordion>
  </AccordionRoot>
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
    <AccordionRoot collapsible defaultValue="item-1" type="single">
      <Accordion value="item-1">
        <AccordionTrigger>
          <AccordionHeading>
            <AccordionEyebrow>Details</AccordionEyebrow>
            <AccordionTitle>{`What's included in the box?`}</AccordionTitle>
          </AccordionHeading>
          <AccordionIcon />
        </AccordionTrigger>
        <AccordionContent>
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
        </AccordionContent>
      </Accordion>
    </AccordionRoot>
  </div>
);

export const MultipleItems: Story<Props> = () => (
  <div className="pui:max-w-2xl">
    <AccordionRoot type="multiple">
      {[
        {
          value: 'item-1',
          eyebrow: 'How it works',
          title: 'How does the subscription work?',
          body: 'Sign up online, choose your plan, and we ship your first kit within 48 hours.'
        },
        {
          value: 'item-2',
          eyebrow: 'Shipping',
          title: 'When will my order arrive?',
          body: 'Most orders ship within 1-2 business days and arrive in 3-5 business days.'
        },
        {
          value: 'item-3',
          eyebrow: 'Returns',
          title: 'What is your return policy?',
          body: 'Unopened items can be returned within 30 days for a full refund.'
        }
      ].map(({ body, eyebrow, title, value }) => (
        <Accordion key={value} value={value}>
          <AccordionTrigger>
            <AccordionHeading>
              <AccordionEyebrow>{eyebrow}</AccordionEyebrow>
              <AccordionTitle>{title}</AccordionTitle>
            </AccordionHeading>
            <AccordionIcon />
          </AccordionTrigger>
          <AccordionContent>
            <p>{body}</p>
          </AccordionContent>
        </Accordion>
      ))}
    </AccordionRoot>
  </div>
);

export const AllVariants: Story<Props> = (args) => (
  <div className="pui:flex pui:flex-col pui:gap-8 pui:max-w-2xl">
    <section>
      <p className="pui:mb-2 pui:text-sm pui:text-pui-fg-muted">
        Single, closed
      </p>
      <SingleItem {...args} />
    </section>
    <section>
      <p className="pui:mb-2 pui:text-sm pui:text-pui-fg-muted">Single, open</p>
      <SingleItem {...args} defaultOpen />
    </section>
    <section>
      <p className="pui:mb-2 pui:text-sm pui:text-pui-fg-muted">
        Custom heading level (h2)
      </p>
      <AccordionRoot collapsible type="single">
        <Accordion value="item-1">
          <AccordionTrigger headingLevel="h2">
            <AccordionHeading>
              <AccordionTitle>{args.title}</AccordionTitle>
            </AccordionHeading>
            <AccordionIcon />
          </AccordionTrigger>
          <AccordionContent>
            <p>{args.body}</p>
          </AccordionContent>
        </Accordion>
      </AccordionRoot>
    </section>
  </div>
);
