# Contributing

Thanks for your interest in `@nyawave/baked-icons`! Bug reports, feature requests and
pull requests are welcome.

## Development setup

Requirements: Node.js 22+ (the published package itself supports Node 20+) and [pnpm](https://pnpm.io). The exact pnpm version is pinned
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
   notes in `CHANGELOG.md` under the new version. Commit and push to `main`.
2. Create a GitHub Release with a `vX.Y.Z` tag (the tag must match the package version).
   On GitHub: **Releases -> Draft a new release -> Choose a tag -> type `vX.Y.Z` ->
   Create new tag on publish**, paste the changelog entry, **Publish release**.
3. The `Release` workflow builds, tests and runs `npm stage publish` through trusted
   publishing (OIDC).
4. Approve the staged version with 2FA, either on npmjs.com (package page ->
   **Staged Packages** -> Approve) or from a terminal:

   ```sh
   npm stage list @nyawave/baked-icons
   npm stage approve <stage-id>
   ```

No npm token is stored anywhere;

### First release of a new package

npm cannot stage or trust-publish a package that does not exist yet, so the very first
version is published by hand:

```sh
cd packages/baked-icons
npm login
npm publish --access public
```

Afterwards add the trusted publisher on the package's **Settings -> Publishing access**
page (or `npm trust github @nyawave/baked-icons --repo nyawave/baked-icons --file release.yml --allow-stage-publish`).
