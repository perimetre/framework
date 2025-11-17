import { join } from 'path';
import { URL } from 'url';

/**
 * Similar to path.join but with urls
 * @param urls the list of urls to join
 * @returns the string with the joined urls
 */
export const joinUrls = (...urls: string[]) => {
  const firstUrl = urls[0];
  if (!firstUrl) {
    throw new Error('At least one URL must be provided');
  }
  const baseUrl = new URL(firstUrl);
  const pathsToJoin =
    baseUrl.pathname && baseUrl.pathname !== '/'
      ? [baseUrl.pathname, ...urls.slice(1)]
      : urls.slice(1);
  return new URL(join(...pathsToJoin), baseUrl.origin).toString();
};
