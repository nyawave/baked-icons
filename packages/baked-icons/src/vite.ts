import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { createTransformer, shouldTransform } from './transform.ts';
import type { BakeOptions } from './types.ts';

export type { BakeOptions } from './types.ts';

/**
 * Vite plugin. Add it **before** `@vitejs/plugin-react` (it's `enforce: 'pre'`
 * anyway, so order in the array does not really matter).
 *
 * ```ts
 * import bakedIcons from '@nyawave/baked-icons/vite';
 * export default defineConfig({ plugins: [bakedIcons(), react()] });
 * ```
 */
export default function bakedIcons(options: BakeOptions = {}): Plugin {
  let transformer = createTransformer(options);

  return {
    name: 'baked-icons',
    enforce: 'pre',
    configResolved(config) {
      // Re-create with the project root so `@iconify-json/*` resolves from the right place.
      transformer = createTransformer({
        ...options,
        root: options.root ? resolve(config.root, options.root) : config.root,
      });
    },
    watchChange(id) {
      transformer.invalidate(id);
    },
    transform: {
      // native filter, Vite ≥ 6.3; older versions ignore it
      filter: {
        id: { include: /\.[cm]?[jt]sx?(?:$|\?)/, exclude: /[\\/]node_modules[\\/]/ },
        code: { include: options.sources ?? ['@nyawave/baked-icons'] },
      },
      handler(code, id) {
        if (!shouldTransform(id)) return null;
        const result = transformer.transform(code, id);
        if (!result) return null;
        for (const file of result.dependencies) this.addWatchFile(file);
        return { code: result.code, map: result.map };
      },
    },
  };
}
