# @perimetre/fancy-log

Pretty print colorful debug messages.

## Install

```bash
pnpm add @perimetre/fancy-log
```

## Usage

```ts
import { info, warn, error, debug } from '@perimetre/fancy-log';

info('Server started on port 3000');
warn('Missing environment variable');
error('Database connection failed', err);
debug('Query result', { rows: 42 });
```

Output:

```
2024-01-15T10:30:00.000Z DEBUG Query result { rows: 42 }
2024-01-15T10:30:00.000Z  INFO Server started on port 3000
2024-01-15T10:30:00.000Z  WARN Missing environment variable
2024-01-15T10:30:00.000Z ERROR Database connection failed Error: ...
```

Extra arguments are passed through to `console` natively, so objects, arrays, and errors are printed with full inspection.
