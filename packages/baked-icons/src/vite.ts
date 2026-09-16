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
      transformer = createTransformer({ root: config.root, ...options });
    },
    transform(code, id) {
      if (!shouldTransform(id)) return null;
      const result = transformer.transform(code, id);
      return result ? { code: result.code, map: result.map } : null;
    },
  };
}
