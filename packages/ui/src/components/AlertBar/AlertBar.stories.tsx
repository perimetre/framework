import type { Story, StoryDefault } from '@ladle/react';
import AlertBar, {
  AlertBarContent,
  AlertBarIcon,
  type AlertBarProps
} from './index';

type Props = {
  label?: string;
} & AlertBarProps;

export default {
  title: 'Components/AlertBar',
  argTypes: {
    label: {
      control: { type: 'text' },
      defaultValue: 'Winter storms may cause shipping delays.'
    },
    variant: {
      options: ['first', 'second', 'third', 'fourth'],
      control: { type: 'select' },
      defaultValue: 'first'
    }
  }
} satisfies StoryDefault<Props>;

const DefaultComp: Story<Props> = ({ label, ...props }) => (
  <AlertBar {...props}>
    <AlertBarContent>{label}</AlertBarContent>
  </AlertBar>
);

export const Default = DefaultComp.bind({});

export const First = DefaultComp.bind({});
First.args = {
  label: 'Free shipping on orders over $75!',
  variant: 'first'
};

export const Second = DefaultComp.bind({});
Second.args = {
  label: 'Winter Weather Alert: Shipping delays expected.',
  variant: 'second'
};

export const Third = DefaultComp.bind({});
Third.args = {
  label: 'New arrivals are here — shop the latest collection.',
  variant: 'third'
};

export const Fourth = DefaultComp.bind({});
Fourth.args = {
  label: 'Black Friday Sale: Up to 50% off sitewide.',
  variant: 'fourth'
};

export const WithIcon: Story<Props> = () => (
  <AlertBar variant="second">
    <AlertBarIcon>
      <svg
        className="pui:size-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          clipRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
          fillRule="evenodd"
        />
      </svg>
    </AlertBarIcon>
    <AlertBarContent>
      Winter Weather Alert: Shipping delays expected.
    </AlertBarContent>
  </AlertBar>
);

export const AllVariants: Story<Props> = () => (
  <div className="pui:flex pui:flex-col pui:gap-0">
    <AlertBar variant="first">
      <AlertBarContent>First — Primary brand color background</AlertBarContent>
    </AlertBar>
    <AlertBar variant="second">
      <AlertBarContent>Second — Attention/red background</AlertBarContent>
    </AlertBar>
    <AlertBar variant="third">
      <AlertBarContent>Third — Neutral/light background</AlertBarContent>
    </AlertBar>
    <AlertBar variant="fourth">
      <AlertBarContent>Fourth — Dark background</AlertBarContent>
    </AlertBar>
  </div>
);
