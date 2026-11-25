# @perimetre/framework

Shared packages for Périmètre projects: lint and format configs, a service layer, a GraphQL toolkit, and the UI behaviours apps build their components from.

Packages are private and published to GitHub Packages under `@perimetre/*`.

## Packages

Each package has its own README with usage.

### Configuration

| Package                                                         | What it is                                             |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| [`eslint-config-base`](packages/eslint-config-base)             | Base ESLint rules for TypeScript                       |
| [`eslint-config-nextjs`](packages/eslint-config-nextjs)         | ESLint for Next.js                                     |
| [`eslint-config-react`](packages/eslint-config-react)           | ESLint for React: hooks, accessibility, TanStack Query |
| [`eslint-config-graphql`](packages/eslint-config-graphql)       | ESLint for GraphQL                                     |
| [`eslint-config-trpc`](packages/eslint-config-trpc)             | ESLint for tRPC                                        |
| [`lintstaged-config-nextjs`](packages/lintstaged-config-nextjs) | lint-staged for Next.js                                |
| [`prettier-config`](packages/prettier-config)                   | Prettier                                               |

### Code

| Package                                       | What it is                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| [`service-builder`](packages/service-builder) | A type-safe service layer that returns errors as values                           |
| [`graphql`](packages/graphql)                 | A GraphQL client toolkit for WPGraphQL projects                                   |
| [`helpers`](packages/helpers)                 | TypeScript utilities                                                              |
| [`fancy-log`](packages/fancy-log)             | Log messages with colours, levels and scopes                                      |
| [`ui-behaviors`](packages/ui-behaviors)       | What we add to [UI SDK](https://ui-sdk.dev), for building an app's own components |

### Deprecated

These stay published and working for the projects that use them. Nothing new is added.

| Package                             | Use instead                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [`ui`](packages/ui)                 | Components written in the app, from UI SDK and `ui-behaviors`. See its [migration guide](packages/ui/docs/migrating-to-ui-behaviors.md) |
| [`tokens`](packages/tokens)         | Design tokens defined in the app's own stylesheet                                                                                       |
| [`icons`](packages/icons)           | `Icon` from `@perimetre/ui-behaviors/react/icon`                                                                                        |
| [`classnames`](packages/classnames) | The [`cn`](https://github.com/shadcn-ui/cn) package                                                                                     |

## How we build UI

Apps own their components. There is no shared component library to add to.

[UI SDK](https://ui-sdk.dev) supplies how a component behaves: keyboard, focus, pointer and accessibility. The app supplies how it looks. `ui-behaviors` holds the few behaviours UI SDK does not have, like a product zoom or a store locator.

In practice you ask your agent for the component, and it builds it in your app. The [`ui-behaviors` README](packages/ui-behaviors) has the prompt to set a project up.

## Using a package in a project

1. Point the `@perimetre` scope at GitHub Packages, in the project's `.npmrc`. Commit this file, and never put a token or a `${VAR}` placeholder in it:

   ```ini
   @perimetre:registry=https://npm.pkg.github.com
   ```

2. Sign in once on your machine. This writes the token to your own `~/.npmrc`:

   ```bash
   gh auth login -h github.com -s read:packages
   npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"
   ```

3. Install what you need:

   ```bash
   pnpm add -D @perimetre/eslint-config-nextjs
   ```

### On Vercel

Set an `NPM_RC` environment variable holding a whole `.npmrc`, token included. Vercel writes it as trusted config before the install ([Vercel's guide](https://vercel.com/kb/guide/using-private-dependencies-with-vercel)).

```ini
registry=https://registry.npmjs.org
@perimetre:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GitHub classic token with read:packages>
```

- Add it per project, for Production and Preview, and mark it Sensitive.
- Add it with the CLI, so the line breaks survive: `vercel env add NPM_RC production < npmrc`.
- Do not use `NPM_TOKEN`. Vercel applies it to `registry.npmjs.org` only, and pnpm 10.34.2 and newer ignore a `${NPM_TOKEN}` placeholder in a committed `.npmrc`.

### On GitHub Actions

Give `actions/setup-node` the registry and the scope, and pass the token to the install step:

```yaml
- uses: actions/setup-node@v6
  with:
    registry-url: https://npm.pkg.github.com
    scope: '@perimetre'
- run: pnpm install --frozen-lockfile
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

`NPM_TOKEN` here is a repository secret holding a GitHub classic token with `read:packages`. The run's own `GITHUB_TOKEN` cannot read these packages from another repository.

## Examples

- [`examples/trpc`](examples/trpc): tRPC with the service layer
- [`examples/tanstack-query-and-graphql`](examples/tanstack-query-and-graphql): GraphQL with TanStack Query
- [`examples/ui-sdk-forms`](examples/ui-sdk-forms): React Hook Form and Zod with UI SDK form controls

Our coding conventions live in the [ai-toolkit](https://github.com/perimetre/ai-toolkit) repo.

## Contributing

You need [pnpm](https://pnpm.io/installation) and the [GitHub CLI](https://cli.github.com/).

```bash
gh repo clone perimetre/framework
cd framework
pnpm install
```

`pnpm install` needs the sign-in step from [Using a package in a project](#using-a-package-in-a-project).

Then, for every change:

1. Branch from `main`.
2. Make the change.
3. Check it:

   ```bash
   pnpm turbo run lint typecheck build
   pnpm test
   ```

4. Describe it for the changelog with `pnpm changeset`. Pick the packages, the bump and a one-line summary.
5. Commit with a [conventional commit](https://www.conventionalcommits.org) message, push, and open a pull request.

Merging to `main` opens a "version packages" pull request. Merging that one publishes the packages.

[CONTRIBUTING.md](CONTRIBUTING.md) explains changesets and versioning in full.
