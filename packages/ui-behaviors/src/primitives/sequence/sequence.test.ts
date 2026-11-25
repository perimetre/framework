import { checkServer, mount } from '@ui-sdk/core/testing';
import { expect, test } from 'bun:test';
import { sequence } from './index';

/**
 * A part's element, or a failed test when the markup has none.
 * @param element - What `view.part` returned
 */
const present = (element: HTMLElement | undefined) => {
  if (!element) throw new Error('The part is missing from the markup.');
  return element;
};

const SEQUENCE = `<root><viewport aria-label="The chair, turning"></viewport><previous>Turn left</previous><next>Turn right</next><play-toggle>Play</play-toggle></root>`;

test('sequence: Next steps, commits once and stops at the end without loop', async () => {
  const commits: number[] = [];
  const view = mount(
    sequence,
    {
      defaultValue: 0.99,
      loop: false,
      /** Records each commit. */
      onValueCommit: (value) => {
        commits.push(value);
      }
    },
    SEQUENCE
  );
  try {
    await view.click(present(view.part('next')));
    expect(view.state.value).toBe(1);
    expect(view.changes.at(-1)).toMatchObject({ reason: 'next-press' });
    expect(commits).toEqual([1]);
    expect(view.part('next')?.getAttribute('aria-disabled')).toBe('true');
    expect(view.part('previous')?.hasAttribute('aria-disabled')).toBe(false);
  } finally {
    view.unmount();
  }
});

test('sequence: a sideways drag scrubs, and Previous takes over from playback', async () => {
  const view = mount(sequence, { defaultPlaying: true }, SEQUENCE);
  try {
    expect(view.state.playing).toBe(true);
    await view.click(present(view.part('previous')));
    expect(view.state.playing).toBe(false);
    expect(
      view.changes.find((change) => change.key === 'playing')
    ).toMatchObject({
      reason: 'previous-press'
    });

    const before = view.state.value;
    await view.drag(present(view.part('viewport')), { by: { x: 40, y: 0 } });
    expect(view.state.value).not.toBe(before);
    expect(view.state.dragging).toBe(false);
    expect(view.changes.at(-1)).toMatchObject({
      key: 'value',
      reason: 'swipe'
    });
  } finally {
    view.unmount();
  }
});

test('sequence: renders on the server', () => {
  expect(checkServer(sequence, { defaultValue: 0.25 }, SEQUENCE)).toContain(
    '--sequence-progress:0.25'
  );
});
