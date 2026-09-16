# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/nyawave/baked-icons/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nyawave/baked-icons/releases/tag/v0.1.0
