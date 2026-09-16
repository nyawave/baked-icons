# @nyawave/baked-icons

[![npm version](https://img.shields.io/npm/v/@nyawave/baked-icons.svg)](https://www.npmjs.com/package/@nyawave/baked-icons)
[![npm downloads](https://img.shields.io/npm/dm/@nyawave/baked-icons.svg)](https://www.npmjs.com/package/@nyawave/baked-icons)
[![CI](https://github.com/nyawave/baked-icons/actions/workflows/ci.yml/badge.svg)](https://github.com/nyawave/baked-icons/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@nyawave/baked-icons.svg)](./LICENSE)

The `@iconify/react` developer experience (`<Icon icon="mdi:home" />`, 200 000+ icons, one string
API) with icons **baked into your bundle at build time**. No runtime requests to
`api.iconify.design`, no flash of missing icons, and it works in React Server Components.

```tsx
import { Icon } from '@nyawave/baked-icons';

export function Header() {
  return <h1><Icon icon="mdi:home" /> Home</h1>;
}
```

At build time this becomes:

```tsx
const $bi_mdi_home = {"body":"<path fill=\"currentColor\" d=\"M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z\"/>","name":"mdi:home","width":24,"height":24};

export function Header() {
  return <h1><Icon icon={$bi_mdi_home} /> Home</h1>;
}
```

## Features

- **Zero runtime fetching.** Icon data is inlined into the module that uses it. Icons are in
  the HTML on first paint, work offline, and never depend on a third-party API.
- **Only what you use.** Each icon is baked once per module and tree-shakes like any other
  constant. No icon set is ever shipped wholesale.
- **Server Components, SSR and the browser.** `<Icon>` has no state, no effects and no
  `"use client"` requirement. Deterministic SVG ids mean no hydration mismatches.
- **Iconify-compatible rendering.** Uses `@iconify/utils` for the exact same `width`, `height`,
  `rotate`, `flip`, `color`, `inline` and `title` behaviour as `@iconify/react`.
- **Any Iconify icon set.** Install `@iconify-json/<prefix>` (or `@iconify/json` for all of
  them), or point the plugin at your own `IconifyJSON` file.
- **Vite, Next.js, webpack.** First-class Vite plugin, a `withBakedIcons()` wrapper for Next.js
  (Turbopack **and** webpack), a plain webpack loader, and a programmatic transform for
  everything else.
- **Runtime registry for data-driven icons.** When the icon name only exists at runtime, bake
  a set of candidates and pick from it.
- **Tiny runtime.** ~2 kB gzipped plus `@iconify/utils`; the transform never ends up in the
  browser bundle.

## Installation

```sh
pnpm add @nyawave/baked-icons
pnpm add -D @iconify-json/mdi        # any icon set(s) you use...
pnpm add -D @iconify/json            # ...or every set at once
```

Requirements: React 18+, Node.js 20+. Vite 5+ or Next.js 14+ for the built-in integrations.

## Setup

### Vite

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import bakedIcons from '@nyawave/baked-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [bakedIcons(), react()],
});
```

The plugin runs with `enforce: 'pre'`, so its position in the array does not matter.

### Next.js

Works with Turbopack (the default in Next.js 16) and with `next build --webpack`.

```ts
// next.config.ts
import { withBakedIcons } from '@nyawave/baked-icons/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withBakedIcons(nextConfig);
// export default withBakedIcons(nextConfig, { sources: ['@nyawave/baked-icons', '@/ui/icon'] });
```

`<Icon>` can be used directly inside Server Components; no client boundary is needed.

### webpack (and other loader-based bundlers)

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.[cm]?[jt]sx?$/,
        exclude: /node_modules/,
        use: [{ loader: '@nyawave/baked-icons/loader', options: { /* BakeOptions */ } }],
      },
    ],
  },
};
```

Put the loader **before** your TypeScript/Babel/SWC loader in the pipeline (in webpack that means
last in the `use` array), so it sees the original JSX.

### Anything else

```ts
import { transform, createTransformer } from '@nyawave/baked-icons/transform';

// one-shot
const result = transform(code, '/abs/path/to/File.tsx', { root: process.cwd() });
// result is null when the file has nothing to bake, otherwise { code, map, icons }

// with a shared icon cache for the whole build
const t = createTransformer({ root: process.cwd() });
const out = t.transform(code, id);
```

## Usage

### `<Icon>` and `<InlineIcon>`

```tsx
import { Icon, InlineIcon } from '@nyawave/baked-icons';

<Icon icon="mdi:home" />
<Icon icon="mdi:arrow-right" rotate={1} />                 // quarter turns, or "90deg", "25%"
<Icon icon="mdi:arrow-right" flip="horizontal" />          // "vertical", "horizontal,vertical"
<Icon icon="mdi:home" width={32} />                        // height follows the icon ratio
<Icon icon="mdi:home" width="2em" height="2em" color="tomato" />
<Icon icon="mdi:home" title="Home" />                      // accessible; otherwise aria-hidden
<Icon icon="mdi:home" className="nav-icon" style={{ opacity: 0.8 }} onClick={...} />

// Sits on the text baseline (vertical-align: -0.125em)
<p>Baked with <InlineIcon icon="lucide:flame" /> love</p>
```

`InlineIcon` is `Icon` with `inline` defaulting to `true`. Every other SVG prop (`onClick`,
`data-*`, `aria-*`, `ref`, ...) is passed through to the `<svg>` element.

| prop        | type                        | description                                                             |
| ----------- | --------------------------- | ----------------------------------------------------------------------- |
| `icon`      | `string \| BakedIcon`       | `"prefix:name"` (baked at build time) or already-baked icon data        |
| `width`     | `number \| string`          | px number or any CSS length; defaults to `1em`-based auto sizing        |
| `height`    | `number \| string`          | same as `width`                                                         |
| `rotate`    | `number \| string`          | `1 \| 2 \| 3` quarter turns, or `"90deg"`, `"0.25turn"`, `"25%"`        |
| `flip`      | `string`                    | `"horizontal"`, `"vertical"` or `"horizontal,vertical"`                 |
| `hFlip`     | `boolean`                   | flip horizontally                                                       |
| `vFlip`     | `boolean`                   | flip vertically                                                         |
| `color`     | `string`                    | sets CSS `color`; icons draw with `currentColor`                        |
| `inline`    | `boolean`                   | add `vertical-align: -0.125em`                                          |
| `title`     | `string`                    | accessible `<title>`; without it the SVG is `aria-hidden`               |
| `className` | `string`                    | appended to `iconify iconify--<prefix>`                                 |

### What gets baked

The transform bakes every `icon` prop on `Icon`/`InlineIcon` (imported from
`@nyawave/baked-icons`, or from any module listed in `sources`) whose value is:

- a string literal: `icon="mdi:home"`, `icon={'mdi:home'}`, `` icon={`mdi:home`} ``
- a conditional: `icon={open ? 'mdi:menu-open' : 'mdi:menu'}`
- a logical expression: `icon={custom || 'mdi:help'}`, `icon={custom ?? 'mdi:help'}`
- any of the above wrapped in `as`, `satisfies`, `!` or parentheses

Renamed imports (`import { Icon as I }`) and namespace imports (`import * as BI`, then
`<BI.Icon>`) are handled too. Icon names must be in the canonical `prefix:name` form
(lowercase, digits and dashes).

### Icons outside JSX: `bakeIcon()` and `bakeIcons()`

```ts
import { bakeIcon, bakeIcons } from '@nyawave/baked-icons';

export const logo = bakeIcon('lucide:flame');
//           ^ replaced with the icon data object at build time

export const weather = bakeIcons(['mdi:weather-sunny', 'mdi:weather-cloudy', 'mdi:weather-rainy']);
//           ^ { 'mdi:weather-sunny': {...}, 'mdi:weather-cloudy': {...}, 'mdi:weather-rainy': {...} }
export type WeatherIcon = keyof typeof weather;
```

```tsx
<Icon icon={logo} />
<Icon icon={weather[current]} />   // pick from a baked object at runtime, fully typed
```

### Dynamic icon names

Only literals can be baked. When the icon name comes from data (a CMS, a database, user
input), bake the set of possible icons and register it so `<Icon icon={string}>` can
resolve them at runtime:

```tsx
import { addIcons, bakeIcons, Icon } from '@nyawave/baked-icons';

addIcons(bakeIcons(['mdi:home', 'mdi:account', 'mdi:cog']));

<Icon icon={menuItem.icon} />   // resolved from the runtime registry
```

You can also register a whole (or partial) `IconifyJSON` collection with `addCollection(json)`,
or single icons with `addIcon(name, data)`. Strings that are neither baked nor registered
render nothing and log a one-time warning in development.

### Re-exporting the component

If you wrap `Icon` in your own module, tell the transform where to look for it:

```ts
// @/ui/icon.tsx
export { Icon, InlineIcon, bakeIcon, bakeIcons } from '@nyawave/baked-icons';
```

```ts
bakedIcons({ sources: ['@nyawave/baked-icons', '@/ui/icon'] })
// or
withBakedIcons(nextConfig, { sources: ['@nyawave/baked-icons', '@/ui/icon'] })
```

The transform matches on the exported names (`Icon`, `InlineIcon`, `bakeIcon`, `bakeIcons`), so
the re-export must keep them. Use the `components` / `helpers` options if you rename them.

### Custom icon sets

Any [IconifyJSON](https://iconify.design/docs/types/iconify-json.html) file works. Give it a
prefix and use it like a regular set:

```ts
// Vite / programmatic: a path or an object
bakedIcons({
  iconSets: {
    brand: './src/icons/brand.json',
    app: { prefix: 'app', icons: { star: { body: '<path d="..."/>', width: 10, height: 10 } } },
  },
});

// Next.js: paths only (loader options must be serialisable)
withBakedIcons(nextConfig, { iconSets: { brand: './src/icons/brand.json' } });
```

```tsx
<Icon icon="brand:logo" />
```

Tip: [Iconify Tools](https://iconify.design/docs/libraries/tools/) can convert a folder of SVGs
into an IconifyJSON file.

## Options

All integrations accept the same `BakeOptions`:

| option       | type                                    | default                          | description                                                                                  |
| ------------ | --------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| `sources`    | `string[]`                              | `['@nyawave/baked-icons']`       | import specifiers whose bindings should be recognised                                        |
| `components` | `string[]`                              | `['Icon', 'InlineIcon']`         | JSX components whose `icon` prop is baked                                                    |
| `helpers`    | `string[]`                              | `['bakeIcon', 'bakeIcons']`      | functions whose literal arguments are baked                                                  |
| `iconSets`   | `Record<string, IconifyJSON \| string>` | `{}`                             | custom sets by prefix; a JSON path (relative to `root`) or an object (not for Next.js)       |
| `root`       | `string`                                | project root / `process.cwd()`   | where `@iconify-json/*`, `@iconify/json` and relative `iconSets` paths are resolved from     |
| `onMissing`  | `'error' \| 'warn' \| 'ignore'`         | `'error'`                        | what to do when an icon or icon set cannot be found                                          |
| `keepName`   | `boolean`                               | `true`                           | keep `name: "prefix:name"` in baked data; enables `iconify--<prefix>` classes and readable devtools |

`withBakedIcons()` additionally accepts `turbopackGlobs` (default `['*.tsx', '*.jsx', '*.ts', '*.js']`)
to control which files the Turbopack rule is attached to.

## API

| entry point                         | exports                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `@nyawave/baked-icons`              | `Icon`, `InlineIcon`, `bakeIcon`, `bakeIcons`, `addIcon`, `addIcons`, `addCollection`, `getIcon`, types `IconProps`, `BakedIcon`, `BakeOptions` |
| `@nyawave/baked-icons/vite`         | `default` – Vite plugin factory                                                                                           |
| `@nyawave/baked-icons/next`         | `withBakedIcons(nextConfig, options?)`, type `NextBakeOptions`                                                            |
| `@nyawave/baked-icons/loader`       | `default` – webpack / Turbopack loader (CommonJS)                                                                         |
| `@nyawave/baked-icons/transform`    | `transform`, `createTransformer`, `shouldTransform`, `IconResolver`, `isIconName`, type `TransformResult`                 |

Both ESM and CommonJS builds ship with TypeScript declarations.

## Comparison

|                              | `@nyawave/baked-icons`        | `@iconify/react`                  | `unplugin-icons`                          |
| ---------------------------- | ----------------------------- | --------------------------------- | ----------------------------------------- |
| Icon API                     | `<Icon icon="mdi:home" />`    | `<Icon icon="mdi:home" />`        | `import IconHome from '~icons/mdi/home'`  |
| Where icon data comes from   | your bundle, at build time    | Iconify API at runtime            | your bundle, at build time                |
| Works in Server Components   | yes                           | no (client-only, fetches)         | yes                                       |
| Runtime customisation props  | yes (`rotate`, `flip`, ...)   | yes                               | limited (compiler-generated components)   |
| Data-driven icon names       | yes, via registry             | yes, any icon                     | no                                        |
| Offline / no third-party API | yes                           | no                                | yes                                       |

## Caveats

- Icon names must be static enough to be found at build time: string literals, or `?:` / `||` /
  `??` combinations of them. Anything else falls back to the runtime registry.
- Files inside `node_modules` are never transformed. If you publish a component library built
  on `@nyawave/baked-icons`, bake the icons when building the library.
- With `keepName: false` the `iconify--<prefix>` class is not emitted.

## License

[MIT](./LICENSE)
