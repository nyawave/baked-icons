import type { BakeOptions } from './types.ts';

export type { BakeOptions } from './types.ts';

/** Structural subset of `NextConfig` — avoids a hard dependency on `next` types. */
interface NextLikeConfig {
  turbopack?: {
    rules?: Record<string, unknown>;
    [key: string]: unknown;
  };
  webpack?: (config: WebpackLikeConfig, context: unknown) => WebpackLikeConfig;
  [key: string]: unknown;
}

interface WebpackLikeConfig {
  module?: { rules?: unknown[]; [key: string]: unknown };
  [key: string]: unknown;
}

export interface NextBakeOptions extends Omit<BakeOptions, 'iconSets'> {
  /** Custom icon sets — paths only, since loader options must be serialisable. */
  iconSets?: Record<string, string>;
  /**
   * Turbopack rule globs the loader is attached to.
   * @default ['*.tsx', '*.jsx', '*.ts', '*.js']
   */
  turbopackGlobs?: string[];
}

/**
 * Wrap your `next.config.ts` so icons are baked with both Turbopack (default in
 * Next 16) and webpack (`next build --webpack`):
 *
 * ```ts
 * import { withBakedIcons } from '@nyawave/baked-icons/next';
 * export default withBakedIcons({ reactStrictMode: true });
 * ```
 */
export function withBakedIcons<T extends object>(config: T = {} as T, options: NextBakeOptions = {}): T {
  const nextConfig = config as NextLikeConfig;
  const { turbopackGlobs = ['*.tsx', '*.jsx', '*.ts', '*.js'], ...loaderOptions } = options;
  const loader = { loader: '@nyawave/baked-icons/loader', options: loaderOptions };

  // Only run the loader on first-party files that actually mention one of the
  // sources — Turbopack evaluates these conditions natively, so everything else
  // never round-trips through JS.
  const sources = loaderOptions.sources ?? ['@nyawave/baked-icons'];
  const rule = {
    loaders: [loader],
    condition: {
      all: [
        { not: { path: /[\\/]node_modules[\\/]/ } },
        { content: new RegExp(sources.map(escapeRegExp).join('|')) },
      ],
    },
  };

  const rules: Record<string, unknown> = { ...nextConfig.turbopack?.rules };
  for (const glob of turbopackGlobs) {
    const existing = rules[glob];
    if (Array.isArray(existing)) rules[glob] = [rule, ...existing];
    else if (existing) rules[glob] = [rule, existing];
    else rules[glob] = rule;
  }

  const result: NextLikeConfig = {
    ...nextConfig,
    turbopack: { ...nextConfig.turbopack, rules },
    webpack(webpackConfig: WebpackLikeConfig, context: unknown) {
      webpackConfig.module ??= {};
      webpackConfig.module.rules ??= [];
      webpackConfig.module.rules.push({
        test: /\.[cm]?[jt]sx?$/,
        exclude: /node_modules/,
        use: [loader],
      });
      return nextConfig.webpack ? nextConfig.webpack(webpackConfig, context) : webpackConfig;
    },
  };
  return result as T;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
