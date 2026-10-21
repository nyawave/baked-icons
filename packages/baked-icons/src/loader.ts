import { resolve } from 'node:path';
import { createTransformer, shouldTransform, type Transformer } from './transform.ts';
import type { BakeOptions } from './types.ts';

interface LoaderContext {
  resourcePath: string;
  rootContext?: string;
  getOptions(): BakeOptions;
  callback(err: Error | null, content?: string, map?: unknown): void;
  cacheable?(flag: boolean): void;
  addDependency?(file: string): void;
}

// Turbopack may pass a fresh options object per file, hence the key fallback.
const byObject = new WeakMap<object, Transformer>();
const byKey = new Map<string, Transformer>();

function getTransformer(options: BakeOptions, rootContext: string | undefined): Transformer {
  let transformer = byObject.get(options);
  if (transformer) return transformer;
  const base = rootContext ?? process.cwd();
  const key = `${base}\0${JSON.stringify(options)}`;
  transformer = byKey.get(key);
  if (!transformer) {
    transformer = createTransformer({ ...options, root: options.root ? resolve(base, options.root) : base });
    byKey.set(key, transformer);
  }
  byObject.set(options, transformer);
  return transformer;
}

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
  if (!shouldTransform(this.resourcePath)) {
    this.callback(null, source);
    return;
  }
  try {
    const transformer = getTransformer(this.getOptions() ?? {}, this.rootContext);
    // watch mode: re-read set files that changed since they were cached
    if (transformer.options.sources.some((s) => source.includes(s))) transformer.invalidate();
    const result = transformer.transform(source, this.resourcePath);
    if (!result) {
      this.callback(null, source);
      return;
    }
    for (const file of result.dependencies) this.addDependency?.(file);
    this.callback(null, result.code, result.map);
  } catch (error) {
    this.callback(error as Error);
  }
}
