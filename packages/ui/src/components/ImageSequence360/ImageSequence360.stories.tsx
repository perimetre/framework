import type { Story, StoryDefault } from '@ladle/react';
import ImageSequence360, { type ImageSequence360Props } from './index';

export default {
  title: 'Components/ImageSequence360'
} satisfies StoryDefault<ImageSequence360Props>;

const FRAME_COUNT = 180;

// Frames served by Ladle from packages/ui/public/bus/*.png (0-indexed, 5-digit padding).
const imageURL = (i: number) =>
  `/bus/mic2026-01_Dseries_G5_studio_360_${String(i).padStart(5, '0')}.png`;

export const Default: Story<ImageSequence360Props> = () => (
  <div style={{ aspectRatio: '4 / 3', maxWidth: 640, width: '100%' }}>
    <ImageSequence360
      clearCanvas
      loop
      frames={FRAME_COUNT}
      src={{ imageURL, maxCachedImages: 6 }}
    />
  </div>
);
