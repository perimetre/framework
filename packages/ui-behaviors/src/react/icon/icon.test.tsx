import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Icon } from './index';

test('Icon: renders on the server, hides the svg and labels it only when it means something', () => {
  const labelled = renderToStaticMarkup(
    <Icon className="size-6" label="Favourite">
      <svg className="fill-current" />
    </Icon>
  );
  expect(labelled).toContain(
    '<svg class="fill-current size-6" aria-hidden="true" focusable="false">'
  );
  expect(labelled).toContain('>Favourite</span>');
  expect(labelled).toContain('white-space:nowrap');

  const decoration = renderToStaticMarkup(
    <Icon aria-hidden>
      <svg />
    </Icon>
  );
  expect(decoration).toBe('<svg aria-hidden="true" focusable="false"></svg>');
});
