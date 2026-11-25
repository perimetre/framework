import { expect, test } from 'bun:test';
import { accessibleIcon } from './index';

test('accessibleIcon: the graphic is always hidden, and only a meaningful icon has a label', () => {
  expect(accessibleIcon({ label: 'Settings' })).toEqual({
    icon: { 'aria-hidden': 'true', focusable: 'false' },
    label: 'Settings'
  });
  expect(accessibleIcon({ 'aria-hidden': true }).label).toBeUndefined();
  // @ts-expect-error An icon that is neither hidden nor labelled is refused.
  accessibleIcon({});
});
