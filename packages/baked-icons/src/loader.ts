import { createTransformer, shouldTransform } from './transform.ts';
import type { BakeOptions } from './types.ts';

interface LoaderContext {
  resourcePath: string;
  rootContext?: string;
  getOptions(): BakeOptions;
  callback(err: Error | null, content?: string, map?: unknown): void;
  cacheable?(flag: boolean): void;
}

// One transformer (and icon-set cache) per options object. Turbopack/webpack
// reuse the same options object for every file that matches a rule.
const transformers = new WeakMap<object, ReturnType<typeof createTransformer>>();

/**
 * webpack / Turbopack loader. Usually wired up via `withBakedIcons()` from
 * `@nyawave/baked-icons/next`, but can be used directly:
 *
 * ```js
 * { test: /\.[jt]sx?$/, exclude: /node_modules/, use: '@nyawave/baked-icons/loader' }
 * ```
 */
export default function bakedIconsLoader(this: LoaderContext, source: string): void {
  this.cacheable?.(true);
  const options = this.getOptions() ?? {};
  if (!shouldTransform(this.resourcePath)) {
    this.callback(null, source);
    return;
  }
  let transformer = transformers.get(options);
  if (!transformer) {
    transformer = createTransformer({ root: this.rootContext ?? process.cwd(), ...options });
    transformers.set(options, transformer);
  }
  try {
    const result = transformer.transform(source, this.resourcePath);
    if (result) this.callback(null, result.code, result.map);
    else this.callback(null, source);
  } catch (error) {
    this.callback(error as Error);
  }
}
