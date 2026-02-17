import type { StoryDefault } from '@ladle/react';
import { TokenGrid } from './_components/TokenGrid';

export default {
  title: 'Docs/Token Reference'
} satisfies StoryDefault;

export const AllTokens = () => <TokenGrid />;
