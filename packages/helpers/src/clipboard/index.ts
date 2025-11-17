/**
 * Used to copy text to the clipboard when on the browser's client side
 * @param str the string to copy
 */
export const copyToClipboard = (str?: string) => {
  // Ref: https://github.com/gatsbyjs/gatsby/blob/master/www/src/utils/copy-to-clipboard.js
  if (
    !str ||
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return Promise.resolve();
  }

  const { clipboard } = window.navigator;
  /*
   * fallback to older browsers (including Safari)
   * if clipboard API not supported
   */
  const hasWriteText =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    clipboard &&
    'writeText' in clipboard &&
    typeof clipboard.writeText === 'function';

  if (!hasWriteText) {
    const textarea = document.createElement('textarea');
    textarea.value = str;
    textarea.setAttribute('readonly', 'true');
    textarea.setAttribute('contenteditable', 'true');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const range = document.createRange();
    const sel = window.getSelection();

    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    textarea.setSelectionRange(0, textarea.value.length);
    // Note: execCommand is deprecated but kept for backwards compatibility
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand('copy');
    document.body.removeChild(textarea);

    return Promise.resolve();
  }

  return clipboard.writeText(str);
};
