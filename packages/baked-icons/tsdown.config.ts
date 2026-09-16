import { defineConfig } from 'tsdown';

export default defineConfig([
  // Runtime: React component, works in browser, SSR and React Server Components.
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    platform: 'neutral',
    dts: true,
    fixedExtension: true,
    target: 'es2022',
  },
  // Build-time tooling: Node only.
  {
    entry: {
      transform: 'src/transform.ts',
      vite: 'src/vite.ts',
      next: 'src/next.ts',
    },
    format: ['esm', 'cjs'],
    platform: 'node',
    dts: true,
    fixedExtension: true,
    target: 'node20',
  },
  // Webpack/Turbopack loader must be CommonJS with a default export.
  {
    entry: { loader: 'src/loader.ts' },
    format: ['cjs'],
    platform: 'node',
    dts: true,
    fixedExtension: true,
    target: 'node20',
  },
]);
