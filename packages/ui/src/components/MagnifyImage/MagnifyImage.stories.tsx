import type { Story, StoryDefault } from '@ladle/react';
import MagnifyImage, { type MagnifyImageProps } from './index';

export default {
  title: 'Components/MagnifyImage'
} satisfies StoryDefault<MagnifyImageProps>;

const sampleImage = (
  <img
    alt="A scenic mountain landscape"
    src="https://picsum.photos/seed/magnify/800/600"
    style={{
      display: 'block',
      height: '100%',
      objectFit: 'cover',
      width: '100%'
    }}
  />
);

export const Default: Story<MagnifyImageProps> = () => (
  <div style={{ height: 360, width: 480 }}>
    <MagnifyImage renderImage={sampleImage} />
  </div>
);

export const LargeLens: Story<MagnifyImageProps> = () => (
  <div style={{ height: 360, width: 480 }}>
    <MagnifyImage lensRadius={120} renderImage={sampleImage} scale={3} />
  </div>
);
