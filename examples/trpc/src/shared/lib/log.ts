export const LOG_COLOR = {
  reset: '\x1b[0m',
  red: '\x1b[1;97;41m',
  green: '\x1b[1;97;42m',
  gray: '\x1b[1;97;47m',
  magenta: '\x1b[1;97;45m',
  blue: '\x1b[1;97;44m'
};

/**
 * Constructs parts and args for console logging with different color modes.
 */
function constructPartsAndArgs(
  {
    colorMode = 'ansi',
    title
  }: { colorMode?: 'ansi' | 'css' | 'none'; title: string },
  ...meta: unknown[]
) {
  const parts: string[] = [];
  const args: unknown[] = [];

  if (colorMode === 'none') {
    parts.push(title);
  } else if (colorMode === 'ansi') {
    parts.push('\x1b[1;97;47m', title, LOG_COLOR.reset);
  } else {
    // css color mode
    const css = `
    background-color: #3fb0d8;
    color: black;
    padding: 2px;
  `;

    parts.push('%c', title, '%O');
    args.push(css, `${css}; font-weight: bold;`);
  }

  args.push(...meta);

  return { args, parts };
}

/**
 * Logs messages to the console with fancy formatting.
 */
export const fancyLog = (
  level: 'error' | 'log',
  title: string,
  ...meta: unknown[]
) => {
  const { args, parts } = constructPartsAndArgs(
    {
      title: title
    },
    ...meta
  );

  console[level].apply(null, [parts.join(' '), ...args]);
};
