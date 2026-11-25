# @perimetre/oxlint-config-nextjs

[`@perimetre/eslint-config-nextjs`](https://github.com/perimetre/framework/tree/main/packages/eslint-config-nextjs) on Oxlint: Next's `core-web-vitals` rules, which Oxlint runs itself, and a check that flags a `middleware.ts`, since Next.js 16 runs `src/proxy.ts` instead. The React Compiler's checks come from [`@perimetre/oxlint-config-react`](https://github.com/perimetre/framework/tree/main/packages/oxlint-config-react).

## Quick start

Use the prompt in [`@perimetre/oxlint-config-base`](https://github.com/perimetre/framework/tree/main/packages/oxlint-config-base#quick-start). It adds this config when the project uses Next.js.

## Requirements

- Next.js 15 or later
- Oxlint 1.95 or later
