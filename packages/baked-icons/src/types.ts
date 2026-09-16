import type { IconifyIcon, IconifyJSON } from '@iconify/types';

/**
 * Icon data that has been baked into the bundle at build time.
 * Structurally identical to Iconify's `IconifyIcon`, plus an optional
 * `name` ("prefix:name") that is kept for debugging / CSS class names.
 */
export interface BakedIcon extends IconifyIcon {
  name?: string;
}

/** Options shared by the transform, the Vite plugin, the loader and the Next.js wrapper. */
export interface BakeOptions {
  /**
   * Module specifier(s) whose `Icon` / `InlineIcon` / `bakeIcon` / `bakeIcons`
   * bindings should be recognised. Useful when you re-export the component
   * from your own module (e.g. `@/ui/icon`).
   * @default ['@nyawave/baked-icons']
   */
  sources?: string[];
  /**
   * Names of JSX components (as exported from `sources`) whose `icon` prop
   * should be baked.
   * @default ['Icon', 'InlineIcon']
   */
  components?: string[];
  /**
   * Names of helper functions (as exported from `sources`) whose string
   * arguments should be baked.
   * @default ['bakeIcon', 'bakeIcons']
   */
  helpers?: string[];
  /**
   * Custom icon sets, keyed by prefix. A value can be an `IconifyJSON` object
   * (only in Vite / programmatic usage) or a path to a JSON file (relative to
   * `root`). Paths are the only option that survives serialisation to a
   * webpack/Turbopack loader.
   */
  iconSets?: Record<string, IconifyJSON | string>;
  /**
   * Directory used to resolve `@iconify-json/*`, `@iconify/json` and
   * relative `iconSets` paths.
   * @default process.cwd()
   */
  root?: string;
  /**
   * What to do when an icon or icon set cannot be found.
   * - `error` — fail the build (default)
   * - `warn`  — print a warning and leave the string as-is
   * - `ignore` — silently leave the string as-is
   * @default 'error'
   */
  onMissing?: 'error' | 'warn' | 'ignore';
  /**
   * Keep `name: "prefix:name"` in baked data. Costs a few bytes per icon,
   * gives you `iconify--prefix` class names and readable devtools.
   * @default true
   */
  keepName?: boolean;
}

export type ResolvedBakeOptions = Required<Omit<BakeOptions, 'iconSets'>> & {
  iconSets: Record<string, IconifyJSON | string>;
};

export function resolveOptions(options: BakeOptions = {}): ResolvedBakeOptions {
  return {
    sources: options.sources ?? ['@nyawave/baked-icons'],
    components: options.components ?? ['Icon', 'InlineIcon'],
    helpers: options.helpers ?? ['bakeIcon', 'bakeIcons'],
    iconSets: options.iconSets ?? {},
    root: options.root ?? process.cwd(),
    onMissing: options.onMissing ?? 'error',
    keepName: options.keepName ?? true,
  };
}
