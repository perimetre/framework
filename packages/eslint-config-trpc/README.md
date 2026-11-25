# @perimetre/eslint-config-trpc

Turns off the few strict rules that misread tRPC. tRPC's generics look unsafe to typescript-eslint's `no-unsafe-*` rules, and procedures document themselves, so this config switches those rules and the JSDoc requirements off. Every other rule from [`@perimetre/eslint-config-base`](https://github.com/perimetre/framework/tree/main/packages/eslint-config-base) stays on. Each rule it switches off carries its reason in [the config](https://github.com/perimetre/framework/blob/main/packages/eslint-config-trpc/index.mjs).

## Quick start

The [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup installs it when the project uses tRPC. To add it yourself, use the prompt in [`@perimetre/eslint-config-base`](https://github.com/perimetre/framework/tree/main/packages/eslint-config-base#quick-start), which adds it for a tRPC project.

Based on the [tRPC Prisma starter](https://github.com/trpc/examples-next-prisma-starter).
