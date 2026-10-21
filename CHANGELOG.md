# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-10-21

### Changed

- No more runtime dependencies besides `oxc-parser`: `@iconify/utils`, `@iconify/types` and
  `magic-string` are replaced by small built-in implementations. SVG output is byte-identical to
  `@iconify/utils` (covered by a parity test over every mdi and lucide icon), source maps are
  identical to magic-string's `hires: 'boundary'`. Installs drop 8 packages; the client runtime is
  ~17% smaller and renders 1.2–2× faster (render results are cached per icon and size).
- Generated constants are now named `$bi_<prefix>$<name>` (e.g. `$bi_mdi$home`).
- `engines.node` is now `^20.19.0 || >=22.12.0` — the actual requirement of `oxc-parser`
  (the CommonJS entry points, e.g. the webpack loader, failed with `ERR_REQUIRE_ESM` on Node
  20.0–20.18).
- Types `IconifyIcon` and `IconifyJSON` are exported from the main entry; `TransformResult`
  gained `dependencies`; `createTransformer()` gained `invalidate()`.

### Fixed

- Icons with several `<defs>` blocks rendered broken markup when rotated or flipped (an
  `@iconify/utils` bug; hit 420 of 423 such icons in the Iconify sets we checked).
- Icon names that differ only in the position of the colon (`material-symbols:light-mode` vs
  `material-symbols-light:mode`) produced the same constant and broke the module.
- Baked constants could be declared after code that uses them when an `import` followed other
  statements (TDZ error at module init), and broke files starting with a hashbang.
- A generated constant could clash with an identifier already present in the module.
- `bakeIcons([...] as const)` / `bakeIcon(("…") satisfies string)` were not baked.
- Changing or upgrading an icon set file did not invalidate webpack/Turbopack persistent caches or
  Vite watch mode; set files are now reported as dependencies and re-read when they change.
- The loader re-read and re-parsed icon set JSON for every file when the bundler passed fresh
  options objects (Turbopack).
- `addCollection()` replaced earlier partial collections with the same prefix, and lookups cached
  before a later `addCollection()` stayed stale. Prototype keys (`constructor`, …) were treated as
  icon names.
- A relative `root` option was resolved against `process.cwd()` instead of the Vite / webpack root.
- `withBakedIcons()` broke function-style `next.config` exports.
- Missing-icon errors now include `line:column`.

## [0.1.0] - 2026-09-16

### Added

- `<Icon>` / `<InlineIcon>` React components, API-compatible with `@iconify/react`
  for the common props (`width`, `height`, `rotate`, `flip`, `hFlip`, `vFlip`,
  `color`, `inline`, `title`, `className`, `style`).
- Build-time transform that replaces `icon="prefix:name"` string literals
  (including `?:`, `||`, `??` branches and template literals) with inlined icon data.
- `bakeIcon()` / `bakeIcons()` helpers for baking icons outside JSX.
- Runtime registry: `addIcon()`, `addIcons()`, `addCollection()`, `getIcon()`.
- Vite plugin (`@nyawave/baked-icons/vite`).
- Next.js wrapper (`@nyawave/baked-icons/next`) supporting Turbopack and webpack.
- Generic webpack loader (`@nyawave/baked-icons/loader`).
- Programmatic transform API (`@nyawave/baked-icons/transform`).
- Deterministic SVG id rewriting for hydration-safe SSR / RSC rendering.

[Unreleased]: https://github.com/nyawave/baked-icons/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/nyawave/baked-icons/compare/0.1.0...v0.2.0
[0.1.0]: https://github.com/nyawave/baked-icons/releases/tag/0.1.0
