# @perimetre/helpers

Shared TypeScript utilities and reusable helpers for Perimetre projects.

## Installation

```bash
pnpm add @perimetre/helpers
```

## Usage

### Tree-shakeable Imports

This package is designed to be tree-shakeable. You can import only the helpers you need:

```typescript
// Import specific helpers (tree-shakeable)
import { insertIntoArray, removeFromArray } from '@perimetre/helpers/array';
import { slugify } from '@perimetre/helpers/string';
import { valueNotUndefined } from '@perimetre/helpers/predicates/value';
```

### Available Exports

#### Client-safe Helpers

These helpers work in both browser and Node.js environments:

- `@perimetre/helpers/array` - Array manipulation utilities
- `@perimetre/helpers/clipboard` - Browser clipboard utilities
- `@perimetre/helpers/object` - Object manipulation utilities
- `@perimetre/helpers/string` - String utilities (slugify, etc.)
- `@perimetre/helpers/predicates` - Type predicates
- `@perimetre/helpers/types` - TypeScript utility types
- `@perimetre/helpers/mappers` - Value mappers

#### Server-only Helpers

These helpers require Node.js APIs and should only be used on the server:

- `@perimetre/helpers/csv` - CSV parsing and generation (requires `fs`, `path`, `csv` package)
- `@perimetre/helpers/file` - File system utilities (requires `fs`, `path`)
- `@perimetre/helpers/url` - URL utilities (requires Node.js `url`, `path`)

### Examples

#### Array Helpers

```typescript
import {
  insertIntoArray,
  removeFromArray,
  shiftIndexInArray
} from '@perimetre/helpers/array';

const arr = [1, 2, 3, 4];
const withInserted = insertIntoArray(arr, 2, 99); // [1, 2, 99, 3, 4]
const withRemoved = removeFromArray(arr, (x) => x === 3); // [1, 2, 4]
const shifted = shiftIndexInArray(arr, 0, 2); // [2, 3, 1, 4]
```

#### String Helpers

```typescript
import { slugify, replaceSpecial } from '@perimetre/helpers/string';

const slug = slugify('Hello World!'); // 'Hello-world'
const clean = replaceSpecial('café'); // 'cafe'
```

#### CSV Helpers (Server-only)

```typescript
import { parseCsv, makeCsv } from '@perimetre/helpers/csv';

// Parse CSV file in chunks
await parseCsv<{ name: string; age: number }>(
  './data.csv',
  async (rows) => {
    // Process each chunk of rows
    console.log(rows);
  },
  { columns: true },
  1000 // chunk size
);

// Generate CSV file
await makeCsv('./output', 'data.csv', [
  ['Name', 'Age'],
  ['John', '30'],
  ['Jane', '25']
]);
```

## TypeScript Support

This package includes full TypeScript definitions. All helpers are strongly typed.
