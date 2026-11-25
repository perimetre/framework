import { checkServer, mount } from '@ui-sdk/core/testing';
import { expect, test } from 'bun:test';
import { magnify } from './index';

const MAGNIFY = `<root><trigger>Magnify</trigger><lens><lens-content></lens-content></lens></root>`;

test('magnify: the trigger shows the lens, arrows move it and Escape hides it', async () => {
  const view = mount(magnify, {}, MAGNIFY);
  try {
    await view.keys('Tab', 'Enter');
    expect(view.state.active).toBe(true);
    expect(view.part('lens')?.isConnected).toBe(true);
    expect(view.part('trigger')?.getAttribute('aria-pressed')).toBe('true');
    expect(view.changes.at(-1)).toMatchObject({
      key: 'active',
      reason: 'trigger-press',
      source: 'keyboard'
    });

    await view.keys('ArrowRight', 'ArrowDown');
    expect(view.state.x).toBeCloseTo(0.55);
    expect(view.state.y).toBeCloseTo(0.55);

    await view.keys('Escape');
    expect(view.state.active).toBe(false);
    expect(view.changes.at(-1)).toMatchObject({ reason: 'escape-key' });
  } finally {
    view.unmount();
  }
});

test('magnify: a mouse shows the lens on hover, and only while enabled', async () => {
  const view = mount(magnify, {}, MAGNIFY);
  const disabled = mount(magnify, { disabled: true }, MAGNIFY);
  try {
    await view.hover(view.root);
    expect(view.state.active).toBe(true);
    expect(view.changes.at(-1)).toMatchObject({ reason: 'trigger-hover' });

    await disabled.hover(disabled.root);
    expect(disabled.state.active).toBe(false);
  } finally {
    view.unmount();
    disabled.unmount();
  }
});

test('magnify: renders on the server', () => {
  expect(checkServer(magnify, { defaultActive: true }, MAGNIFY)).toContain(
    'data-slot="magnify-lens"'
  );
});
