# @perimetre/eslint-config-nextjs

Next.js rules on top of [`@perimetre/eslint-config-react`](https://github.com/perimetre/framework/tree/main/packages/eslint-config-react): Next's `core-web-vitals` rules, the React Compiler, and a check that flags a `middleware.ts`, since Next.js 16 runs `src/proxy.ts` instead.

It uses `@next/eslint-plugin-next` without `eslint-config-next`, which would register `react-hooks` a second time next to the React config.

## Quick start

The [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup installs it in every Next.js project. To add it yourself, use the prompt in [`@perimetre/eslint-config-base`](https://github.com/perimetre/framework/tree/main/packages/eslint-config-base#quick-start). It adds this config when the project uses Next.js.

## Requirements

- Next.js 15 or later
- ESLint 9
