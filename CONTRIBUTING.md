# Contributing

Thanks for your interest in `@nyawave/baked-icons`! Bug reports, feature requests and
pull requests are welcome.

## Development setup

Requirements: Node.js 20+ and [pnpm](https://pnpm.io). The exact pnpm version is pinned
in the root `package.json` (`packageManager`), so `corepack enable` picks it up automatically.

```sh
git clone https://github.com/nyawave/baked-icons.git
cd baked-icons
pnpm install
```

## Repository layout

| path                   | what it is                                        |
| ---------------------- | ------------------------------------------------- |
| `packages/baked-icons` | the published package (`@nyawave/baked-icons`)    |
| `examples/vite-react`  | Vite 8 + React 19 playground                      |
| `examples/next-app`    | Next.js 16 (App Router, RSC, Turbopack + webpack) |

## Scripts

Run these from the repository root:

```sh
pnpm build            # build the library with tsdown
pnpm dev              # rebuild the library on change
pnpm test             # vitest
pnpm lint             # oxlint
pnpm typecheck        # tsc --noEmit across all workspace packages
pnpm build:examples   # build both examples against the local build
pnpm ci               # everything CI runs, in order

pnpm --filter example-vite-react dev
pnpm --filter example-next-app dev
```

The examples depend on the library through `workspace:*`, so run `pnpm build`
(or keep `pnpm dev` running) before starting them.

## Pull requests

- Keep changes focused. For larger features, open an issue first so the design can be
  discussed.
- Add or update tests in `packages/baked-icons/test` for behaviour changes.
- Make sure `pnpm ci` passes locally.
- Add an entry to the `[Unreleased]` section of `CHANGELOG.md`.

## Releasing (maintainers)

1. Bump `version` in `packages/baked-icons/package.json` and move the `[Unreleased]`
   notes in `CHANGELOG.md` under the new version.
2. Commit, tag (`git tag vX.Y.Z`) and push the tag.
3. Create a GitHub Release from the tag. The `Release` workflow builds, tests and
   publishes to npm through trusted publishing (OIDC); no token secret is required.

The very first version must be published manually, because npm only lets you configure
a trusted publisher for a package that already exists:

```sh
cd packages/baked-icons
npm login
pnpm publish --access public
```
